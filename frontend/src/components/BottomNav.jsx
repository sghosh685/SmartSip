import React from 'react';
import { Home, Plus, BarChart2, Trophy } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab, onQuickAdd, isDarkMode }) => (
    <div className="absolute bottom-0 w-full z-50">
        {/* Floating Plus Button - Centered above nav */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-10">
            <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-cyan-400 blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse w-14 h-14"></div>
                <button
                    onClick={onQuickAdd}
                    className="relative w-14 h-14 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 border-4 border-white/20 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                    <Plus size={28} className="text-white drop-shadow-md" strokeWidth={3} />
                </button>
            </div>
        </div>

        {/* Bottom Nav Bar */}
        <div className={`w-full px-6 py-4 grid grid-cols-3 items-center pb-8 rounded-t-3xl transition-all duration-300 ${isDarkMode
            ? 'bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 backdrop-blur-lg border-t border-white/50 shadow-[0_-5px_30px_rgba(59,130,246,0.15)]'
            }`}>

            {/* Left: Home */}
            <div className="flex justify-start pl-4">
                <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-cyan-500' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Home</span>
                </button>
            </div>

            {/* Center: Challenges (below the + button) */}
            <div className="flex justify-center">
                <button onClick={() => setActiveTab('challenges')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'challenges' ? 'text-cyan-500' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Trophy size={22} strokeWidth={activeTab === 'challenges' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Challenges</span>
                </button>
            </div>

            {/* Right: Stats */}
            <div className="flex justify-end pr-4">
                <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-cyan-500' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <BarChart2 size={22} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Stats</span>
                </button>
            </div>
        </div>
    </div>
);

export default BottomNav;
