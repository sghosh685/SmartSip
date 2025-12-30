import { useEffect, useRef, useCallback } from 'react';

export const useSmartNotifications = ({
    enabled,
    frequencyHours,
    startTime,
    endTime,
    goalMet,
    logs,
}) => {
    const lastCheckTime = useRef(Date.now());

    // 1. Request Permission
    const requestPermission = useCallback(async () => {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
            return false;
        }
        if (Notification.permission === "granted") return true;

        const permission = await Notification.requestPermission();
        return permission === "granted";
    }, []);

    // 2. Send Immediate Notification (Test)
    // 2. Send Immediate Notification (Test)
    const sendTestNotification = useCallback(async () => {
        let permission = Notification.permission;
        if (permission !== "granted") {
            permission = await Notification.requestPermission();
        }

        if (permission === "granted") {
            console.log("Sending test notification...");
            const n = new Notification("💧 SmartSip Test", {
                body: "This is how your hydration reminders will look!",
                icon: "/pwa-icon.svg",
                requireInteraction: true // Keep it on screen
            });
            n.onclick = () => { window.focus(); n.close(); };
        } else {
            console.log("Permission denied for notifications");
            alert("Please allow notifications in your browser settings to use this feature.");
        }
    }, []);

    // 3. The "Smart" Loop
    useEffect(() => {
        if (!enabled || goalMet) return; // Don't annoy if disabled or goal met

        const checkInterval = setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();

            // Allow checking time format "09:00" -> 9
            const startH = parseInt(startTime.split(':')[0], 10);
            const endH = parseInt(endTime.split(':')[0], 10);

            // A. Check Quiet Hours
            if (currentHour < startH || currentHour >= endH) return;

            // B. Find Last Hydration Time
            let lastLogTime = 0;
            if (logs && logs.length > 0) {
                // Assuming logs are ordered or find max timestamp
                // Safe bet: sort or just iterate
                const timestamps = logs.map(l => new Date(l.timestamp).getTime());
                lastLogTime = Math.max(...timestamps);
            } else {
                // No logs today? Base it on start of day (Active Window Start)
                const startOfDay = new Date();
                startOfDay.setHours(startH, 0, 0, 0);
                lastLogTime = startOfDay.getTime();
            }

            // C. Calculate Gap
            const timeSinceLastDrink = now.getTime() - lastLogTime;
            const frequencyMs = frequencyHours * 60 * 60 * 1000;

            // D. Trigger Condition
            // We adding a buffer check to ensure we don't spam. 
            // Only notify if we passed the threshold AND we haven't notified recently (e.g. in last hour)
            // For now, simpler: strict threshold check.
            // But wait, if I haven't drunk for 4 hours, this will fire EVERY MINUTE.
            // We need a "lastNotificationTime" tracker.

            const timeSinceLastNotify = now.getTime() - lastCheckTime.current;
            const snoozeTime = 30 * 60 * 1000; // Don't notify more than once every 30 mins even if overdue

            if (timeSinceLastDrink >= frequencyMs && timeSinceLastNotify > snoozeTime) {
                if (Notification.permission === "granted") {
                    new Notification("💧 Time to hydrate!", {
                        body: `You haven't logged any water in ${frequencyHours} hours. Stay on track!`,
                        icon: "/vite.svg"
                    });
                    lastCheckTime.current = now.getTime();
                }
            }

        }, 60000); // Check every minute

        return () => clearInterval(checkInterval);

    }, [enabled, frequencyHours, startTime, endTime, goalMet, logs]);

    return { requestPermission, sendTestNotification };
};
