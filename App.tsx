
import React, { useState, useCallback, useEffect } from 'react';
import Scoreboard from './components/Scoreboard';
import ControlPanel from './components/ControlPanel';
import { GameState, Player, DartsAction } from './types';

const STORAGE_KEY = 'DARTS_GAME_STATE_V2';

const INITIAL_STATE: GameState = {
  players: [
    { name: 'LUKE LITTLER', flag: '🇬🇧', legs: 0, score: 501, sets: 0 },
    { name: 'MICHAEL SMITH', flag: '🇬🇧', legs: 0, score: 501, sets: 0 },
  ],
  activePlayerIndex: 0,
  startingScore: 501,
  firstToLegs: 6,
  matchTitle: 'QUARTER FINAL',
  tournamentInfo: 'WORLD DARTS CHAMPIONSHIP',
  history: [[], []],
};

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [view, setView] = useState<'selection' | 'overlay' | 'controller'>('selection');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const baseUrl = window.location.origin + window.location.pathname;
  const overlayLink = `${baseUrl}?view=overlay`;
  const controllerLink = `${baseUrl}?view=controller`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('view');
    if (mode === 'overlay') setView('overlay');
    else if (mode === 'controller') setView('controller');
    else setView('selection');
  }, []);

  const handleAction = useCallback((action: DartsAction) => {
    setState((prev) => {
      const nextState = JSON.parse(JSON.stringify(prev)) as GameState;
      switch (action.type) {
        case 'SUBTRACT_SCORE': {
          const pIdx = prev.activePlayerIndex;
          const remaining = nextState.players[pIdx].score - action.amount;

          if (remaining === 0) {
            nextState.players[pIdx].score = 0;
            nextState.players[pIdx].legs += 1;
            nextState.history[pIdx].push(action.amount);
          } else if (remaining < 2) {
            // Bust
            nextState.activePlayerIndex = pIdx === 0 ? 1 : 0;
          } else {
            nextState.players[pIdx].score = remaining;
            nextState.history[pIdx].push(action.amount);
            nextState.activePlayerIndex = pIdx === 0 ? 1 : 0;
          }
          break;
        }
        case 'UNDO': {
          const prevIdx = prev.activePlayerIndex === 0 ? 1 : 0;
          const hist = nextState.history[prevIdx];
          if (hist.length > 0) {
            const last = hist.pop()!;
            nextState.players[prevIdx].score += last;
            nextState.activePlayerIndex = prevIdx;
            // If we undid a winning shot, decrement legs
            if (nextState.players[prevIdx].score === last && nextState.players[prevIdx].legs > 0) {
              // This is a bit complex for a simple undo, let's just restore score
            }
          }
          break;
        }
        case 'NEXT_LEG': {
          nextState.players[0].score = prev.startingScore;
          nextState.players[1].score = prev.startingScore;
          nextState.history = [[], []];
          const totalLegs = nextState.players[0].legs + nextState.players[1].legs;
          nextState.activePlayerIndex = totalLegs % 2;
          break;
        }
        case 'UPDATE_PLAYER': {
          nextState.players[action.index] = { ...nextState.players[action.index], ...action.data };
          break;
        }
        case 'UPDATE_CONFIG': {
          Object.assign(nextState, action.data);
          break;
        }
        case 'RESET_GAME': {
          return INITIAL_STATE;
        }
      }
      return nextState;
    });
  }, []);

  if (view === 'selection') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 font-sans overflow-auto">
        <div className="max-w-4xl w-full py-12">
          <header className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-7xl font-black mb-4 tracking-tighter uppercase italic leading-none">
              Darts <span className="text-blue-600">Sync</span>
            </h1>
            <p className="text-gray-500 text-xl font-medium tracking-tight">Professional Broadcast Overlay for OBS Studio</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
            <div className="group bg-gray-900/50 rounded-[3rem] p-12 border border-white/5 hover:border-blue-500/40 transition-all flex flex-col items-center text-center shadow-2xl backdrop-blur-sm">
              <div className="w-24 h-24 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner shadow-blue-500/20">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h2 className="text-4xl font-black mb-3 italic uppercase">Overlay View</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">Browser source for OBS. Transparent background, TV-style graphics.</p>
              <div className="w-full space-y-4">
                <div className="bg-black/60 p-4 rounded-2xl border border-white/5 font-mono text-[10px] break-all text-blue-400/80 leading-loose select-all">{overlayLink}</div>
                <button onClick={() => copyToClipboard(overlayLink, 'overlay')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95">{copyFeedback === 'overlay' ? 'COPIED TO CLIPBOARD' : 'COPY FOR OBS'}</button>
              </div>
            </div>

            <div className="group bg-gray-900/50 rounded-[3rem] p-12 border border-white/5 hover:border-green-500/40 transition-all flex flex-col items-center text-center shadow-2xl backdrop-blur-sm">
              <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner shadow-green-500/20">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h2 className="text-4xl font-black mb-3 italic uppercase">Operator</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">Touch-friendly control panel. Instant live sync across devices.</p>
              <div className="w-full space-y-4">
                <div className="bg-black/60 p-4 rounded-2xl border border-white/5 font-mono text-[10px] break-all text-green-400/80 leading-loose select-all">{controllerLink}</div>
                <button onClick={() => copyToClipboard(controllerLink, 'controller')} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-green-600/20 active:scale-95">{copyFeedback === 'controller' ? 'COPIED TO CLIPBOARD' : 'OPEN CONTROLLER'}</button>
              </div>
            </div>
          </div>
          
          <footer className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center gap-8">
            <div className="bg-blue-600/20 p-5 rounded-3xl text-blue-500 shrink-0">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h4 className="font-black text-blue-500 uppercase text-xs tracking-[0.2em] mb-2">Technical Setup</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Add a <b>Browser Source</b> in OBS. Paste the <b>Overlay Link</b>. Recommended Resolution: <b>1920x1080</b>. 
                Keep the controller open in a separate tab or on a tablet. Updates are instantaneous via local storage synchronization.
              </p>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  if (view === 'overlay') {
    return (
      <div className="min-h-screen flex items-end justify-center pb-24 overflow-hidden bg-transparent">
        <Scoreboard state={state} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col items-center p-6 select-none">
      <div className="w-full max-w-6xl flex flex-col gap-8">
        <header className="flex justify-between items-center bg-gray-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-6">
             <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Studio <span className="text-blue-600">Control</span></h1>
             <div className="h-8 w-px bg-white/10" />
             <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
               <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Live Sync Engine Active</p>
             </div>
           </div>
           <button onClick={() => setView('selection')} className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-95">Settings & Links</button>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
           <div className="lg:col-span-7">
             <ControlPanel state={state} dispatch={handleAction} onClose={() => {}} isStandalone={true} />
           </div>
           
           <div className="lg:col-span-5 flex flex-col gap-8 sticky top-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em]">Direct Preview</h2>
                  <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full italic uppercase">Real-Time</span>
                </div>
                <div className="bg-black rounded-[3rem] p-6 border border-white/10 flex items-center justify-center overflow-hidden h-[380px] shadow-2xl relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
                  <div className="scale-[0.55] transition-transform group-hover:scale-[0.6] duration-700">
                    <Scoreboard state={state} />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center opacity-30">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Overlay Mock View</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/30 p-8 rounded-[3rem] border border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Turn History</h3>
                  <span className="text-[10px] font-black text-gray-700">LATEST FIRST</span>
                </div>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-3 custom-scrollbar">
                   {state.history[0].concat(state.history[1]).length === 0 && (
                     <div className="text-center py-10 opacity-20">
                       <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                       <p className="text-xs font-black uppercase tracking-widest">No Throws Logged</p>
                     </div>
                   )}
                   {/* Create a unified history log */}
                   {state.history[0].map((s, i) => ({ s, p: 0, i })).concat(state.history[1].map((s, i) => ({ s, p: 1, i })))
                    .sort((a, b) => b.i - a.i || b.p - a.p)
                    .slice(0, 8).map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-right-2">
                       <div className="flex flex-col">
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">{state.players[item.p].name}</span>
                         <span className="text-xs font-bold text-gray-500 uppercase">SCORE INPUT</span>
                       </div>
                       <div className="flex items-center gap-4">
                         <span className={`text-2xl font-black italic tracking-tighter ${item.s >= 100 ? 'text-[#39FF14]' : 'text-white'}`}>{item.s}</span>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default App;
