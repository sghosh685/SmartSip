import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Flame, Activity, Clock,
  MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown,
  Home, BarChart2, Settings, Plus, Sparkles, Edit2, Check,
  Wifi, WifiOff, Moon, Sun, User, Droplets, Target, Volume2, Trash2, X,
  Circle, Sprout, Leaf, Flower, Grid, Zap, Award, Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DRINK_TYPES, getDrinkById, getCommonDrinks, getAllDrinks } from './constants/drinkTypes';
import { calculateDailyTarget, GOAL_FACTORS, getAllFactors } from './utils/goalCalculator';
import { BADGES, getAllBadges, checkBadges, getBadgeById } from './constants/badges';
import { useSmartNotifications } from './hooks/useSmartNotifications';
import { useAuth } from './hooks/useAuth'; // NEW: Supabase Auth Hook

// --- CONFIGURATION ---
const API_URL = import.meta.env.VITE_API_URL || "/api";
const FALLBACK_USER_ID = "guest-local-user"; // Fallback for when Supabase is not configured

// --- SHARED UTILS ---

// Mock AI Logic (Fallback if backend is offline)
const getMockAiFeedback = (current, goal) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (current < 500) resolve("🌵 (Offline Mode) You are basically a cactus. Drink water! 🥤");
      else if (current < 1500) resolve("📉 (Offline Mode) Decent start, but don't slack off. 👀");
      else if (current < goal) resolve("🚀 (Offline Mode) Almost there! Keep going! 💧");
      else resolve("🌊 (Offline Mode) You are a Hydration God! 🔱");
    }, 1000);
  });
};

// Helper: Get local date as YYYY-MM-DD string (avoids UTC timezone issues)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- COMPONENTS ---

const BottomNav = ({ activeTab, setActiveTab, onQuickAdd, isDarkMode }) => (
  <div className={`absolute bottom-0 w-full px-6 py-4 grid grid-cols-3 items-end pb-8 z-50 rounded-t-3xl transition-all duration-300 ${isDarkMode
    ? 'bg-gray-900/90 backdrop-blur-lg border-t border-gray-800 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]'
    : 'bg-white/80 backdrop-blur-lg border-t border-white/50 shadow-[0_-5px_30px_rgba(59,130,246,0.15)]'
    }`}>
    <div className="flex justify-start pl-4">
      <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-cyan-500' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
        <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Home</span>
      </button>
    </div>

    <div className="relative -top-10 flex justify-center group pointer-events-none">
      <div className={`absolute inset-0 rounded-full bg-cyan-400 blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse w-16 h-16 mx-auto`}></div>
      <button
        onClick={onQuickAdd}
        className="relative w-16 h-16 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 border-4 border-white/20 hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto"
      >
        <Plus size={32} className="text-white drop-shadow-md" strokeWidth={3} />
      </button>
    </div>

    <div className="flex justify-end pr-4">
      <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-cyan-500' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
        <BarChart2 size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Stats</span>
      </button>
    </div>
  </div>
);

// --- THEME ENGINE COMPONENTS ---

// 1. BASE "SIMPLE" VISUALIZER
const SimpleVisualizer = ({ totalWater, goal, percentage, isDarkMode, showAddAnimation, lastAddedAmount }) => {
  const circumference = 2 * Math.PI * 110;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-64 h-64 flex items-center justify-center my-4">
      <div className={`absolute inset-0 rounded-full border-4 opacity-0 animate-water-pulse ${isDarkMode ? 'border-blue-500/30' : 'border-blue-400/40'}`}></div>
      <div className={`absolute inset-0 rounded-full border-4 opacity-0 animate-water-pulse ${isDarkMode ? 'border-blue-500/20' : 'border-blue-400/30'}`} style={{ animationDelay: '1.5s' }}></div>
      <svg className="w-full h-full transform -rotate-90 relative z-10">
        {/* Simple flat background ring */}
        <circle cx="128" cy="128" r="110" stroke={isDarkMode ? '#374151' : '#E5E7EB'} strokeWidth="12" fill="transparent" />
        {/* Simple flat progress ring (Solid Blue) */}
        <circle cx="128" cy="128" r="110" stroke="#3B82F6" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalWater}</span>
        <span className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/ {goal}ml</span>
      </div>
      {showAddAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span className="text-4xl font-bold text-blue-500 animate-pulse">+{lastAddedAmount}</span>
        </div>
      )}
    </div>
  );
};

// 2. LIQUID GLASS VISUALIZER (Refined Beaker Style)
const GlassVisualizer = ({ totalWater, goal, percentage, isDarkMode, showAddAnimation, lastAddedAmount }) => {
  // Clamp for visual height
  const fillPct = Math.min(percentage, 100);

  return (
    <div className="relative w-full h-80 flex flex-col items-center justify-center my-4">
      {/* The Glass Container */}
      <div className={`relative w-48 h-64 rounded-b-[3rem] border-x-4 border-b-4 border-t-0 ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-white bg-blue-50/10'} backdrop-blur-sm overflow-hidden shadow-xl transition-all duration-500`}>

        {/* Measurement Lines (Ticks) */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-50">
          <div className="absolute top-[25%] right-0 w-3 h-0.5 bg-current opacity-40"></div>
          <div className="absolute top-[50%] right-0 w-4 h-0.5 bg-current opacity-60"></div>
          <div className="absolute top-[75%] right-0 w-3 h-0.5 bg-current opacity-40"></div>
          {/* Dashed lines across */}
          <div className={`absolute top-[25%] left-4 right-4 h-px border-t border-dashed ${isDarkMode ? 'border-gray-600' : 'border-indigo-200'}`}></div>
          <div className={`absolute top-[50%] left-4 right-4 h-px border-t border-dashed ${isDarkMode ? 'border-gray-600' : 'border-indigo-300'}`}></div>
          <div className={`absolute top-[75%] left-4 right-4 h-px border-t border-dashed ${isDarkMode ? 'border-gray-600' : 'border-indigo-200'}`}></div>
        </div>

        {/* --- LIQUID LAYERS --- */}
        <div className="absolute bottom-0 w-full transition-all duration-1000 ease-out" style={{ height: `${fillPct}%` }}>
          {/* Back Wave */}
          <div className="absolute -top-4 w-[200%] h-8 flex animate-wave-flow-reverse opacity-40">
            <svg className={`w-1/2 h-full ${isDarkMode ? 'text-blue-500' : 'text-blue-400'} fill-current`} viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
            </svg>
            <svg className={`w-1/2 h-full ${isDarkMode ? 'text-blue-500' : 'text-blue-400'} fill-current`} viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
            </svg>
          </div>

          {/* Front Wave */}
          <div className="absolute -top-4 w-[200%] h-8 flex animate-wave-flow">
            <svg className={`w-1/2 h-full ${isDarkMode ? 'text-blue-600' : 'text-blue-500'} fill-current`} viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
            <svg className={`w-1/2 h-full ${isDarkMode ? 'text-blue-600' : 'text-blue-500'} fill-current`} viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
          </div>

          {/* Main Liquid Body */}
          <div className={`w-full h-full bg-gradient-to-b ${isDarkMode ? 'from-blue-600 to-blue-800' : 'from-blue-500 to-blue-400'}`}>
            {/* Bubbles */}
            <div className="absolute bottom-4 left-4 w-2 h-2 bg-white/20 rounded-full animate-bubble-rise" style={{ animationDelay: '0s' }}></div>
            <div className="absolute bottom-12 right-8 w-3 h-3 bg-white/10 rounded-full animate-bubble-rise" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute bottom-8 left-1/2 w-1.5 h-1.5 bg-white/30 rounded-full animate-bubble-rise" style={{ animationDelay: '3s' }}></div>
          </div>
        </div>

        {/* Percentage Text (Centered inside glass) */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className={`text-4xl font-black drop-shadow-md ${fillPct > 45 ? 'text-white/90' : (isDarkMode ? 'text-white' : 'text-blue-900')}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Stats Below Glass */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{totalWater}</span>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ml</span>
        </div>
        <div className={`text-xs uppercase tracking-wider font-bold mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
          of {goal} ml goal
        </div>
      </div>

      {showAddAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <span className="text-5xl font-black text-blue-500 animate-float-up drop-shadow-lg">+{lastAddedAmount}</span>
        </div>
      )}
    </div>
  );
};

// 2. ZEN GARDEN VISUALIZER (The "Nurturer" Theme)
const GardenVisualizer = ({ totalWater, goal, percentage, isDarkMode, showAddAnimation, lastAddedAmount }) => {
  // Determine Growth Stage based on percentage
  const getGrowthStage = (pct) => {
    if (pct < 10) return { icon: Circle, color: 'text-amber-700', scale: 0.5, label: 'Seed' }; // 0-9%
    if (pct < 30) return { icon: Sprout, color: 'text-green-400', scale: 0.7, label: 'Sprout' }; // 10-29%
    if (pct < 60) return { icon: Leaf, color: 'text-green-500', scale: 0.9, label: 'Sapling' }; // 30-59%
    if (pct < 90) return { icon: Leaf, color: 'text-emerald-500', scale: 1.1, label: 'Tree' }; // 60-89% (Would use Tree icon if avail, reusing Leaf for now with larger scale)
    return { icon: Flower, color: 'text-pink-500', scale: 1.3, label: 'Bloom' }; // 90-100%
  };

  const stage = getGrowthStage(percentage);
  const StageIcon = stage.icon;

  return (
    <div className="relative w-full h-80 flex flex-col items-center justify-center my-4">
      {/* Garden Background Circle */}
      <div className={`relative w-56 h-56 rounded-full border-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-emerald-100 bg-emerald-50'} shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0`}>

        {/* Sky/Sun effect */}
        <div className={`absolute top-0 w-full h-1/2 ${isDarkMode ? 'bg-slate-800' : 'bg-blue-50'} opacity-50`}></div>
        {percentage >= 50 && <div className="absolute top-8 right-8 text-yellow-400 animate-pulse"><Sun size={32} /></div>}

        {/* The Plant: Anchored to bottom, growing upwards */}
        <div
          className={`absolute bottom-[28%] left-1/2 -translate-x-1/2 z-10 transition-all duration-1000 ease-out origin-bottom ${showAddAnimation ? 'scale-110' : ''}`}
          style={{ transform: `translateX(-50%)` }}
        >
          <div className="origin-bottom animate-sway" style={{ transform: `scale(${stage.scale})` }}>
            <StageIcon size={80} className={`${stage.color} drop-shadow-md`} strokeWidth={1.5} />
          </div>
        </div>

        {/* Soil/Ground */}
        <div className={`absolute bottom-0 w-full h-1/3 ${isDarkMode ? 'bg-stone-800' : 'bg-stone-200'}`}></div>

        {/* Percentage Overlay inside circle */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2">
          <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{percentage.toFixed(0)}%</span>
        </div>
      </div>

      {/* Stats Section - Flow Layout (No Absolute) */}
      <div className="mt-6 flex flex-col items-center">
        <span className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{stage.label} Stage</span>

        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{totalWater}</span>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ml</span>
        </div>
        <div className={`text-xs uppercase tracking-wider font-bold mt-1 ${isDarkMode ? 'text-emerald-400/60' : 'text-emerald-500/60'}`}>
          of {goal} ml goal
        </div>
      </div>

      {showAddAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="absolute -top-10"><Droplets className="text-blue-400 animate-bounce" size={32} /></div>
          <span className="text-3xl font-black text-blue-500 animate-float-up drop-shadow-lg">+{lastAddedAmount}ml</span>
        </div>
      )}
    </div>
  );
};

// 3. THEME CONTROLLER (The Switcher)
const HydrationVisualizer = ({ theme, ...props }) => {
  if (theme === 'garden') return <GardenVisualizer {...props} />;
  if (theme === 'base') return <SimpleVisualizer {...props} />;
  return <GlassVisualizer {...props} />;
};

// 4. LOGIN MODAL (NEW: Auth UI)
const LoginModal = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 text-2xl">
            ☁️
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sync Your Streak</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Don't lose your hydration history. Create a secure account to back up your data across devices.
          </p>

          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-95 text-sm font-semibold mb-4"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>

          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
          >
            Continue as Guest (Unsafe)
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SCREEN 1: HOME (HYDRATION HUB) ---


const HomeScreen = ({
  totalWater,
  goal,
  baseGoal,
  setGoal,
  goalData,
  drinkAmount,
  setDrinkAmount,
  onAddWater,
  aiMessage,
  loadingAi,
  triggerAi,
  isBackendConnected,
  userName,
  selectedDate,
  onSelectDate,
  isDarkMode,
  todayLogs,
  onDeleteLog,
  quickAddPresets,

  statsData,
  theme,
  streak, // Accept streak prop
  onSettingsClick, // Prop to trigger navigation to Settings
  historicalGoal, // NEW: Prop for historical accuracy
  userContext, // NEW: Auth State
  onCloudSync // NEW: Trigger Auth Modal
}) => {
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const isViewingToday = selectedDate === todayStr;

  // CRITICAL: Use effectiveGoal for TODAY only, historicalGoal (snapshot) for past dates
  // Fallback to baseGoal only if no history exists.
  const displayGoal = isViewingToday ? goal : (historicalGoal || baseGoal);

  const percentage = Math.min((totalWater / displayGoal) * 100, 100);
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (percentage / 100) * circumference;
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAnimation, setShowAddAnimation] = useState(false);
  const [lastAddedAmount, setLastAddedAmount] = useState(0);

  // Intelligent Hydration: Drink Type State
  const [selectedDrinkType, setSelectedDrinkType] = useState(DRINK_TYPES.WATER);
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [smartTip, setSmartTip] = useState(null);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️ Good Morning';
    if (hour < 17) return '🌤️ Good Afternoon';
    return '🌙 Good Evening';
  };

  // Motivational taglines
  const getMotivation = () => {
    if (percentage >= 100) return '🎉 Goal crushed! You\'re a hydration hero!';
    if (percentage >= 75) return '💪 Almost there! Keep it up!';
    if (percentage >= 50) return '✨ Halfway to your goal!';
    return '💧 Let\'s get hydrated today!';
  };

  // Prepare chart data safely
  const weekData = statsData?.daily?.slice(0, 7).reverse() || [];
  const maxVal = Math.max(...(weekData.map(d => d.total) || [0]), goal);

  return (
    <div className="px-6 pb-32 pt-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header - Full Width */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-full overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="User" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getGreeting()}</p>
              {isBackendConnected ?
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold ${isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}><Wifi size={10} /> Online</span> :
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}><WifiOff size={10} /> Offline</span>
              }
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{userName}</h2>
            <p className={`text-xs ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{getMotivation()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Cloud Sync Button (NEW) */}
          <button
            onClick={onCloudSync}
            className={`p-3 rounded-full shadow-sm border transition-colors relative ${userContext.isGuest
              ? 'bg-amber-50 border-amber-100 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-700/50 dark:text-amber-500'
              : 'bg-green-50 border-green-100 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:border-green-700/50 dark:text-green-500'
              }`}
          >
            {userContext.isGuest ? (
              <>
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse ring-2 ring-white dark:ring-gray-900"></span>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3h-11c-1.7 0-3 1.3-3 3v2h17v-2Z" /><path d="M11 11.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5Z" /><path d="M12.5 16a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z" /></svg>
              </>
            ) : (
              <Check size={22} />
            )}
          </button>

          {/* Settings Button (Moved from Bottom Nav) */}
          <button
            onClick={onSettingsClick}
            className={`p-3 rounded-full shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
          >
            <Settings size={22} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>

          <button className={`p-3 rounded-full shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
            <Bell size={22} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: ACTION CENTRE */}
        <div className="space-y-6">

          {/* Main Glass Card */}
          <div className={`p-8 rounded-[40px] shadow-sm relative overflow-hidden transition-all duration-300 group ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-bl-full -mr-12 -mt-12 z-0 opacity-50 ${isDarkMode ? 'bg-gray-800' : 'bg-indigo-50'}`}></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-4">
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Daily Target</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedDate === todayStr ? `Today, ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}` : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                  {isEditing ? <Check size={18} className="text-green-500" /> : <Edit2 size={18} />}
                </button>
              </div>

              {/* Context-Aware Goal Bonuses Display - ONLY for TODAY */}
              {isViewingToday && goalData && goalData.bonuses.length > 0 && (
                <div className={`w-full mb-4 p-3 rounded-2xl flex flex-wrap items-center gap-2 ${isDarkMode ? 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-700/30' : 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100'
                  }`}>
                  <Zap size={16} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>Smart Goal:</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{baseGoal}ml</span>
                  {goalData.bonuses.map((bonus, i) => (
                    <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-700'}`}>
                      {bonus.icon} +{bonus.bonus}ml
                    </span>
                  ))}
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>= {goal}ml</span>
                </div>
              )}

              {/* Historical Date Notice */}
              {!isViewingToday && (
                <div className={`w-full mb-4 p-3 rounded-2xl flex items-center gap-2 ${isDarkMode ? 'bg-gray-800/50 border border-gray-700/30' : 'bg-gray-50 border border-gray-200'}`}>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    📅 Viewing historical data • Goal: {displayGoal}ml
                  </span>
                </div>
              )}

              {/* Editing Mode */}

              {isEditing ? (
                <div className="mb-4 space-y-4 w-full animate-in fade-in slide-in-from-top-4 bg-gray-50/5 p-4 rounded-2xl">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Base Goal Amount</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={baseGoal} onChange={(e) => setGoal(Number(e.target.value))} className={`w-full p-2 rounded-lg border focus:outline-none font-bold text-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`} />
                      <span className="text-sm text-gray-500">ml</span>
                    </div>
                    {goalData && goalData.totalBonus > 0 && (
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        + {goalData.totalBonus}ml from conditions = {goal}ml today
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* THEME ENGINE: DYNAMIC VISUALIZER */
                <HydrationVisualizer
                  theme={theme}
                  totalWater={totalWater}
                  goal={displayGoal}
                  percentage={percentage}
                  isDarkMode={isDarkMode}
                  showAddAnimation={showAddAnimation}
                  lastAddedAmount={lastAddedAmount}
                />
              )}
            </div>
          </div>

          {/* Smart Tip Toast (for non-water drinks) */}
          {smartTip && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
              <div className={`px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 border ${isDarkMode ? 'bg-gray-800/95 border-gray-700 text-white' : 'bg-white/95 border-gray-100 text-gray-800'
                } backdrop-blur-md`}>
                <span className="text-2xl">{smartTip.icon}</span>
                <div>
                  <p className="text-sm font-bold">{smartTip.title}</p>
                  <p className="text-xs opacity-70">{smartTip.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* INTELLIGENT HYDRATION: Drink Type Selector */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <div>
                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Log Drink</h3>
                <p className={`text-xs ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  {selectedDrinkType.name} • {Math.round(selectedDrinkType.multiplier * 100)}% hydration
                </p>
              </div>
              <span className="text-xs text-gray-400">Select type & amount</span>
            </div>

            {/* Coach Tip Banner (for non-water drinks) */}
            {selectedDrinkType.coachTip && (
              <div className={`px-4 py-3 rounded-2xl flex items-start gap-3 ${isDarkMode ? 'bg-indigo-900/30 border border-indigo-700/50' : 'bg-indigo-50 border border-indigo-100'
                }`}>
                <span className="text-lg">💡</span>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                  {selectedDrinkType.coachTip}
                </p>
              </div>
            )}

            {/* STEP 1: Drink Type Ribbon (Speed Mode) */}
            <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-hide">
              {getCommonDrinks().map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedDrinkType(type)}
                  className={`flex flex-col items-center min-w-[70px] p-3 rounded-2xl transition-all duration-300 ${selectedDrinkType.id === type.id
                    ? 'ring-2 shadow-lg scale-105'
                    : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  style={{
                    background: selectedDrinkType.id === type.id
                      ? `${type.color}20`
                      : isDarkMode ? 'rgba(30,30,40,0.5)' : 'rgba(255,255,255,0.8)',
                    borderColor: selectedDrinkType.id === type.id ? type.color : 'transparent',
                    boxShadow: selectedDrinkType.id === type.id ? `0 4px 20px ${type.color}30` : 'none',
                    ringColor: type.color
                  }}
                >
                  <span className="text-2xl mb-1">{type.icon}</span>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{type.name}</span>
                </button>
              ))}

              {/* "More" Button for Premium Modal */}
              <button
                onClick={() => setShowDrinkModal(true)}
                className={`flex flex-col items-center min-w-[70px] p-3 rounded-2xl transition-all border-2 border-dashed ${isDarkMode
                  ? 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
                  }`}
              >
                <Grid size={24} className="mb-1" />
                <span className="text-xs font-medium">More</span>
              </button>
            </div>

            {/* STEP 2: Amount Buttons (Apply Smart Logic) */}
            <div className="grid grid-cols-4 gap-3">
              {quickAddPresets && quickAddPresets.map((preset) => {
                const netHydration = Math.floor(preset.amount * selectedDrinkType.multiplier);
                const isReduced = selectedDrinkType.multiplier < 1;
                const isNegative = selectedDrinkType.multiplier < 0;

                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setLastAddedAmount(netHydration);
                      setShowAddAnimation(true);
                      onAddWater(netHydration, selectedDrinkType); // Pass type for logging

                      // Show Smart Tip for non-water drinks
                      if (selectedDrinkType.id !== 'water') {
                        setSmartTip({
                          icon: selectedDrinkType.icon,
                          title: isNegative ? 'Hydration Alert!' : 'Smart Logging',
                          message: isNegative
                            ? `${preset.amount}ml ${selectedDrinkType.name} = ${netHydration}ml (dehydrating)`
                            : `${preset.amount}ml ${selectedDrinkType.name} = ${netHydration}ml net hydration`
                        });
                        setTimeout(() => setSmartTip(null), 3000);
                      }

                      setTimeout(() => setShowAddAnimation(false), 1500);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 py-4 rounded-2xl transition-all active:scale-95 hover:scale-[1.05] hover:-translate-y-1 shadow-sm relative overflow-hidden ${isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-750 text-white border border-gray-700'
                      : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-100'
                      }`}
                  >
                    <span className="text-3xl filter drop-shadow-sm">{selectedDrinkType.icon}</span>
                    <span className="text-sm font-bold">{preset.amount}ml</span>
                    {isReduced && (
                      <span className={`text-[10px] font-bold ${isNegative ? 'text-red-500' : 'text-amber-500'}`}>
                        = {netHydration}ml
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREMIUM DRINK MODAL */}
          {showDrinkModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div
                className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDarkMode
                  ? 'bg-gray-900/95 border-gray-700'
                  : 'bg-white/95 border-gray-100'
                  } backdrop-blur-xl animate-in zoom-in-95 duration-200`}
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select Drink Type</h3>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Different drinks affect hydration differently</p>
                  </div>
                  <button
                    onClick={() => setShowDrinkModal(false)}
                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* The Grid of All Drinks */}
                <div className="grid grid-cols-3 gap-4">
                  {getAllDrinks().map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedDrinkType(type);
                        setShowDrinkModal(false);
                      }}
                      className={`flex flex-col items-center p-4 rounded-2xl relative overflow-hidden transition-all duration-300 group ${selectedDrinkType.id === type.id ? 'ring-2 scale-105' : ''
                        }`}
                      style={{
                        background: selectedDrinkType.id === type.id
                          ? `${type.color}30`
                          : isDarkMode ? 'rgba(30,30,40,0.8)' : 'rgba(245,245,250,1)',
                        ringColor: type.color,
                        boxShadow: selectedDrinkType.id === type.id ? `0 4px 20px ${type.color}40` : 'none'
                      }}
                    >
                      <span className="text-4xl mb-2 transition-transform group-hover:scale-110">
                        {type.icon}
                      </span>
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{type.name}</span>

                      {/* Hydration Factor Badge */}
                      <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-bold ${type.multiplier >= 1
                        ? 'bg-green-500/20 text-green-500'
                        : type.multiplier > 0
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-red-500/20 text-red-500'
                        }`}>
                        {type.multiplier > 0 ? '+' : ''}{Math.round(type.multiplier * 100)}%
                      </span>
                    </button>
                  ))}
                </div>

                {/* Educational Footer */}
                <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-blue-50'}`}>
                  <p className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-bold text-cyan-500">💡 Smart Tip:</span>{' '}
                    {selectedDrinkType.description}
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* Date Strip - Clickable with week navigation arrows */}
          <div className={`mb-4 p-5 rounded-[32px] shadow-sm ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {isViewingToday ? 'Today' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}, {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                {!isViewingToday && <span className="text-xs text-indigo-500 ml-2">(past)</span>}
              </h3>
              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate + 'T12:00:00');
                    newDate.setDate(newDate.getDate() - 7);
                    onSelectDate(getLocalDateString(newDate));
                  }}
                  className={`p-2 rounded-full shadow-sm transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <ChevronLeft size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                {/* Today button - only shows when viewing past dates */}
                {!isViewingToday && (
                  <button
                    onClick={() => onSelectDate(todayStr)}
                    className="px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full shadow-sm hover:bg-indigo-600 transition-colors"
                  >
                    Today
                  </button>
                )}
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate + 'T12:00:00');
                    newDate.setDate(newDate.getDate() + 7);
                    const maxDate = new Date();
                    if (newDate <= maxDate) {
                      onSelectDate(getLocalDateString(newDate));
                    }
                  }}
                  disabled={isViewingToday}
                  className={`p-2 rounded-full shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <ChevronRight size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
            </div>
            <div className="flex justify-between gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                // Calculate the week containing the selected date
                const selectedDateObj = new Date(selectedDate + 'T12:00:00');
                const selectedDayOfWeek = selectedDateObj.getDay();
                const weekStart = new Date(selectedDateObj);
                weekStart.setDate(selectedDateObj.getDate() - selectedDayOfWeek + idx);

                const dateStr = getLocalDateString(weekStart);
                const isFutureDate = weekStart > today;
                const isSelected = selectedDate === dateStr;
                const isTodayDate = dateStr === todayStr;

                return (
                  <button
                    key={day}
                    onClick={() => !isFutureDate && onSelectDate(dateStr)}
                    disabled={isFutureDate}
                    className={`flex flex-col items-center justify-center min-w-[3rem] h-16 rounded-[20px] transition-all
                      ${isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-105' :
                        isFutureDate ? (isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300') + ' cursor-not-allowed opacity-50' :
                          isTodayDate ? (isDarkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-600') + ' hover:opacity-80' :
                            isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 cursor-pointer' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 cursor-pointer'}`}
                  >
                    <span className="text-[10px] font-medium mb-0.5">{day}</span>
                    <span className={`text-base font-bold ${isSelected ? 'text-white' : isFutureDate ? (isDarkMode ? 'text-gray-600' : 'text-gray-300') : isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {weekStart.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSIGHTS CENTRE */}
        <div className="space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-5 rounded-[28px] relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-sm group`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Flame size={48} className="text-orange-500" /></div>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Streak</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{streak}</span>
                <span className="text-sm font-bold text-orange-500">Days 🔥</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Personal Best: {Math.max(streak || 0, 5)} days</p>
            </div>

            <div className={`p-5 rounded-[28px] relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-sm group`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><BarChart2 size={48} className="text-indigo-500" /></div>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Weekly Avg</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{Math.round(statsData?.week_avg || 0)}</span>
                <span className="text-sm font-bold text-indigo-500">ml</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Target: {goal}ml / day</p>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className={`p-6 rounded-[32px] shadow-sm ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Last 7 Days</h3>
              <span className={`text-xs px-2 py-1 rounded-lg ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Weekly View</span>
            </div>
            <div className="h-40 flex items-end justify-between gap-2">
              {weekData.length > 0 ? weekData.map((d, i) => {
                const barHeight = Math.min((d.total / maxVal) * 100, 100);
                const isTodayBar = d.date === todayStr;
                const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="relative w-full flex items-end justify-center h-32 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 overflow-hidden">
                      <div
                        className={`w-full mx-1 rounded-t-xl transition-all duration-500 ${isTodayBar ? 'bg-indigo-500' : d.total >= goal ? 'bg-green-400' : 'bg-indigo-300/60'} group-hover:opacity-80`}
                        style={{ height: `${barHeight}%` }}
                      ></div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded pointer-events-none">
                        {d.total}ml
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ${isTodayBar ? 'text-indigo-500' : 'text-gray-400'}`}>{dayLabel.charAt(0)}</span>
                  </div>
                )
              }) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No data yet</div>
              )}
            </div>
          </div>

          {/* Today's Logs */}
          <div className={`p-6 rounded-[32px] shadow-sm ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{selectedDate === todayStr ? 'Today\'s Activity' : `${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Activity`}</h3>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{todayLogs ? todayLogs.length : 0} records</span>
            </div>

            {todayLogs && todayLogs.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {todayLogs.map(log => (
                  <div key={log.id} className={`flex items-center justify-between p-3 rounded-2xl group ${isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                        <Droplets size={18} />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{log.amount}ml</p>
                        <p className="text-[10px] text-gray-400">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-100 text-red-500'}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No water logged yet today.</p>
                <p className="text-xs mt-1">Tap a preset to start!</p>
              </div>
            )}
          </div>

          {/* AI Insight (Compact) */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDarkMode ? 'border-indigo-900/50 bg-indigo-900/10' : 'border-indigo-100 bg-indigo-50/50'}`}>
            <Sparkles size={20} className="text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h4 className={`text-xs font-bold uppercase mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>SmartSip Tip</h4>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {loadingAi ? "Analyzing..." : (aiMessage || "Drink water before meals to support digestion and feel fuller.")}
              </p>
              {!aiMessage && !loadingAi && (
                <button onClick={triggerAi} className="text-[10px] font-bold text-indigo-500 mt-2 hover:underline">Refresh Insight</button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- SCREEN 2: ALARM ---
const AlarmScreen = ({ totalWater, goal, logs }) => {
  const percentage = Math.min((totalWater / goal) * 100, 100);

  // Convert timestamp if it comes from DB (ISO string) or local state
  const formatTime = (timeStr) => {
    try {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return timeStr; }
  };

  return (
    <div className="px-6 pb-32 pt-6 h-full flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <button className="p-2 bg-white rounded-full shadow-sm"><ChevronLeft size={20} /></button>
        <h2 className="text-lg font-bold">Hydration Level</h2>
        <button className="p-2 bg-white rounded-full shadow-sm"><MoreHorizontal size={20} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mb-8">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0 rounded-full border-[12px] border-indigo-50"></div>
          <div className="absolute inset-4 rounded-full bg-white overflow-hidden border-4 border-white shadow-inner flex items-end justify-center">
            <div className="w-full bg-indigo-500 opacity-80 wave-animation transition-all duration-1000 ease-in-out" style={{ height: `${percentage}%` }}></div>
            <div className="absolute w-full bg-indigo-300 opacity-60 wave-animation-delayed transition-all duration-1000 ease-in-out" style={{ height: `${Math.max(0, percentage - 5)}%` }}></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <span className="text-3xl font-bold text-gray-800 drop-shadow-sm">{totalWater}</span>
              <span className="text-lg text-gray-500">/{goal}ml</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h4 className="font-bold text-gray-800 mb-4 sticky top-0 bg-[#F3F6FF] py-2">Today's Records</h4>
        <div className="space-y-3 pb-4">
          {logs.length === 0 && <p className="text-center text-gray-400 text-sm italic">No drinks logged yet today.</p>}
          {[...logs].reverse().map((log, i) => (
            <div key={log.id || i} className="flex items-center p-4 rounded-2xl bg-white shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-lg mr-4">💧</div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">{formatTime(log.time || log.timestamp)}</p>
                <p className="text-xs text-gray-400">Water</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-indigo-600 text-sm">+{log.amount || log.intake_ml} ml</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- SCREEN 3: STATS ---
const StatsScreen = ({ logs, goal, isDarkMode, unlockedBadges = [], userId }) => {
  const [viewMode, setViewMode] = useState('Week');
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [localToast, setLocalToast] = useState(null);

  const showToast = (msg, icon) => {
    setLocalToast({ msg, icon });
    setTimeout(() => setLocalToast(null), 3000);
  };

  // History view state
  const [calendarMonth, setCalendarMonth] = useState(new Date()); // Current viewing month/year
  const [calendarView, setCalendarView] = useState('grid'); // 'grid' or 'calendar'
  const [gridDays, setGridDays] = useState(365); // 30, 90, 180, or 365 for grid view
  const [calendarSubView, setCalendarSubView] = useState('month'); // 'month' or 'year' for calendar view

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Map view mode to number of days
      const daysMap = {
        'Day': 1, 'Week': 7,
        'History': 365, // History needs full year data
        // Legacy mappings for backwards compat
        '30d': 30, '90d': 90, '180d': 180, '365d': 365,
        'calendar': 365, 'Month': 30, 'Year': 365
      };
      const days = daysMap[viewMode] || 7;
      const response = await fetch(`${API_URL}/stats/${userId}?days=${days}&goal=${goal}&client_date=${getLocalDateString()}`);
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
      }
    } catch (e) {
      console.log("Stats fetch failed, using local data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [viewMode, userId]);

  // Generate week data for LAST 7 DAYS ending at today (chronological order)
  const getWeekData = () => {
    if (!statsData?.daily) return { totals: [0, 0, 0, 0, 0, 0, 0], labels: [] };

    // Get the last 7 days in chronological order (oldest first, today last)
    const last7Days = statsData.daily.slice(0, 7).reverse();
    const totals = last7Days.map(d => d.total);

    // Generate day labels for these dates
    const labels = last7Days.map(d => {
      const date = new Date(d.date + 'T12:00:00');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        name: dayName,
        date: d.date,
        isToday: d.date === getLocalDateString()
      };
    });

    console.log('Week chart data:', totals, labels);
    return { totals, labels };
  };

  // Generate month data
  const getMonthData = () => {
    if (!statsData?.daily) return Array(30).fill(0);
    return statsData.daily.slice(0, 30).reverse().map(d => d.total);
  };

  // Generate 365-day heatmap data (GitHub-style)
  const getYearData = () => {
    if (!statsData?.daily) return [];
    return statsData.daily.map(d => ({
      date: d.date,
      total: d.total,
      intensity: Math.min(d.total / goal, 1) // 0-1 scale
    }));
  };

  const { totals: weekData, labels: weekLabels } = getWeekData();
  const maxWeek = Math.max(...weekData, goal);

  // Handlers for Menu Actions
  const handleExport = () => {
    if (!statsData?.daily) return;
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Date,Amount(ml)\n"
      + statsData.daily.map(d => `${d.date},${d.total}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "smart_sip_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowMenu(false);
    showToast('Data exported successfully!', '📥');
  };

  const handleShare = () => {
    const text = `I'm on a ${statsData?.streak || 0}-day hydration streak with SmartSip! 💧`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Achievement copied to clipboard!', '📋');
    });
    setShowMenu(false);
  };

  // Color scale for heatmap
  const getHeatmapColor = (intensity) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.25) return 'bg-indigo-100';
    if (intensity < 0.5) return 'bg-indigo-200';
    if (intensity < 0.75) return 'bg-indigo-300';
    if (intensity < 1) return 'bg-indigo-400';
    return 'bg-indigo-600';
  };

  return (
    <div className="px-6 pb-32 pt-6 animate-in slide-in-from-right duration-300 relative">
      {/* Local Toast Notification */}
      {localToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border ${isDarkMode ? 'bg-gray-800/90 border-gray-700 text-white' : 'bg-white/90 border-gray-100 text-gray-800'
            } backdrop-blur-md`}>
            <span>{localToast.icon}</span>
            <span className="text-sm font-bold">{localToast.msg}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Statistics</h2>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-full shadow-sm transition-all duration-200 ${isDarkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              : 'bg-white hover:bg-gray-50 text-gray-600'
              } ${showMenu ? 'ring-2 ring-cyan-400' : ''}`}
          >
            <MoreHorizontal size={20} />
          </button>

          {showMenu && (
            <>
              {/* Click backdrop to close */}
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>

              {/* Glass Menu */}
              <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDarkMode
                ? 'bg-gray-900/95 border-gray-700 backdrop-blur-xl'
                : 'bg-white/95 border-white/50 backdrop-blur-xl'
                }`}>
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Actions</p>
                </div>
                <button
                  onClick={handleExport}
                  className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-blue-50'
                    }`}
                >
                  <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'}`}>
                    📥
                  </div>
                  Export Data (CSV)
                </button>
                <button
                  onClick={handleShare}
                  className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-purple-50'
                    }`}
                >
                  <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-purple-100'}`}>
                    🔗
                  </div>
                  Share Achievement
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Simplified Navigation: Today | Week | History */}
      <div className={`p-1 rounded-2xl flex shadow-sm mb-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {[
          { key: 'Day', label: '📊 Today' },
          { key: 'Week', label: '📈 Week' },
          { key: 'History', label: '📅 History' }
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setViewMode(t.key)}
            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${viewMode === t.key || (viewMode === 'History' && t.key === 'History')
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
              : isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 🏆 TROPHY ROOM - Achievement Badges */}
      <div className={`p-5 rounded-[28px] mb-6 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
              <Trophy size={18} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Trophy Room</h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {unlockedBadges.length} / {getAllBadges().length} badges earned
              </p>
            </div>
          </div>
          <div className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
            {Math.round((unlockedBadges.length / getAllBadges().length) * 100)}%
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {getAllBadges().map(badge => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${isUnlocked
                  ? isDarkMode
                    ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                    : 'bg-gradient-to-br from-white to-yellow-50 border-yellow-200 shadow-lg shadow-yellow-100'
                  : isDarkMode
                    ? 'bg-gray-800/50 border-gray-700/50 opacity-40 grayscale'
                    : 'bg-gray-50/50 border-gray-200/50 opacity-40 grayscale'
                  }`}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className={`text-2xl mb-1 filter drop-shadow ${isUnlocked ? '' : 'blur-[1px]'}`}>
                  {isUnlocked ? badge.icon : '🔒'}
                </span>
                <span className={`text-[10px] font-bold text-center leading-tight ${isUnlocked
                  ? isDarkMode ? 'text-white' : 'text-gray-800'
                  : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                  {badge.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards - Dynamic based on view mode */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-200/50 hover:shadow-orange-300/60 transition-all hover:scale-[1.02]">
          <p className="text-xs opacity-80 mb-1">🔥 Streak</p>
          <p className="text-2xl font-bold">{statsData?.streak || 0} days</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-400 via-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 transition-all hover:scale-[1.02]">
          <p className="text-xs opacity-80 mb-1">
            {viewMode === 'Day' ? '📊 Today' : viewMode === 'Week' ? '📊 Weekly Avg' : '📊 Monthly Total'}
          </p>
          <p className="text-2xl font-bold">
            {viewMode === 'Day'
              ? `${statsData?.daily?.[0]?.total || 0} ml`
              : viewMode === 'Week'
                ? `${statsData?.week_avg || 0} ml`
                : `${((statsData?.month_total || 0) / 1000).toFixed(1)}L`
            }
          </p>
        </div>
      </div>

      {/* Day View - Today's Detailed Stats */}
      {
        viewMode === 'Day' && (
          <div className={`p-6 rounded-[32px] mb-6 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Today's Progress</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="dayProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="50%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                  <circle cx="80" cy="80" r="70" stroke={isDarkMode ? '#374151' : '#E5E7EB'} strokeWidth="12" fill="none" />
                  <circle
                    cx="80" cy="80" r="70"
                    stroke="url(#dayProgressGradient)" strokeWidth="12" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min((statsData?.daily?.[0]?.total || 0) / goal, 1))}`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{Math.round((statsData?.daily?.[0]?.total || 0) / goal * 100)}%</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{statsData?.daily?.[0]?.total || 0}/{goal}ml</span>
                  {(statsData?.daily?.[0]?.total || 0) === 0 && (
                    <span className={`text-[10px] mt-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Tap + to start!</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              {(statsData?.daily?.[0]?.total || 0) >= goal
                ? '🎉 Goal achieved! Great job staying hydrated!'
                : `${goal - (statsData?.daily?.[0]?.total || 0)}ml remaining to reach your goal`
              }
            </div>
          </div>
        )
      }

      {/* Weekly Bar Chart */}
      {
        viewMode !== 'Year' && (
          <div className={`p-6 rounded-[32px] mb-6 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Hydration Stats</h3>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{viewMode === 'Week' ? 'Last 7 days' : viewMode === 'Month' ? 'Last 30 days' : 'Today'}</span>
            </div>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Activity size={24} className="animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-2 px-1">
                {weekData.map((val, i) => {
                  const height = maxWeek > 0 ? (val / maxWeek) * 100 : 0;
                  const label = weekLabels[i] || { name: '', isToday: false };
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full">
                      {/* Bar container - takes remaining space above label */}
                      <div className="flex-1 w-full flex flex-col justify-end">
                        <div className="w-full bg-indigo-50 rounded-xl relative" style={{ height: '100%' }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-xl transition-all duration-1000 ${label.isToday ? 'bg-indigo-600' : 'bg-indigo-300'}`}
                            style={{ height: `${Math.min(height, 100)}%` }}
                          />
                          {val > 0 && (
                            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-medium text-indigo-800 whitespace-nowrap">
                              {val >= 1000 ? `${(val / 1000).toFixed(1)}L` : `${val}ml`}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Day label */}
                      <span className={`text-[10px] mt-2 ${label.isToday ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                        {label.isToday ? 'Today' : label.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      }

      {/* HISTORY VIEW - Unified with year chips and view toggle */}
      {
        viewMode === 'History' && (
          <div className={`p-4 md:p-6 rounded-[32px] mb-6 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Header with view toggle */}
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>History</h3>
              <div className={`p-1 rounded-xl flex ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setCalendarView('grid')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${calendarView === 'grid' ? (isDarkMode ? 'bg-gray-700 shadow-sm text-indigo-400' : 'bg-white shadow-sm text-indigo-600') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setCalendarView('calendar')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${calendarView === 'calendar' ? (isDarkMode ? 'bg-gray-700 shadow-sm text-indigo-400' : 'bg-white shadow-sm text-indigo-600') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}
                >
                  Calendar
                </button>
              </div>
            </div>

            {/* GRID VIEW SUB-OPTIONS: Time range only (Year selection is in Calendar) */}
            {calendarView === 'grid' && (
              <div className="flex gap-2 justify-center pb-4">
                {[
                  { days: 30, label: '30 days' },
                  { days: 90, label: '90 days' },
                  { days: 180, label: '6 months' },
                  { days: 365, label: '1 year' }
                ].map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setGridDays(opt.days)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl transition-all
                    ${gridDays === opt.days
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* CALENDAR VIEW SUB-OPTIONS: Year chips + Month selector */}
            {calendarView === 'calendar' && (
              <>
                {/* Month/Year Toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setCalendarSubView('month')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all
                    ${calendarSubView === 'month'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    📅 Month
                  </button>
                  <button
                    onClick={() => setCalendarSubView('year')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all
                    ${calendarSubView === 'year'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    📆 Year
                  </button>
                </div>
                {/* Year Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    const isSelected = calendarMonth.getFullYear() === year;
                    return (
                      <button
                        key={year}
                        onClick={() => setCalendarMonth(new Date(year, calendarMonth.getMonth(), 1))}
                        className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all flex-shrink-0
                        ${isSelected
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
                {/* Month Selector (only show when in month view) */}
                {calendarSubView === 'month' && (
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthName = new Date(calendarMonth.getFullYear(), i, 1).toLocaleDateString('en-US', { month: 'short' });
                      const isSelected = calendarMonth.getMonth() === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), i, 1))}
                          className={`px-3 py-1 text-xs font-medium rounded-xl whitespace-nowrap transition-all flex-shrink-0
                          ${isSelected
                              ? 'bg-indigo-400 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {monthName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* GRID VIEW - Unified wrapped grid for all time ranges (no scrolling) */}
            {calendarView === 'grid' && (
              <div>
                {/* Date Range Title */}
                <div className="text-center mb-4">
                  <div className="font-bold text-indigo-600 text-lg">
                    Last {gridDays === 365 ? '1 Year' : gridDays === 180 ? '6 Months' : `${gridDays} Days`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(() => {
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() - gridDays + 1);
                      const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return `${formatDate(startDate)} → ${formatDate(endDate)}, ${endDate.getFullYear()}`;
                    })()}
                  </div>
                </div>

                {/* Day-of-week header for 30-day grid only */}
                {gridDays === 30 && (
                  <div className="grid grid-cols-7 gap-[3px] mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-[10px] text-gray-400 font-medium">
                        {day}
                      </div>
                    ))}
                  </div>
                )}

                {/* Unified Wrapped Grid - fits without scrolling */}
                <div
                  className="grid gap-[3px]"
                  style={{
                    gridTemplateColumns: gridDays === 30
                      ? 'repeat(7, 1fr)'    // 7 cols × ~5 rows = 35 cells
                      : gridDays === 90
                        ? 'repeat(15, 1fr)' // 15 cols × 6 rows = 90 cells
                        : gridDays === 180
                          ? 'repeat(20, 1fr)' // 20 cols × 9 rows = 180 cells
                          : 'repeat(26, 1fr)' // 26 cols × 14 rows = 364 cells
                  }}
                >
                  {gridDays === 30 ? (
                    /* 30-day grid: Align to day of week (starts from correct day) */
                    (() => {
                      const data = getYearData().slice(0, 30).reverse();
                      // Find what day of week the first day is
                      const firstDayOfWeek = data[0]?.date ? new Date(data[0].date + 'T12:00:00').getDay() : 0;
                      // Add empty cells for alignment
                      const emptyCells = Array(firstDayOfWeek).fill({ intensity: 0, total: 0, date: '' });
                      const alignedData = [...emptyCells, ...data];

                      return alignedData.map((dayData, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded-sm ${dayData.date ? getHeatmapColor(dayData.intensity) : 'bg-transparent'} ${dayData.date ? 'hover:ring-1 hover:ring-indigo-400 cursor-pointer' : ''} transition-all`}
                          title={dayData.date ? `${dayData.date}: ${dayData.total || 0}ml (${Math.round((dayData.intensity || 0) * 100)}%)` : ''}
                        />
                      ));
                    })()
                  ) : (
                    /* Other grids: Simple sequential display */
                    getYearData().slice(0, gridDays).reverse().map((dayData, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm ${getHeatmapColor(dayData.intensity)} hover:ring-1 hover:ring-indigo-400 cursor-pointer transition-all`}
                        title={dayData.date ? `${dayData.date}: ${dayData.total || 0}ml (${Math.round((dayData.intensity || 0) * 100)}%)` : 'No data'}
                      />
                    ))
                  )}
                </div>

                {/* Legend - cleaner design */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="text-xs text-gray-400">Less</span>
                  <div className="flex gap-1">
                    {['bg-gray-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'].map((c, i) => (
                      <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">More</span>
                </div>
              </div>
            )}

            {/* CALENDAR VIEW - Month Detail or Year Overview */}
            {calendarView === 'calendar' && (
              calendarSubView === 'month' ? (
                /* MONTH DETAIL VIEW */
                <div>
                  {/* Month & Year Title */}
                  <div className="text-center font-bold text-indigo-600 mb-4 text-lg">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                      <div key={i} className="text-center text-xs text-gray-400 font-medium">{d}</div>
                    ))}
                  </div>
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
                      const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
                      const cells = [];

                      for (let i = 0; i < firstDay; i++) {
                        cells.push(<div key={`empty-${i}`} className="aspect-square" />);
                      }

                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayData = statsData?.daily?.find(d => d.date === dateStr) || { total: 0 };
                        const intensity = Math.min(dayData.total / goal, 1);
                        const isToday = dateStr === getLocalDateString();

                        cells.push(
                          <div
                            key={day}
                            className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-all
                            ${getHeatmapColor(intensity)} 
                            ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
                            ${dayData.total >= goal ? 'text-white' : 'text-gray-700'}
                            hover:ring-2 hover:ring-indigo-300`}
                            title={`${dateStr}: ${dayData.total}ml (${Math.round(intensity * 100)}%)`}
                          >
                            {day}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                  {/* Month total */}
                  {(() => {
                    const monthStart = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-01`;
                    const monthEnd = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-31`;
                    const monthData = statsData?.daily?.filter(d => d.date >= monthStart && d.date <= monthEnd) || [];
                    const monthTotal = monthData.reduce((sum, d) => sum + d.total, 0);
                    const daysWithGoal = monthData.filter(d => d.total >= goal).length;
                    return (
                      <div className="mt-4 text-center text-sm text-gray-600">
                        <span className="font-bold text-indigo-600">{(monthTotal / 1000).toFixed(1)}L</span> total •
                        <span className="font-bold text-green-600"> {daysWithGoal} days</span> goal met
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* YEAR OVERVIEW - 12 Mini Months */
                <div>
                  <div className="text-center font-bold text-indigo-600 mb-4 text-lg">
                    {calendarMonth.getFullYear()} Overview
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {Array.from({ length: 12 }, (_, monthIdx) => {
                      const monthName = new Date(calendarMonth.getFullYear(), monthIdx, 1).toLocaleDateString('en-US', { month: 'short' });
                      const daysInMonth = new Date(calendarMonth.getFullYear(), monthIdx + 1, 0).getDate();

                      return (
                        <div
                          key={monthIdx}
                          className="bg-gray-50 p-2 rounded-xl cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all"
                          onClick={() => { setCalendarMonth(new Date(calendarMonth.getFullYear(), monthIdx, 1)); setCalendarSubView('month'); }}
                        >
                          <div className="text-xs font-bold text-gray-600 mb-2 text-center">{monthName}</div>
                          <div className="grid grid-cols-7 gap-[2px]">
                            {Array.from({ length: Math.min(daysInMonth, 35) }, (_, dayIdx) => {
                              const dateStr = `${calendarMonth.getFullYear()}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayIdx + 1).padStart(2, '0')}`;
                              const dayData = statsData?.daily?.find(d => d.date === dateStr) || { total: 0 };
                              const intensity = Math.min(dayData.total / goal, 1);

                              return (
                                <div
                                  key={dayIdx}
                                  className={`w-2 h-2 rounded-[1px] ${getHeatmapColor(intensity)}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
              <span>0%</span>
              <div className="flex gap-1">
                {['bg-gray-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-600'].map((c, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
              </div>
              <span>100%+ goal</span>
            </div>
          </div>
        )
      }

      {/* Dynamic Insight Card - Changes based on view */}
      <div className={`p-6 rounded-[32px] text-center transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-indigo-950' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
        <p className={`font-bold mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-800'}`}>💡 Insight</p>
        <p className={`text-sm ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
          {(() => {
            const todayTotal = statsData?.daily?.[0]?.total || 0;
            const weekAvg = statsData?.week_avg || 0;
            const streak = statsData?.streak || 0;
            const monthTotal = statsData?.month_total || 0;

            // Day view insight
            if (viewMode === 'Day') {
              if (todayTotal >= goal) return `🎉 Goal achieved! You've had ${todayTotal}ml today. Keep it up!`;
              if (todayTotal > goal * 0.5) return `You're at ${Math.round(todayTotal / goal * 100)}% of your goal. ${goal - todayTotal}ml to go!`;
              if (todayTotal > 0) return `Good start! ${todayTotal}ml logged. Drink ${goal - todayTotal}ml more to hit your goal.`;
              return 'No water logged yet today. Start hydrating! 💧';
            }

            // Week view insight
            if (viewMode === 'Week') {
              const daysWithData = statsData?.daily?.filter(d => d.total > 0).length || 0;
              if (weekAvg >= goal) return `Excellent week! Averaging ${weekAvg}ml/day, above your ${goal}ml goal. 🌟`;
              if (daysWithData >= 5) return `You've logged ${daysWithData} days this week. Average: ${weekAvg}ml/day.`;
              return `${7 - daysWithData} days missing this week. Try to log consistently!`;
            }

            // History view insight - Complete implementation with edge cases
            if (viewMode === 'History') {
              if (calendarView === 'calendar') {
                // === CALENDAR VIEW INSIGHTS ===
                if (calendarSubView === 'year') {
                  // YEAR OVERVIEW INSIGHT
                  const yearData = statsData?.daily?.filter(d => {
                    const year = new Date(d.date + 'T12:00:00').getFullYear();
                    return year === calendarMonth.getFullYear();
                  }) || [];

                  // Edge case: no data for this year
                  if (yearData.length === 0) {
                    return `📅 ${calendarMonth.getFullYear()}: No data yet. Start tracking!`;
                  }

                  const daysWithGoal = yearData.filter(d => d.total >= goal).length;
                  const totalLiters = (yearData.reduce((sum, d) => sum + d.total, 0) / 1000).toFixed(1);

                  // Calculate monthly stats for best/worst
                  const monthStats = Array.from({ length: 12 }, (_, m) => {
                    const mData = yearData.filter(d => new Date(d.date + 'T12:00:00').getMonth() === m);
                    const daysGoalMet = mData.filter(d => d.total >= goal).length;
                    return { month: m, total: mData.reduce((s, d) => s + d.total, 0), days: mData.length, goalDays: daysGoalMet };
                  }).filter(m => m.days > 0);

                  const bestMonth = monthStats.length > 0 ? monthStats.sort((a, b) => b.total - a.total)[0] : null;
                  const worstMonth = monthStats.length > 1 ? monthStats.sort((a, b) => a.total - b.total)[0] : null;
                  const bestMonthName = bestMonth ? new Date(2025, bestMonth.month, 1).toLocaleDateString('en-US', { month: 'short' }) : '';
                  const worstMonthName = worstMonth && worstMonth.month !== bestMonth?.month ? new Date(2025, worstMonth.month, 1).toLocaleDateString('en-US', { month: 'short' }) : '';

                  // Calculate trend (compare first half vs second half of available data)
                  const sortedByDate = [...yearData].sort((a, b) => a.date.localeCompare(b.date));
                  const halfPoint = Math.floor(sortedByDate.length / 2);
                  const firstHalf = sortedByDate.slice(0, halfPoint);
                  const secondHalf = sortedByDate.slice(halfPoint);
                  const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((s, d) => s + d.total, 0) / firstHalf.length : 0;
                  const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((s, d) => s + d.total, 0) / secondHalf.length : 0;
                  const trendPercent = firstHalfAvg > 0 ? Math.round((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100) : 0;
                  const trendText = trendPercent !== 0 && yearData.length >= 14 ? ` • ${trendPercent > 0 ? '📈' : '📉'} ${trendPercent > 0 ? '+' : ''}${trendPercent}% trend` : '';

                  return `📊 ${calendarMonth.getFullYear()}: ${daysWithGoal}/${yearData.length} days (${Math.round(daysWithGoal / yearData.length * 100)}%) • ${totalLiters}L${bestMonth ? ` • Best: ${bestMonthName} 🏆` : ''}${worstMonthName ? ` • Work on: ${worstMonthName}` : ''}${trendText}`;

                } else {
                  // MONTH DETAIL INSIGHT
                  const monthStart = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-01`;
                  const monthEnd = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-31`;
                  const monthData = statsData?.daily?.filter(d => d.date >= monthStart && d.date <= monthEnd && d.total > 0) || [];
                  const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long' });

                  // Edge case: no data for this month
                  if (monthData.length === 0) {
                    return `📅 ${monthName}: No data yet. Start tracking!`;
                  }

                  const daysWithGoal = monthData.filter(d => d.total >= goal).length;
                  const monthTotal = (monthData.reduce((sum, d) => sum + d.total, 0) / 1000).toFixed(1);
                  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();

                  // Find best day (only from days with actual data)
                  const sortedDays = [...monthData].sort((a, b) => b.total - a.total);
                  const bestDay = sortedDays[0];
                  const bestDayNum = bestDay ? new Date(bestDay.date + 'T12:00:00').getDate() : null;
                  const bestDayTotal = bestDay ? (bestDay.total / 1000).toFixed(1) : null;

                  // Compare to previous month (cap extreme percentages)
                  const prevMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                  const prevMonthStart = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
                  const prevMonthEnd = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-31`;
                  const prevMonthData = statsData?.daily?.filter(d => d.date >= prevMonthStart && d.date <= prevMonthEnd && d.total > 0) || [];
                  const prevTotal = prevMonthData.reduce((sum, d) => sum + d.total, 0);
                  const currTotal = monthData.reduce((sum, d) => sum + d.total, 0);
                  const vsLastMonthRaw = prevTotal > 0 ? Math.round((currTotal - prevTotal) / prevTotal * 100) : 0;

                  // Cap extreme percentages for better UX
                  let compText = '';
                  if (prevMonthData.length >= 3) {
                    if (vsLastMonthRaw > 100) {
                      compText = ` • 📈 Much more than ${prevMonth.toLocaleDateString('en-US', { month: 'short' })}`;
                    } else if (vsLastMonthRaw < -50) {
                      compText = ` • 📉 Much less than ${prevMonth.toLocaleDateString('en-US', { month: 'short' })}`;
                    } else if (Math.abs(vsLastMonthRaw) >= 10) {
                      compText = ` • ${vsLastMonthRaw > 0 ? '↑' : '↓'}${Math.abs(vsLastMonthRaw)}% vs ${prevMonth.toLocaleDateString('en-US', { month: 'short' })}`;
                    }
                  }

                  // Pattern detection: weekday vs weekend + best/worst day of week
                  let patternText = '';
                  if (monthData.length >= 7) { // Require full week of data
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayStats = Array.from({ length: 7 }, (_, i) => {
                      const dayData = monthData.filter(d => new Date(d.date + 'T12:00:00').getDay() === i);
                      const goalMet = dayData.filter(d => d.total >= goal).length;
                      return { day: i, name: dayNames[i], count: dayData.length, goalMet, rate: dayData.length > 0 ? Math.round(goalMet / dayData.length * 100) : 0 };
                    }).filter(d => d.count > 0);

                    // Weekday vs Weekend (require minimum 2 days each)
                    const weekdayData = dayStats.filter(d => d.day >= 1 && d.day <= 5);
                    const weekendData = dayStats.filter(d => d.day === 0 || d.day === 6);
                    const weekdayCount = weekdayData.reduce((s, d) => s + d.count, 0);
                    const weekendCount = weekendData.reduce((s, d) => s + d.count, 0);

                    if (weekdayCount >= 3 && weekendCount >= 2) { // Minimum threshold for meaningful comparison
                      const weekdayRate = Math.round(weekdayData.reduce((s, d) => s + d.goalMet, 0) / weekdayCount * 100);
                      const weekendRate = Math.round(weekendData.reduce((s, d) => s + d.goalMet, 0) / weekendCount * 100);

                      if (Math.abs(weekdayRate - weekendRate) >= 15) {
                        const focusOn = weekdayRate > weekendRate ? 'weekends' : 'weekdays';
                        patternText = ` • 💡 Focus on ${focusOn}!`;
                      }
                    }

                    // Best/worst day of week (require min 2 occurrences for statistical significance)
                    const significantDayStats = dayStats.filter(d => d.count >= 2);
                    if (significantDayStats.length >= 2) {
                      const sortedDayStats = [...significantDayStats].sort((a, b) => b.rate - a.rate);
                      const bestDayOfWeek = sortedDayStats[0];
                      const worstDayOfWeek = sortedDayStats[sortedDayStats.length - 1];

                      if (bestDayOfWeek.name !== worstDayOfWeek.name && bestDayOfWeek.rate - worstDayOfWeek.rate >= 20) {
                        patternText += ` Best: ${bestDayOfWeek.name}, Weak: ${worstDayOfWeek.name}`;
                      }
                    }
                  }

                  // Limited data warning
                  const limitedDataText = monthData.length < 7 ? ` • ⚠️ Limited data (${monthData.length} days)` :
                    monthData.length < 14 ? ` • 📊 ${monthData.length} days tracked` : '';

                  return `📅 ${monthName}: ${monthTotal}L • Goal: ${daysWithGoal}/${daysInMonth} days${bestDayTotal ? ` • Best: ${monthName.slice(0, 3)} ${bestDayNum} 🏆` : ''}${compText}${patternText}${limitedDataText}`;
                }

              } else {
                // === GRID VIEW INSIGHTS ===
                const gridData = statsData?.daily?.slice(0, gridDays).filter(d => d.total > 0) || [];

                // Edge case: no data
                if (gridData.length === 0) {
                  const daysLabel = gridDays === 365 ? '1 year' : gridDays === 180 ? '6 months' : `${gridDays} days`;
                  return `Track daily to see your ${daysLabel} progress!`;
                }

                const allGridData = statsData?.daily?.slice(0, gridDays) || [];
                const daysWithGoal = gridData.filter(d => d.total >= goal).length;
                const goalRate = Math.round(daysWithGoal / gridDays * 100);

                // Calculate trend vs previous period
                const prevData = statsData?.daily?.slice(gridDays, gridDays * 2).filter(d => d.total > 0) || [];
                const prevDaysWithGoal = prevData.filter(d => d.total >= goal).length;
                const prevRate = prevData.length > 0 ? Math.round(prevDaysWithGoal / gridDays * 100) : 0;
                const trendDiff = goalRate - prevRate;

                // Period-specific insights
                if (gridDays === 30) {
                  // 30 DAYS: Focus on consistency + current streak
                  const trendText = trendDiff !== 0 && prevData.length > 0 ? `${trendDiff > 0 ? '📈' : '📉'} ${trendDiff > 0 ? '+' : ''}${trendDiff}% vs prev • ` : '';
                  const limitedWarning = gridData.length < 10 ? ` • ⚠️ ${gridData.length} days tracked` : '';
                  return `🎯 ${goalRate}% (${daysWithGoal}/${gridDays} days) • ${trendText}${streak > 0 ? `🔥 ${streak}-day streak` : 'Build your streak!'}${limitedWarning}`;

                } else if (gridDays === 90) {
                  // 90 DAYS: Focus on trend + best streak
                  const trendIcon = trendDiff > 5 ? '📈 Improving!' : trendDiff < -5 ? '📉 Declining' : '➡️ Steady';
                  const limitedWarning = gridData.length < 30 ? ` • ⚠️ ${gridData.length} days tracked` : '';
                  return `🎯 ${goalRate}% goal rate • ${trendIcon}${streak > 0 ? ` • 🔥 ${streak}-day streak` : ''}${limitedWarning}`;

                } else if (gridDays === 180) {
                  // 180 DAYS: Best/worst months
                  const monthStats = Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const mName = d.toLocaleDateString('en-US', { month: 'short' });
                    const mData = gridData.filter(day => {
                      const dayMonth = new Date(day.date + 'T12:00:00').getMonth();
                      return dayMonth === d.getMonth();
                    });
                    return { name: mName, rate: mData.length > 0 ? Math.round(mData.filter(x => x.total >= goal).length / mData.length * 100) : 0, count: mData.length };
                  }).filter(m => m.count > 0);

                  const best = monthStats.length > 0 ? monthStats.sort((a, b) => b.rate - a.rate)[0] : null;
                  const worst = monthStats.length > 1 ? monthStats.sort((a, b) => a.rate - b.rate)[0] : null;

                  return `🎯 6mo: ${goalRate}% (${daysWithGoal} days)${best ? ` • Best: ${best.name} (${best.rate}%) 🏆` : ''}${worst && worst.name !== best?.name ? ` • Improve: ${worst.name}` : ''}`;

                } else {
                  // 365 DAYS: Year summary with total liters
                  const totalLiters = (gridData.reduce((sum, d) => sum + d.total, 0) / 1000).toFixed(0);
                  const monthStats = Array.from({ length: 12 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const mName = d.toLocaleDateString('en-US', { month: 'short' });
                    const mData = gridData.filter(day => {
                      const dayMonth = new Date(day.date + 'T12:00:00').getMonth();
                      return dayMonth === d.getMonth();
                    });
                    return { name: mName, total: mData.reduce((s, x) => s + x.total, 0), count: mData.length };
                  }).filter(m => m.count > 0);

                  const best = monthStats.length > 0 ? monthStats.sort((a, b) => b.total - a.total)[0] : null;

                  return `🎯 1 year: ${daysWithGoal} days goal met (${goalRate}%) • ${totalLiters}L total${best ? ` • Best: ${best.name} 🏆` : ''}`;
                }
              }
            }

            // Default
            return streak > 0 ? `You're on a ${streak}-day streak! Keep it going! 🔥` : 'Start tracking to see your progress!';
          })()}
        </p>
      </div>
    </div >
  );
};

// --- SCREEN 4: SETTINGS ---
const SettingsScreen = ({
  goal,
  setGoal,
  drinkAmount,
  setDrinkAmount,
  userName,
  setUserName,
  isDarkMode,
  setIsDarkMode,
  smartAlerts,
  setSmartAlerts,
  alertFrequency,
  setAlertFrequency,
  alertStartTime,
  setAlertStartTime,
  alertEndTime,
  setAlertEndTime,
  quickAddPresets,
  setQuickAddPresets,
  theme,
  setTheme,
  dailyConditions,
  setDailyConditions,
  goalData,
  onRequestPermission,
  onTestNotification,
  userEmail  // NEW: Display email in settings
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [tempGoal, setTempGoal] = useState(goal);
  const [tempDrink, setTempDrink] = useState(drinkAmount);

  // Time Input Refs for programmatically showing picker
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  // Presets management state
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);

  const [presetForm, setPresetForm] = useState({ name: '', amount: '', icon: '💧' });

  const formatTimeForDisplay = (timeStr) => {
    if (!timeStr) return "--:--";
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const iconOptions = ['💧', '🥛', '☕', '🧴', '🍶', '🥤', '🍵', '🫗', '🧃', '🍺'];

  const handleAddPreset = () => {
    if (!presetForm.name || !presetForm.amount) return;
    const newPreset = {
      id: Date.now(),
      name: presetForm.name,
      amount: parseInt(presetForm.amount),
      icon: presetForm.icon
    };
    setQuickAddPresets([...quickAddPresets, newPreset]);
    setPresetForm({ name: '', amount: '', icon: '💧' });
  };

  const handleDeletePreset = (id) => {
    setQuickAddPresets(quickAddPresets.filter(p => p.id !== id));
  };

  const handleUpdatePreset = () => {
    if (!editingPreset || !presetForm.name || !presetForm.amount) return;
    setQuickAddPresets(quickAddPresets.map(p =>
      p.id === editingPreset.id
        ? { ...p, name: presetForm.name, amount: parseInt(presetForm.amount), icon: presetForm.icon }
        : p
    ));
    setEditingPreset(null);
    setPresetForm({ name: '', amount: '', icon: '💧' });
  };

  const startEditPreset = (preset) => {
    setEditingPreset(preset);
    setPresetForm({ name: preset.name, amount: preset.amount.toString(), icon: preset.icon });
  };

  const handleSaveProfile = () => {
    setUserName(tempName);
    setGoal(tempGoal);
    setDrinkAmount(tempDrink);
    setEditingProfile(false);
  };

  return (
    <div className="px-6 pb-32 pt-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Settings</h2>
        <button className={`p-2 rounded-full shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <MoreHorizontal size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        </button>
      </div>

      {/* Profile Card */}
      <div className={`p-6 rounded-[32px] shadow-sm mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-full overflow-hidden border-4 shadow-lg ${isDarkMode ? 'bg-indigo-900 border-gray-800' : 'bg-indigo-100 border-white'}`}>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="User" />
          </div>
          <div className="flex-1">
            {editingProfile ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-lg font-bold text-gray-800 bg-transparent border-b-2 border-indigo-300 focus:outline-none w-full"
              />
            ) : (
              <h3 className="text-lg font-bold text-gray-800">{userName}</h3>
            )}
            {userEmail ? (
              <p className="text-xs text-blue-500 font-medium">{userEmail}</p>
            ) : (
              <p className="text-xs text-gray-500">Guest Mode</p>
            )}
            <p className="text-xs text-gray-400">Hydration Champion 💧 (v1.3.1)</p>
          </div>
          <button
            onClick={() => editingProfile ? handleSaveProfile() : setEditingProfile(true)}
            className={`p-3 rounded-full transition-all ${editingProfile ? (isDarkMode ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-600') : (isDarkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
          >
            {editingProfile ? <Check size={18} /> : <Edit2 size={18} />}
          </button>
        </div>

        {/* Hydration Goals */}
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-indigo-950' : 'bg-indigo-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
                <Target size={18} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} />
              </div>
              <div>
                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Daily Goal</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your hydration target</p>
              </div>
            </div>
            {editingProfile ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Number(e.target.value))}
                  className={`w-16 text-right font-bold bg-transparent border-b focus:outline-none ${isDarkMode ? 'text-indigo-400 border-indigo-700' : 'text-indigo-600 border-indigo-300'}`}
                />
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ml</span>
              </div>
            ) : (
              <span className={`font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{goal} ml</span>
            )}
          </div>

          <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-blue-950' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <Droplets size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Glass Size</p>
                <p className="text-xs text-gray-500">Default drink amount</p>
              </div>
            </div>
            {editingProfile ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempDrink}
                  onChange={(e) => setTempDrink(Number(e.target.value))}
                  className="w-16 text-right font-bold text-blue-600 bg-transparent border-b border-blue-300 focus:outline-none"
                />
                <span className="text-xs text-gray-500">ml</span>
              </div>
            ) : (
              <span className="font-bold text-blue-600">{drinkAmount} ml</span>
            )}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className={`p-6 rounded-[32px] shadow-sm mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Preferences</h3>

        {/* THEME SELECTION */}
        <div className={`flex items-center justify-between p-4 rounded-2xl mb-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-pink-900' : 'bg-pink-100'}`}>
              <Sparkles size={18} className={isDarkMode ? 'text-pink-400' : 'text-pink-600'} />
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Visual Theme</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {theme === 'garden' ? 'Zen Garden' : theme === 'base' ? 'Minimalist Base' : 'Classic Glass'}
              </p>
            </div>
          </div>

          <div className={`flex p-1.5 rounded-xl ${isDarkMode ? 'bg-gray-900' : 'bg-white border border-gray-200'}`}>
            <button
              onClick={() => setTheme('base')}
              className={`p-2 rounded-lg transition-all ${theme === 'base'
                ? (isDarkMode ? 'bg-gray-700 shadow-sm text-gray-200' : 'bg-gray-100 shadow-sm text-gray-900')
                : (isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}
              title="Base Mode"
            >
              <Circle size={16} />
            </button>
            <button
              onClick={() => setTheme('glass')}
              className={`p-2 rounded-lg transition-all ${theme === 'glass'
                ? (isDarkMode ? 'bg-gray-700 shadow-sm text-indigo-400' : 'bg-indigo-50 shadow-sm text-indigo-600')
                : (isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}
              title="Glass Mode"
            >
              <Droplets size={16} />
            </button>
            <button
              onClick={() => setTheme('garden')}
              className={`p-2 rounded-lg transition-all ${theme === 'garden'
                ? (isDarkMode ? 'bg-gray-700 shadow-sm text-green-400' : 'bg-green-50 shadow-sm text-green-600')
                : (isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}
              title="Zen Garden Mode"
            >
              <Sprout size={16} />
            </button>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-2xl mb-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-100' : 'bg-yellow-100'}`}>
              {isDarkMode ? <Moon size={18} className="text-indigo-600" /> : <Sun size={18} className="text-yellow-600" />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Dark Mode</p>
              <p className="text-xs text-gray-500">Easier on the eyes</p>
            </div>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* TODAY'S CONDITIONS - Context-Aware Goals */}
        <div className={`p-5 rounded-[28px] mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isDarkMode ? 'bg-cyan-900/50' : 'bg-cyan-100'}`}>
                <Zap size={18} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Today's Conditions</h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Adjust your goal based on your day</p>
              </div>
            </div>
            {goalData && goalData.totalBonus > 0 && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                +{goalData.totalBonus}ml
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Hot Weather Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-2xl ${dailyConditions.isHot
              ? isDarkMode ? 'bg-orange-900/30 border border-orange-700/50' : 'bg-orange-50 border border-orange-200'
              : isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Hot Weather</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>+500ml hydration needed</p>
                </div>
              </div>
              <button
                onClick={() => setDailyConditions({ ...dailyConditions, isHot: !dailyConditions.isHot })}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${dailyConditions.isHot ? 'bg-orange-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${dailyConditions.isHot ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Active Day Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-2xl ${dailyConditions.isActive
              ? isDarkMode ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-50 border border-green-200'
              : isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏃</span>
                <div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Active Day</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>+750ml for workouts</p>
                </div>
              </div>
              <button
                onClick={() => setDailyConditions({ ...dailyConditions, isActive: !dailyConditions.isActive })}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${dailyConditions.isActive ? 'bg-green-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${dailyConditions.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Recovery Mode Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-2xl ${dailyConditions.isRecovery
              ? isDarkMode ? 'bg-purple-900/30 border border-purple-700/50' : 'bg-purple-50 border border-purple-200'
              : isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤒</span>
                <div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recovery Mode</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>+1000ml when feeling unwell</p>
                </div>
              </div>
              <button
                onClick={() => setDailyConditions({ ...dailyConditions, isRecovery: !dailyConditions.isRecovery })}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${dailyConditions.isRecovery ? 'bg-purple-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${dailyConditions.isRecovery ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Summary */}
          {goalData && (
            <div className={`mt-4 p-4 rounded-2xl text-center ${isDarkMode ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-700/30' : 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Today's Smart Goal</p>
              <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {goalData.effectiveGoal}ml
              </p>
              {goalData.totalBonus > 0 && (
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  {goalData.baseGoal}ml base + {goalData.totalBonus}ml conditions
                </p>
              )}
            </div>
          )}
        </div>

        {/* Smart Alerts Configuration */}
        <div className={`p-4 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${smartAlerts ? (isDarkMode ? 'bg-green-900' : 'bg-green-100') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}`}>
                <Bell size={18} className={smartAlerts ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')} />
              </div>
              <div>
                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Smart Alerts</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Adaptive hydration reminders</p>
              </div>
            </div>
            <button
              onClick={() => setSmartAlerts(!smartAlerts)}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${smartAlerts ? 'bg-green-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${smartAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Expanded Settings when Enabled */}
          {smartAlerts && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Frequency */}
              <div>
                <label className={`text-xs font-bold mb-2 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Remind me every</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(h => (
                    <button
                      key={h}
                      onClick={() => setAlertFrequency(h)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${alertFrequency === h
                        ? (isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
                        : (isDarkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Hours */}
              <div>
                <label className={`text-xs font-bold mb-2 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Hours</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Start Time */}
                  <div
                    onClick={() => startTimeRef.current?.showPicker()}
                    className={`relative p-4 rounded-xl border-2 transition-all group cursor-pointer flex items-center justify-between ${isDarkMode ? 'bg-gray-900 border-gray-700 hover:border-indigo-500' : 'bg-white border-gray-100 hover:border-indigo-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-amber-50'}`}>
                        <Sun size={18} className="text-amber-500" />
                      </div>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Start</span>
                    </div>
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {formatTimeForDisplay(alertStartTime)}
                    </div>
                    <input
                      ref={startTimeRef}
                      type="time"
                      value={alertStartTime}
                      onChange={(e) => setAlertStartTime(e.target.value)}
                      className="absolute bottom-0 left-0 opacity-0 w-1 h-1 -z-10"
                    />
                  </div>

                  {/* End Time */}
                  <div
                    onClick={() => endTimeRef.current?.showPicker()}
                    className={`relative p-4 rounded-xl border-2 transition-all group cursor-pointer flex items-center justify-between ${isDarkMode ? 'bg-gray-900 border-gray-700 hover:border-indigo-500' : 'bg-white border-gray-100 hover:border-indigo-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-indigo-50'}`}>
                        <Moon size={18} className="text-indigo-400" />
                      </div>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>End</span>
                    </div>
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {formatTimeForDisplay(alertEndTime)}
                    </div>
                    <input
                      ref={endTimeRef}
                      type="time"
                      value={alertEndTime}
                      onChange={(e) => setAlertEndTime(e.target.value)}
                      className="absolute bottom-0 left-0 opacity-0 w-1 h-1 -z-10"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Test Button */}
              <div className="pt-2">
                <button
                  onClick={onTestNotification}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                >
                  <Bell size={16} /> Test Notification
                </button>
                <p className="text-[10px] text-center mt-2 opacity-60">
                  If nothing happens, check browser permissions for this site.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manage Quick Amounts */}
      <div className={`p-6 rounded-[32px] shadow-sm mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Quick Add Amounts</h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your favorite volumes for fast logging</p>
          </div>
          <button
            onClick={() => {
              setEditingPreset(null);
              setPresetForm({ name: '', amount: '' });
              setShowPresetsModal(true);
            }}
            className="p-2 rounded-full bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickAddPresets.map((preset) => (
            <div key={preset.id} className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isDarkMode ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
                  {preset.amount}
                </div>
                <div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{preset.name}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{preset.amount}ml</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    startEditPreset(preset);
                    setShowPresetsModal(true);
                  }}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About / Version */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-[32px] text-white text-center">
        <Droplets size={32} className="mx-auto mb-2 opacity-80" />
        <h3 className="font-bold text-lg">SmartSip</h3>
        <p className="text-sm opacity-80">AI-Powered Hydration Coach</p>
        <p className="text-xs opacity-60 mt-2">Version 2.0.0 • Intelligent Hydration</p>
      </div>

      {/* Edit/Add Amount Modal (Simplified - no icon picker) */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPresetsModal(false)}></div>
          <div className={`relative w-full max-w-sm p-6 rounded-[32px] shadow-2xl animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">{editingPreset ? 'Edit Amount' : 'Add New Amount'}</h3>

            <div className="space-y-4">
              <div>
                <label className={`text-xs font-bold ml-1 mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Label</label>
                <input
                  type="text"
                  value={presetForm.name}
                  onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  placeholder="e.g. My Bottle"
                  className={`w-full p-4 rounded-xl font-medium outline-none transition-all ${isDarkMode ? 'bg-gray-800 focus:ring-2 focus:ring-cyan-500' : 'bg-gray-50 focus:ring-2 focus:ring-cyan-200'}`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold ml-1 mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Volume (ml)</label>
                <input
                  type="number"
                  value={presetForm.amount}
                  onChange={(e) => setPresetForm({ ...presetForm, amount: e.target.value })}
                  placeholder="e.g. 500"
                  className={`w-full p-4 rounded-xl font-medium outline-none transition-all ${isDarkMode ? 'bg-gray-800 focus:ring-2 focus:ring-cyan-500' : 'bg-gray-50 focus:ring-2 focus:ring-cyan-200'}`}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPresetsModal(false)}
                  className={`flex-1 py-4 rounded-xl font-bold transition-all ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingPreset) handleUpdatePreset();
                    else handleAddPreset();
                    setShowPresetsModal(false);
                  }}
                  className="flex-1 py-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-200/50 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // --- AUTH INTEGRATION ---
  const auth = useAuth();

  // User Identity: Use Supabase user ID if authenticated, otherwise fallback
  const USER_ID = auth.userId || FALLBACK_USER_ID;
  const userContext = {
    isGuest: auth.isGuest,
    email: auth.userEmail,
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // --- HANDLERS ---
  /* REMOVED DUPLICATE HANDLERS */
  const handleLogin = async () => {
    // Use real Supabase OAuth
    const { error } = await auth.signInWithGoogle();
    if (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } else {
      // Close modal - auth state will update automatically via useAuth hook
      setIsLoginModalOpen(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  // --- GUEST DATA MIGRATION ---
  // When user logs in, migrate their localStorage data AND claim DB guest records
  useEffect(() => {
    const migrateGuestData = async () => {
      // Only run if user just authenticated (has real ID, not guest)
      if (!auth.userId || auth.isGuest) return;

      // Use SEPARATE flags for localStorage and DB migration
      const localMigrationKey = `localStorage_migrated_to_${auth.userId}`;
      const dbClaimKey = `db_claimed_to_${auth.userId}`;

      // 1. Migrate localStorage data (if not already done)
      if (!localStorage.getItem(localMigrationKey)) {
        const savedLogs = localStorage.getItem('waterLogs');
        if (savedLogs) {
          try {
            const logs = JSON.parse(savedLogs);
            if (Array.isArray(logs) && logs.length > 0) {
              const formattedLogs = logs.map(log => ({
                amount: log.amount,
                timestamp: log.time || log.timestamp || new Date().toISOString()
              }));

              console.log(`Migrating ${formattedLogs.length} guest logs from localStorage`);

              const response = await fetch(`${API_URL}/bulk-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: auth.userId,
                  logs: formattedLogs,
                  goal: goal
                })
              });

              if (response.ok) {
                const result = await response.json();
                console.log(`localStorage migration: ${result.imported} logs imported`);
              }
            }
          } catch (e) {
            console.error('localStorage migration failed:', e);
          }
        }
        localStorage.setItem(localMigrationKey, 'true');
      }

      // 2. Claim database guest records (ALWAYS runs if not yet claimed)
      if (!localStorage.getItem(dbClaimKey)) {
        try {
          console.log('Claiming guest database records...');
          const claimResponse = await fetch(`${API_URL}/claim-guest-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: auth.userId,
              goal: goal
            })
          });

          if (claimResponse.ok) {
            const claimResult = await claimResponse.json();
            console.log(`DB claim: ${claimResult.logs_transferred} logs, ${claimResult.snapshots_transferred} snapshots`);
            localStorage.setItem(dbClaimKey, 'true');
          }
        } catch (e) {
          console.error('Guest data claim failed:', e);
        }
      }

      // 3. Refresh all data after migration/claim
      fetchStats();
      fetchHistory();
    };

    migrateGuestData();
  }, [auth.userId, auth.isGuest]);

  const [totalWater, setTotalWater] = useState(0);
  const [logs, setLogs] = useState([]);
  const [aiMessage, setAiMessage] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Base Goal: User's profile setting (persisted)
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem('baseGoal');
    return saved ? parseInt(saved, 10) : 2500;
  });

  // Save base goal when it changes
  useEffect(() => {
    localStorage.setItem('baseGoal', goal.toString());
  }, [goal]);

  const [drinkAmount, setDrinkAmount] = useState(200);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [streak, setStreak] = useState(0);
  const [statsData, setStatsData] = useState(null); // Lifted stats state
  const [historicalGoal, setHistoricalGoal] = useState(null); // NEW: Goal from snapshot for past dates
  // Theme State: 'glass' | 'garden'
  // Theme State: 'glass' | 'garden', persisted in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'glass';
  });

  // Save theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch full stats (charts, weekly avg)
  const fetchStats = async () => {
    try {
      // Default to 7 days for dashboard view
      const days = 7;
      const response = await fetch(`${API_URL}/stats/${USER_ID}?days=${days}&goal=${goal}&client_date=${getLocalDateString()}`);
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
        if (data.streak !== undefined) setStreak(data.streak);
      }
    } catch (e) {
      console.log("Stats fetch failed");
    }
  };

  useEffect(() => {
    // Don't fetch until auth is done loading to ensure correct USER_ID
    if (!auth.loading) {
      fetchStats();
    }
  }, [logs, goal, USER_ID, auth.loading]); // Re-fetch when logs, goal, or user changes

  // Dynamic userName with ability to override in Settings
  // Load from localStorage if saved, otherwise use email-based default
  const getDefaultUserName = () => {
    const saved = localStorage.getItem('customUserName');
    if (saved) return saved;
    return userContext.isGuest
      ? "Guest User"
      : (userContext.email?.split('@')[0] || "User");
  };
  const [userName, setUserName] = useState(getDefaultUserName);

  // Wrapper to persist userName changes to localStorage
  const handleSetUserName = (name) => {
    setUserName(name);
    localStorage.setItem('customUserName', name);
  };

  // Only update userName from auth if user hasn't set a custom name
  useEffect(() => {
    const savedName = localStorage.getItem('customUserName');
    if (!savedName && !userContext.isGuest && userContext.email) {
      setUserName(userContext.email.split('@')[0]);
    }
  }, [userContext.isGuest, userContext.email]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState(2);
  const [alertStartTime, setAlertStartTime] = useState("09:00");
  const [alertEndTime, setAlertEndTime] = useState("20:00");

  // Context-Aware Goals: Daily Conditions (persisted to localStorage for session)
  const [dailyConditions, setDailyConditions] = useState(() => {
    // Note: These reset daily - check if same day
    const saved = localStorage.getItem('dailyConditions');
    if (saved) {
      const { date, conditions } = JSON.parse(saved);
      // Only restore if it's the same day
      if (date === getLocalDateString()) {
        return conditions;
      }
    }
    return { isHot: false, isActive: false, isRecovery: false };
  });

  // Save conditions when they change (with date)
  useEffect(() => {
    localStorage.setItem('dailyConditions', JSON.stringify({
      date: getLocalDateString(),
      conditions: dailyConditions
    }));
  }, [dailyConditions]);

  // Calculate effective goal based on conditions
  const goalData = calculateDailyTarget(goal, dailyConditions);
  const effectiveGoal = goalData.effectiveGoal;
  const goalReached = totalWater >= effectiveGoal; // Used for notification logic

  // --- NOTIFICATION HOOK INTEGRATION ---
  const { requestPermission, sendTestNotification } = useSmartNotifications({
    enabled: smartAlerts,
    frequencyHours: alertFrequency,
    startTime: alertStartTime,
    endTime: alertEndTime,
    goalMet: goalReached, // Silence if goal met
    logs: logs // To check last drink time
  });

  // Selected date state (for viewing/logging past dates)
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  // Today's Logs state (individual entries)
  const [todayLogs, setTodayLogs] = useState([]);

  // Quick-Add Presets (now just favorite AMOUNTS - icon comes from drink type)
  const [quickAddPresets, setQuickAddPresets] = useState([
    { id: 1, name: 'Small', amount: 150 },
    { id: 2, name: 'Medium', amount: 300 },
    { id: 3, name: 'Large', amount: 500 },
    { id: 4, name: 'Extra Large', amount: 750 },
  ]);

  // BADGE SYSTEM: Gamification (persisted to localStorage)
  const [unlockedBadges, setUnlockedBadges] = useState(() => {
    const saved = localStorage.getItem('unlockedBadges');
    return saved ? JSON.parse(saved) : [];
  });
  const [badgeToast, setBadgeToast] = useState(null);

  // Save badges when they change
  useEffect(() => {
    localStorage.setItem('unlockedBadges', JSON.stringify(unlockedBadges));
  }, [unlockedBadges]);

  // Confetti celebration tracking
  const celebrationShownForDate = useRef('');

  // Streak celebration tracking
  const lastShownStreakMilestone = useRef(0);
  const [streakToast, setStreakToast] = useState(null);

  // --- SMART ALERTS LOGIC ---
  const lastAlertRef = useRef(null);

  // Request Notification Permissions on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Check for alerts every minute
  useEffect(() => {
    if (!smartAlerts) return;

    const checkHydration = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // 1. Check Active Hours
      if (currentTimeStr < alertStartTime || currentTimeStr > alertEndTime) return;

      // 2. Check Goal (Don't bug if already done)
      if (totalWater >= goal) return;

      // 3. Find Last Drink Time
      let lastDrinkTime = null;
      if (todayLogs && todayLogs.length > 0) {
        // logs should be chronological or reverse-chronological, but let's robustly find the latest
        const sortedLogs = [...todayLogs].sort((a, b) => new Date(b.time || b.timestamp) - new Date(a.time || a.timestamp));
        lastDrinkTime = new Date(sortedLogs[0].time || sortedLogs[0].timestamp);
      }

      // 4. Calculate Elapsed Time (hours)
      let elapsedHours;
      if (lastDrinkTime) {
        const diffMs = now - lastDrinkTime;
        elapsedHours = diffMs / (1000 * 60 * 60);
      } else {
        // No logs today. Measure from Start Time.
        const [startH, startM] = alertStartTime.split(':').map(Number);
        const startTimeDate = new Date();
        startTimeDate.setHours(startH, startM, 0, 0);

        // If 'now' is before start time, elapsed is negative (ignored)
        const diffSinceStart = now - startTimeDate;
        elapsedHours = diffSinceStart / (1000 * 60 * 60);
      }

      // 5. Trigger Alert if overdue
      if (elapsedHours >= alertFrequency) {
        // Prevent spamming: ensure we haven't alerted recently (e.g., within the last hour)
        const lastAlert = lastAlertRef.current;
        const timeSinceLastAlert = lastAlert ? (now - lastAlert) / (1000 * 60 * 60) : 100;

        if (timeSinceLastAlert >= 1) { // 1 hour cool-down
          if (Notification.permission === "granted") {
            new Notification("Time to Hydrate! 💧", {
              body: `You haven't logged any water for over ${Math.floor(elapsedHours)} hours. Stay on track!`,
            });
            lastAlertRef.current = now;
          }
        }
      }
    };

    const timer = setInterval(checkHydration, 60 * 1000); // Check every minute
    return () => clearInterval(timer);
  }, [smartAlerts, alertFrequency, alertStartTime, alertEndTime, todayLogs, totalWater, goal]);


  // Trigger confetti when goal is reached (only for today, only once per day)
  useEffect(() => {
    const isToday = selectedDate === getLocalDateString();
    const goalReached = totalWater >= goal;
    const alreadyCelebrated = celebrationShownForDate.current === selectedDate;

    if (isToday && goalReached && !alreadyCelebrated && totalWater > 0) {
      celebrationShownForDate.current = selectedDate;
      // Fire confetti burst!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#22c55e']
      });
      // Second burst slightly delayed
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#6366f1', '#ec4899', '#f59e0b']
        });
      }, 200);
    }
  }, [totalWater, goal, selectedDate]);

  // Streak milestone notifications
  useEffect(() => {
    const streakMilestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
    const milestone = streakMilestones.find(m => streak >= m && m > lastShownStreakMilestone.current);

    if (milestone && streak > 0) {
      lastShownStreakMilestone.current = milestone;
      const messages = {
        3: { emoji: '🔥', text: '3-day streak! You\'re building a habit!' },
        7: { emoji: '⭐', text: '1 week streak! Amazing consistency!' },
        14: { emoji: '🏅', text: '2 week streak! Hydration pro!' },
        21: { emoji: '🎯', text: '3 week streak! Habit formed!' },
        30: { emoji: '🏆', text: '30-day streak! Unstoppable!' },
        60: { emoji: '💎', text: '60-day streak! Legend status!' },
        90: { emoji: '👑', text: '90-day streak! Royalty!' },
        180: { emoji: '🌟', text: '6 months! Hydration master!' },
        365: { emoji: '🎊', text: '1 YEAR! Hydration God!' }
      };
      setStreakToast(messages[milestone]);
      setTimeout(() => setStreakToast(null), 4000);
    }
  }, [streak]);

  // 1. Initial Data Fetch (re-runs when USER_ID changes after auth)
  useEffect(() => {
    if (!auth.loading && USER_ID) {
      fetchHistory();
    }
  }, [auth.loading, USER_ID]);

  // Refetch when selected date changes (also when USER_ID changes)
  useEffect(() => {
    if (!auth.loading && USER_ID) {
      fetchDataForDate(selectedDate);
    }
  }, [selectedDate, auth.loading, USER_ID]);

  // NEW: Sync effective goal to backend when conditions change
  // This ensures that if you raise your goal (e.g. Hot Weather), the backend
  // immediately knows. If you haven't met the new goal, your streak will drop.
  useEffect(() => {
    // Only sync if looking at today (past dates are locked)
    const todayStr = getLocalDateString();
    if (selectedDate === todayStr) {
      const syncGoal = async () => {
        try {
          await fetch(`${API_URL}/update-goal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: USER_ID,
              date: todayStr,
              goal: effectiveGoal
            })
          });
          // Re-fetch history to update streak (it might drop if goal > total)
          fetchHistory();
        } catch (e) {
          console.error("Failed to sync goal", e);
        }
      };

      // Debounce to allow rapid toggling
      const timer = setTimeout(syncGoal, 500);
      return () => clearTimeout(timer);
    }
  }, [effectiveGoal, selectedDate]);

  // NEW: Dedicated Streak Fetcher
  const fetchStreak = async () => {
    try {
      // Goal param is legacy for streak but might be used by other stats
      const statsRes = await fetch(`${API_URL}/stats/${USER_ID}?days=30&goal=${goal}&client_date=${getLocalDateString()}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStreak(statsData.streak || 0);
      }
    } catch (e) { /* ignore streak fetch errors */ }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history/${USER_ID}?date=${getLocalDateString()}`);
      if (!response.ok) throw new Error("Backend offline");
      const data = await response.json();
      setTodayLogs(data.logs || []);
      setTotalWater(data.total_today);
      if (data.historical_goal) setHistoricalGoal(data.historical_goal);
      setIsBackendConnected(true);

      // Also fetch streak from stats
      // Also fetch streak from stats
      fetchStreak();
    } catch (error) {
      console.log("Backend offline, using local state");
      setIsBackendConnected(false);
    }
  };

  // Fetch total for a specific date
  const fetchDataForDate = async (dateStr) => {
    try {
      // Fetch logs for the selected date
      const historyRes = await fetch(`${API_URL}/history/${USER_ID}?date=${dateStr}`);
      if (historyRes.ok) {
        const data = await historyRes.json();
        setTodayLogs(data.logs || []);
        setTotalWater(data.total_today || 0);
        if (data.historical_goal) setHistoricalGoal(data.historical_goal);
        else setHistoricalGoal(null);
        setIsBackendConnected(true);
      }
    } catch (error) {
      console.log("Failed to fetch date data");
    }
  };

  // 2. Logic: Add Water (supports backdated logging)
  const handleAddWater = async (amount, drinkType = null) => {
    const todayStr = getLocalDateString();
    const isBackdating = selectedDate !== todayStr;

    try {
      // Optimistic UI Update
      const tempId = Date.now();
      const newTotal = totalWater + amount;
      setTotalWater(newTotal);
      const newLog = {
        id: tempId,
        amount,
        time: isBackdating ? `${selectedDate}T12:00:00` : new Date().toISOString(),
        timestamp: new Date().toISOString(),
        drinkType: drinkType?.id || 'water'
      };
      setLogs([...logs, newLog]);
      setTodayLogs([newLog, ...todayLogs]);

      // 🏆 BADGE CHECK: Check for newly unlocked badges
      const newlyUnlocked = checkBadges(
        unlockedBadges,
        [...logs, newLog], // Updated history
        newLog,
        newTotal,
        effectiveGoal,
        streak
      );

      if (newlyUnlocked.length > 0) {
        // Unlock the badges
        setUnlockedBadges(prev => [...prev, ...newlyUnlocked.map(b => b.id)]);

        // Show badge toast for the first one (queue others if needed)
        setBadgeToast(newlyUnlocked[0]);
        setTimeout(() => setBadgeToast(null), 4000);

        // Special celebration for big achievements
        if (newlyUnlocked.some(b => ['hydration_hero', 'week_warrior', 'month_master'].includes(b.id))) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#60A5FA', '#10B981', '#F59E0B']
          });
        }
      }

      // API Call with optional date for backdating
      const response = await fetch(`${API_URL}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          amount,
          // CRITICAL: For today, record the effective smart goal.
          // For backdated logs, use base goal to avoid polluting history with today's conditions.
          goal: isBackdating ? goal : effectiveGoal,
          // ALWAYS send client's local date to prevent server UTC mismatch
          date: isBackdating ? selectedDate : getLocalDateString()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Sync with server truth
        setTotalWater(data.total_today);
        if (data.today_logs) setTodayLogs(data.today_logs);
        setIsBackendConnected(true);

        // NEW: Update streak if this log triggered a milestone
        fetchStreak();
      } else {
        throw new Error("API Failed");
      }
    } catch (e) {
      console.log("Offline mode: Logged locally");
      // Keep optimistic update, just set flag
      setIsBackendConnected(false);
    }
  };

  // 2b. Logic: Delete Log Entry
  const handleDeleteLog = async (logId) => {
    // Optimistic: Remove from UI immediately
    const deletedLog = todayLogs.find(log => log.id === logId);
    setTodayLogs(todayLogs.filter(log => log.id !== logId));
    if (deletedLog) {
      setTotalWater(Math.max(0, totalWater - deletedLog.amount));
    }

    try {
      const response = await fetch(`${API_URL}/log/${logId}?user_id=${USER_ID}&date=${selectedDate}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        // Sync with server truth
        setTotalWater(data.total_today);
        if (data.today_logs) setTodayLogs(data.today_logs);
        setIsBackendConnected(true);

        // NEW: Refresh streak immediately (Auditing Fix)
        // Use fetchStreak() instead of fetchHistory() to avoid resetting the view to Today
        fetchStreak();
      } else {
        // Revert on failure
        if (deletedLog) {
          setTodayLogs([...todayLogs]);
          setTotalWater(totalWater);
        }
      }
    } catch (e) {
      console.log("Delete failed, reverting");
      setIsBackendConnected(false);
    }
  };

  // 3. Logic: Trigger AI
  const handleTriggerAi = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch(`${API_URL}/ai-feedback?user_id=${USER_ID}&goal=${goal}`);
      if (response.ok) {
        const data = await response.json();
        setAiMessage(data.message);
        setIsBackendConnected(true);
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      console.log("Using Mock AI");
      const msg = await getMockAiFeedback(totalWater, goal);
      setAiMessage(msg);
    }
    setLoadingAi(false);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800'
      : 'bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50'
      }`}>
      {/* Streak Toast Notification */}
      {streakToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            }`}>
            <span className="text-3xl">{streakToast.emoji}</span>
            <span className="font-bold text-lg">{streakToast.text}</span>
          </div>
        </div>
      )}

      {/* 🏆 BADGE UNLOCK TOAST */}
      {badgeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-8 duration-500">
          <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border-2 ${isDarkMode
            ? 'bg-gradient-to-r from-gray-900 to-gray-800 border-yellow-500/50 text-white'
            : 'bg-gradient-to-r from-white to-yellow-50 border-yellow-400 text-gray-800'
            } backdrop-blur-xl`}>
            <div className="relative">
              <span className="text-5xl filter drop-shadow-lg animate-bounce">{badgeToast.icon}</span>
              <div className="absolute -top-1 -right-1">
                <Trophy size={20} className="text-yellow-500" fill="currentColor" />
              </div>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                🏆 Badge Unlocked!
              </p>
              <p className="text-lg font-black">{badgeToast.name}</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{badgeToast.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Responsive container - balanced for tablet/desktop, full-width for mobile */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
      <div className="min-h-screen flex justify-center">
        <div className={`w-full max-w-2xl min-h-screen overflow-hidden relative transition-colors duration-300 md:shadow-xl md:border-x ${isDarkMode ? 'bg-gray-800 md:border-gray-700' : 'bg-[#F3F6FF] md:border-gray-200'
          }`}>
          <div className="h-screen overflow-y-auto pb-40">
            {activeTab === 'home' && (
              <HomeScreen
                totalWater={totalWater}
                goal={effectiveGoal} baseGoal={goal} setGoal={setGoal} goalData={goalData}
                drinkAmount={drinkAmount} setDrinkAmount={setDrinkAmount}
                onAddWater={handleAddWater}
                aiMessage={aiMessage}
                loadingAi={loadingAi}
                triggerAi={handleTriggerAi}
                isBackendConnected={isBackendConnected}
                userName={userName}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                isDarkMode={isDarkMode}
                todayLogs={todayLogs}
                onDeleteLog={handleDeleteLog}
                quickAddPresets={quickAddPresets}
                statsData={statsData}
                theme={theme}
                streak={streak}
                onSettingsClick={() => setActiveTab('settings')}
                historicalGoal={historicalGoal}
                userContext={userContext}
                onCloudSync={() => setIsLoginModalOpen(true)}
              />
            )}
            {activeTab === 'stats' && <StatsScreen logs={logs} goal={goal} effectiveGoal={effectiveGoal} isDarkMode={isDarkMode} unlockedBadges={unlockedBadges} userId={USER_ID} />}
            {activeTab === 'alarm' && <AlarmScreen totalWater={totalWater} goal={goal} effectiveGoal={effectiveGoal} logs={logs} />}
            {activeTab === 'settings' && (
              <SettingsScreen
                goal={goal}
                setGoal={setGoal}
                drinkAmount={drinkAmount}
                setDrinkAmount={setDrinkAmount}
                userName={userName}
                setUserName={handleSetUserName}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                smartAlerts={smartAlerts}
                setSmartAlerts={setSmartAlerts}
                alertFrequency={alertFrequency}
                setAlertFrequency={setAlertFrequency}
                alertStartTime={alertStartTime}
                setAlertStartTime={setAlertStartTime}
                alertEndTime={alertEndTime}
                setAlertEndTime={setAlertEndTime}
                quickAddPresets={quickAddPresets}
                setQuickAddPresets={setQuickAddPresets}
                theme={theme}
                setTheme={setTheme}
                dailyConditions={dailyConditions}
                setDailyConditions={setDailyConditions}
                goalData={goalData}
                onRequestPermission={requestPermission}
                onTestNotification={sendTestNotification}
                userEmail={userContext.email}
              />
            )}
          </div>
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onQuickAdd={() => handleAddWater(drinkAmount)} isDarkMode={isDarkMode} />
        </div>
        <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-visible::-webkit-scrollbar { height: 8px; }
        .scrollbar-visible::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .scrollbar-visible::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 4px; }
        .scrollbar-visible::-webkit-scrollbar-thumb:hover { background: #a5b4fc; }
        .wave-animation { animation: wave 4s linear infinite; }
        .wave-animation-delayed { animation: wave 6s linear infinite; }
        @keyframes wave {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-5px) rotate(2deg); }
            100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-float-up {
            animation: floatUp 1.5s ease-out forwards;
        }
        @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            50% { opacity: 1; transform: translateY(-20px) scale(1.2); }
            100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }
        .animate-pulse-ring {
            animation: pulseRing 0.5s ease-out;
        }
        @keyframes pulseRing {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .animate-wave-flow {
            animation: waveFlow 4s linear infinite;
        }
        .animate-wave-flow-reverse {
            animation: waveFlow 6s linear infinite reverse;
        }
        @keyframes waveFlow {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-bubble-rise {
            animation: bubbleRise 3s infinite ease-in;
        }
        @keyframes bubbleRise {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { opacity: 0.5; }
            100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
        }
        .animate-sway {
            animation: sway 3s ease-in-out infinite alternate;
            transform-origin: bottom center;
        }
        @keyframes sway {
            0% { transform: rotate(-5deg); }
            100% { transform: rotate(5deg); }
        }
        .animate-water-pulse {
            animation: waterPulse 3s infinite ease-out;
        }
        @keyframes waterPulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.15); opacity: 0; }
        }
      `}</style>
      </div>
    </div>
  );
}
