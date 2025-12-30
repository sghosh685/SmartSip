import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Flame, Activity, Clock,
  MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown,
  Home, BarChart2, Settings, Plus, Sparkles, Edit2, Check,
  Wifi, WifiOff, Moon, Sun, User, Droplets, Target, Volume2, Trash2, X
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- CONFIGURATION ---
// Updated to port 8001 to match your backend
const API_URL = "/api";
const USER_ID = "alex_johnson_user";

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
  <div className={`absolute bottom-0 w-full px-6 py-4 flex justify-between items-end pb-8 z-50 rounded-t-3xl transition-colors duration-300 ${isDarkMode
    ? 'bg-gray-900 border-t border-gray-700 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]'
    : 'bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]'
    }`}>
    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
      <span className="text-[10px] font-medium">Home</span>
    </button>
    <button onClick={() => setActiveTab('alarm')} className={`flex flex-col items-center gap-1 ${activeTab === 'alarm' ? 'text-indigo-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <Clock size={24} strokeWidth={activeTab === 'alarm' ? 2.5 : 2} />
      <span className="text-[10px] font-medium">Alarm</span>
    </button>
    <div className="relative -top-8">
      <button
        onClick={onQuickAdd}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 border-4 border-white hover:scale-105 transition-transform"
      >
        <Plus size={28} className="text-white" strokeWidth={3} />
      </button>
    </div>
    <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-indigo-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <BarChart2 size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
      <span className="text-[10px] font-medium">Stats</span>
    </button>
    <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-indigo-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
      <span className="text-[10px] font-medium">Settings</span>
    </button>
  </div>
);

// --- SCREEN 1: HOME ---
const HomeScreen = ({
  totalWater,
  goal,
  setGoal,
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
  quickAddPresets
}) => {
  const percentage = Math.min((totalWater / goal) * 100, 100);
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (percentage / 100) * circumference;
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAnimation, setShowAddAnimation] = useState(false);
  const [lastAddedAmount, setLastAddedAmount] = useState(0);

  const today = new Date();
  const todayStr = getLocalDateString(today);
  const isViewingToday = selectedDate === todayStr;

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
    if (percentage >= 25) return '🌊 Great start! Stay consistent.';
    return '💧 Let\'s get hydrated today!';
  };

  return (
    <div className="px-6 pb-32 pt-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="User" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getGreeting()}</p>
              {isBackendConnected ?
                <span className={`text-[8px] px-1 rounded flex items-center gap-1 ${isDarkMode ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-700'}`}><Wifi size={8} /> Online</span> :
                <span className={`text-[8px] px-1 rounded flex items-center gap-1 ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}><WifiOff size={8} /> Offline Mode</span>
              }
            </div>
            <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{userName}</h2>
            <p className={`text-[10px] ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{getMotivation()}</p>
          </div>
        </div>
        <button className={`p-2 rounded-full shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <Bell size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        </button>
      </div>

      {/* Date Strip - Clickable with week navigation arrows */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">
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
              className={`p-2 rounded-full shadow-sm transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
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
              className={`p-2 rounded-full shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
            >
              <ChevronRight size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>
        </div>
        <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Show week containing selectedDate */}
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
                className={`flex flex-col items-center justify-center min-w-[3.5rem] h-20 rounded-[20px] transition-all
                  ${isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-105' :
                    isFutureDate ? (isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300') + ' cursor-not-allowed opacity-50' :
                      isTodayDate ? (isDarkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-600') + ' hover:opacity-80' :
                        isDarkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 cursor-pointer' : 'bg-white text-gray-400 hover:bg-gray-50 cursor-pointer'}`}
              >
                <span className="text-xs font-medium mb-1">{day}</span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : isFutureDate ? (isDarkMode ? 'text-gray-600' : 'text-gray-300') : isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {weekStart.getDate()}
                </span>
                {isTodayDate && !isSelected && <span className={`text-[8px] ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>today</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', val: '140 Kcal', label: 'Calories' },
          { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', val: '200 bpm', label: 'Heart Rate' },
          { icon: Clock, color: 'text-pink-500', bg: 'bg-pink-50', val: '03:00', label: 'Workout' },
        ].map((item, i) => (
          <div key={i} className={`${item.bg.replace('50', '50')} bg-opacity-50 p-4 rounded-3xl flex flex-col gap-3 shadow-sm`}>
            <div className="p-2 bg-white rounded-full w-min"><item.icon size={16} className={item.color} /></div>
            <div><p className="text-sm font-bold text-gray-800">{item.val}</p><p className="text-[10px] text-gray-500">{item.label}</p></div>
          </div>
        ))}
      </div>

      {/* MAIN TARGET CARD */}
      <div className={`p-6 rounded-[32px] shadow-sm mb-6 relative overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 z-0 ${isDarkMode ? 'bg-gray-800' : 'bg-indigo-50'}`}></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Daily Target</h3>
              <button onClick={() => setIsEditing(!isEditing)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                {isEditing ? <Check size={14} className="text-green-500" /> : <Edit2 size={14} />}
              </button>
            </div>

            {isEditing ? (
              <div className="mb-4 space-y-2 animate-in fade-in slide-in-from-left-2">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold">Goal Amount</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="w-20 border-b border-indigo-300 focus:outline-none font-bold text-gray-800 bg-transparent" />
                    <span className="text-xs text-gray-500">ml</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-bold">Drink Size</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={drinkAmount} onChange={(e) => setDrinkAmount(Number(e.target.value))} className="w-20 border-b border-indigo-300 focus:outline-none font-bold text-gray-800 bg-transparent" />
                    <span className="text-xs text-gray-500">ml</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className={`text-xs mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Goal: {goal}ml</p>
                <button
                  onClick={() => {
                    setLastAddedAmount(drinkAmount);
                    setShowAddAnimation(true);
                    onAddWater(drinkAmount);
                    setTimeout(() => setShowAddAnimation(false), 1500);
                  }}
                  className={`text-sm font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-300' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'}`}
                >
                  Drink {drinkAmount} ml <Plus size={16} />
                </button>
              </>
            )}
          </div>
          <div className="w-28 h-28 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
              <circle cx="56" cy="56" r="48" stroke={isDarkMode ? '#374151' : '#F3F4F6'} strokeWidth="8" fill="transparent" />
              <circle cx="56" cy="56" r="48" stroke="url(#progressGradient)" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out drop-shadow-lg" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{totalWater}ml</span>
              <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{(percentage).toFixed(0)}%</span>
            </div>
            {/* Floating +ml animation */}
            {showAddAnimation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-lg font-bold text-indigo-500 animate-float-up">+{lastAddedAmount}ml</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI COACH CARD */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-[32px] shadow-lg text-white relative overflow-hidden">
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h3 className="font-bold">AI Coach Insight</h3>
          </div>
          <button onClick={triggerAi} disabled={loadingAi} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            {loadingAi ? <Activity size={16} className="animate-spin" /> : <ChevronDown size={16} />}
          </button>
        </div>
        <p className="text-sm font-medium opacity-90 relative z-10 min-h-[40px] flex items-center">
          {loadingAi ? "Analyzing hydration levels..." : (aiMessage || "Click the button to get personalized advice based on your intake.")}
        </p>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* QUICK-ADD PRESETS */}
      {quickAddPresets && quickAddPresets.length > 0 && (
        <div className="mt-5">
          <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>⚡ Quick Add</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {quickAddPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onAddWater(preset.amount)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl font-medium transition-all active:scale-95 hover:scale-[1.02] ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-800 shadow-md border border-gray-100'}`}
              >
                <span className="text-2xl">{preset.icon}</span>
                <span className="text-base font-bold">{preset.amount}ml</span>
                <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TODAY'S LOGS */}
      {todayLogs && todayLogs.length > 0 && (
        <div className={`mt-4 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Today's Logs ({todayLogs.length})
            </p>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total: {todayLogs.reduce((sum, log) => sum + log.amount, 0)}ml
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {todayLogs.map((log) => (
              <div key={log.id} className={`flex items-center justify-between py-2 px-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Droplets size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>+{log.amount}ml</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}
                    title="Delete this entry"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
const StatsScreen = ({ logs, goal, isDarkMode }) => {
  const [viewMode, setViewMode] = useState('Week');
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch(`${API_URL}/stats/${USER_ID}?days=${days}&goal=${goal}`);
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
  }, [viewMode]);

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
    <div className="px-6 pb-32 pt-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Statistics</h2>
        <button className={`p-2 rounded-full shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}><MoreHorizontal size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} /></button>
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
      {viewMode === 'Day' && (
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
      )}

      {/* Weekly Bar Chart */}
      {viewMode !== 'Year' && (
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
      )}

      {/* HISTORY VIEW - Unified with year chips and view toggle */}
      {viewMode === 'History' && (
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
      )}

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
    </div>
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
  notificationsEnabled,
  setNotificationsEnabled,
  quickAddPresets,
  setQuickAddPresets
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [tempGoal, setTempGoal] = useState(goal);
  const [tempDrink, setTempDrink] = useState(drinkAmount);

  // Presets management state
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [presetForm, setPresetForm] = useState({ name: '', amount: '', icon: '💧' });

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
            <p className="text-xs text-gray-500">Hydration Champion 💧</p>
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

        {/* Notifications Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${notificationsEnabled ? (isDarkMode ? 'bg-green-900' : 'bg-green-100') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}`}>
              <Volume2 size={18} className={notificationsEnabled ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')} />
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Reminders</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hydration notifications</p>
            </div>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${notificationsEnabled ? 'bg-green-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-all duration-300 ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Manage Presets */}
      <div className={`p-6 rounded-[32px] shadow-sm mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Manage Presets</h3>
          <button
            onClick={() => {
              setEditingPreset(null);
              setPresetForm({ name: '', amount: '', icon: '💧' });
              setShowPresetsModal(true);
            }}
            className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {quickAddPresets.map((preset) => (
            <div key={preset.id} className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{preset.icon}</span>
                <div>
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{preset.amount}ml</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{preset.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    startEditPreset(preset);
                    setShowPresetsModal(true);
                  }}
                  className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About / Version */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-[32px] text-white text-center">
        <Droplets size={32} className="mx-auto mb-2 opacity-80" />
        <h3 className="font-bold text-lg">SmartSip</h3>
        <p className="text-sm opacity-80">AI-Powered Water Tracker</p>
        <p className="text-xs opacity-60 mt-2">Version 1.2.0 • Made with ❤️</p>
      </div>

      {/* Edit/Add Preset Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPresetsModal(false)}></div>
          <div className={`relative w-full max-w-sm p-6 rounded-[32px] shadow-2xl animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-xl font-bold mb-4">{editingPreset ? 'Edit Preset' : 'Add New Preset'}</h3>

            <div className="space-y-4">
              <div>
                <label className={`text-xs font-bold ml-1 mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Icon</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setPresetForm({ ...presetForm, icon })}
                      className={`text-2xl p-2 rounded-xl transition-all ${presetForm.icon === icon
                        ? (isDarkMode ? 'bg-indigo-600/20 ring-2 ring-indigo-500' : 'bg-indigo-50 ring-2 ring-indigo-500')
                        : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold ml-1 mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</label>
                <input
                  type="text"
                  value={presetForm.name}
                  onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  placeholder="e.g. My Bottle"
                  className={`w-full p-4 rounded-xl font-medium outline-none transition-all ${isDarkMode ? 'bg-gray-800 focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50 focus:ring-2 focus:ring-indigo-200'}`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold ml-1 mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Amount (ml)</label>
                <input
                  type="number"
                  value={presetForm.amount}
                  onChange={(e) => setPresetForm({ ...presetForm, amount: e.target.value })}
                  placeholder="e.g. 500"
                  className={`w-full p-4 rounded-xl font-medium outline-none transition-all ${isDarkMode ? 'bg-gray-800 focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50 focus:ring-2 focus:ring-indigo-200'}`}
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
                  className="flex-1 py-4 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 transition-all"
                >
                  Save Preset
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
  const [totalWater, setTotalWater] = useState(0);
  const [logs, setLogs] = useState([]);
  const [aiMessage, setAiMessage] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [goal, setGoal] = useState(2500);
  const [drinkAmount, setDrinkAmount] = useState(200);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [streak, setStreak] = useState(0);

  // Settings state
  const [userName, setUserName] = useState("Alex Johnson");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Selected date state (for viewing/logging past dates)
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  // Today's Logs state (individual entries)
  const [todayLogs, setTodayLogs] = useState([]);

  // Quick-Add Presets (customizable)
  const [quickAddPresets, setQuickAddPresets] = useState([
    { id: 1, name: 'Small Glass', amount: 150, icon: '🥛' },
    { id: 2, name: 'Coffee', amount: 300, icon: '☕' },
    { id: 3, name: 'Bottle', amount: 500, icon: '🧴' },
    { id: 4, name: 'Large Flask', amount: 750, icon: '🍶' },
  ]);

  // Confetti celebration tracking
  const celebrationShownForDate = useRef('');

  // Streak celebration tracking
  const lastShownStreakMilestone = useRef(0);
  const [streakToast, setStreakToast] = useState(null);

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

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchHistory();
  }, []);

  // Refetch when selected date changes
  useEffect(() => {
    fetchDataForDate(selectedDate);
  }, [selectedDate]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history/${USER_ID}`);
      if (!response.ok) throw new Error("Backend offline");
      const data = await response.json();
      setTodayLogs(data.logs || []);
      setTotalWater(data.total_today);
      setIsBackendConnected(true);

      // Also fetch streak from stats
      try {
        const statsRes = await fetch(`${API_URL}/stats/${USER_ID}?days=30&goal=${goal}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStreak(statsData.streak || 0);
        }
      } catch (e) { /* ignore streak fetch errors */ }
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
        setIsBackendConnected(true);
      }
    } catch (error) {
      console.log("Failed to fetch date data");
    }
  };

  // 2. Logic: Add Water (supports backdated logging)
  const handleAddWater = async (amount) => {
    const todayStr = getLocalDateString();
    const isBackdating = selectedDate !== todayStr;

    try {
      // Optimistic UI Update
      const tempId = Date.now();
      const newTotal = totalWater + amount;
      setTotalWater(newTotal);
      const newLog = { id: tempId, amount, time: isBackdating ? `${selectedDate}T12:00:00` : new Date().toISOString() };
      setLogs([...logs, newLog]);
      setTodayLogs([newLog, ...todayLogs]);

      // API Call with optional date for backdating
      const response = await fetch(`${API_URL}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          amount,
          goal,
          date: isBackdating ? selectedDate : null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Sync with server truth
        setTotalWater(data.total_today);
        if (data.today_logs) setTodayLogs(data.today_logs);
        setIsBackendConnected(true);
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
      const response = await fetch(`${API_URL}/log/${logId}?user_id=${USER_ID}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        // Sync with server truth
        setTotalWater(data.total_today);
        if (data.today_logs) setTodayLogs(data.today_logs);
        setIsBackendConnected(true);
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

      {/* Responsive container - balanced for tablet/desktop, full-width for mobile */}
      <div className="min-h-screen flex justify-center">
        <div className={`w-full max-w-2xl min-h-screen overflow-hidden relative transition-colors duration-300 md:shadow-xl md:border-x ${isDarkMode ? 'bg-gray-800 md:border-gray-700' : 'bg-[#F3F6FF] md:border-gray-200'
          }`}>
          <div className="h-screen overflow-y-auto pb-24">
            {activeTab === 'home' && (
              <HomeScreen
                totalWater={totalWater}
                goal={goal} setGoal={setGoal}
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
              />
            )}
            {activeTab === 'stats' && <StatsScreen logs={logs} goal={goal} isDarkMode={isDarkMode} />}
            {activeTab === 'alarm' && <AlarmScreen totalWater={totalWater} goal={goal} logs={logs} />}
            {activeTab === 'settings' && (
              <SettingsScreen
                goal={goal}
                setGoal={setGoal}
                drinkAmount={drinkAmount}
                setDrinkAmount={setDrinkAmount}
                userName={userName}
                setUserName={setUserName}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                notificationsEnabled={notificationsEnabled}
                setNotificationsEnabled={setNotificationsEnabled}
                quickAddPresets={quickAddPresets}
                setQuickAddPresets={setQuickAddPresets}
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
      `}</style>
      </div>
    </div>
  );
}
