import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] animate-toast-in pointer-events-none">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border
        ${toast.type === 'ok'
          ? 'bg-solar-green/10 border-solar-green/40 text-solar-text'
          : toast.type === 'err'
          ? 'bg-red-500/10 border-red-500/40 text-solar-text'
          : 'bg-solar-card2 border-solar-border2 text-solar-text'
        }`}>
        <span>{toast.type === 'ok' ? '✅' : toast.type === 'err' ? '❌' : 'ℹ️'}</span>
        {toast.msg}
      </div>
    </div>
  );
}
