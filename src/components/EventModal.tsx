import React from 'react';
import { GameEvent, GameState } from '../types/footballLife';
import { Sparkles, Globe, GraduationCap } from 'lucide-react';

interface EventModalProps {
  event: GameEvent;
  onResolve: (actionType: string, payload?: any) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onResolve }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4 my-8">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          {event.category === 'national' ? (
            <Globe className="w-4 h-4 text-sky-400" />
          ) : (
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          )}
          <span>重要イベント発生</span>
        </div>

        <h2 className="text-base font-bold text-white leading-snug">{event.title}</h2>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
          {event.description}
        </p>

        <div className="space-y-2 pt-2">
          {event.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onResolve(opt.actionType, opt.payload)}
              className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-left text-xs font-semibold text-white transition-all cursor-pointer flex items-center justify-between"
            >
              <span>{opt.label}</span>
              <span className="text-[10px] text-emerald-400 font-bold">選択する →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
