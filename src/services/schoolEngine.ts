import { GameState, SchoolStage } from '../types/footballLife';
import { COUNTRIES, getRandomElement, getRandomInt } from '../data/worldData';

export interface SchoolEvent {
  id: string;
  name: string;
  month: number;
  description: string;
  choices: Array<{
    text: string;
    academicDelta: number;
    fatigueDelta: number;
    classmateAffinityDelta: number;
    outcomeText: string;
  }>;
}

export function checkSchoolEvents(currentDate: string): SchoolEvent | null {
  const date = new Date(currentDate);
  const month = date.getMonth() + 1; // 1 to 12
  const day = date.getDate();

  // Sports Day in May or October
  if (month === 5 && day === 15) {
    return {
      id: 'sports_day',
      name: '学校の体育祭',
      month,
      description: '全校生徒が参加する春の体育祭！リレーの選手としてクラスの期待を背負っている。',
      choices: [
        {
          text: 'アンカーとして全力疾走し、クラスの勝利に貢献する！',
          academicDelta: 0,
          fatigueDelta: 8,
          classmateAffinityDelta: 10,
          outcomeText: '圧倒的な快足でごぼう抜きを演じ、クラスを総合優勝に導いた！みんなから大歓声を浴びた！'
        },
        {
          text: '無理せずマイペースに走り、週末のサッカー公式戦に備える',
          academicDelta: 0,
          fatigueDelta: 3,
          classmateAffinityDelta: 2,
          outcomeText: '無理のない走りで無事にバトンを繋いだ。体力を温存できた。'
        }
      ]
    };
  }

  // Cultural Festival in November
  if (month === 11 && day === 3) {
    return {
      id: 'cultural_festival',
      name: '学校の文化祭',
      month,
      description: '模擬店や展示で賑わう秋の文化祭。クラスの出し物のシフトや自由見学の時間がある。',
      choices: [
        {
          text: 'クラスの模擬店の呼び込みや準備を積極的に手伝う',
          academicDelta: 0,
          fatigueDelta: 4,
          classmateAffinityDelta: 8,
          outcomeText: 'クラスメイトと協力して模擬店は大盛況！気になるあの子ともたくさん話せた。'
        },
        {
          text: '友達と一緒に校内を回って他の展示を楽しむ',
          academicDelta: 0,
          fatigueDelta: 2,
          classmateAffinityDelta: 5,
          outcomeText: '友達と美味しい屋台を食べ歩き、学生らしい楽しい思い出を作った。'
        }
      ]
    };
  }

  // Term Exam in July or December
  if ((month === 7 && day === 10) || (month === 12 && day === 10)) {
    return {
      id: 'term_exam',
      name: '期末定期テスト',
      month,
      description: '今学期の学力成果を問われる期末テストが返却された！',
      choices: [
        {
          text: '間違えた問題をしっかり復習して先生に質問に行く',
          academicDelta: 2,
          fatigueDelta: 2,
          classmateAffinityDelta: 1,
          outcomeText: '先生から「前向きで立派ですね」と褒められ、弱点を克服できた。'
        },
        {
          text: '結果を確認し、サッカーの練習に切り替える',
          academicDelta: 0,
          fatigueDelta: 0,
          classmateAffinityDelta: 0,
          outcomeText: 'テストを終えてすっきりし、放課後の練習に集中することにした。'
        }
      ]
    };
  }

  return null;
}

export function handleAgeTransition(gameState: GameState): Partial<GameState> {
  const { player } = gameState;
  const newAge = player.age + 1;
  let newSchoolStage: SchoolStage = player.schoolStage;
  let newSchoolName = player.schoolName;

  const countryData = COUNTRIES[player.currentCountry] || COUNTRIES.japan;

  // School progression by age
  if (newAge === 13) {
    newSchoolStage = 'middle';
    newSchoolName = getRandomElement(countryData.schools.middle);
  } else if (newAge === 16) {
    newSchoolStage = 'high';
    newSchoolName = getRandomElement(countryData.schools.high);
  } else if (newAge === 19) {
    if (player.ovr >= 68 || player.wage > 0) {
      newSchoolStage = 'pro';
      newSchoolName = 'プロ専念';
    } else {
      newSchoolStage = 'university';
      newSchoolName = getRandomElement(countryData.schools.university);
    }
  }

  // Dual nationality event check
  const dualNationalCheck = player.dualNationality && (newAge === 15 || newAge === 18) && !player.selectedNationalTeam;

  const timelineEntry = {
    id: `age_${newAge}_${Date.now()}`,
    age: newAge,
    date: gameState.currentDate,
    title: `${newAge}歳の誕生日`,
    description: `${newAge}歳を迎えた。${newSchoolName}での生活とサッカーでの更なるステップアップを誓う。`,
    type: 'milestone' as const
  };

  return {
    player: {
      ...player,
      age: newAge,
      schoolStage: newSchoolStage,
      schoolName: newSchoolName
    },
    timeline: [timelineEntry, ...gameState.timeline]
  };
}
