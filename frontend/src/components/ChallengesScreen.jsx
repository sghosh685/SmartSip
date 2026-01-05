import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Users, Calendar, Target, ChevronRight, Share2, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "/api";

const ChallengesScreen = ({ userId, isDarkMode, onViewChallenge }) => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newChallenge, setNewChallenge] = useState({ name: '', goal_ml: 2500 });
    const [createdInviteCode, setCreatedInviteCode] = useState(null);

    useEffect(() => {
        fetchChallenges();
    }, [userId]);

    const fetchChallenges = async () => {
        try {
            const res = await fetch(`${API_URL}/users/${userId}/challenges`);
            if (res.ok) {
                const data = await res.json();
                setChallenges(data.challenges || []);
            }
        } catch (e) {
            console.error('Failed to fetch challenges:', e);
        }
        setLoading(false);
    };

    const handleCreateChallenge = async () => {
        if (!newChallenge.name.trim()) return;

        try {
            const res = await fetch(`${API_URL}/challenges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    name: newChallenge.name,
                    goal_ml: newChallenge.goal_ml
                })
            });

            if (res.ok) {
                const data = await res.json();
                setCreatedInviteCode(data.invite_code);
                fetchChallenges();
            }
        } catch (e) {
            console.error('Failed to create challenge:', e);
        }
    };

    const handleShare = (inviteCode) => {
        const url = `${window.location.origin}/join/${inviteCode}`;
        if (navigator.share) {
            navigator.share({
                title: 'Join my SmartSip Challenge!',
                text: 'Compete with me to stay hydrated! 💧',
                url
            });
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="px-6 pb-32 pt-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Challenges
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Compete with friends to stay hydrated
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Active Challenges */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
            ) : challenges.length === 0 ? (
                <div className={`text-center py-12 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                    <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>No active challenges</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Create one and invite friends!
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
                    >
                        Create Challenge
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {challenges.map(challenge => (
                        <div
                            key={challenge.id}
                            className={`p-5 rounded-3xl shadow-sm transition-all hover:shadow-md cursor-pointer ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                            onClick={() => onViewChallenge && onViewChallenge(challenge.id)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-cyan-900/30' : 'bg-cyan-50'}`}>
                                        <Trophy size={24} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {challenge.name}
                                        </h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(challenge.status)}`}>
                                            {challenge.status}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="text-center">
                                    <Users size={16} className={`mx-auto mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                        {challenge.participant_count}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Players</p>
                                </div>
                                <div className="text-center">
                                    <Target size={16} className={`mx-auto mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                        {challenge.goal_ml}ml
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Daily Goal</p>
                                </div>
                                <div className="text-center">
                                    <Calendar size={16} className={`mx-auto mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                        7 days
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration</p>
                                </div>
                            </div>

                            {challenge.is_creator && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleShare(challenge.invite_code); }}
                                    className={`mt-4 w-full py-2 rounded-xl flex items-center justify-center gap-2 font-medium ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    <Share2 size={16} /> Invite Friends
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Challenge Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setCreatedInviteCode(null); }}></div>
                    <div className={`relative w-full max-w-sm p-6 rounded-[32px] shadow-2xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
                        {createdInviteCode ? (
                            <>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trophy size={32} className="text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Challenge Created! 🎉</h3>
                                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Share this code with friends:
                                    </p>
                                    <div className={`p-4 rounded-2xl font-mono text-2xl font-bold ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        {createdInviteCode}
                                    </div>
                                    <button
                                        onClick={() => handleShare(createdInviteCode)}
                                        className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center gap-2"
                                    >
                                        <Share2 size={18} /> Share Invite Link
                                    </button>
                                    <button
                                        onClick={() => { setShowCreateModal(false); setCreatedInviteCode(null); }}
                                        className={`mt-2 w-full py-3 rounded-xl font-bold ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                                    >
                                        Done
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">New Challenge</h3>
                                    <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={`text-xs font-bold mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Challenge Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newChallenge.name}
                                            onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
                                            placeholder="e.g. New Year Hydration"
                                            className={`w-full p-4 rounded-xl font-medium outline-none ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`text-xs font-bold mb-1 block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Daily Goal (ml)
                                        </label>
                                        <div className="flex gap-2">
                                            {[2000, 2500, 3000, 3500].map(goal => (
                                                <button
                                                    key={goal}
                                                    onClick={() => setNewChallenge({ ...newChallenge, goal_ml: goal })}
                                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${newChallenge.goal_ml === goal
                                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                                                        : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    {goal / 1000}L
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateChallenge}
                                        disabled={!newChallenge.name.trim()}
                                        className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold disabled:opacity-50"
                                    >
                                        Create 7-Day Challenge
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengesScreen;
