import React, { useState, useEffect } from 'react';
import {
    MoreHorizontal, Activity, Trophy
} from 'lucide-react';
import { getAllBadges } from '../constants/badges';
import { getLocalDateString } from '../utils/dateUtils';

const API_URL = import.meta.env.VITE_API_URL || "/api";

const StatsScreen = ({ logs, globalDefaultGoal, isDarkMode, unlockedBadges = [], userId }) => {
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
            const response = await fetch(`${API_URL}/stats/${userId}?days=${days}&goal=${globalDefaultGoal}&client_date=${getLocalDateString()}`);
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
            intensity: Math.min(d.total / globalDefaultGoal, 1) // 0-1 scale
        }));
    };

    const { totals: weekData, labels: weekLabels } = getWeekData();
    const maxWeek = Math.max(...weekData, globalDefaultGoal);

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
                                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min((statsData?.daily?.[0]?.total || 0) / globalDefaultGoal, 1))}`}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{Math.round((statsData?.daily?.[0]?.total || 0) / globalDefaultGoal * 100)}%</span>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{statsData?.daily?.[0]?.total || 0}/{globalDefaultGoal}ml</span>
                                    {(statsData?.daily?.[0]?.total || 0) === 0 && (
                                        <span className={`text-[10px] mt-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Tap + to start!</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-center text-sm text-gray-600">
                            {(statsData?.daily?.[0]?.total || 0) >= globalDefaultGoal
                                ? '🎉 Goal achieved! Great job staying hydrated!'
                                : `${globalDefaultGoal - (statsData?.daily?.[0]?.total || 0)}ml remaining to reach your goal`
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
                                                const intensity = Math.min(dayData.total / globalDefaultGoal, 1);
                                                const isToday = dateStr === getLocalDateString();

                                                cells.push(
                                                    <div
                                                        key={day}
                                                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-all
                            ${getHeatmapColor(intensity)} 
                            ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
                            ${dayData.total >= globalDefaultGoal ? 'text-white' : 'text-gray-700'}
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
                                        const daysWithGoal = monthData.filter(d => d.total >= globalDefaultGoal).length;
                                        return (
                                            <div className="mt-4 text-center text-sm text-gray-600">
                                                <span className="font-bold text-indigo-600">{(monthTotal / 1000).toFixed(1)}L</span> total •
                                                <span className="font-bold text-green-600"> {daysWithGoal} days</span> globalDefaultGoal met
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
                                                            const intensity = Math.min(dayData.total / globalDefaultGoal, 1);

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
                            <span>100%+ globalDefaultGoal</span>
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
                            if (todayTotal >= globalDefaultGoal) return `🎉 Goal achieved! You've had ${todayTotal}ml today. Keep it up!`;
                            if (todayTotal > globalDefaultGoal * 0.5) return `You're at ${Math.round(todayTotal / globalDefaultGoal * 100)}% of your goal. ${globalDefaultGoal - todayTotal}ml to go!`;
                            if (todayTotal > 0) return `Good start! ${todayTotal}ml logged. Drink ${globalDefaultGoal - todayTotal}ml more to hit your goal.`;
                            return 'No water logged yet today. Start hydrating! 💧';
                        }

                        // Week view insight
                        if (viewMode === 'Week') {
                            const daysWithData = statsData?.daily?.filter(d => d.total > 0).length || 0;
                            if (weekAvg >= globalDefaultGoal) return `Excellent week! Averaging ${weekAvg}ml/day, above your ${globalDefaultGoal}ml globalDefaultGoal. 🌟`;
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

                                    const daysWithGoal = yearData.filter(d => d.total >= globalDefaultGoal).length;
                                    const totalLiters = (yearData.reduce((sum, d) => sum + d.total, 0) / 1000).toFixed(1);

                                    // Calculate monthly stats for best/worst
                                    const monthStats = Array.from({ length: 12 }, (_, m) => {
                                        const mData = yearData.filter(d => new Date(d.date + 'T12:00:00').getMonth() === m);
                                        const daysGoalMet = mData.filter(d => d.total >= globalDefaultGoal).length;
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

                                    const daysWithGoal = monthData.filter(d => d.total >= globalDefaultGoal).length;
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
                                            const goalMet = dayData.filter(d => d.total >= globalDefaultGoal).length;
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
                                const daysWithGoal = gridData.filter(d => d.total >= globalDefaultGoal).length;
                                const goalRate = Math.round(daysWithGoal / gridDays * 100);

                                // Calculate trend vs previous period
                                const prevData = statsData?.daily?.slice(gridDays, gridDays * 2).filter(d => d.total > 0) || [];
                                const prevDaysWithGoal = prevData.filter(d => d.total >= globalDefaultGoal).length;
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
                                    return `🎯 ${goalRate}% globalDefaultGoal rate • ${trendIcon}${streak > 0 ? ` • 🔥 ${streak}-day streak` : ''}${limitedWarning}`;

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
                                        return { name: mName, rate: mData.length > 0 ? Math.round(mData.filter(x => x.total >= globalDefaultGoal).length / mData.length * 100) : 0, count: mData.length };
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

                                    return `🎯 1 year: ${daysWithGoal} days globalDefaultGoal met (${goalRate}%) • ${totalLiters}L total${best ? ` • Best: ${best.name} 🏆` : ''}`;
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

export default StatsScreen;
