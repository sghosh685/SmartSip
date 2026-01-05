import React from 'react';
import { Home, Plus, BarChart2, Trophy } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab, onQuickAdd, isDarkMode }) => (
    <div className={`absolute bottom-0 w-full px-4 py-4 grid grid-cols-4 items-end pb-8 z-50 rounded-t-3xl transition-all duration-300 ${isDarkMode
        ? 'bg-gray-900/90 backdrop-blur-lg border-t border-gray-800 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]'
        : 'bg-white/80 backdrop-blur-lg border-t border-white/50 shadow-[0_-5px_30px_rgba(59,130,246,0.15)]'
        }`}>
        <div className="flex justify-center">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-cyan-500' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Home</span>
            </button>
        </div>

        <div className="flex justify-center">
            <button onClick={() => setActiveTab('challenges')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'challenges' ? 'text-cyan-500' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                <Trophy size={22} strokeWidth={activeTab === 'challenges' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Challenges</span>
            </button>
        </div>

        <div className="relative -top-8 flex justify-center group pointer-events-none">
            <div className={`absolute inset-0 rounded-full bg-cyan-400 blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse w-14 h-14 mx-auto`}></div>
            <button
                onClick={onQuickAdd}
                className="relative w-14 h-14 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 border-4 border-white/20 hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto"
            >
                <Plus size={28} className="text-white drop-shadow-md" strokeWidth={3} />
            </button>
        </div>

        <div className="flex justify-center">
            <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-cyan-500' : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                <BarChart2 size={22} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Stats</span>
            </button>
        </div>
    </div>
);

export default BottomNav;
