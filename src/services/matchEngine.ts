import { GameState, MatchFixture, LeagueStanding, MatchMoment, MatchEventLog, Position, PlayerStats } from '../types/footballLife';
import { COUNTRIES, getRandomElement, getRandomInt, findRealProClubByName, getProClubsForCountry, REAL_PRO_CLUBS } from '../data/worldData';

/**
 * Calculates Position-Weighted OVR (Overall Rating)
 */
export function calculatePlayerOVR(stats: PlayerStats, position: Position): number {
  if (!stats) return 30;
  let total = 0;
  switch (position) {
    case 'CF':
    case 'ST':
      total = (stats.shooting || 30) * 0.30 + (stats.pace || 30) * 0.18 + (stats.dribbling || 30) * 0.16 + (stats.physical || 30) * 0.14 + (stats.tacticalSense || 30) * 0.11 + (stats.passing || 30) * 0.11;
      break;
    case 'WG':
      total = (stats.pace || 30) * 0.28 + (stats.dribbling || 30) * 0.25 + (stats.passing || 30) * 0.18 + (stats.shooting || 30) * 0.16 + (stats.stamina || 30) * 0.13;
      break;
    case 'OMF':
      total = (stats.passing || 30) * 0.26 + (stats.dribbling || 30) * 0.22 + (stats.tacticalSense || 30) * 0.20 + (stats.shooting || 30) * 0.16 + (stats.pace || 30) * 0.16;
      break;
    case 'CMF':
      total = (stats.passing || 30) * 0.25 + (stats.stamina || 30) * 0.20 + (stats.tacticalSense || 30) * 0.18 + (stats.dribbling || 30) * 0.14 + (stats.defending || 30) * 0.13 + (stats.physical || 30) * 0.10;
      break;
    case 'DMF':
      total = (stats.defending || 30) * 0.28 + (stats.physical || 30) * 0.22 + (stats.passing || 30) * 0.18 + (stats.tacticalSense || 30) * 0.18 + (stats.stamina || 30) * 0.14;
      break;
    case 'CB':
      total = (stats.defending || 30) * 0.35 + (stats.physical || 30) * 0.25 + (stats.tacticalSense || 30) * 0.18 + (stats.pace || 30) * 0.12 + (stats.stamina || 30) * 0.10;
      break;
    case 'SB':
      total = (stats.pace || 30) * 0.26 + (stats.stamina || 30) * 0.22 + (stats.defending || 30) * 0.20 + (stats.passing || 30) * 0.18 + (stats.dribbling || 30) * 0.14;
      break;
    case 'GK':
      total = (stats.defending || 30) * 0.40 + (stats.physical || 30) * 0.25 + (stats.mental || 30) * 0.20 + (stats.tacticalSense || 30) * 0.15;
      break;
    default:
      total = ((stats.pace || 30) + (stats.shooting || 30) + (stats.passing || 30) + (stats.dribbling || 30) + (stats.defending || 30) + (stats.physical || 30) + (stats.tacticalSense || 30) + (stats.mental || 30) + (stats.stamina || 30)) / 9;
  }
  return Math.max(20, Math.min(99, Math.round(total)));
}

/**
 * Robust, bug-free lineup role evaluation.
 * High coach trust (85-100), low fatigue, and healthy status guarantees starter!
 * Cured injuries restore immediate match eligibility without any permanent lockouts.
 */
export function evaluateLineupRole(gameState: GameState): 'starter' | 'bench' | 'out_of_squad' {
  const { player } = gameState;

  // 1. If currently injured, strictly out of squad
  if (player.injury && player.injury.daysRemaining > 0) {
    return 'out_of_squad';
  }

  // 2. Severe fatigue checks
  if (player.fatigue >= 88) {
    return 'out_of_squad';
  }
  if (player.fatigue >= 76) {
    return 'bench';
  }

  // 3. Absolute Guarantee Rule: Trust >= 85 and fatigue <= 45 with decent condition is GUARANTEED starter
  if (player.coachTrust >= 85 && player.fatigue <= 45 && player.condition !== 'terrible') {
    return 'starter';
  }

  // 4. Guaranteed at least Bench if Trust >= 65 and fatigue <= 60
  const guaranteedBench = player.coachTrust >= 65 && player.fatigue <= 60;

  // 5. Age-scaled expected OVR for fair progression:
  // Age 10-12 (Junior): ~28-32
  // Age 13-15 (Junior High): ~38-44
  // Age 16-18 (High School): ~50-58
  // Age 19+ (Pro/Adult): ~62-72
  let ageBaseline = 28;
  if (player.age >= 19) ageBaseline = 62;
  else if (player.age >= 16) ageBaseline = 50;
  else if (player.age >= 13) ageBaseline = 38;

  const teamLevel = player.currentTeam?.level || 1;
  const expectedOvr = ageBaseline + (teamLevel - 1) * 2.5;
  const ovrDiff = player.ovr - expectedOvr;

  // 6. Condition factor
  let conditionBonus = 0;
  if (player.condition === 'superb') conditionBonus = 10;
  else if (player.condition === 'good') conditionBonus = 4;
  else if (player.condition === 'poor') conditionBonus = -6;
  else if (player.condition === 'terrible') conditionBonus = -16;

  // 7. Trust bonus (scaled so 50 is neutral, 80+ is strong)
  const trustScore = (player.coachTrust - 50) * 0.55;

  // 8. Discipline: only penalize consecutive unexcused missed practices
  const attitudePenalty = Math.min(25, (player.consecutiveMissedPractices || 0) * 8);

  const totalScore = (ovrDiff * 1.2) + trustScore + conditionBonus - attitudePenalty;

  if (totalScore >= -2) {
    return 'starter';
  } else if (totalScore >= -20 || guaranteedBench) {
    return 'bench';
  } else {
    return 'out_of_squad';
  }
}

/**
 * Generates a full 14-matchday round-robin league schedule for all 8 clubs.
 * Creates matches for both the player's team and all other clubs.
 */
export function generateLeagueSeason(
  teamName: string,
  countryId: string,
  currentYear: number,
  playerAge = 10,
  division: 1 | 2 = 1,
  isProPlayer = false
): {
  fixtures: MatchFixture[];
  standings: LeagueStanding[];
  competitionName: string;
} {
  const country = COUNTRIES[countryId] || COUNTRIES.japan;
  const proClub = findRealProClubByName(teamName);
  const isPro = isProPlayer || Boolean(proClub) || playerAge >= 18;
  const targetDivision: 1 | 2 = division || proClub?.division || 1;
  const targetCountryId = proClub?.countryId || countryId;

  let competitionName = `${country.name} 全日本U-12育成リーグ`;
  let uniqueTeams: string[] = [];

  if (isPro) {
    // Professional League: strictly use REAL professional clubs only
    const realProClubs = getProClubsForCountry(targetCountryId, targetDivision);
    const countryProClubs = REAL_PRO_CLUBS.filter(c => c.countryId === targetCountryId);
    const otherProClubs = REAL_PRO_CLUBS.filter(c => c.countryId !== targetCountryId);

    competitionName = proClub?.leagueName || (targetDivision === 1 ? `${country.name} 1部プロリーグ` : `${country.name} 2部プロリーグ`);

    const pool = [
      teamName,
      ...realProClubs.map(c => c.name).filter(n => n !== teamName),
      ...countryProClubs.map(c => c.name).filter(n => n !== teamName),
      ...otherProClubs.map(c => c.name).filter(n => n !== teamName)
    ];

    uniqueTeams = Array.from(new Set(pool)).slice(0, 8);
  } else {
    // Youth / School League
    if (playerAge >= 16) {
      competitionName = `${country.name} U-18プレミア・プリンスリーグ`;
    } else if (playerAge >= 13) {
      competitionName = `${country.name} U-15クラブユース・高円宮杯`;
    }

    const candidateTeams = [
      teamName,
      ...country.youthTeams.map(t => t.name).filter(n => n !== teamName),
      ...country.famousClubs.slice(0, 4).map(c => `${c} ユース`)
    ];

    uniqueTeams = Array.from(new Set(candidateTeams)).slice(0, 8);
    if (!uniqueTeams.includes(teamName)) {
      uniqueTeams[0] = teamName;
    }
    while (uniqueTeams.length < 8) {
      uniqueTeams.push(`FC アカデミー ${uniqueTeams.length + 1}`);
    }
  }

  if (!uniqueTeams.includes(teamName)) {
    uniqueTeams[0] = teamName;
  }

  const fixtures: MatchFixture[] = [];
  const numTeams = uniqueTeams.length; // 8
  const rounds = numTeams - 1; // 7 rounds per single round robin

  // Berger Round-Robin Pairing Algorithm for 8 teams
  // Double round-robin: 14 matchdays
  let currentDate = new Date(`${currentYear}-04-14`);

  for (let cycle = 0; cycle < 2; cycle++) {
    for (let round = 0; round < rounds; round++) {
      const matchday = cycle * rounds + round + 1;
      // Advance 7 to 10 days per matchday
      currentDate.setDate(currentDate.getDate() + 7);
      const dateString = currentDate.toISOString().split('T')[0];

      // Form 4 pairs of matches for this round
      const roundTeams = [...uniqueTeams];
      // Polygon rotation: fix index 0, rotate indices 1..7 by 'round'
      const rotating = roundTeams.slice(1);
      const rotated: string[] = [];
      for (let i = 0; i < rotating.length; i++) {
        rotated.push(rotating[(i + round) % rotating.length]);
      }
      const teamsForRound = [roundTeams[0], ...rotated];

      for (let m = 0; m < numTeams / 2; m++) {
        let home = teamsForRound[m];
        let away = teamsForRound[numTeams - 1 - m];

        // Alternate home/away in second round-robin cycle
        if (cycle === 1 || (round + m) % 2 === 1) {
          const tmp = home;
          home = away;
          away = tmp;
        }

        const isPlayerTeamMatch = home === teamName || away === teamName;
        const isPlayerHome = home === teamName;

        fixtures.push({
          id: `fixture_md_${matchday}_${m}_${Date.now()}_${getRandomInt(100, 999)}`,
          date: dateString,
          matchday,
          competitionName: `${competitionName} (第${matchday}節)`,
          competitionType: 'league',
          homeTeam: home,
          awayTeam: away,
          isPlayerHome,
          played: false
        });
      }
    }
  }

  const standings: LeagueStanding[] = uniqueTeams.map(name => ({
    teamName: name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0
  }));

  return { fixtures, standings, competitionName };
}

export function generateMatchMoments(
  playerRole: 'starter' | 'bench',
  position: Position,
  opponentName?: string
): MatchMoment[] {
  const isStarter = playerRole === 'starter';
  const moments: MatchMoment[] = [];
  const opp = opponentName || '相手チーム';

  // Helper to pick n unique elements from array
  function pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // --- Situation Templates for First Half (15 - 45 min) ---
  interface MomentTemplate {
    title: string;
    situations: string[];
    options: Array<{
      text: string;
      statUsed: keyof PlayerStats;
      risk: 'low' | 'medium' | 'high';
      successOutcome: string;
      failOutcome: string;
      points: number;
      outcomeType: 'goal' | 'assist' | 'chance_created' | 'defensive_stop' | 'turnover' | 'none';
    }>;
  }

  const isAttacker = ['CF', 'ST', 'WG'].includes(position);
  const isMidfielder = ['OMF', 'CMF', 'DMF'].includes(position);
  const isDefender = ['CB', 'SB'].includes(position);
  const isGoalkeeper = position === 'GK';

  // 1st Half Moment Pools (Starter only)
  if (isStarter) {
    const firstHalfPool: MomentTemplate[] = [];

    if (isAttacker) {
      firstHalfPool.push({
        title: '相手最終ラインとの駆け引き',
        situations: [
          `前半22分、味方ボランチが顔を上げ前線を窺う。${opp}のディフェンスラインに一瞬のギャップが生じた！`,
          `前半18分、右サイドから鋭い縦パスが入ってきた。相手センターバックが背後を警戒している。`,
          `前半31分、激しい中盤のルーズボールを味方が拾い、前線へ素早く展開！マークを剥がすチャンス！`
        ],
        options: [
          {
            text: '相手DFの背後へ一気にダイアゴナルランで抜け出す',
            statUsed: 'pace',
            risk: 'medium',
            successOutcome: '見事なオフ・ザ・ボール！完全に裏へ抜け出し、GKと1対1の絶好機を自ら創出！',
            failOutcome: '相手DFの巧みなオフサイドトラップに引っかかり、旗が上がってしまった。',
            points: 2,
            outcomeType: 'chance_created'
          },
          {
            text: '一度足元に引いて受けてから、鋭いターンで前を向く',
            statUsed: 'dribbling',
            risk: 'medium',
            successOutcome: '絶妙なファーストタッチで相手DFの逆を突き、前方の広いスペースへ侵入！',
            failOutcome: '寄せてきた相手CBの激しいチャージを受け、前を向けずボールを失った。',
            points: 2,
            outcomeType: 'chance_created'
          },
          {
            text: '相手を背負ったままワンタッチで味方へ落とすポストプレー',
            statUsed: 'passing',
            risk: 'low',
            successOutcome: '体を張ってボールを収め、走り込んできた味方へ完璧な落としを供給！攻撃のリズムを作る。',
            failOutcome: '相手のプレッシャーに押され、バックパスが乱れて相手にカットされた。',
            points: 1,
            outcomeType: 'none'
          }
        ]
      });

      firstHalfPool.push({
        title: 'サイドからの崩しと仕掛け',
        situations: [
          `前半27分、サイドのタッチライン際でパスを受け、${opp}のサイドバックと1対1のマッチアップ！`,
          `前半34分、味方のサイドチェンジを完璧な胸トラップで収める。前方にドリブルの走路がある。`,
          `前半15分、ショートカウンター発動！左サイドを疾走しながら味方のアシストを待つ。`
        ],
        options: [
          {
            text: '緩急をつけた高速シザースで縦に突破しクロスを上げる',
            statUsed: 'dribbling',
            risk: 'high',
            successOutcome: '爆発的な加速で相手DFを置き去り！ピンポイントの高速グラウンダークロスを供給！',
            failOutcome: '相手サイドバックの粘り強い足の長さに阻まれ、タッチラインを割ってしまった。',
            points: 2,
            outcomeType: 'chance_created'
          },
          {
            text: 'カットインしてペナルティエリア手前から意表を突くミドルシュート',
            statUsed: 'shooting',
            risk: 'high',
            successOutcome: '右足の強烈な一撃がゴール右隅へ突き刺さる！前半の貴重な先制ゴール！！',
            failOutcome: '枠を捉えた強烈な弾道だったが、相手GKの決死のファインセーブに阻まれた。',
            points: 3,
            outcomeType: 'goal'
          },
          {
            text: 'インナーラップしてきた味方ボランチへスルーパスを通す',
            statUsed: 'tacticalSense',
            risk: 'medium',
            successOutcome: '相手守備陣の意表を突く斜めのスルーパスが通り、決定的な崩しを完成させた！',
            failOutcome: '相手のカバーリングにコースを消され、パスカットを許してしまった。',
            points: 2,
            outcomeType: 'chance_created'
          }
        ]
      });
    }

    if (isMidfielder) {
      firstHalfPool.push({
        title: '中盤のゲームメイクと配球',
        situations: [
          `前半24分、センターサークル付近でこぼれ球を拾う。${opp}が前線から強烈なハイプレスを仕掛けてきた！`,
          `前半19分、自陣深くから前線へ繋ぐビルドアップの局面。マークを受けながらパスコースを探す。`,
          `前半33分、相手の最終ライン手前の「バイタルエリア」でフリーでボールを受けた！`
        ],
        options: [
          {
            text: 'ダイレクトで相手DFラインの裏へ浮き球のスルーパスを送る',
            statUsed: 'passing',
            risk: 'medium',
            successOutcome: '芸術的な軌道を描くピンポイントパス！走り込んだFWへ完璧に通りビッグチャンス！',
            failOutcome: 'パスの長短がわずかに合わず、飛び出した相手GKに直接キャッチされた。',
            points: 2,
            outcomeType: 'chance_created'
          },
          {
            text: '細かいボールタッチでプレッシャーをいなし、逆サイドへ大きく展開',
            statUsed: 'tacticalSense',
            risk: 'low',
            successOutcome: '視野の広さを発揮！プレッシャーを交わして逆サイドの広大なスペースへ完璧なサイドチェンジ！',
            failOutcome: '相手のプレスバックに挟まれ、苦し紛れのバックパスになってしまった。',
            points: 1,
            outcomeType: 'none'
          },
          {
            text: 'ワンフェイクを入れて相手ボランチを抜き去り、自ら前進する',
            statUsed: 'dribbling',
            risk: 'high',
            successOutcome: '鮮やかなキックフェイントで相手の重心を崩し、一気に中央を切り裂いて前進！',
            failOutcome: '相手の中盤複数人に囲まれ、身体を入れられてボールを奪われてしまった。',
            points: 2,
            outcomeType: 'chance_created'
          }
        ]
      });
    }

    if (isDefender) {
      firstHalfPool.push({
        title: '相手カウンターへの守備対応',
        situations: [
          `前半26分、味方のコーナーキックが跳ね返され、${opp}の鋭いカウンターアタックが始まった！`,
          `前半38分、相手の俊足ウインガーがドリブルでサイドからペナルティエリア内に侵入してくる！`,
          `前半16分、相手FWへ鋭い縦パスが入る。反転される前に体を寄せて潰したい局面！`
        ],
        options: [
          {
            text: 'タイミングを見計らって鋭いスライディングタックルで奪取',
            statUsed: 'defending',
            risk: 'high',
            successOutcome: '完璧なタイミングのクリーンタックル！ボールだけを綺麗に刈り取り、ピンチを救った！',
            failOutcome: '相手のフェイントにわずかに遅れ、ファウルを取られて警告の危機を招いてしまった。',
            points: 2,
            outcomeType: 'defensive_stop'
          },
          {
            text: '飛び込まずにディレイし、相手の選択肢を狭めながら味方の戻りを待つ',
            statUsed: 'tacticalSense',
            risk: 'low',
            successOutcome: '冷静沈着なポジショニング！相手のスピードを完全に殺し、パスコースを限定して奪取成功！',
            failOutcome: '相手のミドルシュートを警戒しすぎて距離を詰められず、打たれてしまった。',
            points: 1,
            outcomeType: 'defensive_stop'
          },
          {
            text: '強靭なフィジカルで体をぶつけ、ショルダーチャージでマイボールにする',
            statUsed: 'physical',
            risk: 'medium',
            successOutcome: '圧巻の体幹！相手FWを力強く弾き飛ばし、堂々とマイボールに収めた！',
            failOutcome: '競り合いの勢いでバランスを崩し、相手に抜け出されそうになってしまった。',
            points: 2,
            outcomeType: 'defensive_stop'
          }
        ]
      });
    }

    if (isGoalkeeper) {
      firstHalfPool.push({
        title: 'ゴール前の決死のセービング',
        situations: [
          `前半29分、${opp}のFWがDFラインを突破！ペナルティエリア内で至近距離から強烈なシュートが放たれた！`,
          `前半35分、相手の右サイドからの鋭いクロスボールがゴール前に飛んでくる！`
        ],
        options: [
          {
            text: '一瞬の判断で前に飛び出し、身体全体を広げてシュートコースを塞ぐ',
            statUsed: 'defending',
            risk: 'high',
            successOutcome: '神がかり的なビッグセーブ！至近距離のシュートを右腕一本で弾き出し、絶体絶命の危機を救う！',
            failOutcome: '飛び出しのタイミングがコンマ数秒合わず、コースを突かれてしまった。',
            points: 3,
            outcomeType: 'defensive_stop'
          },
          {
            text: 'ゴールライン上でステップを踏み、最後までボールの軌道を見極めてキャッチ',
            statUsed: 'tacticalSense',
            risk: 'low',
            successOutcome: '抜群の安定感！強烈なシュートを胸元でしっかりと抱え込み、確実にキャッチ！',
            failOutcome: '強烈な無回転シュートにファンブルしそうになったが、なんとか外へ弾き出した。',
            points: 1,
            outcomeType: 'defensive_stop'
          },
          {
            text: '空中に力強く跳び上がり、ハイボールをパンチングで大きくクリア',
            statUsed: 'physical',
            risk: 'medium',
            successOutcome: '相手長身FWの上から力強くパンチング！危険エリアからボールを大きく遠ざけた！',
            failOutcome: '競り合いの中で体勢を崩し、クリアが中途半端になってしまった。',
            points: 2,
            outcomeType: 'defensive_stop'
          }
        ]
      });
    }

    // Default general template if none matched
    if (firstHalfPool.length === 0) {
      firstHalfPool.push({
        title: '中盤での攻防',
        situations: [`前半25分、中盤で味方から横パスを受ける。前線に動き出しが見える！`],
        options: [
          {
            text: 'ダイレクトで前線へスルーパスを通す',
            statUsed: 'passing',
            risk: 'medium',
            successOutcome: '鋭いスルーパスが通り、決定機を創出！',
            failOutcome: '相手DFに読まれてカットされた。',
            points: 2,
            outcomeType: 'chance_created'
          },
          {
            text: 'キープして落ち着いて味方へ繋ぐ',
            statUsed: 'tacticalSense',
            risk: 'low',
            successOutcome: '落ち着いたボール保持で攻撃を組み立てた。',
            failOutcome: '相手のプレッシャーを受け、苦しいパスになった。',
            points: 1,
            outcomeType: 'none'
          },
          {
            text: 'ターンで前を向いてドリブルで仕掛ける',
            statUsed: 'dribbling',
            risk: 'medium',
            successOutcome: '相手をかわして一気に前進した！',
            failOutcome: 'ボールを突かれて奪われた。',
            points: 2,
            outcomeType: 'chance_created'
          }
        ]
      });
    }

    const chosenFirstHalf = pickRandom(firstHalfPool, 1)[0];
    const situationText = pickRandom(chosenFirstHalf.situations, 1)[0];

    moments.push({
      id: 'moment_1',
      minute: getRandomInt(18, 42),
      title: chosenFirstHalf.title,
      situation: situationText,
      options: chosenFirstHalf.options
    });
  }

  // --- 2nd Half Moment (Crucial moment: 60 - 88 min) ---
  const secondHalfPool: MomentTemplate[] = [];

  if (isAttacker || isMidfielder) {
    secondHalfPool.push({
      title: 'ゴール前の緊迫した決定機',
      situations: [
        `後半32分、ペナルティエリア手前で味方の折り返しが足元に転がってきた！${opp}のDFがスライディングで寄せてくる！`,
        `後半41分、試合終盤の猛攻！ゴール前16mの中央でこぼれ球にいち早く反応！`,
        `後半28分、サイドからの浮き球クロスが相手DFの頭を越え、フリーの自分の元へドンピシャで落ちてきた！`
      ],
      options: [
        {
          text: 'GKの重心を見極め、冷静に右足インサイドでコースを突いたシュート！',
          statUsed: 'shooting',
          risk: 'medium',
          successOutcome: 'サイドネットを揺らす鮮やかなコントロールショット！値千金の劇的ゴール！！',
          failOutcome: 'コースを狙いすぎたシュートは、わずかにポストの外側を叩いてしまった！',
          points: 3,
          outcomeType: 'goal'
        },
        {
          text: '自ら打つと見せかけてキックフェイント！完全フリーの味方へラストパス',
          statUsed: 'tacticalSense',
          risk: 'low',
          successOutcome: '相手守備陣全員を欺く超絶アシスト！味方が無人のゴールに流し込み、見事に得点を演出！',
          failOutcome: 'パスがわずかに味方の背中側へズレ、シュートを打ちきれなかった。',
          points: 2,
          outcomeType: 'assist'
        },
        {
          text: '思い切り右足を振り抜き、ゴール上段を突き刺す弾丸ミドルシュート！',
          statUsed: 'shooting',
          risk: 'high',
          successOutcome: 'キャノンシュートがバーの内側を叩いてネットに突き刺さる！スタジアムを揺るがす圧巻のスーパーゴール！！',
          failOutcome: '力みすぎたシュートは大きくクロスバーを越えてスタンドへ消えていった。',
          points: 3,
          outcomeType: 'goal'
        }
      ]
    });

    secondHalfPool.push({
      title: 'ペナルティエリア内の突破と打開',
      situations: [
        `後半36分、ペナルティエリア左角からドリブルで切り込む。相手DFが2枚立ちはだかる！`,
        `後半22分、カウンターから敵陣深くへ侵入。ゴール前に味方が2人走り込んできている！`
      ],
      options: [
        {
          text: '細かいステップワークで相手DFの間をすり抜け、ニア上を撃ち抜く！',
          statUsed: 'dribbling',
          risk: 'high',
          successOutcome: '圧巻のテクニックで2枚の間を強引に突破！GKの手を弾いてゴールイン！！',
          failOutcome: '相手DFの挟み込みに遭い、最後の一歩でボールをかき出された。',
          points: 3,
          outcomeType: 'goal'
        },
        {
          text: 'グラウンダーで鋭いマイナスのクロスを味方ストライカーに届ける',
          statUsed: 'passing',
          risk: 'medium',
          successOutcome: '針の穴を通すような完璧なマイナスクロス！走り込んだ味方が豪快に決めてアシスト記録！',
          failOutcome: '相手DFの決死のブロックに当たり、コーナーキックに逃げられた。',
          points: 2,
          outcomeType: 'assist'
        },
        {
          text: '相手のファウルを誘うように体を入れ、ファウルまたはPKを狙う',
          statUsed: 'tacticalSense',
          risk: 'medium',
          successOutcome: '巧みなボディフェイントで相手の足を誘い、絶好の位置でフリーキックを獲得！',
          failOutcome: '審判の笛は鳴らず、ノーファウルの判定でカウンターを浴びそうになった。',
          points: 1,
          outcomeType: 'chance_created'
        }
      ]
    });
  }

  if (isDefender || isGoalkeeper) {
    secondHalfPool.push({
      title: '試合終盤、1点を争う最終防衛ラインの死闘',
      situations: [
        `後半38分、${opp}がパワープレイを開始！前線にロングボールを放り込んできた！`,
        `後半44分、アディショナルタイム直前。相手のエースがバイタルエリアで前を向いた！`
      ],
      options: [
        {
          text: '決死のヘディングクリアでゴール前のハイボールを跳ね返す',
          statUsed: 'physical',
          risk: 'medium',
          successOutcome: '圧巻の跳躍力！相手長身FWに競り勝ち、頭で大きく前線へ押し返した！',
          failOutcome: '相手の競り合いに押され、こぼれ球をゴール前で拾われそうになった。',
          points: 2,
          outcomeType: 'defensive_stop'
        },
        {
          text: 'シュートコースに体を投げ出してシュートブロック！',
          statUsed: 'defending',
          risk: 'high',
          successOutcome: '魂のシュートブロック！至近距離からの強烈な一撃を身を挺して防ぎ切った！',
          failOutcome: 'ボールが体に当たってコースが変わり、ヒヤリとする場面を作ってしまった。',
          points: 2,
          outcomeType: 'defensive_stop'
        },
        {
          text: 'ボールを奪った後、前線へ素早くロングフィードを送りカウンターの起点に',
          statUsed: 'passing',
          risk: 'medium',
          successOutcome: '正確無比なロングフィード！前線の味方FWに通り、一気に相手陣内深くへ押し返した！',
          failOutcome: 'クリアが浅くなり、相手にセカンドボールを拾われてしまった。',
          points: 2,
          outcomeType: 'chance_created'
        }
      ]
    });
  }

  if (secondHalfPool.length === 0) {
    secondHalfPool.push({
      title: '後半の勝負所',
      situations: [`後半30分、緊迫した時間帯。味方からのパスを受けて前線へ仕掛ける！`],
      options: [
        {
          text: '思い切ってシュートを放つ',
          statUsed: 'shooting',
          risk: 'high',
          successOutcome: '見事にゴールネットを揺らし、貴重な得点を挙げた！',
          failOutcome: '相手GKに阻まれた。',
          points: 3,
          outcomeType: 'goal'
        },
        {
          text: '味方へラストパスを通す',
          statUsed: 'passing',
          risk: 'medium',
          successOutcome: '味方が合わせてゴール！アシストを記録した！',
          failOutcome: 'わずかに合わなかった。',
          points: 2,
          outcomeType: 'assist'
        },
        {
          text: '落ち着いてボールを繋ぐ',
          statUsed: 'tacticalSense',
          risk: 'low',
          successOutcome: 'ポゼッションを安定させリズムを保った。',
          failOutcome: '相手に囲まれて奪われた。',
          points: 1,
          outcomeType: 'none'
        }
      ]
    });
  }

  const chosenSecondHalf = pickRandom(secondHalfPool, 1)[0];
  const secondSituationText = pickRandom(chosenSecondHalf.situations, 1)[0];

  moments.push({
    id: 'moment_2',
    minute: getRandomInt(65, 87),
    title: chosenSecondHalf.title,
    situation: secondSituationText,
    options: chosenSecondHalf.options
  });

  return moments;
}

export function simulateMatchResults(
  fixture: MatchFixture,
  gameState: GameState,
  momentChoices: Array<{
    momentId: string;
    optionIndex: number;
    success: boolean;
    outcomeType?: 'goal' | 'assist' | 'chance_created' | 'defensive_stop' | 'turnover' | 'none';
  }>
): {
  updatedFixture: MatchFixture;
  playerRating: number;
  playerGoals: number;
  playerAssists: number;
  coachTrustDelta: number;
  fansGained: number;
  ovrIncreased: boolean;
  fatigueCost: number;
  logs: MatchEventLog[];
} {
  const { player } = gameState;
  const role = fixture.playerRole || 'bench';
  const isStarter = role === 'starter';
  const isBench = role === 'bench';

  const logs: MatchEventLog[] = [];
  let playerPlayed = false;
  let playerMinutes = 0;
  let playerGoals = 0;
  let playerAssists = 0;
  let totalScoreBonus = 0;

  logs.push({ minute: 0, text: 'キックオフ！熱気あふれる試合が始まった。', type: 'chance' });

  if (isStarter) {
    playerPlayed = true;
    playerMinutes = getRandomInt(75, 90);
  } else if (isBench) {
    // 70% chance to be subbed on
    if (Math.random() < 0.70) {
      playerPlayed = true;
      playerMinutes = getRandomInt(18, 38);
      logs.push({
        minute: 90 - playerMinutes,
        text: `【選手交代】監督の指示を受け、${player.name}が途中出場！ピッチへ駆け込む！`,
        type: 'sub',
        isPlayerInvolved: true
      });
    } else {
      playerPlayed = false;
      playerMinutes = 0;
      logs.push({ minute: 90, text: `${player.name}はベンチでチームの戦況を見守った。`, type: 'sub' });
    }
  }

  // Calculate moment successes strictly tied to chosen outcomeType
  for (const choice of momentChoices) {
    if (choice.success) {
      totalScoreBonus += 1.2;

      // 100% synchronized with player's interactive moment outcome!
      if (choice.outcomeType === 'goal') {
        playerGoals += 1;
        logs.push({
          minute: getRandomInt(30, 85),
          text: `【GOAL!!】${player.name}が自らの決定機を冷静に仕留め、値千金のゴール！`,
          type: 'goal',
          isPlayerInvolved: true
        });
      } else if (choice.outcomeType === 'assist') {
        playerAssists += 1;
        logs.push({
          minute: getRandomInt(25, 80),
          text: `【ASSIST!】${player.name}の鮮やかな演出から味方がゴール！アシストを記録！`,
          type: 'assist',
          isPlayerInvolved: true
        });
      } else if (choice.outcomeType === 'defensive_stop') {
        totalScoreBonus += 0.4;
        logs.push({
          minute: getRandomInt(20, 85),
          text: `【好守備】${player.name}が体を張った素晴らしいディフェンスで相手の決定機を阻止！`,
          type: 'defense',
          isPlayerInvolved: true
        });
      } else if (choice.outcomeType === 'chance_created') {
        totalScoreBonus += 0.3;
        logs.push({
          minute: getRandomInt(20, 85),
          text: `【好機演出】${player.name}の鋭い仕掛けからチャンスが生まれた！`,
          type: 'chance',
          isPlayerInvolved: true
        });
      }
    } else {
      totalScoreBonus -= 0.3;
    }
  }

  // Determine team scores:
  // 100% Strict synchronization:
  // - Every playerGoal adds +1 directly to the team's score.
  // - Every playerAssist implies a teammate scored, adding +1 to team score.
  // - Other teammate unassisted goals can occur (0 to 2 goals).
  const teammateOtherGoals = getRandomInt(0, 1);
  let playerTeamScore = playerGoals + playerAssists + teammateOtherGoals;

  // Strict constraint: if team scored 0, player goals and assists MUST be 0!
  if (playerTeamScore === 0) {
    playerGoals = 0;
    playerAssists = 0;
  }

  let opponentScore = getRandomInt(0, 2);

  let homeScore = fixture.isPlayerHome ? playerTeamScore : opponentScore;
  let awayScore = fixture.isPlayerHome ? opponentScore : playerTeamScore;

  // Calculate Player Rating (1.0 - 10.0)
  let baseRating = 6.0;
  if (playerPlayed) {
    baseRating = 6.2 + totalScoreBonus + (playerGoals * 0.9) + (playerAssists * 0.6);
    // Condition bonus
    if (player.condition === 'superb') baseRating += 0.4;
    if (player.condition === 'good') baseRating += 0.2;
    if (player.condition === 'poor') baseRating -= 0.3;
    if (player.condition === 'terrible') baseRating -= 0.6;
  } else {
    baseRating = 0; // Did not play
  }

  const playerRating = playerPlayed ? Math.min(9.9, Math.max(5.0, Number(baseRating.toFixed(1)))) : 0;

  // Coach Trust Delta
  let coachTrustDelta = 0;
  if (playerPlayed) {
    if (playerRating >= 7.5) coachTrustDelta = +5;
    else if (playerRating >= 6.5) coachTrustDelta = +2;
    else if (playerRating <= 5.5) coachTrustDelta = -2;
  }

  // Fans Gained: strictly realistic scaling
  let fansGained = 0;
  if (playerPlayed && playerRating >= 6.5) {
    if (player.age <= 12) {
      fansGained = getRandomInt(1, 3) + playerGoals;
    } else if (player.age <= 15) {
      fansGained = getRandomInt(3, 8) + playerGoals * 3;
    } else {
      fansGained = getRandomInt(15, 50) + playerGoals * 15;
    }
  }

  // OVR Increase chance on outstanding rating (7.8+)
  let ovrIncreased = false;
  if (playerPlayed && playerRating >= 7.8 && Math.random() < 0.45) {
    ovrIncreased = true;
  }

  const fatigueCost = playerPlayed ? Math.floor(playerMinutes * 0.26) + getRandomInt(5, 8) : 2;

  logs.push({
    minute: 90,
    text: `試合終了のホイッスル！スコアは ${homeScore} - ${awayScore}。`,
    type: 'chance'
  });

  const updatedFixture: MatchFixture = {
    ...fixture,
    played: true,
    homeScore,
    awayScore,
    playerPlayed,
    playerMinutes,
    playerGoals,
    playerAssists,
    playerRating,
    logs
  };

  return {
    updatedFixture,
    playerRating,
    playerGoals,
    playerAssists,
    coachTrustDelta,
    fansGained,
    ovrIncreased,
    fatigueCost,
    logs
  };
}

export function updateStandingsWithResult(standings: LeagueStanding[], fixture: MatchFixture): LeagueStanding[] {
  if (fixture.homeScore === undefined || fixture.awayScore === undefined) return standings;

  const hScore = fixture.homeScore;
  const aScore = fixture.awayScore;

  return standings.map(s => {
    if (s.teamName === fixture.homeTeam) {
      const won = hScore > aScore ? 1 : 0;
      const drawn = hScore === aScore ? 1 : 0;
      const lost = hScore < aScore ? 1 : 0;
      const points = won * 3 + drawn;
      return {
        ...s,
        played: s.played + 1,
        won: s.won + won,
        drawn: s.drawn + drawn,
        lost: s.lost + lost,
        gf: s.gf + hScore,
        ga: s.ga + aScore,
        gd: s.gd + (hScore - aScore),
        points: s.points + points
      };
    } else if (s.teamName === fixture.awayTeam) {
      const won = aScore > hScore ? 1 : 0;
      const drawn = hScore === aScore ? 1 : 0;
      const lost = aScore < hScore ? 1 : 0;
      const points = won * 3 + drawn;
      return {
        ...s,
        played: s.played + 1,
        won: s.won + won,
        drawn: s.drawn + drawn,
        lost: s.lost + lost,
        gf: s.gf + aScore,
        ga: s.ga + hScore,
        gd: s.gd + (aScore - hScore),
        points: s.points + points
      };
    }
    return s;
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

/**
 * Simulates all other league fixtures scheduled on this matchday, ensuring all 8 teams
 * play simultaneously and have equal matches played in the standings.
 */
export function simulateMatchdayForAllTeams(
  standings: LeagueStanding[],
  allFixtures: MatchFixture[],
  matchday: number,
  playerFixtureResult: MatchFixture
): {
  updatedStandings: LeagueStanding[];
  updatedFixtures: MatchFixture[];
} {
  let updatedStandings = [...standings];

  // 1. Process player match
  updatedStandings = updateStandingsWithResult(updatedStandings, playerFixtureResult);

  // 2. Process other fixtures of the same matchday
  const updatedFixtures = allFixtures.map(f => {
    if (f.id === playerFixtureResult.id) {
      return playerFixtureResult;
    }
    if (f.matchday === matchday && !f.played) {
      // Simulate CPU vs CPU match
      const hScore = getRandomInt(0, 3);
      const aScore = getRandomInt(0, 2);
      const cpuResult: MatchFixture = {
        ...f,
        played: true,
        homeScore: hScore,
        awayScore: aScore
      };
      updatedStandings = updateStandingsWithResult(updatedStandings, cpuResult);
      return cpuResult;
    }
    return f;
  });

  return { updatedStandings, updatedFixtures };
}
