// SmartSip Achievement Badges System
// Gamification layer for user retention

export const BADGES = [
    // --- MILESTONE BADGES ---
    {
        id: 'first_sip',
        name: 'First Sip',
        description: 'Logged your first drink',
        icon: '🏁',
        color: '#60A5FA', // Blue
        category: 'milestone',
        condition: (history) => history.length >= 1
    },
    {
        id: 'hydration_hero',
        name: 'Hydration Hero',
        description: 'Hit 100% of your daily goal',
        icon: '🦸',
        color: '#10B981', // Emerald
        category: 'milestone',
        condition: (history, currentLog, total, goal) => total >= goal
    },
    {
        id: 'overachiever',
        name: 'Overachiever',
        description: 'Exceeded goal by 50%',
        icon: '🚀',
        color: '#8B5CF6', // Purple
        category: 'milestone',
        condition: (history, currentLog, total, goal) => total >= goal * 1.5
    },

    // --- TIME-BASED BADGES ---
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Drank water before 8 AM',
        icon: '🌅',
        color: '#F59E0B', // Sun Orange
        category: 'time',
        condition: (history, currentLog) => {
            if (!currentLog?.timestamp) return false;
            const hour = new Date(currentLog.timestamp).getHours();
            return hour < 8 && hour >= 4;
        }
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Logged water after 11 PM',
        icon: '🦉',
        color: '#6366F1', // Indigo
        category: 'time',
        condition: (history, currentLog) => {
            if (!currentLog?.timestamp) return false;
            const hour = new Date(currentLog.timestamp).getHours();
            return hour >= 23;
        }
    },

    // --- STREAK BADGES ---
    {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Met goal 7 days in a row',
        icon: '🔥',
        color: '#EF4444', // Red
        category: 'streak',
        condition: (history, currentLog, total, goal, streak) => streak >= 7
    },
    {
        id: 'month_master',
        name: 'Month Master',
        description: 'Met goal 30 days in a row',
        icon: '👑',
        color: '#F59E0B', // Gold
        category: 'streak',
        condition: (history, currentLog, total, goal, streak) => streak >= 30
    },

    // --- DRINK TYPE BADGES ---
    {
        id: 'coffee_lover',
        name: 'Coffee Lover',
        description: 'Logged 10 coffees',
        icon: '☕',
        color: '#D97706', // Brown
        category: 'drink',
        condition: (history) => {
            const coffeeCount = history.filter(log => log.drinkType === 'coffee').length;
            return coffeeCount >= 10;
        }
    },
    {
        id: 'gym_rat',
        name: 'Gym Rat',
        description: 'Logged 5 protein shakes',
        icon: '💪',
        color: '#6366F1', // Indigo
        category: 'drink',
        condition: (history) => {
            const proteinCount = history.filter(log => log.drinkType === 'protein').length;
            return proteinCount >= 5;
        }
    },
    {
        id: 'tea_enthusiast',
        name: 'Tea Enthusiast',
        description: 'Logged 10 teas',
        icon: '🍵',
        color: '#10B981', // Green
        category: 'drink',
        condition: (history) => {
            const teaCount = history.filter(log => log.drinkType === 'tea').length;
            return teaCount >= 10;
        }
    },

    // --- VOLUME BADGES ---
    {
        id: 'gallon_club',
        name: 'Gallon Club',
        description: 'Logged 4L+ in one day',
        icon: '🌊',
        color: '#0EA5E9', // Sky Blue
        category: 'volume',
        condition: (history, currentLog, total) => total >= 4000
    },
    {
        id: 'centurion',
        name: 'Centurion',
        description: 'Logged 100 drinks total',
        icon: '💯',
        color: '#EC4899', // Pink
        category: 'volume',
        condition: (history) => history.length >= 100
    }
];

// Get all badges
export const getAllBadges = () => BADGES;

// Get badges by category
export const getBadgesByCategory = (category) => {
    return BADGES.filter(b => b.category === category);
};

// Get a specific badge by ID
export const getBadgeById = (id) => {
    return BADGES.find(b => b.id === id);
};

// Check which badges should be unlocked
export const checkBadges = (unlockedBadges, history, currentLog, total, goal, streak) => {
    const newlyUnlocked = [];

    BADGES.forEach(badge => {
        // Skip if already unlocked
        if (unlockedBadges.includes(badge.id)) return;

        // Run the condition check
        try {
            const isUnlocked = badge.condition(history, currentLog, total, goal, streak);
            if (isUnlocked) {
                newlyUnlocked.push(badge);
            }
        } catch (e) {
            console.warn(`Badge check failed for ${badge.id}:`, e);
        }
    });

    return newlyUnlocked;
};
