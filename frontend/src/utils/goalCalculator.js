// SmartSip Goal Calculator
// Implements Context-Aware Dynamic Goals based on daily conditions

export const GOAL_FACTORS = {
    HOT_WEATHER: {
        id: 'hot',
        name: 'Hot Weather',
        icon: '🔥',
        bonus: 500,
        description: 'It\'s warm today! Your body needs extra hydration.',
        color: '#F97316' // Orange
    },
    ACTIVE_DAY: {
        id: 'active',
        name: 'Active Day',
        icon: '🏃',
        bonus: 750,
        description: 'Workout or physical activity planned.',
        color: '#22C55E' // Green
    },
    RECOVERY: {
        id: 'recovery',
        name: 'Recovery Mode',
        icon: '🤒',
        bonus: 1000,
        description: 'Feeling under the weather? Extra fluids help!',
        color: '#8B5CF6' // Purple
    }
};

/**
 * Calculates the dynamic goal for the day based on conditions
 * @param {number} baseGoal - User's profile setting (e.g., 2000)
 * @param {object} conditions - { isHot: boolean, isActive: boolean, isRecovery: boolean }
 * @returns {object} { effectiveGoal, bonuses: [{ name, bonus, icon }] }
 */
export const calculateDailyTarget = (baseGoal, conditions) => {
    let effectiveGoal = baseGoal;
    const activeBonuses = [];

    if (conditions.isHot) {
        effectiveGoal += GOAL_FACTORS.HOT_WEATHER.bonus;
        activeBonuses.push({
            name: GOAL_FACTORS.HOT_WEATHER.name,
            bonus: GOAL_FACTORS.HOT_WEATHER.bonus,
            icon: GOAL_FACTORS.HOT_WEATHER.icon,
            color: GOAL_FACTORS.HOT_WEATHER.color
        });
    }

    if (conditions.isActive) {
        effectiveGoal += GOAL_FACTORS.ACTIVE_DAY.bonus;
        activeBonuses.push({
            name: GOAL_FACTORS.ACTIVE_DAY.name,
            bonus: GOAL_FACTORS.ACTIVE_DAY.bonus,
            icon: GOAL_FACTORS.ACTIVE_DAY.icon,
            color: GOAL_FACTORS.ACTIVE_DAY.color
        });
    }

    if (conditions.isRecovery) {
        effectiveGoal += GOAL_FACTORS.RECOVERY.bonus;
        activeBonuses.push({
            name: GOAL_FACTORS.RECOVERY.name,
            bonus: GOAL_FACTORS.RECOVERY.bonus,
            icon: GOAL_FACTORS.RECOVERY.icon,
            color: GOAL_FACTORS.RECOVERY.color
        });
    }

    return {
        effectiveGoal,
        baseGoal,
        bonuses: activeBonuses,
        totalBonus: effectiveGoal - baseGoal
    };
};

/**
 * Get all available goal factors for the Settings UI
 */
export const getAllFactors = () => {
    return Object.values(GOAL_FACTORS);
};
