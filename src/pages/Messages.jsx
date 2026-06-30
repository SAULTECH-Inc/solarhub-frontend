import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { chatService } from '../services';
import { getSocket, connectSocket } from '../lib/socket';
import { formatDistanceToNow } from 'date-fns';
import SEO from '../components/SEO';
import { MessageCircle, User, Bot, Headphones, Inbox } from 'lucide-react';

// Keeps first occurrence of each room id — prevents duplicate key warnings from racing fetches
const dedup = arr => arr.filter((r, i, a) => a.findIndex(x => x.id === r.id) === i);

export default function Messages() {
  const { user, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const bottomRef = useRef(null);

  // Parse `?room_id=` from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rid = params.get('room_id');
    if (rid) setActiveRoomId(rid);
  }, [location]);

  // Load Rooms
  useEffect(() => {
    if (!user) return;
    chatService.getRooms(1, 50).then(res => {
      const data = res?.data || res;
      setRooms(dedup(data.data || []));
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load rooms', err);
      setLoading(false);
    });
  }, [user]);

  // Socket Connection
  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    setSocketConnected(true);

    const handleNewMessage = (msg) => {
      if (msg.roomId === activeRoomId) {
        setMessages(prev => [...prev, msg]);
      } else {
        // Update unread status/preview in room list
        setRooms(prevRooms => {
          const updated = [...prevRooms];
          const idx = updated.findIndex(r => r.id === msg.roomId);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], lastMessageAt: new Date().toISOString(), messageCount: (updated[idx].messageCount || 0) + 1 };
            const [room] = updated.splice(idx, 1);
            updated.unshift(room);
          }
          return dedup(updated);
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [user, activeRoomId]);

  // Load active room messages
  useEffect(() => {
    if (!activeRoomId || !user) return;
    const socket = getSocket();
    
    // Find room metadata
    const r = rooms.find(rc => rc.id === activeRoomId);
    if (!r) {
      chatService.getRoomById(activeRoomId).then(res => {
        const room = res?.data || res;
        setActiveRoom(room);
        setRooms(prev => dedup([room, ...prev]));
      }).catch(console.error);
    } else {
      setActiveRoom(r);
    }

    // Join room & fetch history
    socket.emit('join_room', { roomId: activeRoomId });
    chatService.getMessages(activeRoomId, 1, 100).then(res => {
      const data = res?.data || res;
      setMessages(data.data?.reverse() || []);
    }).catch(console.error);

    return () => {
      socket.emit('leave_room', { roomId: activeRoomId });
      setMessages([]);
    };
  }, [activeRoomId, user, rooms.length]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="flex justify-center mb-4"><MessageCircle size={48} className="text-solar-dim opacity-40"/></div>
        <h1 className="font-heading text-xl font-bold mb-3">Sign in to view messages</h1>
        <div className="flex gap-3 justify-center">
          <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'login' })} className="btn-primary">Log In</button>
        </div>
      </div>
    );
  }

  function sendMessage() {
    const msg = input.trim();
    if (!msg || !activeRoomId) return;
    setInput('');
    const socket = getSocket();
    socket.emit('send_message', {
      roomId: activeRoomId,
      content: msg,
    });
    // Optimistic UI
    setMessages(prev => [...prev, {
      id: Date.now(),
      roomId: activeRoomId,
      content: msg,
      role: 'user',
      senderId: user.id,
      createdAt: new Date().toISOString(),
    }]);
  }

  // Get name of the other person in the room
  const getOtherParty = (room) => {
    if (!room) return 'Loading...';
    if (room.type === 'ai_support') return 'SolarBot Assistant';
    if (room.type === 'human_support') return room.agent ? `${room.agent.firstName} (Support)` : 'Solar Maket Support';
    
    // BUYER_SELLER logic
    if (room.userId === user.id && room.agent) {
      return room.agent.storeName || `${room.agent.firstName} ${room.agent.lastName}`;
    }
    if (room.agentId === user.id && room.user) {
      return `${room.user.firstName} ${room.user.lastName}`;
    }
    return 'Unknown User';
  };

  const getOtherPartyAvatar = (room) => {
    if (!room) return <User size={18}/>;
    if (room.type === 'ai_support') return <Bot size={18}/>;
    if (room.type === 'human_support') return <Headphones size={18}/>;

    let u = room.userId === user.id ? room.agent : room.user;
    if (u?.avatar) return <img src={u.avatar} alt="avatar" className="w-full h-full object-cover" />;
    if (u?.firstName) return u.firstName[0].toUpperCase();
    return <User size={18}/>;
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <SEO title="Messages" noindex />
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold">Inbox</h1>
        {!socketConnected && <span className="text-[10px] text-solar-dim px-2 border border-solar-border rounded-full animate-pulse">Connecting...</span>}
      </div>

      <div className="border border-solar-border bg-solar-card rounded-2xl overflow-hidden shadow-2xl flex h-[calc(100vh-200px)] md:h-[600px]">

        {/* ROOMS LIST (LEFT) — hidden on mobile when a room is open */}
        <div className={`${activeRoomId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 md:min-w-[280px] md:max-w-[360px] border-r border-solar-border flex-col bg-solar-surface`}>
          <div className="p-4 border-b border-solar-border">
            <input type="text" placeholder="Search conversations..." className="solar-input" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-solar-dim">Loading conversations...</div>
            ) : rooms.length === 0 ? (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-2"><Inbox size={32} className="text-solar-dim opacity-40"/></div>
                <div className="text-sm font-medium text-solar-muted">No messages yet</div>
                <div className="text-xs text-solar-dim mt-1">Start chatting with sellers to see conversations here.</div>
              </div>
            ) : (
              rooms.map(room => (
                <button key={room.id} onClick={() => { setActiveRoomId(room.id); navigate(`/messages?room_id=${room.id}`, { replace: true }); }}
                  className={`w-full flex items-start gap-3 p-4 transition-all border-b border-solar-border hover:bg-black/10 ${activeRoomId === room.id ? 'bg-solar-accent/10 border-l-2 border-l-solar-accent' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-solar-card2 border border-solar-border2 flex-shrink-0 flex items-center justify-center overflow-hidden font-bold">
                    {getOtherPartyAvatar(room)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="font-semibold text-sm text-solar-text truncate">{getOtherParty(room)}</div>
                      {room.lastMessageAt && (
                        <div className="text-[10px] text-solar-dim whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-solar-muted truncate pr-2">
                        {room.type === 'buyer_seller' ? 'Direct Message' : 'Support Query'}
                      </div>
                      {room.status === 'resolved' && <span className="text-[9px] bg-solar-surface px-1.5 rounded border border-solar-border">Done</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* CHAT AREA (RIGHT) — hidden on mobile when no room is selected */}
        <div className={`${activeRoomId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-solar-card relative`}>
          {activeRoomId ? (
            <>
              {/* Header */}
              <div className="h-[68px] px-4 border-b border-solar-border flex items-center justify-between bg-solar-surface/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setActiveRoomId(null); navigate('/messages', { replace: true }); }}
                    className="md:hidden text-solar-muted hover:text-solar-text text-sm font-medium flex items-center gap-1 mr-1">
                    ← Back
                  </button>
                  <div className="w-10 h-10 rounded-full bg-solar-card2 border border-solar-border flex items-center justify-center font-bold">
                    {getOtherPartyAvatar(activeRoom)}
                  </div>
                  <div>
                    <div className="font-heading font-semibold tracking-wide text-solar-text">{getOtherParty(activeRoom)}</div>
                    {activeRoom?.productId && <div className="text-[10px] text-solar-dim uppercase tracking-widest mt-0.5">Regarding a product</div>}
                  </div>
                </div>
                {activeRoom?.status === 'resolved' && (
                  <span className="text-xs text-solar-dim border border-solar-border px-2 py-1 rounded-lg">Conversation Closed</span>
                )}
              </div>

              {/* Messages block */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-solar-dim hidden">No messages here yet. Say hello!</div>
                ) : (
                  messages.map(m => {
                    const isMe = m.senderId === user.id || m.role === 'user';
                    const isSystem = m.role === 'system';

                    if (isSystem) {
                      return <div key={m.id} className="text-xs text-solar-dim italic text-center my-4">{m.content}</div>;
                    }

                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                          <div className={`text-sm px-4 py-2.5 rounded-2xl ${
                            isMe ? 'bg-solar-accent text-black rounded-tr-sm' : 'bg-solar-surface border border-solar-border text-solar-text rounded-tl-sm'
                          }`}>
                            {m.content}
                          </div>
                          <div className="text-[9px] text-solar-dim mt-1.5 px-1 uppercase tracking-widest">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input block */}
              <div className="p-4 border-t border-solar-border bg-solar-surface/50">
                {activeRoom?.status === 'resolved' ? (
                  <div className="text-center text-sm text-solar-muted py-2">This conversation has been resolved and is closed to new messages.</div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="solar-input flex-1 py-3 text-sm" 
                      placeholder="Write your message..." 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!input.trim()} 
                      className="btn-primary px-5 disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // No room selected empty state
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-solar-surface border border-solar-border flex items-center justify-center mb-4"><MessageCircle size={24} className="text-solar-accent opacity-60"/></div>
              <h3 className="font-heading font-semibold text-lg">Your Messages</h3>
              <p className="text-sm text-solar-dim max-w-sm mt-2">Select a conversation from the left to view messages or reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
