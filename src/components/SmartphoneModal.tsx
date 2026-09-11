import React, { useState, useRef, useEffect } from 'react';
import { GameState, Person, SNSPost } from '../types/footballLife';
import { getConversationalAIReply, getAISNSPostResult, checkAIHealth } from '../services/aiDialogueService';
import { 
  X, Send, MessageCircle, Share2, Heart, Users, User, Shield, 
  Sparkles, ThumbsUp, AlertCircle, MessageSquare, Phone, Bot, CheckCircle2 
} from 'lucide-react';

interface SmartphoneModalProps {
  gameState: GameState;
  onClose: () => void;
  onUpdateGameState: (updater: (prev: GameState) => GameState) => void;
}

export const SmartphoneModal: React.FC<SmartphoneModalProps> = ({
  gameState,
  onClose,
  onUpdateGameState
}) => {
  const [activeTab, setActiveTab] = useState<'sns' | 'chat' | 'contacts'>('sns');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    gameState.activeChatPersonId || (gameState.contacts[0]?.id ?? null)
  );
  const [chatInput, setChatInput] = useState('');
  const [snsInput, setSnsInput] = useState('');
  const [isPostingSns, setIsPostingSns] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiOnline, setIsAiOnline] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const selectedPerson = gameState.contacts.find(c => c.id === selectedPersonId);

  // Check AI health on mount
  useEffect(() => {
    checkAIHealth().then(online => setIsAiOnline(online));
  }, []);

  // Auto scroll chat to bottom when person, history, or AI thinking changes
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedPersonId, activeTab, selectedPerson?.chatHistory.length, isAiThinking]);

  // Mark unread messages as read when selecting a person
  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
    onUpdateGameState(prev => ({
      ...prev,
      activeChatPersonId: personId,
      contacts: prev.contacts.map(c => 
        c.id === personId ? { ...c, unreadCount: 0 } : c
      )
    }));
  };

  // Send message in Chat using Conversational AI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedPerson || isAiThinking) return;

    const userText = chatInput.trim();
    setChatInput('');
    setIsAiThinking(true);

    // 1. Immediately append player message to chat history
    onUpdateGameState(prev => ({
      ...prev,
      contacts: prev.contacts.map(c =>
        c.id === selectedPerson.id
          ? {
              ...c,
              chatHistory: [
                ...c.chatHistory,
                {
                  id: `p_msg_${Date.now()}`,
                  sender: 'player' as const,
                  text: userText,
                  timestamp: 'たった今'
                }
              ]
            }
          : c
      )
    }));

    try {
      // 2. Call Conversational AI service (Gemini with deep context & fallback)
      const replyResult = await getConversationalAIReply(userText, selectedPerson, gameState);

      // 3. Update game state with CPU reply and controlled game mutations
      onUpdateGameState(prev => {
        let updatedPlayer = { ...prev.player };
        let updatedTimeline = [...prev.timeline];
        let dailyLogs = [...prev.dailyLogs];

        // Coach trust impact (strictly bounded)
        if (replyResult.coachTrustDelta) {
          updatedPlayer.coachTrust = Math.max(0, Math.min(100, updatedPlayer.coachTrust + replyResult.coachTrustDelta));
        }

        // Position change granted
        if (replyResult.positionChangeGranted) {
          updatedPlayer.currentPosition = replyResult.positionChangeGranted;
          updatedPlayer.positionPlayCounts[replyResult.positionChangeGranted] = 
            (updatedPlayer.positionPlayCounts[replyResult.positionChangeGranted] || 0) + 1;
          dailyLogs.unshift({
            date: prev.currentDate,
            text: `【ポジション変更】監督の承諾を受け、ポジションを『${replyResult.positionChangeGranted}』へ変更しました。`,
            type: 'event'
          });
        }

        // Transfer discussion event noted
        if (replyResult.transferDesireNoted) {
          if (!updatedTimeline.some(t => t.title.includes('移籍相談'))) {
            updatedTimeline.unshift({
              id: `tl_transfer_${Date.now()}`,
              age: updatedPlayer.age,
              date: prev.currentDate,
              title: `移籍に関する真剣相談`,
              description: `${selectedPerson.name}と将来のキャリアや移籍について腹を割って話し合った。`,
              type: 'transfer'
            });
          }
          dailyLogs.unshift({
            date: prev.currentDate,
            text: `【移籍相談】${selectedPerson.name}と移籍に関する意見交換を行いました。`,
            type: 'event'
          });
        }

        // Playing time promise noted
        if (replyResult.playingTimePromise) {
          dailyLogs.unshift({
            date: prev.currentDate,
            text: `【起用約束】${selectedPerson.name}から「次のチャンスで起用する」との意向が示されました。`,
            type: 'event'
          });
        }

        // Romance progression
        if (replyResult.romanceProgression === 'confession_accept') {
          updatedTimeline.unshift({
            id: `tl_dating_${Date.now()}`,
            age: updatedPlayer.age,
            date: prev.currentDate,
            title: `恋人の成立（${selectedPerson.name}）`,
            description: `${selectedPerson.name}に想いを告白し、両思いとなって交際をスタートした。`,
            type: 'romance'
          });
        }

        // Update memories
        const updatedMemories = replyResult.memoryAdded
          ? [replyResult.memoryAdded, ...selectedPerson.memories.filter(m => m !== replyResult.memoryAdded)]
          : selectedPerson.memories;

        const updatedContacts = prev.contacts.map(c => {
          if (c.id === selectedPerson.id) {
            const newAffinity = Math.max(0, Math.min(100, c.affinity + (replyResult.affinityDelta || 0)));
            const newTrust = Math.max(0, Math.min(100, c.trust + (replyResult.trustDelta || 0)));
            let newRel = c.relationship;

            if (replyResult.romanceProgression === 'confession_accept') {
              newRel = 'dating';
            } else if (c.role === 'friend' && newAffinity >= 80) {
              newRel = 'best_friend';
            }

            return {
              ...c,
              affinity: newAffinity,
              trust: newTrust,
              relationship: newRel,
              memories: updatedMemories,
              chatHistory: [
                ...c.chatHistory,
                {
                  id: `cpu_msg_${Date.now()}`,
                  sender: 'cpu' as const,
                  text: replyResult.replyText,
                  timestamp: 'たった今'
                }
              ]
            };
          }
          return c;
        });

        return {
          ...prev,
          player: updatedPlayer,
          contacts: updatedContacts,
          timeline: updatedTimeline,
          dailyLogs
        };
      });
    } catch (err) {
      console.error('Failed to get dialogue reply:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Publish SNS Post using Conversational AI
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snsInput.trim() || isPostingSns) return;

    setIsPostingSns(true);
    const text = snsInput.trim();
    setSnsInput('');

    try {
      const analysis = await getAISNSPostResult(text, gameState);

      onUpdateGameState(prev => {
        let updatedPlayer = { ...prev.player };
        let dailyLogs = [...prev.dailyLogs];

        if (analysis.coachTrustDelta) {
          updatedPlayer.coachTrust = Math.max(0, Math.min(100, updatedPlayer.coachTrust + analysis.coachTrustDelta));
        }
        if (analysis.fansDelta > 0) {
          updatedPlayer.fans += analysis.fansDelta;
        }
        if (analysis.followersDelta > 0) {
          updatedPlayer.snsFollowers += analysis.followersDelta;
        }
        if (analysis.worldReactionLog) {
          dailyLogs.unshift({
            date: prev.currentDate,
            text: analysis.worldReactionLog,
            type: 'event'
          });
        }

        return {
          ...prev,
          player: updatedPlayer,
          snsPosts: [analysis.post, ...prev.snsPosts],
          dailyLogs
        };
      });
    } catch (err) {
      console.error('Failed to publish AI SNS post:', err);
    } finally {
      setIsPostingSns(false);
    }
  };

  const totalUnread = gameState.contacts.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4">
      {/* Smartphone Bezel Body */}
      <div className="bg-slate-900 border-4 border-slate-700 rounded-3xl w-full max-w-md h-[90vh] max-h-[780px] flex flex-col shadow-2xl overflow-hidden text-white relative">
        {/* Top Speaker & Camera Notch */}
        <div className="bg-slate-950 py-2 px-6 flex items-center justify-between border-b border-slate-800 text-[11px] text-slate-400 select-none">
          <span className="font-semibold text-slate-300">FootPhone OS</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto" />
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smartphone Navigation Tabs */}
        <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('sns')}
            className={`py-3 flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
              activeTab === 'sns'
                ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Footter (SNS)</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 flex items-center justify-center gap-1.5 font-bold relative transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>トーク</span>
            {totalUnread > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold">
                {totalUnread}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
              activeTab === 'contacts'
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-950/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>連絡先</span>
          </button>
        </div>

        {/* Tab 1: SNS ("Footter") */}
        {activeTab === 'sns' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            {/* User Profile Header in SNS */}
            <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                  {gameState.player.name.slice(0, 1)}
                </div>
                <div>
                  <div className="font-bold text-slate-200">{gameState.player.name}</div>
                  <div className="text-[10px] text-slate-400">{gameState.player.snsHandle}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold text-sky-400">
                  {gameState.player.snsFollowers} <span className="text-slate-400 font-normal">フォロワー</span>
                </div>
                <div className="text-[10px] text-pink-400">
                  {gameState.player.fans} <span className="text-slate-500 font-normal">本物ファン</span>
                </div>
              </div>
            </div>

            {/* Create Free-text Post Form */}
            <form onSubmit={handlePublishPost} className="p-3 border-b border-slate-800 bg-slate-900/90">
              <textarea
                value={snsInput}
                onChange={(e) => setSnsInput(e.target.value)}
                placeholder="いまどうしてる？（自由に入力して投稿。監督への感謝や不満、移籍願望なども世間に波紋を広げます）"
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-[10px] text-slate-500">
                  ※投稿内容は監督やファン、メディアに認識されます
                </div>
                <button
                  type="submit"
                  disabled={!snsInput.trim() || isPostingSns}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  {isPostingSns ? 'AI世論分析中...' : '投稿する'}
                </button>
              </div>
            </form>

            {/* SNS Timeline Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {gameState.snsPosts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">まだ投稿がありません。</div>
              ) : (
                gameState.snsPosts.map((post) => (
                  <div key={post.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          post.authorRole === 'player'
                            ? 'bg-emerald-600 text-white'
                            : post.authorRole === 'media'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {post.authorName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{post.authorName}</div>
                          <div className="text-[10px] text-slate-500">{post.authorHandle} • {post.timestamp}</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    <div className="flex items-center gap-4 pt-1 text-slate-400 text-[11px] border-t border-slate-800/60">
                      <span className="flex items-center gap-1 text-pink-400/90">
                        <Heart className="w-3 h-3 fill-pink-400/40" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post.comments.length}
                      </span>
                    </div>

                    {/* Comments List */}
                    {post.comments.length > 0 && (
                      <div className="space-y-1.5 pl-3 border-l-2 border-slate-800 mt-2">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="text-[11px] bg-slate-900/60 p-2 rounded-lg">
                            <span className="font-bold text-slate-300 mr-1.5">{comment.authorName}</span>
                            <span className="text-slate-300">{comment.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Chat & Messages */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            {/* Top Contact Selector Bar */}
            <div className="p-2 bg-slate-950 border-b border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
              {gameState.contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectPerson(contact.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                    selectedPersonId === contact.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{contact.name}</span>
                  {contact.unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {selectedPerson ? (
              <>
                {/* Active Person Header */}
                <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{selectedPerson.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                        {selectedPerson.role === 'coach' ? '監督' : selectedPerson.relationship}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      好感度: {selectedPerson.affinity}/100 • 信頼度: {selectedPerson.trust}/100
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 font-medium">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      <span>会話AI連携中</span>
                    </div>
                    {selectedPerson.role === 'coach' && (
                      <div className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                        直訴・相談受付中
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950/30">
                  {selectedPerson.chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'player' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          msg.sender === 'player'
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))}

                  {/* AI Typing indicator bubble */}
                  {isAiThinking && (
                    <div className="flex flex-col items-start">
                      <div className="bg-slate-800 text-slate-300 border border-slate-700/80 rounded-2xl rounded-bl-none px-3.5 py-2 text-xs flex items-center gap-2">
                        <span className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="text-[10px] text-slate-400">{selectedPerson.name}が返信を考え中...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Free-text Chat Input */}
                <div className="bg-slate-950 border-t border-slate-800">
                  {/* Quick suggestion prompt chips */}
                  <div className="px-2.5 pt-2 pb-1 flex gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      'よろしくお願いします！',
                      '今日の試合見てた？',
                      '明日の練習って何時から？',
                      selectedPerson.role === 'coach' ? '最近試合に出られなくて悔しいです' : '放課後遊ぼうぜ！',
                      selectedPerson.role === 'coach' ? '次の試合スタメンで出たいです' : 'テスト勉強進んでる？',
                      selectedPerson.role === 'coach' ? '移籍したいです' : 'このクラブが大好きです！'
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        disabled={isAiThinking}
                        onClick={() => setChatInput(chip)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700/60 whitespace-nowrap transition cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-2.5 pt-1.5 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      disabled={isAiThinking}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={
                        isAiThinking
                          ? 'AIが返信を生成中...'
                          : selectedPerson.role === 'coach'
                          ? '例: よろしくお願いします / 試合見てた？ / 練習何時から？ / 出たいです / 移籍したい'
                          : `${selectedPerson.name}へメッセージを入力（例: よろしく！ / 試合見てた？ / 練習何時？）`
                      }
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isAiThinking}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                連絡先を選択してください
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Contacts Directory */}
        {activeTab === 'contacts' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-900">
            <div className="text-xs font-bold text-slate-400 px-1">登録されている人物一覧（全 {gameState.contacts.length} 名）</div>
            {gameState.contacts.map((person) => (
              <div
                key={person.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                      {person.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{person.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400">
                          {person.role === 'coach' ? '監督' : person.relationship}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{person.schoolOrClub} • {person.age}歳</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSelectPerson(person.id);
                      setActiveTab('chat');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    トーク
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div>好感度: <span className="text-pink-400 font-bold">{person.affinity}</span>/100</div>
                  <div>信頼度: <span className="text-sky-400 font-bold">{person.trust}</span>/100</div>
                  <div className="col-span-2 text-[10px] text-slate-400">
                    性格: {person.personality} • 趣味: {person.hobbies.join(', ')}
                  </div>
                  {person.memories.length > 0 && (
                    <div className="col-span-2 text-[10px] text-amber-300/80 truncate">
                      記憶: {person.memories[0]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
