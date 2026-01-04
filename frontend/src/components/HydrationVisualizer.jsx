import React from 'react';
import { Circle, Sprout, Leaf, Flower, Sun, Droplets } from 'lucide-react';

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

                {/* OVERFLOW EFFECT: Water droplets spilling when > 100% */}
                {percentage >= 100 && (
                    <div className="absolute -top-2 left-0 right-0 flex justify-center z-30 pointer-events-none">
                        <div className="absolute -top-4 left-6 w-3 h-3 bg-blue-400 rounded-full animate-bounce opacity-80" style={{ animationDelay: '0s' }} />
                        <div className="absolute -top-6 right-8 w-2 h-2 bg-blue-500 rounded-full animate-bounce opacity-70" style={{ animationDelay: '0.3s' }} />
                        <div className="absolute -top-3 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.6s' }} />
                        <div className="absolute -top-5 right-12 w-2.5 h-2.5 bg-blue-300 rounded-full animate-bounce opacity-80" style={{ animationDelay: '0.9s' }} />
                    </div>
                )}
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
        if (pct < 90) return { icon: Leaf, color: 'text-emerald-500', scale: 1.1, label: 'Tree' }; // 60-89%
        if (pct < 100) return { icon: Flower, color: 'text-pink-500', scale: 1.3, label: 'Bloom' }; // 90-99%
        return { icon: Flower, color: 'text-yellow-400', scale: 1.5, label: 'Flourishing!' }; // 100%+
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

export default HydrationVisualizer;
