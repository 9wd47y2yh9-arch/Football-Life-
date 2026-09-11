import React from 'react';
import { GameState } from '../types/footballLife';
import { Trophy, Calendar, CheckCircle2, Circle } from 'lucide-react';

interface LeagueStandingsViewProps {
  gameState: GameState;
  onOpenMatchModal: () => void;
}

export const LeagueStandingsView: React.FC<LeagueStandingsViewProps> = ({
  gameState,
  onOpenMatchModal
}) => {
  const { leagueStandings, leagueFixtures, currentMatchday, player, currentDate } = gameState;
  const nextFixture = leagueFixtures.find(f => !f.played);

  // Check if today is a matchday
  const isTodayMatch = !!(gameState.activeMatch || leagueFixtures.find(f => f.date === currentDate && !f.played));
  const todayFixture = gameState.activeMatch || leagueFixtures.find(f => f.date === currentDate && !f.played);

  // Calculate days until next match
  const getDaysUntilNextMatch = () => {
    if (!nextFixture) return null;
    const current = new Date(currentDate).getTime();
    const next = new Date(nextFixture.date).getTime();
    const diff = Math.ceil((next - current) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };
  const daysUntilNextMatch = getDaysUntilNextMatch();

  return (
    <div className="space-y-6">
      {/* League Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span>育成U公式リーグ（シーズン {gameState.currentSeason}）</span>
          </div>
          <h2 className="text-lg font-black text-white">
            現在: 第 {currentMatchday} 節進行中（全 {leagueFixtures.length} 節）
          </h2>
        </div>

        {isTodayMatch && todayFixture ? (
          <button
            onClick={onOpenMatchModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-950/40 transition cursor-pointer flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>本日キックオフ！試合を行う（vs {todayFixture.isPlayerHome ? todayFixture.awayTeam : todayFixture.homeTeam}）</span>
          </button>
        ) : nextFixture ? (
          <div className="text-right">
            <div className="text-xs font-bold text-slate-300">
              次節（第 {nextFixture.matchday} 節）: {nextFixture.date}
            </div>
            <div className="text-[11px] text-slate-500">
              あと {daysUntilNextMatch} 日（日常画面で日程を進めてください）
            </div>
          </div>
        ) : null}
      </div>

      {/* Standings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
        <h3 className="text-xs font-bold text-slate-400">リーグ順位表</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                <th className="py-2.5 px-2">順位</th>
                <th className="py-2.5 px-3">クラブ名</th>
                <th className="py-2.5 px-2 text-center">試合</th>
                <th className="py-2.5 px-2 text-center">勝</th>
                <th className="py-2.5 px-2 text-center">分</th>
                <th className="py-2.5 px-2 text-center">負</th>
                <th className="py-2.5 px-2 text-center">得失差</th>
                <th className="py-2.5 px-3 text-right">勝点</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leagueStandings.map((team, idx) => {
                const isPlayerTeam = team.teamName === player.currentTeam.name;
                return (
                  <tr
                    key={team.teamName}
                    className={`${isPlayerTeam ? 'bg-emerald-950/40 font-bold text-emerald-300' : 'text-slate-300'}`}
                  >
                    <td className="py-2.5 px-2">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                        idx === 0 ? 'bg-amber-500 text-slate-950 font-black' : idx <= 2 ? 'bg-slate-700 text-white' : 'text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 truncate max-w-[180px]">
                      {team.teamName}
                      {isPlayerTeam && <span className="ml-1.5 text-[10px] text-emerald-400 font-normal">（所属）</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-400">{team.played}</td>
                    <td className="py-2.5 px-2 text-center">{team.won}</td>
                    <td className="py-2.5 px-2 text-center">{team.drawn}</td>
                    <td className="py-2.5 px-2 text-center">{team.lost}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={team.gd > 0 ? 'text-emerald-400' : team.gd < 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-sm text-white">
                      {team.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixtures Schedule List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-400" />
          全節試合日程・結果一覧
        </h3>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {leagueFixtures.map((fix) => (
            <div
              key={fix.id}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                fix.played
                  ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                  : fix.matchday === currentMatchday
                  ? 'bg-emerald-950/30 border-emerald-600 text-white font-semibold'
                  : 'bg-slate-950/40 border-slate-850 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-14 text-[11px] font-mono text-slate-400">
                  第 {fix.matchday} 節
                </span>
                <div className="flex items-center gap-2">
                  <span className={fix.isPlayerHome ? 'font-bold text-slate-200' : ''}>{fix.homeTeam}</span>
                  <span className="text-slate-500 text-[10px]">vs</span>
                  <span className={!fix.isPlayerHome ? 'font-bold text-slate-200' : ''}>{fix.awayTeam}</span>
                </div>
              </div>

              <div className="text-right">
                {fix.played ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">
                      {fix.homeScore} - {fix.awayScore}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {fix.playerPlayed ? `採点 ${fix.playerRating}` : 'ベンチ外'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">{fix.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
