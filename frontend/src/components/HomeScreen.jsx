import React, { useState } from 'react';
import {
    Bell, Settings, Check, Wifi, WifiOff, Edit2, Zap, Grid, X, ChevronLeft, ChevronRight, Flame, BarChart2, Droplets, Sparkles, Trophy
} from 'lucide-react';
import HydrationVisualizer from './HydrationVisualizer';
import { DRINK_TYPES, getAllDrinks, getCommonDrinks } from '../constants/drinkTypes';
import { getLocalDateString } from '../utils/dateUtils';

const API_URL = import.meta.env.VITE_API_URL || "/api";

const HomeScreen = ({
    totalWater,
    goal,
    globalDefaultGoal,
    setGlobalDefaultGoal,
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
    setHistoricalGoal, // NEW: Setter for historical goal edits
    userContext, // NEW: Auth State
    onCloudSync // NEW: Trigger Auth Modal
}) => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const isViewingToday = selectedDate === todayStr;
    const [showNotifications, setShowNotifications] = useState(false); // NEW: Notification Panel State

    // CRITICAL (Three-Tier Goal Architecture v1.8.0):
    // - TODAY: Use effectiveGoal (globalDefaultGoal + conditions)
    // - PAST: Use historicalGoal (from DailySnapshot) or fallback to globalDefaultGoal
    const displayGoal = isViewingToday ? goal : (historicalGoal || globalDefaultGoal);

    const percentage = (totalWater / displayGoal) * 100; // Allow > 100% for display
    const circumference = 2 * Math.PI * 48;
    const offset = circumference - (percentage / 100) * circumference;
    const [isEditing, setIsEditing] = useState(false);
    const [editGoalValue, setEditGoalValue] = useState(0); // NEW: Local state for editing to prevent partial global updates

    const handleToggleEditGoal = async () => {
        if (isEditing) {
            // SAVE LOGIC
            const newGoal = Number(editGoalValue);

            // 1. Always update Backend Snapshot
            try {
                await fetch(`${API_URL}/update-goal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userContext.userId, date: selectedDate, goal: newGoal })
                });
            } catch (e) {
                console.error("Failed to update goal backend", e);
            }

            // 2. Conditional State Update
            if (isViewingToday) {
                // If editing TODAY, we update the Global App State
                // This persists to localStorage and becomes the default for future days
                setGlobalDefaultGoal(newGoal);
            } else {
                // If editing PAST, we ONLY update the historical display
                // We do NOT call setGlobalDefaultGoal(), so the global default remains untouched.
                // v1.7.0: Backend already updated via /update-goal. Local state update is sufficient.
                // Stats/streak will refresh on next navigation or water log action.
                setHistoricalGoal(newGoal);
            }

            setIsEditing(false);
        } else {
            // START EDITING
            setEditGoalValue(displayGoal);
            setIsEditing(true);
        }
    };

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

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-3 rounded-full shadow-sm border transition-colors relative ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                        >
                            <Bell size={22} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                            {/* Notification Dot if there are notifications */}
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        </button>

                        {/* Dynamic Notification Panel */}
                        {showNotifications && (
                            <div className={`absolute right-0 mt-2 w-72 rounded-2xl shadow-xl border z-50 p-4 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-800'}`}>
                                <h3 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-70">Notifications</h3>
                                <div className="space-y-3">
                                    {/* 1. Streak Notification */}
                                    {streak > 0 ? (
                                        <div className={`p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                                <Flame size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">On Fire! 🔥</p>
                                                <p className="text-xs opacity-70">You're on a {streak}-day streak. Keep it up!</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <div className="p-2 bg-gray-200 rounded-lg text-gray-500">
                                                <Flame size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Start a Streak</p>
                                                <p className="text-xs opacity-70">Log water today to start your streak!</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Goal Progress Notification */}
                                    {percentage >= 100 ? (
                                        <div className={`p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                                <Trophy size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Goal Crushed! 🏆</p>
                                                <p className="text-xs opacity-70">You hit your {displayGoal}ml goal today.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                <Droplets size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Keep Drinking 💧</p>
                                                <p className="text-xs opacity-70">{Math.round(displayGoal - totalWater)}ml left to reach your goal.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
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
                                <button
                                    onClick={() => handleToggleEditGoal()}
                                    className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                                >
                                    {isEditing ? <Check size={18} className="text-green-500" /> : <Edit2 size={18} />}
                                </button>
                            </div>

                            {/* Context-Aware Goal Bonuses Display - ONLY for TODAY */}
                            {isViewingToday && goalData && goalData.bonuses.length > 0 && (
                                <div className={`w-full mb-4 p-3 rounded-2xl flex flex-wrap items-center gap-2 ${isDarkMode ? 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-700/30' : 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100'
                                    }`}>
                                    <Zap size={16} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                                    <span className={`text-xs font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>Smart Goal:</span>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{globalDefaultGoal}ml</span>
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
                                        <label className={`text-xs uppercase font-extrabold mb-1 block flex items-center gap-1 ${isViewingToday ? 'text-blue-500' : 'text-amber-500'}`}>
                                            {isViewingToday ? (
                                                <><span>🌍</span> Setting Global Baseline</>
                                            ) : (
                                                <><span>📅</span> Correcting Historical Entry</>
                                            )}
                                        </label>
                                        <p className="text-[10px] text-gray-500 mb-2">
                                            {isViewingToday
                                                ? "This will be your new default goal moving forward."
                                                : "This change only affects this specific date."}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editGoalValue}
                                                onChange={(e) => setEditGoalValue(Number(e.target.value))}
                                                onFocus={(e) => e.target.select()} // Auto-select for easier editing
                                                className={`w-full p-2 rounded-lg border focus:outline-none font-bold text-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                                                placeholder="e.g. 2500"
                                                autoFocus
                                            />
                                            <span className="text-sm text-gray-500">ml</span>
                                        </div>
                                        {goalData && goalData.totalBonus > 0 && isViewingToday && (
                                            <p className={`text-xs mt-2 font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                + {goalData.totalBonus}ml active bonus = {Number(editGoalValue) + goalData.totalBonus}ml total today
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
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div
                                className={`w-full max-w-md max-h-[70vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border ${isDarkMode
                                    ? 'bg-gray-900/95 border-gray-700'
                                    : 'bg-white/95 border-gray-100'
                                    } backdrop-blur-xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200`}
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

export default HomeScreen;
