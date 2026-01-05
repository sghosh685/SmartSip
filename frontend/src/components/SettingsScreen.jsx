import React, { useState, useRef } from 'react';
import {
    MoreHorizontal, Check, Edit2, Target, Droplets,
    Sparkles, Circle, Sprout, Sun, Moon, Zap, Bell,
    Plus, Trash2, LogOut, Info, Shield, HelpCircle
} from 'lucide-react';

const SettingsScreen = ({
    globalDefaultGoal,
    setGlobalDefaultGoal,
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
    const [tempGoal, setTempGoal] = useState(globalDefaultGoal);
    const [tempDrink, setTempDrink] = useState(drinkAmount);

    // Time Input Refs for programmatically showing picker
    const startTimeRef = useRef(null);
    const endTimeRef = useRef(null);

    // Presets management state
    const [showPresetsModal, setShowPresetsModal] = useState(false);
    const [editingPreset, setEditingPreset] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

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
        setGlobalDefaultGoal(tempGoal);
        setDrinkAmount(tempDrink);
        setEditingProfile(false);
    };

    return (
        <div className="px-6 pb-32 pt-6 animate-in fade-in duration-500">
            {/* Header */}
            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-50">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Settings</h2>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-2 rounded-full shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                    >
                        <MoreHorizontal size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                            <div className={`absolute right-0 top-12 w-48 rounded-2xl shadow-xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                <button
                                    onClick={() => { setShowMenu(false); alert("SmartSip v1.8.0\n\nThe hydration companion that keeps you refreshed!\n\nDeveloped with ❤️"); }}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Info size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
                                    <span className="text-sm font-medium">About</span>
                                </button>
                                <button
                                    onClick={() => { setShowMenu(false); alert("Need help?\n\nContact us at:\nsupport@smartsip.com\n\nOr visit our FAQ on the website."); }}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <HelpCircle size={16} className={isDarkMode ? 'text-purple-400' : 'text-purple-500'} />
                                    <span className="text-sm font-medium">Help</span>
                                </button>
                                <button
                                    onClick={() => { setShowMenu(false); alert("Privacy is important.\n\nSmartSip stores your data locally on your device and securely in the cloud via encrypted sync. We do not sell your data."); }}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Shield size={16} className={isDarkMode ? 'text-green-400' : 'text-green-500'} />
                                    <span className="text-sm font-medium">Privacy</span>
                                </button>
                                <div className={`h-px mx-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                                <button
                                    onClick={() => {
                                        if (confirm("This will clear local data and log you out. Your history remains safe in the cloud. Continue?")) {
                                            localStorage.clear();
                                            window.location.reload();
                                        }
                                    }}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isDarkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-500 hover:bg-red-50'}`}
                                >
                                    <LogOut size={16} />
                                    <span className="text-sm font-medium">Log Out</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
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
                                className={`text-lg font-bold bg-transparent border-b-2 focus:outline-none w-full ${isDarkMode ? 'text-white border-indigo-500' : 'text-gray-800 border-indigo-300'}`}
                            />
                        ) : (
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{userName}</h3>
                        )}
                        {userEmail ? (
                            <p className="text-xs text-blue-500 font-medium">{userEmail}</p>
                        ) : (
                            <p className="text-xs text-gray-500">Guest Mode</p>
                        )}
                        <p className="text-xs text-gray-400">Hydration Champion 💧 (v1.8.0)</p>
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
                            <span className={`font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{globalDefaultGoal} ml</span>
                        )}
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-blue-950' : 'bg-blue-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                                <Droplets size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                            </div>
                            <div>
                                <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Glass Size</p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Default drink amount</p>
                            </div>
                        </div>
                        {editingProfile ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={tempDrink}
                                    onChange={(e) => setTempDrink(Number(e.target.value))}
                                    className={`w-16 text-right font-bold bg-transparent border-b focus:outline-none ${isDarkMode ? 'text-blue-400 border-blue-700' : 'text-blue-600 border-blue-300'}`}
                                />
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ml</span>
                            </div>
                        ) : (
                            <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{drinkAmount} ml</span>
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
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Dark Mode</p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Easier on the eyes</p>
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
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Start Time */}
                                    <div
                                        onClick={() => startTimeRef.current?.showPicker()}
                                        className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-700 hover:border-indigo-500' : 'bg-white border-gray-100 hover:border-indigo-300'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-gray-800' : 'bg-amber-50'}`}>
                                                <Sun size={14} className="text-amber-500" />
                                            </div>
                                            <span className={`text-xs font-bold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Start</span>
                                        </div>
                                        <div className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
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
                                        className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-700 hover:border-indigo-500' : 'bg-white border-gray-100 hover:border-indigo-300'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-full shrink-0 ${isDarkMode ? 'bg-gray-800' : 'bg-indigo-50'}`}>
                                                <Moon size={14} className="text-indigo-400" />
                                            </div>
                                            <span className={`text-xs font-bold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>End</span>
                                        </div>
                                        <div className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
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

                <div className="grid grid-cols-2 gap-3 overflow-hidden">
                    {quickAddPresets.map((preset) => (
                        <div key={preset.id} className={`flex items-center justify-between p-3 rounded-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
                                    {preset.amount}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{preset.name}</p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{preset.amount}ml</p>
                                </div>
                            </div>
                            <div className="flex items-center shrink-0">
                                <button
                                    onClick={() => {
                                        startEditPreset(preset);
                                        setShowPresetsModal(true);
                                    }}
                                    className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeletePreset(preset.id)}
                                    className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                                >
                                    <Trash2 size={14} />
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
                <p className="text-xs opacity-60 mt-2">Version 1.8.0 • Three-Tier Goal Architecture</p>
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

export default SettingsScreen;
