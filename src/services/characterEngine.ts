import { Person, Position, Gender, GameState } from '../types/footballLife';
import { COUNTRIES, CountryData, getRandomElement, getRandomInt } from '../data/worldData';
import { generateContextualSpontaneousMessage } from './dialogueEngine';

export function generateInitialCharacters(
  countryId: string,
  playerGender: Gender,
  schoolName: string,
  clubName: string,
  playerPosition: Position,
  coachName: string,
  coachStyle: Person['personality']
): Person[] {
  const country = COUNTRIES[countryId] || COUNTRIES.japan;
  const isJapan = countryId === 'japan';

  // 1. Coach (監督)
  const coach: Person = {
    id: 'char_coach',
    name: coachName,
    role: 'coach',
    relationship: 'mentor',
    gender: 'male',
    age: 42,
    country: country.name,
    schoolOrClub: clubName,
    personality: coachStyle || 'serious',
    hobbies: ['戦術分析', 'ジョギング', 'プロ観戦'],
    soccerExperience: '元実業団 / ユース指導歴15年',
    affinity: 50,
    trust: 50,
    memories: ['入団面談を実施。基礎からの成長に期待している。'],
    chatHistory: [
      {
        id: 'msg_init_coach',
        sender: 'cpu',
        text: `チームへようこそ。ここでは日々の練習態度と試合での判断力を重視する。全力で取り組んでくれ。`,
        timestamp: '10:00'
      }
    ],
    unreadCount: 1
  };

  // 2. Assistant Coach / Trainer (コーチ)
  const asstCoachLastName = getRandomElement(country.lastNames);
  const asstCoachFirstName = getRandomElement(country.firstNamesMale);
  const asstCoach: Person = {
    id: 'char_asst_coach',
    name: isJapan ? `${asstCoachLastName} コーチ` : `Coach ${asstCoachFirstName} ${asstCoachLastName}`,
    role: 'assistant_coach',
    relationship: 'mentor',
    gender: 'male',
    age: 28,
    country: country.name,
    schoolOrClub: clubName,
    personality: 'passionate',
    hobbies: ['フィジカルトレーニング', 'スニーカー収集'],
    soccerExperience: '大学サッカー出身・A級ライセンス取得中',
    affinity: 55,
    trust: 55,
    memories: ['ウォーミングアップとリハビリ担当'],
    chatHistory: [
      {
        id: 'msg_init_asst',
        sender: 'cpu',
        text: '何か体の張りやポジションの悩みがあればいつでも相談に来てくれよな！',
        timestamp: '10:15'
      }
    ],
    unreadCount: 0
  };

  // 3. School Teacher (担任の先生)
  const teacherLastName = getRandomElement(country.lastNames);
  const teacherFirstName = getRandomElement(country.firstNamesMale.concat(country.firstNamesFemale));
  const teacher: Person = {
    id: 'char_teacher',
    name: isJapan ? `${teacherLastName} 先生` : `Prof. ${teacherFirstName} ${teacherLastName}`,
    role: 'teacher',
    relationship: 'mentor',
    gender: 'female',
    age: 34,
    country: country.name,
    schoolOrClub: schoolName,
    personality: 'gentle',
    hobbies: ['読書', 'カフェ巡り'],
    soccerExperience: 'サッカー未経験 (文芸部顧問)',
    affinity: 50,
    trust: 50,
    memories: ['新学期の担任。サッカーと勉強の両立を見守る。'],
    chatHistory: [
      {
        id: 'msg_init_teacher',
        sender: 'cpu',
        text: 'サッカーも大切ですが、宿題と定期テストもしっかり取り組んでくださいね。',
        timestamp: '11:00'
      }
    ],
    unreadCount: 0
  };

  // 4. Teammate & Childhood Friend (チームメイト兼友達)
  const friendLastName = getRandomElement(country.lastNames);
  const friendFirstName = getRandomElement(country.firstNamesMale);
  const friendName = isJapan ? `${friendLastName} ${friendFirstName}` : `${friendFirstName} ${friendLastName}`;
  const friend: Person = {
    id: 'char_friend_1',
    name: friendName,
    role: 'friend',
    relationship: 'friend',
    gender: 'male',
    age: 10,
    country: country.name,
    schoolOrClub: clubName,
    personality: 'cheerful',
    hobbies: ['ゲーム', '漫画', 'リフティング'],
    soccerExperience: '小学1年生から同じスクール',
    affinity: 65,
    trust: 60,
    memories: ['いつも一緒にグラウンドに行っている。'],
    chatHistory: [
      {
        id: 'msg_init_friend',
        sender: 'cpu',
        text: '今日も練習終わったら公園で少しボール蹴ろうぜ！新しいフェイント練習したいんだ！',
        timestamp: '08:30'
      }
    ],
    unreadCount: 1
  };

  // 5. Rival (同年代のライバル - 同ポジションまたは攻撃/守備の好敵手)
  const rivalLastName = getRandomElement(country.lastNames);
  const rivalFirstName = getRandomElement(country.firstNamesMale);
  const rivalName = isJapan ? `${rivalLastName} ${rivalFirstName}` : `${rivalFirstName} ${rivalLastName}`;
  const rival: Person = {
    id: 'char_rival_1',
    name: rivalName,
    role: 'rival',
    relationship: 'rival',
    gender: 'male',
    age: 10,
    country: country.name,
    schoolOrClub: clubName,
    personality: 'ambitious',
    hobbies: ['自主練', '欧州CL観戦'],
    soccerExperience: '県トレセン候補・ストイック',
    affinity: 40,
    trust: 45,
    isRival: true,
    rivalPosition: playerPosition,
    memories: ['同じポジションでスタメンを競い合うライバル。'],
    chatHistory: [
      {
        id: 'msg_init_rival',
        sender: 'cpu',
        text: `お前が同じポジションだろうと、スタメンは譲らないからな。練習で勝負だ。`,
        timestamp: '09:00'
      }
    ],
    unreadCount: 1
  };

  // 6. Classmate (クラスメイト・将来の親友・恋愛候補)
  const classmateGender = playerGender === 'male' ? 'female' : 'male';
  const classmateLastName = getRandomElement(country.lastNames);
  const classmateFirstName = getRandomElement(
    classmateGender === 'female' ? country.firstNamesFemale : country.firstNamesMale
  );
  const classmateName = isJapan ? `${classmateLastName} ${classmateFirstName}` : `${classmateFirstName} ${classmateLastName}`;
  const classmate: Person = {
    id: 'char_classmate_1',
    name: classmateName,
    role: 'romance',
    relationship: 'acquaintance',
    gender: classmateGender,
    age: 10,
    country: country.name,
    schoolOrClub: schoolName,
    personality: 'gentle',
    hobbies: ['音楽鑑賞', 'お絵描き', '散歩'],
    soccerExperience: '体育のサッカーくらい',
    affinity: 35,
    trust: 35,
    memories: ['同じクラスで席が前後になった。'],
    chatHistory: [
      {
        id: 'msg_init_crush',
        sender: 'cpu',
        text: '教科書見せてくれてありがとう！いつも放課後サッカー頑張ってるね。',
        timestamp: '16:00'
      }
    ],
    unreadCount: 0
  };

  // 7. Family (保護者・父または母)
  const parentName = isJapan ? `${playerGender === 'male' ? '父' : '母'}` : (playerGender === 'male' ? 'Dad' : 'Mom');
  const family: Person = {
    id: 'char_family_1',
    name: parentName,
    role: 'family',
    relationship: 'mentor',
    gender: 'female',
    age: 39,
    country: country.name,
    schoolOrClub: '実家',
    personality: 'gentle',
    hobbies: ['料理', '応援'],
    soccerExperience: '大ファン',
    affinity: 90,
    trust: 90,
    memories: ['毎日のお弁当作りとユニフォームの洗濯をしてくれている。'],
    chatHistory: [
      {
        id: 'msg_init_family',
        sender: 'cpu',
        text: 'スパイク洗っておいたよ。今日も怪我しないように気をつけて頑張っておいで！',
        timestamp: '07:00'
      }
    ],
    unreadCount: 0
  };

  return [coach, asstCoach, teacher, friend, rival, classmate, family];
}

// Generate spontaneous CPU messages based on game state
export function generateSpontaneousMessages(gameState: GameState): { personId: string; text: string }[] {
  const newMessages: { personId: string; text: string }[] = [];
  const { contacts } = gameState;

  // Chance of message per day
  for (const person of contacts) {
    // 35% chance for a contact to trigger a message on any given day
    if (Math.random() > 0.4) continue;

    const text = generateContextualSpontaneousMessage(person, gameState);
    if (text) {
      newMessages.push({ personId: person.id, text });
    }
  }

  return newMessages;
}
