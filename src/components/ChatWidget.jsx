import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getSocket, connectSocket } from '../lib/socket';
import { MessageCircle, X, Bot, User, SendHorizonal, Star, MapPin, BadgeCheck } from 'lucide-react';

const QUICK = ['What solar system do I need?','How much do solar panels cost?','Do you install solar?','How long is delivery?'];
const HUMAN = {
  order: ["Your order is confirmed and being processed. Our team will reach out within 2 hours.","I can see your order was dispatched yesterday. It should arrive within 1–2 business days."],
  price: ["We offer price matching! Send us the competitor's quote and we'll beat it by 5%.","Our prices include VAT and 1-year platform warranty support."],
  deliver: ["We deliver to all 36 states. Lagos/Abuja orders: 2–3 days, others 3–5 days.","Same-day delivery available in Lagos for orders before 12pm."],
  install: ["We partner with certified installers in Lagos, Abuja, PH, and 12 other cities at no extra charge.","Our installation partners are NAFDAC-registered. Costs ₦15k–₦50k depending on system size."],
  default: ["Thanks for reaching out! Could you share more details about your solar project?","I'll help resolve this for you. What specific information do you need today?"],
};

function humanReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes('order')||m.includes('track')) return HUMAN.order[Math.random()>.5?1:0];
  if (m.includes('price')||m.includes('cost')||m.includes('cheaper')) return HUMAN.price[Math.random()>.5?1:0];
  if (m.includes('deliver')||m.includes('ship')) return HUMAN.deliver[Math.random()>.5?1:0];
  if (m.includes('install')||m.includes('techni')) return HUMAN.install[Math.random()>.5?1:0];
  return HUMAN.default[Math.random()>.5?1:0];
}

function RichCards({ content }) {
  const { products = [], engineers = [] } = content;
  return (
    <div className="mt-2 space-y-2 w-full max-w-[300px]">
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {products.slice(0, 4).map(p => (
            <a key={p.id} href={`/product/${p.slug}`}
              className="flex flex-col bg-solar-surface border border-solar-border hover:border-solar-accent rounded-lg overflow-hidden transition-colors text-left">
              {p.thumbnail
                ? <img src={p.thumbnail} alt={p.name} className="w-full h-16 object-cover"/>
                : <div className="w-full h-16 bg-solar-card2 flex items-center justify-center text-solar-dim text-[9px]">No img</div>
              }
              <div className="p-1.5">
                <div className="text-[10px] font-medium text-solar-text line-clamp-2 leading-tight">{p.name}</div>
                <div className="text-[11px] font-bold text-solar-accent mt-0.5">₦{Number(p.price).toLocaleString()}</div>
                {Number(p.rating) > 0 && (
                  <div className="flex items-center gap-0.5 text-[9px] text-solar-dim">
                    <Star size={8} className="text-solar-accent fill-solar-accent"/>
                    {Number(p.rating).toFixed(1)}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
      {engineers.length > 0 && (
        <div className="space-y-1.5">
          {engineers.slice(0, 3).map(e => (
            <a key={e.id} href={`/engineers/${e.id}`}
              className="flex items-center gap-2 bg-solar-surface border border-solar-border hover:border-solar-accent rounded-lg p-2 transition-colors">
              {e.profilePhoto
                ? <img src={e.profilePhoto} alt={e.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0"/>
                : <div className="w-9 h-9 rounded-full bg-solar-accent/20 flex items-center justify-center text-solar-accent text-xs font-bold flex-shrink-0">
                    {e.name?.[0] || 'E'}
                  </div>
              }
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-solar-text truncate">{e.name}</span>
                  {e.isVerified && <BadgeCheck size={10} className="text-solar-accent flex-shrink-0"/>}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-solar-dim">
                  <MapPin size={8}/>{e.city}, {e.state}
                </div>
                <div className="text-[10px] text-solar-accent">
                  ★ {Number(e.rating).toFixed(1)} · {e.completedJobs} jobs
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatWidget() {
  const { chatOpen, dispatch, user } = useApp();
  const [mode, setMode] = useState('ai');
  const [msgs, setMsgs] = useState([{
    role:'ai', text:"Hi! I'm SolarBot. I can help you size your solar system, compare products, or answer any solar question.", time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId]   = useState(null);
  const [connecting, setConnecting] = useState(false);
  const bottomRef = useRef(null);
  const agentName = useRef(['Chidi','Amaka','Emeka','Ngozi'][Math.floor(Math.random()*4)]).current;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, loading]);

  // WebSocket listeners
  useEffect(() => {
    if (!chatOpen || !user) return;
    const s = connectSocket();
    if (!s) return;
    s.on('room_created', d => setRoomId(d.roomId));
    s.on('new_message',  d => {
      if (d.role === 'assistant' || d.role === 'human_agent' || d.role === 'system') {
        const isHuman = d.role === 'human_agent';
        setMsgs(m => [...m, {
          role: isHuman ? 'human' : d.role === 'system' ? 'system' : 'ai',
          text: d.content, time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
          agentName: isHuman ? agentName : undefined,
          metadata: d.metadata || null,
        }]);
        setLoading(false);
      }
    });
    s.on('human_agent_joined', () => {
      setConnecting(false); setMode('human');
      setMsgs(m => [...m, { role:'system', text:'You are now connected with a live support agent.', time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) }]);
    });
    s.on('queued', d => {
      setConnecting(false);
      setMsgs(m => [...m, { role:'system', text: d.message, time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) }]);
    });
    return () => { s.off('room_created'); s.off('new_message'); s.off('human_agent_joined'); s.off('queued'); };
  }, [chatOpen, user]);

  async function sendMsg(text) {
    const msg = (text||input).trim(); if (!msg||loading) return;
    setInput('');
    const t = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    setMsgs(m => [...m, {role:'user', text:msg, time:t}]);
    setLoading(true);

    const s = getSocket();
    if (user && s?.connected) {
      // Use WebSocket when available
      s.emit('send_message', { content:msg, roomId, type:'ai_support' });
      // Fallback timeout if no response in 10s
      setTimeout(() => setLoading(false), 10000);
    } else {
      // Unauthenticated: local mock response
      if (mode==='human') {
        setTimeout(() => {
          setLoading(false);
          setMsgs(m => [...m, {role:'human', text:humanReply(msg), time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
        }, 1200+Math.random()*1000);
      } else {
        // Call API directly (no auth)
        try {
          const res = await fetch('/api/v1/advisor/calculate', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ appliances:[], preferences:{}, _chatQuery:msg })
          });
        } catch {}
        // Simulated AI response
        const replies = [
          "Great question! For solar sizing in Nigeria, you'll need to calculate your daily Wh load first. Use our Solar Advisor for a complete 3-option system design!",
          "Panel prices in Nigeria typically range from ₦160k–₦320k for quality 400–580W modules. Check our marketplace for current listings.",
          "We deliver nationwide! Lagos & Abuja: 2–3 days, other states: 3–5 days. Sign in to place an order.",
          "For your appliances, I'd recommend starting with our Solar Advisor — it calculates panels, batteries, and inverter size automatically.",
        ];
        setTimeout(() => {
          setLoading(false);
          setMsgs(m => [...m, {role:'ai', text:replies[Math.floor(Math.random()*replies.length)], time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
        }, 1200);
      }
    }
  }

  function switchToHuman() {
    if (!user) { dispatch({type:'OPEN_AUTH',payload:'login'}); return; }
    setConnecting(true);
    setMsgs(m => [...m, {role:'system', text:'Connecting you to a human agent…', time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
    const s = getSocket();
    if (roomId && s?.connected) {
      s.emit('request_human', { roomId });
    } else {
      setTimeout(() => {
        setConnecting(false); setMode('human');
        setMsgs(m => [...m, {role:'human', text:`Hi! I'm ${agentName} from Solar Maket support. How can I help you today?`, time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}]);
      }, 2000);
    }
  }

  return (
    <>
      <button onClick={()=>dispatch({type:'TOGGLE_CHAT'})}
        className={`fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110 ${chatOpen?'bg-solar-surface border-2 border-solar-border text-solar-muted':'bg-solar-accent text-black'}`}
        style={chatOpen?{}:{boxShadow:'0 0 24px rgba(245,158,11,0.4)'}}>
        {chatOpen ? <X size={22}/> : <MessageCircle size={22}/>}
      </button>
      {!chatOpen&&<div className="fixed bottom-[72px] right-[72px] z-[201] w-3 h-3 bg-solar-green rounded-full border-2 border-solar-bg animate-pulse-slow"/>}

      {chatOpen&&(
        <div className="fixed bottom-24 right-6 z-[199] w-[360px] max-w-[calc(100vw-24px)] bg-solar-card border border-solar-border2 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
          style={{height:520, maxHeight:'calc(100vh - 120px)'}}>
          <div className="p-4 border-b border-solar-border bg-gradient-to-r from-solar-card to-solar-card2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-solar-accent/20 border border-solar-accent/30 flex items-center justify-center text-solar-accent">{mode==='ai'?<Bot size={16}/>:<User size={16}/>}</div>
                <div>
                  <div className="font-heading text-sm font-semibold">{mode==='ai'?'SolarBot AI':`${agentName} · Support`}</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${connecting?'bg-solar-accent animate-pulse-slow':'bg-solar-green'}`}/>
                    <span className="text-[11px] text-solar-muted">{connecting?'Connecting…':mode==='ai'?'AI powered · Instant':'Human agent · Live'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setMode('ai')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${mode==='ai'?'bg-solar-accent text-black':'bg-solar-surface text-solar-muted hover:text-solar-text'}`}><Bot size={13}/> AI Assistant</button>
              <button onClick={mode==='ai'?switchToHuman:undefined} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${mode==='human'?'bg-solar-green text-black':'bg-solar-surface text-solar-muted hover:text-solar-text'}`}><User size={13}/> Human Agent</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m,i) => (
              <div key={i} className={`flex flex-col gap-0.5 ${m.role==='user'?'items-end':'items-start'}`}>
                {m.role==='system'?(
                  <div className="text-xs text-solar-dim italic bg-solar-surface/50 px-3 py-1.5 rounded-full mx-auto">{m.text}</div>
                ):(
                  <>
                    <div className={m.role==='user'?'msg-user':'msg-ai'}>{m.text}</div>
                    {m.role !== 'user' && m.metadata?.richContent && (
                      <RichCards content={m.metadata.richContent}/>
                    )}
                    <span className="text-[10px] text-solar-dim px-1">{m.time}</span>
                  </>
                )}
              </div>
            ))}
            {loading&&(
              <div className="flex items-start gap-2">
                <div className="msg-ai flex gap-1 items-center py-3.5">
                  {[0,200,400].map(d=><div key={d} className="w-1.5 h-1.5 bg-solar-muted rounded-full animate-bounce-slow" style={{animationDelay:d+'ms'}}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          {msgs.length<=2&&mode==='ai'&&(
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK.map(q=>(
                  <button key={q} onClick={()=>sendMsg(q)} className="text-[11px] bg-solar-surface border border-solar-border hover:border-solar-accent hover:text-solar-accent text-solar-muted px-2.5 py-1 rounded-full transition-all">{q}</button>
                ))}
              </div>
            </div>
          )}
          <div className="p-3 border-t border-solar-border">
            <div className="flex gap-2">
              <input className="solar-input flex-1 text-sm py-2" placeholder="Ask anything about solar…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}/>
              <button onClick={()=>sendMsg()} disabled={!input.trim()||loading} className="btn-primary px-3 py-2 disabled:opacity-40"><SendHorizonal size={16}/></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
