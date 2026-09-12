import React, { useState } from 'react';
import { GameState, MatchFixture } from '../types/footballLife';
import { Calendar, Trophy, MapPin, CheckCircle2, Clock, ChevronRight, Shield, Star, AlertCircle } from 'lucide-react';
import { getDaysBetweenDates, formatDateJapanese } from '../services/gameEngine';

interface ScheduleViewProps {
  gameState: GameState;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ gameState }) => {
  const { leagueFixtures, currentDate, player, currentSeason } = gameState;
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'finished'>('upcoming');

  const upcomingFixtures = leagueFixtures.filter(f => !f.played);
  const finishedFixtures = leagueFixtures.filter(f => f.played);

  const displayedFixtures = filter === 'all'
    ? leagueFixtures
    : filter === 'upcoming'
    ? upcomingFixtures
    : finishedFixtures;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">
                Season {currentSeason}
              </span>
              <span className="text-xs text-slate-400">所属: {player.currentTeam.name}</span>
            </div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              公式戦・大会日程スケジュール
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              今後の公式戦・大会日程、大会名、リーグ名、対戦相手、ホーム/アウェイを確認できます。
            </p>
          </div>

          <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-right shrink-0">
            <div className="text-[10px] text-slate-500">現在日時</div>
            <div className="text-sm font-black text-emerald-400 font-mono">{formatDateJapanese(currentDate)}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              未消化: <span className="text-white font-bold">{upcomingFixtures.length}</span> / 全 {leagueFixtures.length} 節
            </div>
          </div>
        </div>

        {/* Read-Only Notice Rule Enforcement: No warp button */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            ※日程画面は試合スケジュール確認専用です。日程画面から直接試合日へワープすることは禁止されています。日々の準備・コンディション調整を経て試合当日を迎えます。
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filter === 'upcoming'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>今後の対戦予定</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80">
            {upcomingFixtures.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('finished')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filter === 'finished'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>終了した試合結果</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80">
            {finishedFixtures.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            filter === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>全日程（通期）</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80">
            {leagueFixtures.length}
          </span>
        </button>
      </div>

      {/* Fixtures List */}
      <div className="space-y-3">
        {displayedFixtures.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
            表示する日程はありません。
          </div>
        ) : (
          displayedFixtures.map((fixture) => {
            const isToday = fixture.date === currentDate;
            const daysDiff = getDaysBetweenDates(currentDate, fixture.date);
            const isUpcoming = !fixture.played;
            const opponentName = fixture.isPlayerHome ? fixture.awayTeam : fixture.homeTeam;
            const leagueName = fixture.competitionName.includes('リーグ') 
              ? fixture.competitionName 
              : `${player.currentTeam.name} 所属公式リーグ`;

            let countdownBadge = null;
            if (isUpcoming) {
              if (isToday) {
                countdownBadge = (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold animate-pulse">
                    ★ 本日 試合当日
                  </span>
                );
              } else if (daysDiff === 1) {
                countdownBadge = (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    明日（試合前日）
                  </span>
                );
              } else if (daysDiff > 1 && daysDiff <= 5) {
                countdownBadge = (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold">
                    あと {daysDiff} 日（直前調整期）
                  </span>
                );
              } else if (daysDiff > 5) {
                countdownBadge = (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
                    あと {daysDiff} 日後
                  </span>
                );
              }
            } else {
              const won = (fixture.isPlayerHome && (fixture.homeScore || 0) > (fixture.awayScore || 0)) ||
                          (!fixture.isPlayerHome && (fixture.awayScore || 0) > (fixture.homeScore || 0));
              const drawn = (fixture.homeScore || 0) === (fixture.awayScore || 0);

              countdownBadge = (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  won
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : drawn
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}>
                  {won ? '勝利' : drawn ? '引き分け' : '敗戦'}
                </span>
              );
            }

            return (
              <div
                key={fixture.id}
                className={`bg-slate-900 border rounded-2xl p-4 transition space-y-3 ${
                  isToday
                    ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Top header row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                      第 {fixture.matchday} 節
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {fixture.competitionName}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      fixture.isPlayerHome 
                        ? 'bg-sky-950/70 text-sky-300 border-sky-700/50' 
                        : 'bg-amber-950/70 text-amber-300 border-amber-700/50'
                    }`}>
                      {fixture.isPlayerHome ? 'HOME（ホーム）' : 'AWAY（アウェイ）'}
                    </span>
                    {countdownBadge}
                  </div>

                  {/* Match score if played */}
                  {fixture.played && (
                    <div className="text-xs font-mono font-black text-white px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
                      スコア: {fixture.homeScore} - {fixture.awayScore}
                    </div>
                  )}
                </div>

                {/* Matchup Header */}
                <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-white bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  <span className={fixture.isPlayerHome ? 'text-emerald-400 font-black' : 'text-slate-200'}>
                    {fixture.homeTeam}
                  </span>
                  <span className="text-xs text-slate-500 font-normal px-1">vs</span>
                  <span className={!fixture.isPlayerHome ? 'text-emerald-400 font-black' : 'text-slate-200'}>
                    {fixture.awayTeam}
                  </span>
                </div>

                {/* 5 Required Specifications:
                    1. 日付
                    2. 大会名
                    3. リーグ名
                    4. 対戦相手
                    5. ホーム / アウェイ
                */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">1. 日付</span>
                    <span className="text-slate-200 font-bold font-mono text-[11px] sm:text-xs">
                      {formatDateJapanese(fixture.date)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">2. 大会名</span>
                    <span className="text-emerald-400 font-bold truncate block">
                      {fixture.competitionName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">3. リーグ名</span>
                    <span className="text-sky-300 font-semibold truncate block">
                      {leagueName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">4. 対戦相手</span>
                    <span className="text-amber-300 font-bold truncate block">
                      {opponentName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">5. 会場区分</span>
                    <span className={`font-bold text-[11px] ${fixture.isPlayerHome ? 'text-sky-400' : 'text-orange-400'}`}>
                      {fixture.isPlayerHome ? 'ホーム' : 'アウェイ'}
                    </span>
                  </div>
                </div>

                {/* Player Performance if played */}
                {fixture.played && (
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">本人の出場記録:</span>
                    <div className="font-bold text-white flex items-center gap-2">
                      {fixture.playerPlayed ? (
                        <>
                          <span className="text-emerald-400 font-mono">
                            ★ 評価点 {fixture.playerRating?.toFixed(1) || '-'}
                          </span>
                          <span className="text-slate-300">
                            {fixture.playerGoals || 0}G / {fixture.playerAssists || 0}A
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            （{fixture.playerMinutes || 0}分出場）
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500">ベンチ外 / 出場なし</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
