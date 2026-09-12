import React, { useState } from 'react';
import { GameState, FaceToFaceEvent } from '../types/footballLife';
import { MessageSquare, Award, ArrowRight, CheckCircle2, UserCheck, Shield } from 'lucide-react';

interface FaceToFaceModalProps {
  event: FaceToFaceEvent;
  onResolve: (updatedState: GameState) => void;
  gameState: GameState;
}

export const FaceToFaceModal: React.FC<FaceToFaceModalProps> = ({
  event,
  onResolve,
  gameState
}) => {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [resolved, setResolved] = useState(false);

  const handleSelectOption = (idx: number) => {
    setSelectedOptionIndex(idx);
    setResolved(true);
  };

  const handleFinish = () => {
    if (selectedOptionIndex === null) return;
    const choice = event.options[selectedOptionIndex];

    let updatedPlayer = { ...gameState.player };
    if (choice.trustDelta) {
      updatedPlayer.coachTrust = Math.min(100, Math.max(0, updatedPlayer.coachTrust + choice.trustDelta));
    }
    if (choice.attitudeDelta) {
      updatedPlayer.practiceAttitude = Math.min(100, Math.max(0, (updatedPlayer.practiceAttitude || 80) + choice.attitudeDelta));
    }

    const updatedTimeline = [...gameState.timeline];
    if (event.speakerRole === 'coach' && Math.abs(choice.trustDelta || 0) >= 4) {
      updatedTimeline.unshift({
        id: `ftf_log_${Date.now()}`,
        age: updatedPlayer.age,
        date: gameState.currentDate,
        title: `${event.speakerName}との対面面談`,
        description: `「${choice.text}」と直訴し、監督からの信頼を獲得した。`,
        type: 'event'
      });
    }

    const updatedState: GameState = {
      ...gameState,
      player: updatedPlayer,
      timeline: updatedTimeline,
      activeFaceToFace: null,
      dailyLogs: [
        {
          date: gameState.currentDate,
          text: `【対面面談】${event.speakerTitle}との対話を実施。『${choice.text}』と伝えました。`,
          type: 'event'
        },
        ...gameState.dailyLogs
      ]
    };

    onResolve(updatedState);
  };

  const selectedChoice = selectedOptionIndex !== null ? event.options[selectedOptionIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/60 to-slate-900 p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                面談イベント（対面対話）
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">{event.speakerTitle}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Situation prompt */}
          <div className="text-sm text-slate-300 bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-xl">
            <span className="text-slate-400 block text-xs font-semibold mb-1">【状況】</span>
            {event.situation}
          </div>

          {/* Speaker Dialogue */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl relative">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-2">
              <MessageSquare className="w-4 h-4" />
              <span>{event.speakerName}</span>
            </div>
            <p className="text-base text-slate-100 leading-relaxed font-medium">
              {event.dialogueText}
            </p>
          </div>

          {/* Options or Response */}
          {!resolved ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">返答・相談内容を選択</h3>
              {event.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className="w-full text-left p-4 rounded-xl border border-slate-700 hover:border-emerald-500/70 bg-slate-800/70 hover:bg-slate-800 transition flex items-center justify-between group"
                >
                  <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-300">
                    {opt.text}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition ml-3 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Speaker Response */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{event.speakerName}の返答</span>
                </div>
                <p className="text-sm text-emerald-100 leading-relaxed font-medium">
                  {selectedChoice?.response}
                </p>

                {/* Stat deltas */}
                <div className="mt-3 flex items-center space-x-3 text-xs pt-3 border-t border-emerald-900/40">
                  {selectedChoice?.trustDelta !== undefined && (
                    <span className={`px-2.5 py-1 rounded-md font-semibold ${
                      selectedChoice.trustDelta >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      監督信頼度: {selectedChoice.trustDelta >= 0 ? `+${selectedChoice.trustDelta}` : selectedChoice.trustDelta}
                    </span>
                  )}
                  {selectedChoice?.attitudeDelta !== undefined && (
                    <span className="px-2.5 py-1 rounded-md font-semibold bg-blue-500/20 text-blue-300">
                      練習態度: +{selectedChoice.attitudeDelta}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleFinish}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center space-x-2"
              >
                <span>面談を終了して日程を進める</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
