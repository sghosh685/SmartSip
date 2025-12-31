# SmartSip V1.0 - QA Testing Checklist

## Pre-Launch Testing Guide

Use this checklist to verify all features work before deploying to production.

---

## 1. Authentication Flow

### Guest Mode (No Supabase)
- [ ] App loads without errors when Supabase credentials are missing
- [ ] Console shows warning: "Supabase credentials not found"
- [ ] Cloud icon shows amber/warning state
- [ ] User can still log water as guest
- [ ] Data persists in local database

### Google Sign-In (With Supabase)
- [ ] Clicking cloud icon opens login modal
- [ ] "Sign in with Google" button is visible and styled correctly
- [ ] Google OAuth flow redirects properly
- [ ] After login, cloud icon turns green
- [ ] User name updates from "Guest User" to email username
- [ ] Clicking "Continue as Guest" closes modal

---

## 2. Core Hydration Tracking

### Logging Water
- [ ] Tap preset buttons (150ml, 300ml, 500ml, 750ml) to log water
- [ ] Water amount animates and updates total
- [ ] Percentage ring/visualization updates smoothly
- [ ] Confetti fires when goal is reached (first time per day)
- [ ] Toast message appears for non-water drinks

### Drink Types
- [ ] Can switch between Water, Coffee, Tea, etc.
- [ ] Different drinks show correct hydration multiplier
- [ ] Coach tip appears for non-water drinks
- [ ] "More" button opens full drink selector modal

### History
- [ ] Today's logs appear in activity list
- [ ] Can delete individual log entries
- [ ] Deleting updates total correctly
- [ ] Past dates are viewable via date picker
- [ ] Cannot log to future dates

---

## 3. Goals & Streaks

### Goal Management
- [ ] Goal displays correctly (ml)
- [ ] Can edit goal via pencil icon
- [ ] Context bonuses (Hot Weather, Active, etc.) add to goal
- [ ] Historical dates show snapshot goal, not current

### Streaks
- [ ] Current streak displays
- [ ] Streak increments after meeting goal
- [ ] Streak resets if goal not met previous day
- [ ] Streak milestone toasts appear (3, 7, 14, etc.)

---

## 4. AI Coach

- [ ] "Get AI Feedback" button appears
- [ ] Loading spinner shows during API call
- [ ] AI message displays with emojis
- [ ] Fallback message shows if GROQ_API_KEY missing
- [ ] No errors in console during AI call

---

## 5. Settings

- [ ] Settings accessible via gear icon
- [ ] Can toggle Dark Mode
- [ ] Can change notification settings
- [ ] Can customize quick-add presets
- [ ] Can view/modify daily conditions
- [ ] Theme switcher works (Glass, Garden, Simple)

---

## 6. PWA Features

### Installation
- [ ] "Add to Home Screen" prompt appears (iOS Safari, Android Chrome)
- [ ] App icon appears on home screen after install
- [ ] App launches in standalone mode (no browser UI)

### Offline Behavior
- [ ] App loads when offline (cached shell)
- [ ] Shows "Offline" badge when disconnected
- [ ] Gracefully handles API failures

---

## 7. Responsive Design

- [ ] Mobile (iPhone SE - 375px): All elements visible, no overflow
- [ ] Tablet (iPad - 768px): Layout adapts, good use of space
- [ ] Desktop (1440px): Constrained width, centered layout

---

## 8. Dark Mode

- [ ] All text readable in dark mode
- [ ] No white flashes on page load
- [ ] Charts/graphs have proper contrast
- [ ] Modals styled correctly

---

## 9. Performance

- [ ] Initial page load < 3 seconds
- [ ] No layout shifts after load
- [ ] Smooth animations (60fps)
- [ ] No memory leaks on long sessions

---

## 10. Error Handling

- [ ] API timeout shows user-friendly message
- [ ] Invalid data doesn't crash app
- [ ] Network errors show retry option
- [ ] Console has no red errors in normal usage

---

## Bug Report Template

If you find issues, document them:

```
**Bug:** [Brief description]
**Steps to Reproduce:**
1. ...
2. ...
3. ...
**Expected:** What should happen
**Actual:** What actually happened
**Device/Browser:** e.g., iPhone 14, Safari 17
**Screenshot:** [attach if possible]
```

---

## Sign-Off

- [ ] All critical items pass
- [ ] No blocking bugs
- [ ] Ready for production deployment

**Tested by:** _______________  
**Date:** _______________
