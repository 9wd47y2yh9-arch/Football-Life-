import { GameState, FreeTimeActivity, Condition, StatExp, FaceToFaceEvent, InventoryItem } from '../types/footballLife';
import { getRandomInt, getRandomElement, SHOP_ITEMS } from '../data/worldData';

export interface FreeTimeResult {
  fatigueDelta: number;
  conditionChange?: Condition;
  academicDelta?: number;
  statExpGained?: Partial<StatExp>;
  friendAffinityDelta?: { personId: string; delta: number; becameBestFriend?: boolean };
  coachTrustDelta?: number;
  rehabDaysReduced?: number;
  faceToFaceTriggered?: FaceToFaceEvent;
  logText: string;
}

export function executeFreeTimeActivity(
  activity: string,
  gameState: GameState,
  options?: {
    targetStat?: keyof StatExp;
    friendId?: string;
    sleepHours?: number;
  }
): FreeTimeResult {
  try {
    const player = gameState.player || ({} as any);
    const contacts = Array.isArray(gameState.contacts) ? gameState.contacts : [];

    switch (activity) {
      case 'individual_practice':
      case 'solo_practice': {
        const stat: keyof StatExp = options?.targetStat || 'shooting';
        const statLabels: Record<keyof StatExp, string> = {
          shooting: 'シュート練習',
          passing: 'パス・ロングキック練習',
          dribbling: 'コーンドリブル特訓',
          pace: 'スプリント・アジリティ強化',
          defending: '対人守備・ポジショニング',
          physical: '体幹強化・自重トレーニング',
          tacticalSense: '戦術研究・視野拡大',
          mental: 'メンタルトレーニング',
          stamina: 'インターバル走・持久力'
        };

        const expGain = getRandomInt(4, 7);
        const fatigueCost = getRandomInt(8, 12);

        return {
          fatigueDelta: fatigueCost,
          statExpGained: { [stat]: expGain },
          coachTrustDelta: +1,
          logText: `放課後の自主練で『${statLabels[stat] || '個人技術'}』を磨きました。（${statLabels[stat] || stat} EXP +${expGain}% / 疲労 +${fatigueCost}%）`
        };
      }

      case 'physical_workout': {
        const workoutType = options?.targetStat === 'pace' ? 'sprint' : options?.targetStat === 'stamina' ? 'stamina' : 'core';
        let statKey: keyof StatExp = 'physical';
        let workoutName = '体幹トレーニング＆自重筋力強化';

        if (workoutType === 'sprint') {
          statKey = 'pace';
          workoutName = '短距離スプリント＆ラダードリル';
        } else if (workoutType === 'stamina') {
          statKey = 'stamina';
          workoutName = 'インターバルシャトルラン＆有酸素トレ';
        }

        const expGain = getRandomInt(5, 8);
        const fatigueCost = getRandomInt(10, 15);

        return {
          fatigueDelta: fatigueCost,
          statExpGained: { [statKey]: expGain },
          coachTrustDelta: +1,
          logText: `フィジカル強化として『${workoutName}』を敢行。（${statKey.toUpperCase()} EXP +${expGain}% / 疲労 +${fatigueCost}%）`
        };
      }

      case 'shooting_practice': {
        const expGain = getRandomInt(5, 8);
        const fatigueCost = getRandomInt(8, 13);
        return {
          fatigueDelta: fatigueCost,
          statExpGained: { shooting: expGain },
          coachTrustDelta: +1,
          logText: `様々な角度や距離からシュート練習を繰り返し、決定力を研ぎ澄ましました。（SHOOTING EXP +${expGain}% / 疲労 +${fatigueCost}%）`
        };
      }

      case 'condition_tuning': {
        // Condition promotion
        const currCond = player.condition || 'normal';
        let nextCond: Condition = 'good';
        if (currCond === 'terrible') nextCond = 'poor';
        else if (currCond === 'poor') nextCond = 'normal';
        else if (currCond === 'normal') nextCond = 'good';
        else if (currCond === 'good') nextCond = 'superb';
        else nextCond = 'superb';

        return {
          fatigueDelta: -12,
          conditionChange: nextCond,
          logText: `入念なストレッチと交代浴でコンディションを整えました。（疲労 -12% / コンディション: ${nextCond.toUpperCase()}へ上昇）`
        };
      }

      case 'rehab_session': {
        if (!player.injury) {
          return {
            fatigueDelta: -6,
            logText: '現在は怪我をしていないため、予防のアイシングと柔軟運動を行いました。'
          };
        }

        // 1 day reduction chance (65%)
        const reduced = Math.random() < 0.65 ? 1 : 0;
        return {
          fatigueDelta: -4,
          rehabDaysReduced: reduced,
          logText: reduced > 0
            ? `トレーナーの指導のもと慎重にリハビリを行い、患部の回復が1日早まりました！（復帰まで前進）`
            : `痛む患部のアイシングとマッサージを受け、無理のないペースで治癒を目指します。`
        };
      }

      case 'coach_consult': {
        const coach = contacts.find(c => c.role === 'coach') || contacts.find(c => c.role === 'assistant_coach');
        const coachName = coach ? coach.name : '監督';
        const pos = player.currentPosition;

        // Position-specific coaching dialogue
        let positionAdvice = 'チーム全体のバランスと攻守の切り替えをもっと速く意識しろ。';
        let positionOption = '「チームのために全力で走り、攻守に貢献します！」';
        if (pos === 'CF' || pos === 'ST') {
          positionAdvice = 'FWは結果がすべてだ。ペナルティエリア内での嗅覚と、泥臭くゴールをもぎ取る決定力を磨け。';
          positionOption = '「どんな形でもゴールを奪い、チームを勝たせるストライカーになります！」';
        } else if (pos === 'WG') {
          positionAdvice = 'サイドでの1対1は常に仕掛けろ。縦への突破力と、中の味方に合わせるクロスの質が武器になる。';
          positionOption = '「サイドを切り裂いてチャンスを量産してみせます！」';
        } else if (pos === 'OMF' || pos === 'CMF') {
          positionAdvice = '中盤のリズムはお前が作れ。パスの強弱、受ける前の首振り、そして決定的なラストパスの視野だ。';
          positionOption = '「ゲームを支配し、決定的なラストパスを味方に供給し続けます！」';
        } else if (pos === 'DMF' || pos === 'CB' || pos === 'SB') {
          positionAdvice = '守備の要としての声出しとライン統率だ。1対1の対人強度と、危機察知の予測で味方を救え。';
          positionOption = '「最終ラインの統率と球際の激しさで、ゴールを死守します！」';
        } else if (pos === 'GK') {
          positionAdvice = '最後方からのコーチングで守備陣を動かせ。シュートストップだけでなくハイボールの安定感も重要だ。';
          positionOption = '「最後方から声を張り上げ、鉄壁のゴールキーパーとしてゴールを守り抜きます！」';
        }

        const faceToFace: FaceToFaceEvent = {
          id: `ftf_consult_${Date.now()}`,
          speakerName: coachName,
          speakerRole: coach?.role === 'coach' ? 'coach' : 'assistant_coach',
          speakerTitle: `${coachName}（指導者面談）`,
          situation: '練習前、グラウンド脇で監督・コーチに直接話しかけました。',
          dialogueText: `「お前か。どうした？練習や次の試合について、何か話したいことでもあるのか？」`,
          options: [
            {
              text: positionOption,
              response: `「いい気迫だ！${positionAdvice}その意識を忘れずにグラウンドで体現してみせろ。」`,
              trustDelta: 3,
              attitudeDelta: 4
            },
            {
              text: '「次の試合、先発スタメンで使ってください！」と直訴する',
              response: '「その積極性は嫌いじゃない。練習での動きと戦術理解が伴っていれば、ピッチに立たせてやる。」',
              trustDelta: player.fatigue < 40 ? 4 : 1,
              attitudeDelta: 3
            },
            {
              text: '「将来プロの世界で戦うために、今自分に最も足りない部分を教えてください」と進路相談する',
              response: '「プロの世界は厳しく、90分間戦い抜くメンタルと基礎技術の絶対的な安定性が求められる。驕らず日々の練習を積み重ねろ。」',
              trustDelta: 3,
              attitudeDelta: 3
            }
          ]
        };

        return {
          fatigueDelta: 0,
          coachTrustDelta: +1,
          faceToFaceTriggered: faceToFace,
          logText: `指導者に直接声をかけ、真摯に対面で面談を行いました。`
        };
      }

      case 'study': {
        const academicGain = Math.random() < 0.75 ? 1 : 0;
        return {
          fatigueDelta: +2,
          academicDelta: academicGain,
          logText: academicGain > 0
            ? `机に向かって学校の予習・復習に取り組みました。（学力 +1点 / 現在: ${(player.academicScore || 60) + 1}点）`
            : `教科書を開いて自習しましたが、集中が続かずあまり身に入りませんでした。（学力変動なし）`
        };
      }

      case 'videogame':
      case 'game_relax': {
        return {
          fatigueDelta: 0,
          conditionChange: player.condition === 'terrible' ? 'poor' : player.condition,
          logText: '部屋でサッカーゲームや映画を鑑賞してリフレッシュしました。（精神的リフレッシュ）'
        };
      }

      case 'hangout_friend': {
        const friend = contacts.find(c => c.id === options?.friendId) || contacts.find(c => c.role === 'friend' || c.role === 'romance' || c.role === 'teammate') || contacts[0];
        if (!friend) {
          return {
            fatigueDelta: 0,
            logText: '友達に声をかけましたが都合が合わず、一人で近所を散歩して過ごしました。'
          };
        }

        const affinityGain = getRandomInt(4, 8);
        const newAffinity = Math.min(100, (friend.affinity || 50) + affinityGain);
        const becameBestFriend = friend.role === 'friend' && friend.relationship !== 'best_friend' && newAffinity >= 80;

        // Generate diverse Face-to-Face event based on relationship & role
        let ftfEvent: FaceToFaceEvent | undefined = undefined;
        const isLover = friend.relationship === 'dating' || friend.role === 'romance';
        const isTeammate = friend.role === 'teammate';

        if (isLover) {
          ftfEvent = {
            id: `ftf_date_${Date.now()}`,
            speakerName: friend.name,
            speakerRole: 'romance',
            speakerTitle: `${friend.name}（恋人とデート）`,
            situation: `放課後、${friend.name}とカフェでお茶をしながら並んで歩く特別な時間を過ごしました。`,
            dialogueText: `「ふふ、今日は一緒に過ごせてすごく嬉しいな！次の試合も応援に行くから、かっこいい姿見せてね？」`,
            options: [
              {
                text: '「ありがとう！絶対にゴールや良いプレーを決めて喜ばせるよ」と笑顔で応える',
                response: '「うん！信じてるよ。怪我だけは絶対に気をつけてね！」',
                attitudeDelta: 3
              },
              {
                text: '「いつも支えてくれて感謝してるよ。今度美味しいスイーツでも食べに行こう」と約束する',
                response: '「やったぁ！約束だよ？すごく楽しみにしてるね！」',
                attitudeDelta: 2
              },
              {
                text: '「実は最近、サッカーで少し悩んでることがあって…」と胸の内を明かす',
                response: '「そうだったんだ…何があっても私はあなたの味方だから、いつでも話してね。」',
                attitudeDelta: 4
              }
            ]
          };
        } else if (isTeammate) {
          ftfEvent = {
            id: `ftf_teammate_${Date.now()}`,
            speakerName: friend.name,
            speakerRole: 'teammate',
            speakerTitle: `${friend.name}（チームメイトと食事）`,
            situation: `練習帰りに${friend.name}とファミレスに寄り、ドリンクバーを飲みながらサッカー談義に花を咲かせました。`,
            dialogueText: `「なぁ、次の対戦相手の守備ライン、結構足が速いらしいぜ。俺たちの連携をどう合わせていく？」`,
            options: [
              {
                text: '「ワンツーで狭いエリアを素早く打開しよう。息を合わせるぞ！」',
                response: '「よし、そのイメージで行こう！俺がスペースを空けるから飛び出してくれ！」',
                attitudeDelta: 3
              },
              {
                text: '「相手の背後のスペースを突くロングフィードを狙っていこう！」',
                response: '「いい狙いだな。タイミングを合わせて一気に裏へ抜け出すぜ！」',
                attitudeDelta: 3
              },
              {
                text: '「お互い将来プロになって、同じピッチで戦うのが夢だな」と熱く語る',
                response: '「ああ！絶対にプロになって、世界の大舞台でボールを蹴ろうぜ！」',
                attitudeDelta: 4
              }
            ]
          };
        } else {
          // Regular friend hangout
          ftfEvent = {
            id: `ftf_friend_${Date.now()}`,
            speakerName: friend.name,
            speakerRole: 'friend',
            speakerTitle: `${friend.name}（放課後の交流）`,
            situation: `放課後、${friend.name}と一緒にゲームセンターやショッピングモールで楽しい時間を過ごしました。`,
            dialogueText: `「久しぶりに遊べて楽しかったな！サッカーの練習毎日ハードそうだけど、たまには息抜きも必要だよな？」`,
            options: [
              {
                text: '「すごく良いリフレッシュになった！ありがとう！」と感謝を伝える',
                response: '「どういたしまして！またいつでも付き合うから声かけてよな！」',
                attitudeDelta: 3
              },
              {
                text: '「進路や将来のことで考えてることがあれば相談に乗るよ」と話を聞く',
                response: '「お前も自分の夢に向かって頑張ってるもんな。俺も負けてられないぜ！」',
                attitudeDelta: 2
              },
              {
                text: '「今度の週末の試合、時間があったら見に来てよ！」と誘う',
                response: '「もちろん見に行くよ！スタンドから大声で応援するからな！」',
                attitudeDelta: 3
              }
            ]
          };
        }

        return {
          fatigueDelta: +2,
          faceToFaceTriggered: ftfEvent,
          friendAffinityDelta: {
            personId: friend.id,
            delta: affinityGain,
            becameBestFriend
          },
          logText: becameBestFriend
            ? `【親友誕生！】${friend.name}と語り合い、お互いにとってかけがえのない『親友』になりました！`
            : `${friend.name}と一緒に楽しく過ごしました。（親密度 +${affinityGain}）`
        };
      }

      case 'sleep': {
        const hours = options?.sleepHours ?? 8;
        if (hours >= 7 && hours <= 9) {
          return {
            fatigueDelta: -18,
            conditionChange: 'good',
            logText: `8時間の質の高い睡眠を取りました。（疲労 -18% / コンディション良好）`
          };
        } else if (hours < 6) {
          return {
            fatigueDelta: +5,
            conditionChange: 'poor',
            logText: `夜更かしをして睡眠不足になってしまいました。（疲労 +5% / コンディション低下）`
          };
        } else {
          return {
            fatigueDelta: -10,
            conditionChange: 'normal',
            coachTrustDelta: -1,
            logText: `昼過ぎまで寝すぎてしまい、体が少し重く感じられます。（疲労 -10%）`
          };
        }
      }

      case 'rest': {
        return {
          fatigueDelta: -14,
          conditionChange: 'normal',
          logText: '自宅でアイシングと静かな休養を取り、疲労を抜きました。（疲労 -14%）'
        };
      }

      case 'tactics_study': {
        return {
          fatigueDelta: +2,
          statExpGained: { tacticalSense: 6 },
          coachTrustDelta: +1,
          logText: 'トッププロの試合映像を戦術ノートを取りながら分析しました。（戦術眼 EXP +6% / 監督信頼度 +1）'
        };
      }

      case 'sns_post': {
        return {
          fatigueDelta: 0,
          logText: 'スマートフォンを開いてSNSの反響をチェックしました。'
        };
      }

      default: {
        return {
          fatigueDelta: -8,
          conditionChange: 'normal',
          logText: '放課後の時間をのんびりと過ごしてリフレッシュしました。（疲労 -8%）'
        };
      }
    }
  } catch (error) {
    console.error('Safe error recovery in executeFreeTimeActivity:', error);
    return {
      fatigueDelta: -5,
      logText: '穏やかな時間を過ごして体力を整えました。（安全処理完了）'
    };
  }
}

/**
 * Economy System: Purchase an item from the Shop
 */
export function purchaseShopItem(
  gameState: GameState,
  shopItemId: string
): { success: boolean; message: string; updatedGameState: GameState } {
  const { player } = gameState;
  const item = SHOP_ITEMS.find(i => i.id === shopItemId);
  if (!item) {
    return { success: false, message: '指定されたアイテムが見つかりませんでした。', updatedGameState: gameState };
  }

  const currentFunds = player.funds ?? 30000;
  if (currentFunds < item.price) {
    return {
      success: false,
      message: `所持金が足りません。（必要: ¥${item.price.toLocaleString()} / 所持金: ¥${currentFunds.toLocaleString()}）`,
      updatedGameState: gameState
    };
  }

  const newFunds = currentFunds - item.price;
  const newInventoryItem: InventoryItem = {
    id: `inv_${item.id}_${Date.now()}`,
    shopItemId: item.id,
    name: item.name,
    category: item.category,
    purchasedDate: gameState.currentDate,
    isEquipped: false,
    durabilityRemaining: item.durability,
    statBonus: item.statBonus
  };

  let updatedPlayer = {
    ...player,
    funds: newFunds,
    inventory: [...(player.inventory || []), newInventoryItem]
  };

  // Immediate effect items (e.g. nutrition, recovery sessions)
  let effectMessage = '';
  if (item.category === 'nutrition') {
    updatedPlayer.fatigue = Math.max(0, updatedPlayer.fatigue - 15);
    effectMessage = '（疲労が15%回復しました！）';
  } else if (item.category === 'recovery') {
    updatedPlayer.fatigue = Math.max(0, updatedPlayer.fatigue - 25);
    updatedPlayer.condition = 'superb';
    effectMessage = '（疲労が25%回復し、コンディションが最高になりました！）';
  }

  const logText = `【ショップ購入】『${item.name}』を ¥${item.price.toLocaleString()} で購入しました。${effectMessage}`;

  const updatedGameState: GameState = {
    ...gameState,
    player: updatedPlayer,
    dailyLogs: [
      {
        date: gameState.currentDate,
        text: logText,
        type: 'event'
      },
      ...gameState.dailyLogs
    ]
  };

  return {
    success: true,
    message: `${item.name}を購入しました！${effectMessage}`,
    updatedGameState
  };
}

/**
 * Equip Cleats/Gear
 */
export function equipCleats(
  gameState: GameState,
  inventoryItemId: string
): { success: boolean; message: string; updatedGameState: GameState } {
  const { player } = gameState;
  const inventory = [...(player.inventory || [])];
  const targetIndex = inventory.findIndex(i => i.id === inventoryItemId);

  if (targetIndex === -1) {
    return { success: false, message: '所持品の中に該当アイテムがありません。', updatedGameState: gameState };
  }

  const item = inventory[targetIndex];
  if (item.category !== 'cleats') {
    return { success: false, message: 'このアイテムはスパイクとして装備できません。', updatedGameState: gameState };
  }

  // Unequip previously equipped cleats
  const updatedInventory = inventory.map(inv => {
    if (inv.category === 'cleats') {
      return { ...inv, isEquipped: inv.id === inventoryItemId };
    }
    return inv;
  });

  const equippedItem = { ...item, isEquipped: true };
  const updatedPlayer = {
    ...player,
    inventory: updatedInventory,
    equippedGear: {
      ...(player.equippedGear || {}),
      cleats: equippedItem
    }
  };

  return {
    success: true,
    message: `『${item.name}』を装備しました！実戦や練習でのパフォーマンスが向上します。`,
    updatedGameState: {
      ...gameState,
      player: updatedPlayer
    }
  };
}

/**
 * Use a consumable item (recovery, nutrition)
 */
export function useConsumableItem(
  gameState: GameState,
  inventoryItemId: string
): { success: boolean; message: string; updatedGameState: GameState } {
  const { player } = gameState;
  const inventory = [...(player.inventory || [])];
  const targetIndex = inventory.findIndex(i => i.id === inventoryItemId);

  if (targetIndex === -1) {
    return { success: false, message: '所持品の中に該当アイテムがありません。', updatedGameState: gameState };
  }

  const item = inventory[targetIndex];
  if (item.category === 'cleats') {
    return { success: false, message: 'スパイクは消費アイテムではありません。「装備」してください。', updatedGameState: gameState };
  }

  // Apply consumable effect
  let updatedPlayer = { ...player };
  let effectText = '';

  if (item.name.includes('アミノ酸') || item.name.includes('プロテイン')) {
    updatedPlayer.fatigue = Math.max(0, updatedPlayer.fatigue - 20);
    effectText = '疲労が -20% 回復しました。';
  } else if (item.name.includes('酸素カプセル') || item.name.includes('マッサージ')) {
    updatedPlayer.fatigue = Math.max(0, updatedPlayer.fatigue - 35);
    updatedPlayer.condition = 'superb';
    effectText = '疲労が -35% 回復し、絶好調（SUPERB）になりました！';
  } else {
    updatedPlayer.fatigue = Math.max(0, updatedPlayer.fatigue - 15);
    effectText = '疲労が -15% 回復しました。';
  }

  // Remove from inventory
  const updatedInventory = inventory.filter(i => i.id !== inventoryItemId);
  updatedPlayer.inventory = updatedInventory;

  return {
    success: true,
    message: `『${item.name}』を使用しました！${effectText}`,
    updatedGameState: {
      ...gameState,
      player: updatedPlayer,
      dailyLogs: [
        {
          date: gameState.currentDate,
          text: `【アイテム使用】『${item.name}』を使用しました。（${effectText}）`,
          type: 'event'
        },
        ...gameState.dailyLogs
      ]
    }
  };
}
