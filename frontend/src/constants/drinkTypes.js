// SmartSip Drink Types Configuration
// Based on Beverage Hydration Index (BHI) science

export const DRINK_TYPES = {
    WATER: {
        id: 'water',
        name: 'Water',
        multiplier: 1.0,
        icon: '💧',
        color: '#3B82F6', // Blue
        description: 'The gold standard. 100% hydration.',
        coachTip: null,
        common: true
    },
    COFFEE: {
        id: 'coffee',
        name: 'Coffee',
        multiplier: 0.85,
        icon: '☕',
        color: '#D97706', // Amber
        description: 'Mild diuretic. Counts as 85%.',
        coachTip: 'Follow up with a glass of water to maximize hydration!',
        common: true
    },
    TEA: {
        id: 'tea',
        name: 'Tea',
        multiplier: 0.90,
        icon: '🍵',
        color: '#10B981', // Green
        description: 'Antioxidants + Hydration.',
        coachTip: 'Green tea is especially hydrating!',
        common: true
    },
    PROTEIN: {
        id: 'protein',
        name: 'Protein',
        multiplier: 0.90,
        icon: '💪',
        color: '#6366F1', // Indigo (Gym vibe)
        description: 'Muscle fuel. 90% hydration value.',
        coachTip: 'Protein needs water to digest! Drink extra water after your shake.',
        common: true // In ribbon for quick gym access
    },
    JUICE: {
        id: 'juice',
        name: 'Juice',
        multiplier: 0.85,
        icon: '🧃',
        color: '#F97316', // Orange
        description: 'Natural sugars affect absorption.',
        coachTip: 'Dilute with water for better hydration!',
        common: false
    },
    SMOOTHIE: {
        id: 'smoothie',
        name: 'Smoothie',
        multiplier: 0.90,
        icon: '🥤',
        color: '#22C55E', // Emerald Green
        description: 'Fiber + Water. Counts as 90%.',
        coachTip: 'Great post-workout! Add extra liquid for better absorption.',
        common: false
    },
    SPORTS_DRINK: {
        id: 'sports',
        name: 'Sports',
        multiplier: 1.0,
        icon: '⚡',
        color: '#8B5CF6', // Purple
        description: 'High retention due to electrolytes.',
        coachTip: 'Best during or after intense workouts.',
        common: false
    },
    MILK: {
        id: 'milk',
        name: 'Milk',
        multiplier: 1.1,
        icon: '🥛',
        color: '#F1F5F9', // Off-white
        description: 'Excellent retention. Better than water!',
        coachTip: 'Studies show milk hydrates better than water!',
        common: false
    },
    SODA: {
        id: 'soda',
        name: 'Soda',
        multiplier: 0.80,
        icon: '🥤',
        color: '#EF4444', // Red
        description: 'High sugar slows absorption.',
        coachTip: 'Consider sparkling water as a healthier swap!',
        common: false
    },
    ALCOHOL: {
        id: 'alcohol',
        name: 'Alcohol',
        multiplier: -0.5,
        icon: '🍺',
        color: '#F59E0B', // Yellow
        description: 'Dehydrating. Reduces your total.',
        coachTip: '⚠️ For every drink, have a full glass of water!',
        common: false
    }
};

// Helper to get drink by ID
export const getDrinkById = (id) => {
    return Object.values(DRINK_TYPES).find(d => d.id === id) || DRINK_TYPES.WATER;
};

// Get common drinks for speed ribbon
export const getCommonDrinks = () => {
    return Object.values(DRINK_TYPES).filter(d => d.common);
};

// Get all drinks for modal
export const getAllDrinks = () => {
    return Object.values(DRINK_TYPES);
};
