import React, { useState, useEffect } from 'react';
import { ChevronLeft, Trophy, Target, Calendar, Users, Crown, Medal, Award } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "/api";

const ChallengeDetail = ({ challengeId, userId, isDarkMode, onBack }) => {
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [challengeId]);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_URL}/challenges/${challengeId}/leaderboard`);
            if (res.ok) {
                const data = await res.json();
                setChallenge(data);
            }
        } catch (e) {
            console.error('Failed to fetch leaderboard:', e);
        }
        setLoading(false);
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <Crown size={20} className="text-yellow-500" />;
            case 2: return <Medal size={20} className="text-gray-400" />;
            case 3: return <Award size={20} className="text-amber-600" />;
            default: return <span className={`font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{rank}</span>;
        }
    };

    const getRankBg = (rank, isCurrentUser) => {
        if (isCurrentUser) {
            return isDarkMode ? 'bg-cyan-900/30 border-cyan-500' : 'bg-cyan-50 border-cyan-200';
        }
        switch (rank) {
            case 1: return isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50';
            case 2: return isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
            case 3: return isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50';
            default: return isDarkMode ? 'bg-gray-800' : 'bg-white';
        }
    };

    if (loading) {
        return (
            <div className="px-6 py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="px-6 py-12 text-center">
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Challenge not found</p>
            </div>
        );
    }

    const daysRemaining = Math.max(0, Math.ceil(
        (new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24)
    ));

    return (
        <div className="px-6 pb-32 pt-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
                >
                    <ChevronLeft size={20} className={isDarkMode ? 'text-white' : 'text-gray-800'} />
                </button>
                <div>
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {challenge.challenge_name}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Challenge ended'}
                    </p>
                </div>
            </div>

            {/* Challenge Stats */}
            <div className={`p-5 rounded-3xl mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <Target size={24} className={`mx-auto mb-2 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {challenge.goal_ml}ml
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daily Goal</p>
                    </div>
                    <div>
                        <Users size={24} className={`mx-auto mb-2 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {challenge.leaderboard?.length || 0}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Participants</p>
                    </div>
                    <div>
                        <Calendar size={24} className={`mx-auto mb-2 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            7
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Days</p>
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className={`rounded-3xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        <Trophy size={18} className="text-yellow-500" />
                        Leaderboard
                    </h3>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {challenge.leaderboard?.map((entry) => {
                        const isCurrentUser = entry.user_id === userId;
                        return (
                            <div
                                key={entry.user_id}
                                className={`p-4 flex items-center gap-4 ${getRankBg(entry.rank, isCurrentUser)} ${isCurrentUser ? 'border-l-4' : ''}`}
                            >
                                <div className="w-8 h-8 flex items-center justify-center">
                                    {getRankIcon(entry.rank)}
                                </div>

                                <div className="flex-1">
                                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                        {entry.user_id.split('-')[0]}
                                        {isCurrentUser && <span className="text-cyan-500 text-xs ml-2">(You)</span>}
                                    </p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {entry.days_goal_met} days met • {(entry.total_ml / 1000).toFixed(1)}L total
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                        {entry.days_goal_met}/7
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>days</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ChallengeDetail;
