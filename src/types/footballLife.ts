export type Gender = 'male' | 'female';

export type Position = 'GK' | 'CB' | 'SB' | 'DMF' | 'CMF' | 'OMF' | 'WG' | 'ST' | 'CF';

export type Playstyle =
  // FW
  | 'line_breaker' // ラインブレーカー
  | 'chance_maker' // チャンスメイカー
  | 'decoy_run' // デコイラン
  | 'box_striker' // ボックスストライカー
  | 'target_man' // ターゲットマン
  | 'wing_striker' // ウイングストライカー
  // MF
  | 'creative_playmaker' // 創造型MF
  | 'defensive_midfielder' // 守備型MF
  | 'anchor' // アンカー
  | 'box_to_box' // ボックストゥボックス
  // DF
  | 'offensive_sideback' // 攻撃的SB
  | 'defensive_sideback' // 守備型SB
  | 'build_up_cb' // ビルドアップ型CB
  | 'stopper_cb' // 守備型CB
  // GK
  | 'offensive_gk' // 攻撃型GK
  | 'defensive_gk'; // 守備型GK

export type PracticeAbsenceReasonId =
  | 'fatigue' // 疲労蓄積
  | 'illness' // 軽い体調不良
  | 'injury_care' // 怪我・違和感
  | 'academic' // 学校・学業
  | 'family' // 家族の事情
  | 'personal' // 個人的な予定
  | 'solo_practice' // 自主練習を優先
  | 'rest_needed' // 休養が必要
  | 'coach_consulted' // 監督・コーチへの相談後
  | 'other' // その他
  | 'unexcused'; // 無断欠席

export interface PracticeAbsenceReason {
  id: PracticeAbsenceReasonId;
  label: string;
  category: 'legitimate' | 'doubtful' | 'unexcused';
  baseTrustImpact: number;
  baseAttitudeImpact: number;
  coachMessage: string;
}

export type Condition = 'terrible' | 'poor' | 'normal' | 'good' | 'superb';

export type InjurySeverity = 'minor' | 'moderate' | 'severe';

export interface Injury {
  name: string;
  severity: InjurySeverity;
  daysRemaining: number;
  initialDays: number;
}

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  tacticalSense: number;
  mental: number;
  stamina: number;
}

export interface StatExp {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  tacticalSense: number;
  mental: number;
  stamina: number;
}

export type SchoolStage = 'elementary' | 'middle' | 'high' | 'university' | 'pro';

export type TeamCategory = 
  | 'local_youth'
  | 'club_team'
  | 'school_club'
  | 'j_youth'
  | 'overseas_youth'
  | 'university'
  | 'pro';

export interface Team {
  id: string;
  name: string;
  country: string;
  category: TeamCategory;
  level: number; // 1 to 5 stars
  division?: 1 | 2; // 1: 1部 (Top division), 2: 2部 (Second division)
  leagueName?: string;
  practiceDaysPerWeek: number; // e.g. 3, 4, 5
  practiceSchedule: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  tactic: 'possession' | 'counter' | 'high_press' | 'direct' | 'balanced';
  coachName: string;
  coachStyle: 'strict' | 'nurturing' | 'tactical' | 'passionate';
}

export type PersonRole =
  | 'friend'
  | 'best_friend'
  | 'coach'
  | 'assistant_coach'
  | 'teammate'
  | 'rival'
  | 'teacher'
  | 'romance'
  | 'family'
  | 'agent';

export type RelationshipStatus =
  | 'acquaintance'
  | 'friend'
  | 'best_friend'
  | 'rival'
  | 'teammate'
  | 'mentor'
  | 'crush'
  | 'dating'
  | 'fiance'
  | 'married'
  | 'ex';

export type RelationshipType = RelationshipStatus;

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: 'school' | 'coach' | 'friend' | 'romance' | 'scout' | 'national';
  options: Array<{
    label: string;
    actionType: string;
    payload?: any;
  }>;
}

export interface DialogueMessage {
  id: string;
  sender: 'cpu' | 'player';
  text: string;
  timestamp: string;
  reaction?: string;
}

export interface Person {
  id: string;
  name: string;
  role: PersonRole;
  relationship: RelationshipStatus;
  gender: Gender;
  age: number;
  country: string;
  schoolOrClub: string;
  personality: 'cheerful' | 'cool' | 'serious' | 'passionate' | 'gentle' | 'ambitious' | 'strict';
  hobbies: string[];
  soccerExperience: string;
  affinity: number; // 0 - 100
  trust: number; // 0 - 100
  isRival?: boolean;
  rivalPosition?: Position;
  memories: string[];
  chatHistory: DialogueMessage[];
  unreadCount: number;
}

export interface SNSPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorRole: 'player' | 'teammate' | 'friend' | 'media' | 'fan' | 'rival';
  content: string;
  timestamp: string;
  likes: number;
  isLikedByPlayer: boolean;
  comments: Array<{
    id: string;
    authorName: string;
    authorHandle: string;
    content: string;
  }>;
}

export interface MatchMoment {
  id: string;
  minute: number;
  title: string;
  situation: string;
  options: Array<{
    text: string;
    statUsed: keyof PlayerStats;
    risk: 'low' | 'medium' | 'high';
    successOutcome: string;
    failOutcome: string;
    points: number;
    outcomeType?: 'goal' | 'assist' | 'chance_created' | 'defensive_stop' | 'turnover' | 'none';
  }>;
}

export interface MatchEventLog {
  minute: number;
  text: string;
  type: 'goal' | 'assist' | 'chance' | 'defense' | 'foul' | 'card' | 'sub';
  isPlayerInvolved?: boolean;
}

export interface MatchFixture {
  id: string;
  date: string;
  matchday: number;
  competitionName: string;
  competitionType: 'league' | 'cup' | 'tournament' | 'national';
  homeTeam: string;
  awayTeam: string;
  isPlayerHome: boolean;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  playerRole?: 'starter' | 'bench' | 'out_of_squad';
  playerPlayed?: boolean;
  playerMinutes?: number;
  playerGoals?: number;
  playerAssists?: number;
  playerRating?: number; // 1.0 to 10.0
  moments?: MatchMoment[];
  logs?: MatchEventLog[];
}

export interface LeagueStanding {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export type TransferType = 'permanent' | 'loan' | 'developmental_loan';

export interface LoanTerms {
  duration: '6_months' | '1_year' | 'season_end';
  durationDays: number;
  returnDate: string;
  rolePromise: 'starter' | 'rotation' | 'backup';
  promisedPlayingTimeText: string;
  developmentPolicy: 'match_experience' | 'position_mastery' | 'tactical_growth' | 'physical_strengthening';
  targetPosition: Position;
  parentClub: Team;
  parentCoachTrust: number;
  parentClubWageSharePercent: number;
  developmentGoals: string[];
  matchesPlayedOnLoan: number;
  goalsScoredOnLoan: number;
}

export interface TransferOffer {
  id: string;
  clubName: string;
  country: string;
  level: number;
  transferType: TransferType;
  step: 'contact' | 'review' | 'consult_coach' | 'negotiating' | 'accepted' | 'declined';
  rolePromise: string;
  wage: number;
  transferFee: number;
  notes: string;
  isProContract?: boolean;
  isFifteenYoOffer?: boolean;
  division?: 1 | 2;
  proLeagueName?: string;
  negotiationFeedback?: string;
  negotiationRound?: number;
  loanTerms?: {
    duration: '6_months' | '1_year' | 'season_end';
    durationDays: number;
    returnDate: string;
    rolePromise: 'starter' | 'rotation' | 'backup';
    promisedPlayingTimeText: string;
    developmentPolicy: 'match_experience' | 'position_mastery' | 'tactical_growth' | 'physical_strengthening';
    targetPosition: Position;
    parentClubWageSharePercent: number;
    developmentGoals: string[];
  };
  playerConsultedCoach?: boolean;
  coachAdvice?: string;
}

export interface TimelineEntry {
  id: string;
  age: number;
  date: string;
  title: string;
  description: string;
  type: 'start' | 'trophy' | 'transfer' | 'loan' | 'debut' | 'national' | 'romance' | 'milestone';
}

export type FreeTimeActivity = 
  | 'individual_practice'
  | 'solo_practice'
  | 'physical_workout'
  | 'shooting_practice'
  | 'tactics_study'
  | 'condition_tuning'
  | 'rehab_session'
  | 'coach_consult'
  | 'study'
  | 'videogame'
  | 'game_relax'
  | 'hangout_friend'
  | 'sleep'
  | 'rest'
  | 'sns_post';

export interface FaceToFaceOption {
  text: string;
  response: string;
  trustDelta?: number;
  attitudeDelta?: number;
  fatigueDelta?: number;
  positionChange?: Position;
  transferAction?: 'loan_requested' | 'stay';
}

export interface FaceToFaceEvent {
  id: string;
  speakerName: string;
  speakerRole: 'coach' | 'assistant_coach' | 'trainer' | 'scout' | 'friend' | 'teammate' | 'family' | 'romance';
  speakerTitle: string;
  situation: string;
  dialogueText: string;
  options: FaceToFaceOption[];
}

export interface OffSeasonData {
  seasonNumber: number;
  teamName?: string;
  finalPosition: number;
  totalTeams?: number;
  points?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  teamPoints?: number;
  teamWon?: number;
  teamDrawn?: number;
  teamLost?: number;
  isChampion: boolean;
  playerMatchesPlayed: number;
  playerGoals: number;
  playerAssists: number;
  averageRating?: number;
  newAge?: number;
  nextCompetition?: string;
  promotionStatus?: 'promoted' | 'relegated' | 'stayed';
  promotionMessage?: string;
  promotedTeams?: string[];
  relegatedTeams?: string[];
}

export interface RecentGameContext {
  lastMatchResult?: {
    date: string;
    opponent: string;
    isWin: boolean;
    isDraw: boolean;
    isLoss: boolean;
    playerGoals: number;
    playerAssists: number;
    playerRating: number;
    playerRole: 'starter' | 'bench' | 'out_of_squad';
    wasKeyMatch?: boolean;
  };
  lastPracticeEvent?: {
    date: string;
    attended: boolean;
    reason?: string;
  };
  lastInjuryEvent?: {
    date: string;
    injuryName: string;
    severity: string;
  };
  lastTransferEvent?: {
    date: string;
    type: 'offer_arrived' | 'coach_consulted' | 'loan_started' | 'loan_ended';
    clubName: string;
  };
  lastSNSEvent?: {
    date: string;
    topic: string;
    isBuzz: boolean;
  };
}

export interface GameState {
  player: {
    id: string;
    name: string;
    gender: Gender;
    birthDate: string;
    age: number;
    nationality: string;
    dualNationality?: string;
    birthplace: string;
    startingCountry: string;
    currentCountry: string;
    basePosition: Position;
    currentPosition: Position;
    playstyle: Playstyle;
    positionPlayCounts: Record<Position, number>;
    ovr: number;
    stats: PlayerStats;
    statExp: StatExp;
    fatigue: number; // 0 - 100
    condition: Condition;
    injury: Injury | null;
    growthType?: 'early' | 'normal' | 'late' | 'prodigy';
    rehabDoneToday?: boolean;
    todayPracticeStatus: 'attended' | 'missed' | null;
    todayPracticeReason?: string;
    totalMissedPractices: number;
    consecutiveMissedPractices: number;
    practiceAttitude: number; // 0 - 100
    schoolName: string;
    schoolStage: SchoolStage;
    academicScore: number; // 0 - 100
    schoolReputation: number;
    currentTeam: Team;
    coachTrust: number; // 0 - 100
    teamRole: 'starter' | 'bench' | 'out_of_squad';
    isLoaned: boolean;
    loanType?: 'loan' | 'developmental_loan';
    loanTerms?: LoanTerms;
    fans: number; // strictly real fans from matches/feats
    snsFollowers: number; // social followers
    snsHandle: string;
    wage: number; // annual wage
    marketValue: number;
    nationalTeamCaps: number;
    nationalTeamGoals: number;
    selectedNationalTeam?: string; // chosen country if dual nationality
    currentNationalTier?: 'U-15' | 'U-17' | 'U-20' | 'U-23' | 'Senior' | null;
  };
  currentDate: string; // YYYY-MM-DD
  dayCount: number;
  currentSeason: number;
  freeTimeUsedToday: boolean;
  lastSleepDurationHours?: number;
  recentContext?: RecentGameContext;
  contacts: Person[];
  activeChatPersonId: string | null;
  snsPosts: SNSPost[];
  leagueFixtures: MatchFixture[];
  leagueStandings: LeagueStanding[];
  currentMatchday: number;
  totalMatchdays: number;
  activeMatch: MatchFixture | null;
  transferOffers: TransferOffer[];
  scoutInterests: Array<{ clubName: string; country: string; interestLevel: string; lastSeen: string }>;
  timeline: TimelineEntry[];
  dailyLogs: Array<{ date: string; text: string; type: 'training' | 'school' | 'match' | 'event' | 'relation' }>;
  activePressConference: {
    title: string;
    context: string;
    questions: Array<{ question: string; answered: boolean; playerAnswer?: string; reaction?: string }>;
  } | null;
  pendingEvents: Array<{
    id: string;
    title: string;
    description: string;
    category: 'school' | 'coach' | 'friend' | 'romance' | 'scout' | 'national';
    options: Array<{
      label: string;
      actionType: string;
      payload?: any;
    }>;
  }>;
  activeFaceToFace?: FaceToFaceEvent | null;
  activeOffSeason?: OffSeasonData | null;
  isRetired: boolean;
}

export type Player = GameState['player'];
export type PlayerProfile = Player;

