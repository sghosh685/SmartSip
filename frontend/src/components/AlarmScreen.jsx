import React from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';

const AlarmScreen = ({ totalWater, globalDefaultGoal, logs }) => {
    const percentage = Math.min(100, (totalWater / globalDefaultGoal) * 100); // Cap visual fill at 100% usually, but logic allows more

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
                            <span className="text-lg text-gray-500">/{globalDefaultGoal}ml</span>
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

export default AlarmScreen;
