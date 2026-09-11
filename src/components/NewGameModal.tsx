import React, { useState, useMemo } from 'react';
import { Position, Gender, Playstyle } from '../types/footballLife';
import { COUNTRIES, POSITIONS, PLAYSTYLES, getCompatiblePlaystyles } from '../data/worldData';
import { Shield, Sparkles, User, Globe, Trophy, Compass, Flame } from 'lucide-react';

interface NewGameModalProps {
  onStartGame: (config: {
    name: string;
    gender: Gender;
    nationality: string;
    dualNationality?: string;
    birthplace: string;
    startingCountry: string;
    initialPosition: Position;
    playstyle: Playstyle;
    initialTeamIndex: number;
  }) => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({ onStartGame }) => {
  const [name, setName] = useState('佐藤 拓海');
  const [gender, setGender] = useState<Gender>('male');
  const [startingCountry, setStartingCountry] = useState('japan');
  const [nationality, setNationality] = useState('日本');
  const [hasDualNationality, setHasDualNationality] = useState(false);
  const [dualNationality, setDualNationality] = useState('スペイン');
  const [birthplace, setBirthplace] = useState('東京都');
  const [initialPosition, setInitialPosition] = useState<Position>('CF');
  const [playstyle, setPlaystyle] = useState<Playstyle>('line_breaker');
  const [initialTeamIndex, setInitialTeamIndex] = useState(0);

  const countryData = COUNTRIES[startingCountry] || COUNTRIES.japan;

  // Compatible playstyles for current position
  const compatiblePlaystyles = useMemo(() => {
    return getCompatiblePlaystyles(initialPosition);
  }, [initialPosition]);

  const handlePositionChange = (pos: Position) => {
    setInitialPosition(pos);
    const compatible = getCompatiblePlaystyles(pos);
    if (compatible.length > 0 && !compatible.some(p => p.id === playstyle)) {
      setPlaystyle(compatible[0].id);
    }
  };

  const handleCountryChange = (cId: string) => {
    setStartingCountry(cId);
    const cData = COUNTRIES[cId];
    if (cData) {
      setNationality(cData.name);
      setBirthplace(cId === 'japan' ? '東京都' : cId === 'spain' ? 'Madrid' : cId === 'england' ? 'London' : 'City');
      setInitialTeamIndex(0);
      const first = cData.firstNamesMale[0];
      const last = cData.lastNames[0];
      setName(cId === 'japan' ? `${last} ${first}` : `${first} ${last}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onStartGame({
      name: name.trim(),
      gender,
      nationality,
      dualNationality: hasDualNationality ? dualNationality : undefined,
      birthplace: birthplace.trim() || '地元',
      startingCountry,
      initialPosition,
      playstyle,
      initialTeamIndex
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 flex flex-col items-center justify-start min-h-screen">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 sm:p-8 text-white shadow-2xl my-4 sm:my-8 shrink-0 pb-12">
        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            完全オリジナル・サッカー人生シミュレーション
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>FOOTBALL LIFE</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            10歳の少年・少女からスタートし、練習・学校・SNS・移籍・恋愛・代表を経て自分だけのサッカー人生を作ろう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                1. プレイヤー基本情報（10歳からスタート）
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-400 font-bold bg-amber-950/70 border border-amber-800 px-2.5 py-0.5 rounded">
                  初期能力: OVR 30
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                  年齢: 10歳（小学4年生）
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  選手名（キーボードで自由に直接入力）
                </label>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                  placeholder="例: 佐藤 拓海"
                />
                <p className="text-[10px] text-slate-400 mt-1">※文字入力キーボードで名前を自由に変更できます</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">性別</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    男子 (Boy)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'bg-pink-600 border-pink-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    女子 (Girl)
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">出生地（都市）</label>
                <input
                  type="text"
                  required
                  value={birthplace}
                  onChange={(e) => setBirthplace(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="例: 東京都"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Country & Nationality */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              2. 国・国籍・育成環境（国によって学校・ユース・人物が変化）
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">開始国（キャリアを始める国）</label>
                <select
                  value={startingCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.values(COUNTRIES).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flag} {c.name} ({c.continent})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">第一国籍</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Dual Nationality Option */}
            <div className="pt-2 border-t border-slate-700/60">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={hasDualNationality}
                  onChange={(e) => setHasDualNationality(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                />
                二重国籍を設定する（将来の代表招集選択に影響）
              </label>

              {hasDualNationality && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">第二国籍</label>
                    <select
                      value={dualNationality}
                      onChange={(e) => setDualNationality(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {Object.values(COUNTRIES).map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center">
                    ※U-15/U-18年代で代表招集された際、どちらの代表で戦うかの選択イベントが発生します。
                  </p>
                </div>
              )}
            </div>

            {/* Starting Youth Team in chosen country */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                開始ユース・少年チーム（{countryData.name}国内のチーム）
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {countryData.youthTeams.map((team, idx) => (
                  <label
                    key={team.name}
                    className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                      initialTeamIndex === idx
                        ? 'bg-emerald-950/40 border-emerald-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="team"
                          checked={initialTeamIndex === idx}
                          onChange={() => setInitialTeamIndex(idx)}
                          className="text-emerald-500"
                        />
                        <span className="font-semibold text-xs">{team.name}</span>
                      </div>
                      <span className="text-xs text-amber-400">★{team.level}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex gap-3">
                      <span>週{team.practiceDaysPerWeek}日練習</span>
                      <span>監督: {team.coachName} ({team.coachStyle})</span>
                      <span>戦術: {team.tactic}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Position & Playstyle */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                3. 基本ポジションの選択
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ※10〜12歳でプレーする最初のポジションを選択します。
              </p>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePositionChange(p.id)}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                    initialPosition === p.id
                      ? 'bg-emerald-600 border-emerald-400 text-white font-bold shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{p.id}</div>
                  <div className="text-[10px] text-slate-300 truncate">{p.area}</div>
                </button>
              ))}
            </div>

            {/* Playstyle Selection */}
            <div className="pt-3 border-t border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  プレースタイルの選択（初期能力・成長傾向に影響）
                </label>
                <span className="text-[10px] text-slate-400">
                  {initialPosition}適性のスタイル一覧
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                {compatiblePlaystyles.map((p) => {
                  const isSelected = playstyle === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlaystyle(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/70 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Compass className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                          {p.name}
                        </span>
                        <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/60">
                          {p.roleSummary}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {p.description}
                      </p>
                      <div className="text-[10px] text-emerald-400/90 mt-1.5 font-mono">
                        成長ボーナス: {p.growthBonus.join(' / ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            この設定でサッカー人生を開始する（10歳）
          </button>
        </form>
      </div>
    </div>
  );
};
