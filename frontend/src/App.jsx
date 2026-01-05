import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Flame, Activity, Clock,
  MoreHorizontal, ChevronLeft, ChevronRight, ChevronDown,
  Home, BarChart2, Settings, Plus, Sparkles, Edit2, Check,
  Wifi, WifiOff, Moon, Sun, User, Droplets, Target, Volume2, Trash2, X,
  Circle, Sprout, Leaf, Flower, Grid, Zap, Award, Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DRINK_TYPES, getDrinkById, getCommonDrinks, getAllDrinks } from './constants/drinkTypes';
import { calculateDailyTarget, GOAL_FACTORS, getAllFactors } from './utils/goalCalculator';
import { BADGES, getAllBadges, checkBadges, getBadgeById } from './constants/badges';
import { useSmartNotifications } from './hooks/useSmartNotifications';
import { useAuth } from './hooks/useAuth'; // NEW: Supabase Auth Hook
import HomeScreen from './components/HomeScreen';
import { getLocalDateString } from './utils/dateUtils';

// --- CONFIGURATION ---
const API_URL = import.meta.env.VITE_API_URL || "/api";
const FALLBACK_USER_ID = "guest-local-user"; // Fallback for when Supabase is not configured

// --- SHARED UTILS ---

// Mock AI Logic (Fallback if backend is offline)
const getMockAiFeedback = (current, goal) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (current < 500) resolve("🌵 (Offline Mode) You are basically a cactus. Drink water! 🥤");
      else if (current < 1500) resolve("📉 (Offline Mode) Decent start, but don't slack off. 👀");
      else if (current < goal) resolve("🚀 (Offline Mode) Almost there! Keep going! 💧");
      else resolve("🌊 (Offline Mode) You are a Hydration God! 🔱");
    }, 1000);
  });
};

// --- COMPONENTS ---

import StatsScreen from './components/StatsScreen';
import SettingsScreen from './components/SettingsScreen';
import LoginModal from './components/LoginModal';
import BottomNav from './components/BottomNav';
import AlarmScreen from './components/AlarmScreen';
import ChallengesScreen from './components/ChallengesScreen';
import ChallengeDetail from './components/ChallengeDetail';

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // --- AUTH INTEGRATION ---
  const auth = useAuth();

  // User Identity: Use Supabase user ID if authenticated, otherwise fallback
  const USER_ID = auth.userId || FALLBACK_USER_ID;
  const userContext = {
    isGuest: auth.isGuest,
    email: auth.userEmail,
    userId: USER_ID,
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // --- DEEP LINK: Handle /join/:code URLs ---
  const [joinModalData, setJoinModalData] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
      const inviteCode = path.split('/join/')[1];
      if (inviteCode) {
        // Fetch challenge details and show join modal
        fetch(`${API_URL}/challenges/${inviteCode}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setJoinModalData({ ...data, inviteCode });
            }
          })
          .catch(console.error);
      }
    }
  }, []);

  // --- HANDLERS ---
  /* REMOVED DUPLICATE HANDLERS */
  const handleLogin = async () => {
    // Use real Supabase OAuth
    const { error } = await auth.signInWithGoogle();
    if (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } else {
      // Close modal - auth state will update automatically via useAuth hook
      setIsLoginModalOpen(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  // --- GUEST DATA MIGRATION ---
  // When user logs in, migrate their localStorage data AND claim DB guest records
  useEffect(() => {
    const migrateGuestData = async () => {
      // Only run if user just authenticated (has real ID, not guest)
      if (!auth.userId || auth.isGuest) return;

      // Use SEPARATE flags for localStorage and DB migration
      const localMigrationKey = `localStorage_migrated_to_${auth.userId}`;
      const dbClaimKey = `db_claimed_to_${auth.userId}`;

      // 1. Migrate localStorage data (if not already done)
      if (!localStorage.getItem(localMigrationKey)) {
        const savedLogs = localStorage.getItem('waterLogs');
        if (savedLogs) {
          try {
            const logs = JSON.parse(savedLogs);
            if (Array.isArray(logs) && logs.length > 0) {
              const formattedLogs = logs.map(log => ({
                amount: log.amount,
                timestamp: log.time || log.timestamp || new Date().toISOString()
              }));

              console.log(`Migrating ${formattedLogs.length} guest logs from localStorage`);

              const response = await fetch(`${API_URL}/bulk-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: auth.userId,
                  logs: formattedLogs,
                  goal: globalDefaultGoal
                })
              });

              if (response.ok) {
                const result = await response.json();
                console.log(`localStorage migration: ${result.imported} logs imported`);
              }
            }
          } catch (e) {
            console.error('localStorage migration failed:', e);
          }
        }
        localStorage.setItem(localMigrationKey, 'true');
      }

      // 2. Claim database guest records (ALWAYS runs if not yet claimed)
      if (!localStorage.getItem(dbClaimKey)) {
        try {
          console.log('Claiming guest database records...');
          const claimResponse = await fetch(`${API_URL}/claim-guest-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: auth.userId,
              goal: globalDefaultGoal
            })
          });

          if (claimResponse.ok) {
            const claimResult = await claimResponse.json();
            console.log(`DB claim: ${claimResult.logs_transferred} logs, ${claimResult.snapshots_transferred} snapshots`);
            localStorage.setItem(dbClaimKey, 'true');
          }
        } catch (e) {
          console.error('Guest data claim failed:', e);
        }
      }

      // 3. Data refresh is now handled by unified fetch effect (v1.5.6)
      // REMOVED: fetchStats(); fetchHistory(); - these were causing race condition
      // The unified fetch effect will automatically re-run when auth.userId changes
      console.log('[SmartSip v1.5.6] Migration complete - unified fetch will handle data loading');
    };

    migrateGuestData();
  }, [auth.userId, auth.isGuest]);

  const [totalWater, setTotalWater] = useState(0);
  const [logs, setLogs] = useState([]);
  const [aiMessage, setAiMessage] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // ============================================================================
  // GLOBAL DEFAULT GOAL - User's baseline preference (Three-Tier Architecture)
  // v1.8.0: Renamed from 'goal' to 'globalDefaultGoal' for clarity
  // Tier 1: This is the user's preference, NOT the per-day snapshot goal
  // ============================================================================
  const [globalDefaultGoal, setGlobalDefaultGoal] = useState(() => {
    // Migration: Check new key first, then fall back to old key for existing users
    const newKey = localStorage.getItem('globalDefaultGoal');
    let val = 2500;

    if (newKey) {
      val = parseInt(newKey, 10);
    } else {
      // Migration from old localStorage key ('baseGoal')
      const oldKey = localStorage.getItem('baseGoal');
      if (oldKey) {
        val = parseInt(oldKey, 10);
        // Migrate to new key immediately
        console.log(`[SmartSip v1.8.0] Migrating 'baseGoal' -> 'globalDefaultGoal': ${val}ml`);
      }
    }

    // SANITIZATION (Phase C): Fix corrupted data (e.g. "150012341500")
    // Cap reasonably at 10,000ml (10L) and min 500ml
    if (isNaN(val) || val > 10000 || val < 500) {
      console.warn(`[SmartSip] Detected corrupted/invalid goal (${val}). Resetting to 2500.`);
      return 2500;
    }

    return val;
  });

  // Save global default goal when it changes (localStorage + cloud)
  useEffect(() => {
    localStorage.setItem('globalDefaultGoal', globalDefaultGoal.toString());
    console.log(`[SmartSip] Global Default Goal saved: ${globalDefaultGoal}`);

    // CLOUD SYNC: Save to backend for cross-device consistency
    if (USER_ID) {
      fetch(`${API_URL}/user/${USER_ID}/goal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: globalDefaultGoal })
      }).catch(e => console.log('Goal cloud sync failed:', e));
    }
  }, [globalDefaultGoal]);

  // CLOUD SYNC: Fetch goal from cloud on app load (NOT in guest mode)
  useEffect(() => {
    if (!auth.isGuest && USER_ID) {
      fetch(`${API_URL}/user/${USER_ID}/goal`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.goal && data.goal !== globalDefaultGoal) {
            console.log(`[SmartSip] Cloud goal sync: ${data.goal}ml`);
            setGlobalDefaultGoal(data.goal);
          }
        })
        .catch(e => console.log('Goal cloud fetch failed:', e));
    }
  }, [USER_ID, auth.isGuest]);

  const [drinkAmount, setDrinkAmount] = useState(() => {
    const saved = localStorage.getItem('drinkAmount');
    return saved ? parseInt(saved, 10) : 200;
  });

  // Save drink amount when it changes (localStorage + cloud)
  useEffect(() => {
    localStorage.setItem('drinkAmount', drinkAmount.toString());

    // CLOUD SYNC: Save to backend for cross-device consistency
    if (USER_ID) {
      fetch(`${API_URL}/user/${USER_ID}/drink-amount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drink_amount: drinkAmount })
      }).catch(e => console.log('Drink amount cloud sync failed:', e));
    }
  }, [drinkAmount]);

  // CLOUD SYNC: Fetch drink amount from cloud on app load
  useEffect(() => {
    if (!auth.isGuest && USER_ID) {
      fetch(`${API_URL}/user/${USER_ID}/drink-amount`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.drink_amount && data.drink_amount !== drinkAmount) {
            console.log(`[SmartSip] Cloud drink amount sync: ${data.drink_amount}ml`);
            setDrinkAmount(data.drink_amount);
          }
        })
        .catch(e => console.log('Drink amount cloud fetch failed:', e));
    }
  }, [USER_ID, auth.isGuest]);

  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [streak, setStreak] = useState(0);
  const [statsData, setStatsData] = useState(null); // Lifted stats state
  const [historicalGoal, setHistoricalGoal] = useState(null); // NEW: Goal from snapshot for past dates
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false); // Track if initial load is done
  // Theme State: 'glass' | 'garden'
  // Theme State: 'glass' | 'garden', persisted in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'glass';
  });

  // Save theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch full stats (charts, weekly avg) - LEGACY: Now only used for manual refresh
  // v1.5.3: Removed auto-trigger useEffect to prevent race with unified fetch
  const fetchStats = async () => {
    try {
      // Default to 7 days for dashboard view
      const days = 7;
      const response = await fetch(`${API_URL}/stats/${USER_ID}?days=${days}&goal=${globalDefaultGoal}&client_date=${getLocalDateString()}`);
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
        if (data.streak !== undefined) setStreak(data.streak);
      }
    } catch (e) {
      console.log("Stats fetch failed");
    }
  };

  // REMOVED: This useEffect was causing race conditions with unified fetch
  // Stats are now fetched by the unified fetch effect in v1.5.2+
  // useEffect(() => {
  //   if (!auth.loading) { fetchStats(); }
  // }, [logs, goal, USER_ID, auth.loading]);

  // Dynamic userName with ability to override in Settings
  // Load from localStorage if saved, otherwise use email-based default
  const getDefaultUserName = () => {
    const saved = localStorage.getItem('customUserName');
    if (saved) return saved;
    return userContext.isGuest
      ? "Guest User"
      : (userContext.email?.split('@')[0] || "User");
  };
  const [userName, setUserName] = useState(getDefaultUserName);

  // Wrapper to persist userName changes to localStorage
  const handleSetUserName = (name) => {
    setUserName(name);
    localStorage.setItem('customUserName', name);
  };

  // Only update userName from auth if user hasn't set a custom name
  useEffect(() => {
    const savedName = localStorage.getItem('customUserName');
    if (!savedName && !userContext.isGuest && userContext.email) {
      setUserName(userContext.email.split('@')[0]);
    }
  }, [userContext.isGuest, userContext.email]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState(2);
  const [alertStartTime, setAlertStartTime] = useState("09:00");
  const [alertEndTime, setAlertEndTime] = useState("20:00");

  // Context-Aware Goals: Daily Conditions (persisted to localStorage for session)
  const [dailyConditions, setDailyConditions] = useState(() => {
    // Note: These reset daily - check if same day
    const saved = localStorage.getItem('dailyConditions');
    if (saved) {
      const { date, conditions } = JSON.parse(saved);
      // Only restore if it's the same day
      if (date === getLocalDateString()) {
        return conditions;
      }
    }
    return { isHot: false, isActive: false, isRecovery: false };
  });

  // Save conditions when they change (with date)
  useEffect(() => {
    localStorage.setItem('dailyConditions', JSON.stringify({
      date: getLocalDateString(),
      conditions: dailyConditions
    }));
  }, [dailyConditions]);

  // Calculate effective goal based on conditions (Three-Tier Architecture)
  const goalData = calculateDailyTarget(globalDefaultGoal, dailyConditions);
  const effectiveGoal = goalData.effectiveGoal;
  const goalReached = totalWater >= effectiveGoal; // Used for notification logic

  // --- NOTIFICATION HOOK INTEGRATION ---
  const { requestPermission, sendTestNotification } = useSmartNotifications({
    enabled: smartAlerts,
    frequencyHours: alertFrequency,
    startTime: alertStartTime,
    endTime: alertEndTime,
    goalMet: goalReached, // Silence if goal met
    logs: logs // To check last drink time
  });

  // Selected date state (for viewing/logging past dates)
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  // Today's Logs state (individual entries)
  const [todayLogs, setTodayLogs] = useState([]);

  // Quick-Add Presets (now just favorite AMOUNTS - icon comes from drink type)
  const [quickAddPresets, setQuickAddPresets] = useState([
    { id: 1, name: 'Small', amount: 150 },
    { id: 2, name: 'Medium', amount: 300 },
    { id: 3, name: 'Large', amount: 500 },
    { id: 4, name: 'Extra Large', amount: 750 },
  ]);

  // BADGE SYSTEM: Gamification (persisted to localStorage)
  const [unlockedBadges, setUnlockedBadges] = useState(() => {
    const saved = localStorage.getItem('unlockedBadges');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      // Deduplicate on load
      return [...new Set(parsed)];
    } catch {
      return [];
    }
  });
  const [badgeToast, setBadgeToast] = useState(null);

  // Save badges when they change (with protection against accidental overwrite)
  useEffect(() => {
    // Never overwrite existing badges with empty array (protection against race conditions)
    if (unlockedBadges.length === 0) {
      const existing = localStorage.getItem('unlockedBadges');
      if (existing && JSON.parse(existing).length > 0) {
        console.log('[SmartSip] Prevented badge overwrite - keeping existing badges');
        return;
      }
    }
    // Deduplicate before saving
    const unique = [...new Set(unlockedBadges)];
    localStorage.setItem('unlockedBadges', JSON.stringify(unique));
  }, [unlockedBadges]);

  // Confetti celebration tracking
  const celebrationShownForDate = useRef('');

  // Streak celebration tracking
  const lastShownStreakMilestone = useRef(0);
  const [streakToast, setStreakToast] = useState(null);

  // --- SMART ALERTS LOGIC ---
  const lastAlertRef = useRef(null);

  // Request Notification Permissions on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Check for alerts every minute
  useEffect(() => {
    if (!smartAlerts) return;

    const checkHydration = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // 1. Check Active Hours
      if (currentTimeStr < alertStartTime || currentTimeStr > alertEndTime) return;

      // 2. Check Goal (Don't bug if already done)
      if (totalWater >= globalDefaultGoal) return;

      // 3. Find Last Drink Time
      let lastDrinkTime = null;
      if (todayLogs && todayLogs.length > 0) {
        // logs should be chronological or reverse-chronological, but let's robustly find the latest
        const sortedLogs = [...todayLogs].sort((a, b) => new Date(b.time || b.timestamp) - new Date(a.time || a.timestamp));
        lastDrinkTime = new Date(sortedLogs[0].time || sortedLogs[0].timestamp);
      }

      // 4. Calculate Elapsed Time (hours)
      let elapsedHours;
      if (lastDrinkTime) {
        const diffMs = now - lastDrinkTime;
        elapsedHours = diffMs / (1000 * 60 * 60);
      } else {
        // No logs today. Measure from Start Time.
        const [startH, startM] = alertStartTime.split(':').map(Number);
        const startTimeDate = new Date();
        startTimeDate.setHours(startH, startM, 0, 0);

        // If 'now' is before start time, elapsed is negative (ignored)
        const diffSinceStart = now - startTimeDate;
        elapsedHours = diffSinceStart / (1000 * 60 * 60);
      }

      // 5. Trigger Alert if overdue
      if (elapsedHours >= alertFrequency) {
        // Prevent spamming: ensure we haven't alerted recently (e.g., within the last hour)
        const lastAlert = lastAlertRef.current;
        const timeSinceLastAlert = lastAlert ? (now - lastAlert) / (1000 * 60 * 60) : 100;

        if (timeSinceLastAlert >= 1) { // 1 hour cool-down
          if (Notification.permission === "granted") {
            new Notification("Time to Hydrate! 💧", {
              body: `You haven't logged any water for over ${Math.floor(elapsedHours)} hours. Stay on track!`,
            });
            lastAlertRef.current = now;
          }
        }
      }
    };

    const timer = setInterval(checkHydration, 60 * 1000); // Check every minute
    return () => clearInterval(timer);
  }, [smartAlerts, alertFrequency, alertStartTime, alertEndTime, todayLogs, totalWater, globalDefaultGoal]);


  // Trigger confetti when goal is reached (only for today, only once per day)
  useEffect(() => {
    const isToday = selectedDate === getLocalDateString();
    const goalReached = totalWater >= effectiveGoal; // Use effectiveGoal for celebration trigger
    const alreadyCelebrated = celebrationShownForDate.current === selectedDate;

    if (isToday && goalReached && !alreadyCelebrated && totalWater > 0) {
      celebrationShownForDate.current = selectedDate;
      // Fire confetti burst!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#22c55e']
      });
      // Second burst slightly delayed
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#6366f1', '#ec4899', '#f59e0b']
        });
      }, 200);
    }
  }, [totalWater, effectiveGoal, selectedDate]);

  // Streak milestone notifications
  useEffect(() => {
    const streakMilestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
    const milestone = streakMilestones.find(m => streak >= m && m > lastShownStreakMilestone.current);

    if (milestone && streak > 0) {
      lastShownStreakMilestone.current = milestone;
      const messages = {
        3: { emoji: '🔥', text: '3-day streak! You\'re building a habit!' },
        7: { emoji: '⭐', text: '1 week streak! Amazing consistency!' },
        14: { emoji: '🏅', text: '2 week streak! Hydration pro!' },
        21: { emoji: '🎯', text: '3 week streak! Habit formed!' },
        30: { emoji: '🏆', text: '30-day streak! Unstoppable!' },
        60: { emoji: '💎', text: '60-day streak! Legend status!' },
        90: { emoji: '👑', text: '90-day streak! Royalty!' },
        180: { emoji: '🌟', text: '6 months! Hydration master!' },
        365: { emoji: '🎊', text: '1 YEAR! Hydration God!' }
      };
      setStreakToast(messages[milestone]);
      setTimeout(() => setStreakToast(null), 4000);
    }
  }, [streak]);

  // Track if initial data load has completed
  const hasInitiallyLoaded = useRef(false);

  // ============================================================================
  // UNIFIED DATA FETCH - v1.5.7: Prevents guest fetch from overwriting auth data
  // Tracks last fetched user to prevent auth state transition issues
  // ============================================================================
  // ============================================================================
  // UNIFIED DATA FETCH - v1.5.8: Use AbortController to cancel stale requests
  // This definitively solves race conditions by aborting the previous fetch
  // if the dependencies change (e.g. user ID updates from Guest -> User)
  // ============================================================================
  const lastFetchedUserId = useRef(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (auth.loading) {
      console.log('[SmartSip v1.5.8] Auth still loading, waiting...');
      return;
    }

    const abortController = new AbortController();
    const currentUserId = auth.userId || 'guest-local-user';

    // Guard: If we've already fetched for an authenticated user, block guest fallback
    // This is an extra safety layer on top of AbortController
    if (lastFetchedUserId.current &&
      lastFetchedUserId.current !== 'guest-local-user' &&
      currentUserId === 'guest-local-user') {
      console.log('[SmartSip v1.5.8] Blocking guest fetch - already have authenticated user data');
      return;
    }

    const cacheBust = `_t=${Date.now()}`;
    console.log(`[SmartSip v1.5.8] Auth ready! Fetching ALL data for user: ${currentUserId}`);

    const fetchAllData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/stats/${currentUserId}?days=30&goal=${globalDefaultGoal}&client_date=${getLocalDateString()}&${cacheBust}`, {
            signal: abortController.signal
          }),
          fetch(`${API_URL}/history/${currentUserId}?date=${selectedDate}&${cacheBust}`, {
            signal: abortController.signal
          })
        ]);

        // Process stats
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          console.log(`[SmartSip v1.5.8] Stats received: streak=${statsData.streak}`);
          setStreak(statsData.streak || 0);
          setStatsData(statsData);
        }

        // Process history
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          console.log(`[SmartSip v1.5.8] History received: total=${historyData.total_today}, logs=${historyData.logs?.length || 0}`);
          setTodayLogs(historyData.logs || []);
          setTotalWater(historyData.total_today || 0);
          if (historyData.historical_goal) setHistoricalGoal(historyData.historical_goal);
          else setHistoricalGoal(null);
        }

        setIsBackendConnected(true);
        hasInitiallyLoaded.current = true;
        lastFetchedUserId.current = currentUserId;
        setIsInitialDataLoaded(true);

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`[SmartSip v1.5.8] Fetch aborted for user: ${currentUserId} (Request cancelled)`);
        } else {
          console.error('[SmartSip v1.5.8] Data fetch failed:', error);
          setIsBackendConnected(false);
          setIsInitialDataLoaded(true);
        }
      }
    };

    fetchAllData();

    // Cleanup: Abort any pending requests when dependencies change
    return () => {
      abortController.abort();
    };
  }, [auth.loading, auth.userId, selectedDate, globalDefaultGoal]); // Re-fetch on any of these changes

  // ============================================================================
  // BADGE RECOVERY - Automatically unlock streak-based badges on load
  // v1.5.0: Prevents badge loss by re-checking milestone conditions
  // ============================================================================
  useEffect(() => {
    if (streak > 0) {
      // Check streak-based badges
      const streakBadges = [];
      if (streak >= 7 && !unlockedBadges.includes('week_warrior')) {
        streakBadges.push('week_warrior');
      }
      if (streak >= 30 && !unlockedBadges.includes('month_master')) {
        streakBadges.push('month_master');
      }

      if (streakBadges.length > 0) {
        console.log(`[SmartSip] Badge recovery: Adding ${streakBadges.join(', ')}`);
        setUnlockedBadges(prev => [...new Set([...prev, ...streakBadges])]);
      }
    }
  }, [streak]); // Only run when streak changes

  // NEW: Sync effective goal to backend when conditions change
  // This ensures that if you raise your goal (e.g. Hot Weather), the backend
  // immediately knows. If you haven't met the new goal, your streak will drop.
  // 
  // v1.7.0 FIX: ONLY sync for TODAY. Past dates should NOT be auto-synced.
  // Editing past goals is handled explicitly by handleToggleEditGoal in HomeScreen.
  // This prevents the "God State Variable" anti-pattern where global goal leaks to all dates.
  useEffect(() => {
    const todayStr = getLocalDateString();
    const isViewingToday = selectedDate === todayStr;
    let isMounted = true;

    // CRITICAL: Only sync for TODAY, never for past dates
    if (isViewingToday) {
      const syncGoal = async () => {
        try {
          await fetch(`${API_URL}/update-goal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: USER_ID,
              date: todayStr, // Always use todayStr, never selectedDate for auto-sync
              goal: effectiveGoal
            })
          });
          // Refetch stats to update streak immediately in UI
          const cacheBust = `_t=${Date.now()}`;
          const currentUserId = auth.userId || 'guest-local-user';

          const statsRes = await fetch(`${API_URL}/stats/${currentUserId}?days=30&goal=${globalDefaultGoal}&client_date=${todayStr}&${cacheBust}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            if (isMounted) {
              setStreak(statsData.streak || 0);
              setStatsData(statsData);
            }
          }
        } catch (e) {
          console.error("Failed to sync goal", e);
        }
      };

      // Debounce to allow rapid toggling
      const timer = setTimeout(syncGoal, 500);
      return () => { clearTimeout(timer); isMounted = false; };
    }
  }, [effectiveGoal, auth.userId, globalDefaultGoal]); // REMOVED selectedDate - this effect is TODAY-only

  // NEW: Dedicated Streak Fetcher
  const fetchStreak = async (userId = USER_ID) => {
    try {
      // Goal param is legacy for streak but might be used by other stats
      const statsRes = await fetch(`${API_URL}/stats/${userId}?days=30&goal=${goal}&client_date=${getLocalDateString()}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStreak(statsData.streak || 0);
      }
    } catch (e) { /* ignore streak fetch errors */ }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history/${USER_ID}?date=${getLocalDateString()}`);
      if (!response.ok) throw new Error("Backend offline");
      const data = await response.json();
      setTodayLogs(data.logs || []);
      setTotalWater(data.total_today);
      if (data.historical_goal) setHistoricalGoal(data.historical_goal);
      setIsBackendConnected(true);

      // Also fetch streak from stats
      // Also fetch streak from stats
      fetchStreak();
    } catch (error) {
      console.log("Backend offline, using local state");
      setIsBackendConnected(false);
    }
  };

  // Fetch total for a specific date (userId passed explicitly to avoid stale closure)
  const fetchDataForDate = async (dateStr, userId = USER_ID) => {
    try {
      // Fetch logs for the selected date
      const historyRes = await fetch(`${API_URL}/history/${userId}?date=${dateStr}`);
      if (historyRes.ok) {
        const data = await historyRes.json();
        setTodayLogs(data.logs || []);
        setTotalWater(data.total_today || 0);
        if (data.historical_goal) setHistoricalGoal(data.historical_goal);
        else setHistoricalGoal(null);
        setIsBackendConnected(true);

        // Always fetch streak when loading data (pass userId to avoid stale closure)
        fetchStreak(userId);
      }
    } catch (error) {
      console.log("Failed to fetch date data");
    }
  };

  // 2. Logic: Add Water (supports backdated logging)
  const handleAddWater = async (amount, drinkType = null) => {
    const todayStr = getLocalDateString();
    const isBackdating = selectedDate !== todayStr;

    try {
      // Optimistic UI Update
      const tempId = Date.now();
      const newTotal = totalWater + amount;
      setTotalWater(newTotal);
      const newLog = {
        id: tempId,
        amount,
        time: isBackdating ? `${selectedDate}T12:00:00` : new Date().toISOString(),
        timestamp: new Date().toISOString(),
        drinkType: drinkType?.id || 'water'
      };
      setLogs([...logs, newLog]);
      setTodayLogs([newLog, ...todayLogs]);

      // 🏆 BADGE CHECK: Check for newly unlocked badges
      const newlyUnlocked = checkBadges(
        unlockedBadges,
        [...logs, newLog], // Updated history
        newLog,
        newTotal,
        effectiveGoal,
        streak
      );

      if (newlyUnlocked.length > 0) {
        // Unlock the badges (use Set to prevent duplicates)
        setUnlockedBadges(prev => [...new Set([...prev, ...newlyUnlocked.map(b => b.id)])]);

        // Show badge toast for the first one (queue others if needed)
        setBadgeToast(newlyUnlocked[0]);
        setTimeout(() => setBadgeToast(null), 4000);

        // Special celebration for big achievements
        if (newlyUnlocked.some(b => ['hydration_hero', 'week_warrior', 'month_master'].includes(b.id))) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#60A5FA', '#10B981', '#F59E0B']
          });
        }
      }

      // API Call with optional date for backdating
      const response = await fetch(`${API_URL}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          amount,
          // CRITICAL: For today, record the effective smart goal.
          // For backdated logs, use historicalGoal (from DailySnapshot) to preserve the user's saved goal.
          // Fall back to globalDefaultGoal only if no snapshot exists for that date.
          goal: isBackdating ? (historicalGoal || globalDefaultGoal) : effectiveGoal,
          // ALWAYS send client's local date to prevent server UTC mismatch
          date: isBackdating ? selectedDate : getLocalDateString(),
          // For today's logs, send exact client timestamp for correct timezone display
          client_timestamp: isBackdating ? null : new Date().toISOString()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Sync with server truth
        setTotalWater(data.total_today);
        if (data.today_logs) setTodayLogs(data.today_logs);
        setIsBackendConnected(true);

        // NEW: Update streak if this log triggered a milestone
        fetchStreak();
      } else {
        throw new Error("API Failed");
      }
    } catch (e) {
      console.log("Offline mode: Logged locally");
      // Keep optimistic update, just set flag
      setIsBackendConnected(false);
    }
  };

  // 2b. Logic: Delete Log Entry
  const handleDeleteLog = async (logId) => {
    // Optimistic: Remove from UI immediately
    const deletedLog = todayLogs.find(log => log.id === logId);
    setTodayLogs(todayLogs.filter(log => log.id !== logId));
    if (deletedLog) {
      setTotalWater(Math.max(0, totalWater - deletedLog.amount));
    }

    try {
      const response = await fetch(`${API_URL}/log/${logId}?user_id=${USER_ID}&date=${selectedDate}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        // Sync with server truth
        setTotalWater(data.total_today);
        if (data.today_logs) setTodayLogs(data.today_logs);
        setIsBackendConnected(true);

        // NEW: Refresh streak immediately (Auditing Fix)
        // Use fetchStreak() instead of fetchHistory() to avoid resetting the view to Today
        fetchStreak();
      } else {
        // Revert on failure
        if (deletedLog) {
          setTodayLogs([...todayLogs]);
          setTotalWater(totalWater);
        }
      }
    } catch (e) {
      console.log("Delete failed, reverting");
      setIsBackendConnected(false);
    }
  };

  // 3. Logic: Trigger AI
  const handleTriggerAi = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch(`${API_URL}/ai-feedback?user_id=${USER_ID}&goal=${goal}`);
      if (response.ok) {
        const data = await response.json();
        setAiMessage(data.message);
        setIsBackendConnected(true);
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      console.log("Using Mock AI");
      const msg = await getMockAiFeedback(totalWater, goal);
      setAiMessage(msg);
    }
    setLoadingAi(false);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800'
      : 'bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50'
      }`}>
      {/* Streak Toast Notification */}
      {streakToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            }`}>
            <span className="text-3xl">{streakToast.emoji}</span>
            <span className="font-bold text-lg">{streakToast.text}</span>
          </div>
        </div>
      )}

      {/* 🏆 BADGE UNLOCK TOAST */}
      {badgeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-8 duration-500">
          <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border-2 ${isDarkMode
            ? 'bg-gradient-to-r from-gray-900 to-gray-800 border-yellow-500/50 text-white'
            : 'bg-gradient-to-r from-white to-yellow-50 border-yellow-400 text-gray-800'
            } backdrop-blur-xl`}>
            <div className="relative">
              <span className="text-5xl filter drop-shadow-lg animate-bounce">{badgeToast.icon}</span>
              <div className="absolute -top-1 -right-1">
                <Trophy size={20} className="text-yellow-500" fill="currentColor" />
              </div>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                🏆 Badge Unlocked!
              </p>
              <p className="text-lg font-black">{badgeToast.name}</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{badgeToast.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Responsive container - balanced for tablet/desktop, full-width for mobile */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* JOIN CHALLENGE MODAL (Deep Link) */}
      {joinModalData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setJoinModalData(null); window.history.pushState({}, '', '/'); }}></div>
          <div className={`relative w-full max-w-sm p-6 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy size={32} className="text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Join Challenge</h3>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {joinModalData.name}
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {joinModalData.duration_days} days • {joinModalData.goal_ml}ml daily goal
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {joinModalData.participant_count} participants
              </p>

              <button
                onClick={async () => {
                  const res = await fetch(`${API_URL}/challenges/${joinModalData.inviteCode}/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: USER_ID })
                  });
                  if (res.ok) {
                    setJoinModalData(null);
                    window.history.pushState({}, '', '/');
                    setActiveTab('challenges');
                  }
                }}
                className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
              >
                Join Challenge 🏆
              </button>
              <button
                onClick={() => { setJoinModalData(null); window.history.pushState({}, '', '/'); }}
                className={`mt-2 w-full py-3 rounded-xl font-bold ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen flex justify-center">
        <div className={`w-full max-w-2xl min-h-screen overflow-hidden relative transition-colors duration-300 md:shadow-xl md:border-x ${isDarkMode ? 'bg-gray-800 md:border-gray-700' : 'bg-[#F3F6FF] md:border-gray-200'
          }`}>
          <div className="h-screen overflow-y-auto pb-40">
            {activeTab === 'home' && (
              <HomeScreen
                totalWater={totalWater}
                goal={effectiveGoal} globalDefaultGoal={globalDefaultGoal} setGlobalDefaultGoal={setGlobalDefaultGoal} goalData={goalData}
                drinkAmount={drinkAmount} setDrinkAmount={setDrinkAmount}
                onAddWater={handleAddWater}
                aiMessage={aiMessage}
                loadingAi={loadingAi}
                triggerAi={handleTriggerAi}
                isBackendConnected={isBackendConnected}
                userName={userName}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                isDarkMode={isDarkMode}
                todayLogs={todayLogs}
                onDeleteLog={handleDeleteLog}
                quickAddPresets={quickAddPresets}
                statsData={statsData}
                theme={theme}
                streak={streak}
                onSettingsClick={() => setActiveTab('settings')}
                historicalGoal={historicalGoal}
                setHistoricalGoal={setHistoricalGoal}
                userContext={userContext}
                onCloudSync={() => setIsLoginModalOpen(true)}
              />
            )}
            {activeTab === 'stats' && <StatsScreen logs={logs} globalDefaultGoal={globalDefaultGoal} effectiveGoal={effectiveGoal} isDarkMode={isDarkMode} unlockedBadges={unlockedBadges} userId={USER_ID} />}
            {activeTab === 'alarm' && <AlarmScreen totalWater={totalWater} globalDefaultGoal={globalDefaultGoal} effectiveGoal={effectiveGoal} logs={logs} />}
            {activeTab === 'settings' && (
              <SettingsScreen
                globalDefaultGoal={globalDefaultGoal}
                setGlobalDefaultGoal={setGlobalDefaultGoal}
                drinkAmount={drinkAmount}
                setDrinkAmount={setDrinkAmount}
                userName={userName}
                setUserName={handleSetUserName}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                smartAlerts={smartAlerts}
                setSmartAlerts={setSmartAlerts}
                alertFrequency={alertFrequency}
                setAlertFrequency={setAlertFrequency}
                alertStartTime={alertStartTime}
                setAlertStartTime={setAlertStartTime}
                alertEndTime={alertEndTime}
                setAlertEndTime={setAlertEndTime}
                quickAddPresets={quickAddPresets}
                setQuickAddPresets={setQuickAddPresets}
                theme={theme}
                setTheme={setTheme}
                dailyConditions={dailyConditions}
                setDailyConditions={setDailyConditions}
                goalData={goalData}
                onRequestPermission={requestPermission}
                onTestNotification={sendTestNotification}
                userEmail={userContext.email}
              />
            )}
            {activeTab === 'challenges' && (
              <ChallengesScreen
                userId={USER_ID}
                isDarkMode={isDarkMode}
                onViewChallenge={(id) => {
                  setActiveTab('challenge-detail');
                  window.selectedChallengeId = id;
                }}
              />
            )}
            {activeTab === 'challenge-detail' && (
              <ChallengeDetail
                challengeId={window.selectedChallengeId}
                userId={USER_ID}
                isDarkMode={isDarkMode}
                onBack={() => setActiveTab('challenges')}
              />
            )}
          </div>
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onQuickAdd={() => { setActiveTab('home'); handleAddWater(drinkAmount); }} isDarkMode={isDarkMode} />
        </div>
        <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-visible::-webkit-scrollbar { height: 8px; }
        .scrollbar-visible::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .scrollbar-visible::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 4px; }
        .scrollbar-visible::-webkit-scrollbar-thumb:hover { background: #a5b4fc; }
        .wave-animation { animation: wave 4s linear infinite; }
        .wave-animation-delayed { animation: wave 6s linear infinite; }
        @keyframes wave {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-5px) rotate(2deg); }
            100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-float-up {
            animation: floatUp 1.5s ease-out forwards;
        }
        @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            50% { opacity: 1; transform: translateY(-20px) scale(1.2); }
            100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }
        .animate-pulse-ring {
            animation: pulseRing 0.5s ease-out;
        }
        @keyframes pulseRing {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .animate-wave-flow {
            animation: waveFlow 4s linear infinite;
        }
        .animate-wave-flow-reverse {
            animation: waveFlow 6s linear infinite reverse;
        }
        @keyframes waveFlow {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-bubble-rise {
            animation: bubbleRise 3s infinite ease-in;
        }
        @keyframes bubbleRise {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { opacity: 0.5; }
            100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
        }
        .animate-sway {
            animation: sway 3s ease-in-out infinite alternate;
            transform-origin: bottom center;
        }
        @keyframes sway {
            0% { transform: rotate(-5deg); }
            100% { transform: rotate(5deg); }
        }
        .animate-water-pulse {
            animation: waterPulse 3s infinite ease-out;
        }
        @keyframes waterPulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.15); opacity: 0; }
        }
      `}</style>
      </div>
    </div>
  );
}
