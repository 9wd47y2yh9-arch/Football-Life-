import React, { useState } from 'react';
import { GameState, Person, RelationshipType } from '../types/footballLife';
import { Heart, Users, Shield, Award, MessageCircle, Sparkles, UserCheck, Flame } from 'lucide-react';
import { getRandomInt } from '../data/worldData';

interface RelationshipsViewProps {
  gameState: GameState;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
  onOpenChatWithPerson: (personId: string) => void;
}

export const RelationshipsView: React.FC<RelationshipsViewProps> = ({
  gameState,
  onUpdateGameState,
  onOpenChatWithPerson
}) => {
  const [filterRole, setFilterRole] = useState<'all' | 'friend' | 'rival' | 'crush' | 'coach'>('all');
  const [confessionFeedback, setConfessionFeedback] = useState<string | null>(null);

  const filteredContacts = gameState.contacts.filter(c => {
    if (filterRole === 'all') return true;
    if (filterRole === 'friend') return c.role === 'friend' || c.relationship === 'best_friend';
    if (filterRole === 'rival') return c.role === 'rival';
    if (filterRole === 'crush') return c.role === 'crush' || c.relationship === 'dating';
    if (filterRole === 'coach') return c.role === 'coach';
    return true;
  });

  // Handle Confession (告白)
  const handleConfession = (targetPerson: Person) => {
    // Determine confession outcome based on affinity
    let isAccepted = false;
    let feedback = '';

    if (targetPerson.affinity >= 75) {
      isAccepted = true;
      feedback = `${targetPerson.name}「…本当！？ずっと待ってたよ…！私もあなたのことが好き！これからもずっと一番近くで応援させてね！」`;
    } else if (targetPerson.affinity >= 50) {
      feedback = `${targetPerson.name}「えっ…！びっくりした…。気持ちはすごく嬉しいけど、今はまだ大事な友達としてもっと仲良くなりたいな…ごめんね。」`;
    } else {
      feedback = `${targetPerson.name}「え…？ごめん、今はサッカーや勉強のことで頭がいっぱいで、そういう風には見られないかな…。」`;
    }

    setConfessionFeedback(feedback);

    onUpdateGameState(prev => {
      let updatedTimeline = [...prev.timeline];
      let dailyLogs = [...prev.dailyLogs];

      if (isAccepted) {
        updatedTimeline.unshift({
          id: `tl_dating_${Date.now()}`,
          age: prev.player.age,
          date: prev.currentDate,
          title: `告白成功・恋人関係へ（${targetPerson.name}）`,
          description: `${targetPerson.name}に勇気を出して告白し、見事想いが通じ合って交際をスタートした！`,
          type: 'romance'
        });
      }

      dailyLogs.unshift({
        date: prev.currentDate,
        text: `【告白イベント】${targetPerson.name}へ想いを告げました。結果: ${isAccepted ? '恋人成立！' : '保留・友達のまま'}`,
        type: 'event'
      });

      const updatedContacts = prev.contacts.map(c => {
        if (c.id === targetPerson.id) {
          return {
            ...c,
            relationship: (isAccepted ? 'dating' : c.relationship) as RelationshipType,
            affinity: Math.min(100, c.affinity + (isAccepted ? 15 : -5)),
            memories: [`放課後の告白イベント（${prev.currentDate}）`, ...c.memories]
          };
        }
        return c;
      });

      return {
        ...prev,
        contacts: updatedContacts,
        timeline: updatedTimeline,
        dailyLogs
      };
    });
  };

  // Handle Date (デート)
  const handleAskOnDate = (targetPerson: Person) => {
    const affinityGain = getRandomInt(6, 12);
    const feedback = `${targetPerson.name}と休日デートに出かけました！カフェで美味しいスイーツを食べ、公園のベンチで将来の夢について楽しく語り合いました。（親密度+${affinityGain}）`;
    setConfessionFeedback(feedback);

    onUpdateGameState(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => 
        c.id === targetPerson.id ? { ...c, affinity: Math.min(100, c.affinity + affinityGain) } : c
      ),
      dailyLogs: [
        {
          date: prev.currentDate,
          text: `【休日デート】${targetPerson.name}とデートを楽しみ、絆が深まりました。`,
          type: 'event'
        },
        ...prev.dailyLogs
      ]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: '全員' },
          { id: 'friend', label: '友達・親友' },
          { id: 'rival', label: 'ライバル' },
          { id: 'crush', label: '恋愛・気になる人' },
          { id: 'coach', label: '監督・コーチ' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterRole(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterRole === tab.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Confession / Date Feedback Modal/Card */}
      {confessionFeedback && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-pink-500/80 text-white space-y-2 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-pink-400">
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 fill-pink-400" />
              イベント結果
            </span>
            <button
              onClick={() => setConfessionFeedback(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              閉じる
            </button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">{confessionFeedback}</p>
        </div>
      )}

      {/* Contacts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContacts.map(person => {
          const isDating = person.relationship === 'dating';
          const isCrush = person.role === 'crush';

          return (
            <div
              key={person.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow ${
                    isDating
                      ? 'bg-pink-600'
                      : person.role === 'rival'
                      ? 'bg-amber-600'
                      : person.role === 'coach'
                      ? 'bg-blue-600'
                      : 'bg-emerald-600'
                  }`}>
                    {person.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{person.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                        {isDating ? '恋人' : person.relationship === 'best_friend' ? '親友' : person.role === 'coach' ? '監督' : person.relationship}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{person.schoolOrClub} • {person.age}歳</div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenChatWithPerson(person.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>トーク</span>
                </button>
              </div>

              {/* Gauges */}
              <div className="space-y-1.5 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-pink-400" />
                      好感度
                    </span>
                    <span className="font-bold text-pink-300">{person.affinity} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${person.affinity}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-sky-400" />
                      信頼度
                    </span>
                    <span className="font-bold text-sky-300">{person.trust} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${person.trust}%` }} />
                  </div>
                </div>
              </div>

              {/* Personality & Memories */}
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 space-y-1">
                <div>性格: <span className="text-slate-300">{person.personality}</span></div>
                <div>趣味: <span className="text-slate-300">{person.hobbies.join(', ')}</span></div>
                {person.memories.length > 0 && (
                  <div className="text-amber-300/90 text-[10px] truncate">
                    思い出: {person.memories[0]}
                  </div>
                )}
              </div>

              {/* Romance Actions for crush or dating */}
              {(isCrush || isDating) && (
                <div className="pt-2 border-t border-slate-800/80 flex gap-2">
                  {!isDating && (
                    <button
                      onClick={() => handleConfession(person)}
                      className="flex-1 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      想いを告白する
                    </button>
                  )}
                  {isDating && (
                    <button
                      onClick={() => handleAskOnDate(person)}
                      className="flex-1 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      デートに誘う
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
