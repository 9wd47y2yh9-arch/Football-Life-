import React, { useState, useEffect } from 'react';
import { GameState, Position, Gender } from './types/footballLife';
import { loadGameState, saveGameState, clearGameState, createNewGame } from './services/storage';
import { advanceToNextDay } from './services/gameEngine';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { TrainingView } from './components/TrainingView';
import { LeagueStandingsView } from './components/LeagueStandingsView';
import { TransferView } from './components/TransferView';
import { RelationshipsView } from './components/RelationshipsView';
import { SchoolView } from './components/SchoolView';
import { CareerTimelineView } from './components/CareerTimelineView';
import { SmartphoneModal } from './components/SmartphoneModal';
import { MatchModal } from './components/MatchModal';
import { NewGameModal } from './components/NewGameModal';
import { SettingsModal } from './components/SettingsModal';
import { EventModal } from './components/EventModal';
import { Home, Dumbbell, Trophy, ArrowRightLeft, Users, BookOpen, Clock } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'training' | 'league' | 'transfer' | 'relationships' | 'school' | 'career'>('home');
  const [isSmartphoneOpen, setIsSmartphoneOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isProcessingNextDay, setIsProcessingNextDay] = useState(false);

  // Initialize Game State on mount
  useEffect(() => {
    const saved = loadGameState();
    if (saved) {
      setGameState(saved);
    }
  }, []);

  // Save State on changes
  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  // Handle New Game Creation
  const handleStartNewGame = (config: {
    name: string;
    gender: Gender;
    nationality: string;
    dualNationality?: string;
    birthplace: string;
    startingCountry: string;
    initialPosition: Position;
    playstyle: any;
    initialTeamIndex: number;
  }) => {
    const newGame = createNewGame(config);
    setGameState(newGame);
    saveGameState(newGame);
  };

  // Handle Next Day
  const handleNextDay = () => {
    if (!gameState || isProcessingNextDay || gameState.isRetired) return;

    setIsProcessingNextDay(true);
    setTimeout(() => {
      setGameState(prev => {
        if (!prev) return null;
        const nextState = advanceToNextDay(prev);
        // If today is a matchday, auto-notify
        if (nextState.activeMatch) {
          setIsMatchModalOpen(true);
        }
        return nextState;
      });
      setIsProcessingNextDay(false);
    }, 280);
  };

  // Handle Reset Game
  const handleResetGame = () => {
    clearGameState();
    setGameState(null);
    setIsSettingsOpen(false);
    setIsSmartphoneOpen(false);
    setIsMatchModalOpen(false);
  };

  // Open Chat from Relationships View
  const handleOpenChatWithPerson = (personId: string) => {
    if (!gameState) return;
    setGameState(prev => prev ? { ...prev, activeChatPersonId: personId } : null);
    setIsSmartphoneOpen(true);
  };

  // Resolve Pending Event
  const handleResolveEvent = (actionType: string, payload?: any) => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev) return null;
      let updatedPlayer = { ...prev.player };
      let updatedTimeline = [...prev.timeline];
      let dailyLogs = [...prev.dailyLogs];

      if (actionType === 'choose_nation' && payload) {
        updatedPlayer.selectedNationalTeam = payload;
        updatedTimeline.unshift({
          id: `tl_national_choice_${Date.now()}`,
          age: updatedPlayer.age,
          date: prev.currentDate,
          title: `代表国籍の決定（${payload}代表）`,
          description: `二重国籍の中から、将来のフットボール人生を捧げる国として『${payload}代表』を選択した。`,
          type: 'milestone'
        });
        dailyLogs.unshift({
          date: prev.currentDate,
          text: `【代表国籍決定】${payload}代表として国際舞台で戦うことを正式に宣言しました。`,
          type: 'event'
        });
      } else if (actionType === 'school_choice' && payload) {
        updatedPlayer.academicScore = Math.min(100, updatedPlayer.academicScore + (payload.academicDelta || 0));
        updatedPlayer.fatigue = Math.min(100, updatedPlayer.fatigue + (payload.fatigueDelta || 0));
        dailyLogs.unshift({
          date: prev.currentDate,
          text: payload.outcomeText,
          type: 'event'
        });
      }

      // Remove the first pending event
      const remainingEvents = prev.pendingEvents.slice(1);

      return {
        ...prev,
        player: updatedPlayer,
        timeline: updatedTimeline,
        dailyLogs,
        pendingEvents: remainingEvents
      };
    });
  };

  // If no game state exists, show New Game Creation Screen
  if (!gameState) {
    return <NewGameModal onStartGame={handleStartNewGame} />;
  }

  // Active pending event (e.g. Dual Nationality choice or School event)
  const currentPendingEvent = gameState.pendingEvents[0];

  // Active fixture for match modal
  const activeFixture = gameState.activeMatch || gameState.leagueFixtures.find(f => !f.played) || gameState.leagueFixtures[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Persistent Header */}
      <Header
        gameState={gameState}
        onNextDay={handleNextDay}
        onOpenSmartphone={() => setIsSmartphoneOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isProcessingNextDay={isProcessingNextDay}
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-5">
        {/* Navigation Bar */}
        <nav className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar shadow-sm">
          {[
            { id: 'home', label: 'ホーム', icon: Home },
            { id: 'training', label: '練習・能力', icon: Dumbbell },
            { id: 'league', label: 'リーグ戦', icon: Trophy },
            { id: 'transfer', label: '移籍市場', icon: ArrowRightLeft },
            { id: 'relationships', label: '人間関係', icon: Users },
            { id: 'school', label: '学校生活', icon: BookOpen },
            { id: 'career', label: 'キャリア年表', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* View Routing */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <HomeDashboard
              gameState={gameState}
              onUpdateGameState={setGameState}
              onOpenMatchModal={() => setIsMatchModalOpen(true)}
              onOpenSmartphone={() => setIsSmartphoneOpen(true)}
            />
          )}

          {activeTab === 'training' && (
            <TrainingView
              gameState={gameState}
              onUpdateGameState={setGameState}
            />
          )}

          {activeTab === 'league' && (
            <LeagueStandingsView
              gameState={gameState}
              onOpenMatchModal={() => setIsMatchModalOpen(true)}
            />
          )}

          {activeTab === 'transfer' && (
            <TransferView
              gameState={gameState}
              onUpdateGameState={setGameState}
            />
          )}

          {activeTab === 'relationships' && (
            <RelationshipsView
              gameState={gameState}
              onUpdateGameState={setGameState}
              onOpenChatWithPerson={handleOpenChatWithPerson}
            />
          )}

          {activeTab === 'school' && (
            <SchoolView
              gameState={gameState}
              onUpdateGameState={setGameState}
            />
          )}

          {activeTab === 'career' && (
            <CareerTimelineView
              gameState={gameState}
              onUpdateGameState={setGameState}
            />
          )}
        </main>
      </div>

      {/* Smartphone Modal (Footter SNS, Chat & Contacts) */}
      {isSmartphoneOpen && (
        <SmartphoneModal
          gameState={gameState}
          onClose={() => setIsSmartphoneOpen(false)}
          onUpdateGameState={setGameState}
        />
      )}

      {/* Match Modal */}
      {isMatchModalOpen && activeFixture && (
        <MatchModal
          gameState={gameState}
          fixture={activeFixture}
          onFinishMatch={(updated) => {
            setGameState(updated);
            setIsMatchModalOpen(false);
          }}
          onClose={() => setIsMatchModalOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onResetGame={handleResetGame}
        />
      )}

      {/* Pending Event Modal */}
      {currentPendingEvent && (
        <EventModal
          event={currentPendingEvent}
          onResolve={handleResolveEvent}
        />
      )}
    </div>
  );
}
