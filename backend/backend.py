import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

# SQLAlchemy Imports
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from database import SessionLocal, engine, get_db
import models

# --- CONFIGURATION ---
load_dotenv()
app = FastAPI(title="SmartSip API")

# CORS Configuration
# In production, set CORS_ORIGINS to your frontend domain(s)
# Example: CORS_ORIGINS=https://smartsip.vercel.app,https://smartsip.com
cors_origins_str = os.getenv("CORS_ORIGINS", "*")
cors_origins = cors_origins_str.split(",") if cors_origins_str != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database (Create tables if not exist)
models.Base.metadata.create_all(bind=engine)

# Helper to ensure we strictly use 'test-user' for MVP 
# (simulating the single-user local mode until full Auth is added)
DEFAULT_USER_ID = "test-user"

def get_or_create_user(db: Session, user_id: str):
    """Ensure the user exists in the Users table (Migration Helper)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        user = models.User(id=user_id, is_guest=True)
        db.add(user)
        db.commit()
    return user

def db_log_intake(db: Session, user_id: str, amount: int, date_str: str = None):
    # Ensure User exists
    get_or_create_user(db, user_id)
    
    if date_str:
        timestamp = datetime.strptime(f"{date_str} 12:00:00", "%Y-%m-%d %H:%M:%S")
    else:
        timestamp = datetime.now()
        
    db_log = models.WaterIntake(user_id=user_id, intake_ml=amount, timestamp=timestamp)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log.id, db_log.timestamp.isoformat()

def db_get_history(db: Session, user_id: str):
    logs = db.query(models.WaterIntake).filter(models.WaterIntake.user_id == user_id).order_by(models.WaterIntake.id.desc()).all()
    return [{"id": l.id, "amount": l.intake_ml, "time": l.timestamp.isoformat()} for l in logs]

def db_get_today_total(db: Session, user_id: str):
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    total = db.query(func.sum(models.WaterIntake.intake_ml)).filter(
        models.WaterIntake.user_id == user_id,
        models.WaterIntake.timestamp >= today_start
    ).scalar()
    return total or 0

def db_get_date_total(db: Session, user_id: str, date_str: str):
    """Get total intake for a specific date."""
    date_start = datetime.strptime(date_str, "%Y-%m-%d")
    date_end = date_start + timedelta(days=1)
    
    total = db.query(func.sum(models.WaterIntake.intake_ml)).filter(
        models.WaterIntake.user_id == user_id,
        models.WaterIntake.timestamp >= date_start,
        models.WaterIntake.timestamp < date_end
    ).scalar()
    return total or 0

def db_delete_log(db: Session, log_id: int, user_id: str):
    """Delete a specific log entry by ID."""
    log = db.query(models.WaterIntake).filter(models.WaterIntake.id == log_id).first()
    
    if not log:
        return None, None, "Log not found"
    if log.user_id != user_id:
        return None, None, "Unauthorized"
    
    amount = log.intake_ml
    timestamp = log.timestamp.isoformat()
    
    db.delete(log)
    db.commit()
    return amount, timestamp, "success"

def db_get_today_logs(db: Session, user_id: str, date_str: str = None):
    """Get individual log entries for today (or specified date)."""
    if date_str:
        date_start = datetime.strptime(date_str, "%Y-%m-%d")
    else:
        date_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    date_end = date_start + timedelta(days=1)
    
    logs = db.query(models.WaterIntake).filter(
        models.WaterIntake.user_id == user_id,
        models.WaterIntake.timestamp >= date_start,
        models.WaterIntake.timestamp < date_end
    ).order_by(models.WaterIntake.id.desc()).all()
    
    return [{"id": l.id, "amount": l.intake_ml, "time": l.timestamp.isoformat()} for l in logs]

# --- DAILY SNAPSHOT MANAGEMENT ---

def db_create_or_update_snapshot(db: Session, user_id: str, date_str: str, goal: int):
    """Create or update a daily snapshot. Called whenever water is logged."""
    # Ensure User exists
    get_or_create_user(db, user_id)

    total = db_get_date_total(db, user_id, date_str)
    goal_met = total >= goal
    
    # Check if snapshot exists
    snapshot = db.query(models.DailySnapshot).filter(
        models.DailySnapshot.user_id == user_id,
        models.DailySnapshot.date == date_str
    ).first()
    
    if snapshot:
        # Update existing
        snapshot.goal_for_day = goal
        snapshot.total_intake = total
        snapshot.goal_met = goal_met
        snapshot.updated_at = datetime.now()
    else:
        # Create new
        snapshot = models.DailySnapshot(
            user_id=user_id,
            date=date_str,
            goal_for_day=goal,
            total_intake=total,
            goal_met=goal_met,
            updated_at=datetime.now()
        )
        db.add(snapshot)
    
    db.commit()
    db.refresh(snapshot)
    return {"date": date_str, "goal": goal, "total": total, "goal_met": goal_met}

def db_lock_previous_day_snapshot(db: Session, user_id: str, goal: int):
    """Lock yesterday's snapshot if it doesn't exist."""
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Check if snapshot exists
    exists = db.query(models.DailySnapshot).filter(
        models.DailySnapshot.user_id == user_id,
        models.DailySnapshot.date == yesterday
    ).first()
    
    if not exists:
        # Create user if needed
        get_or_create_user(db, user_id)
        
        total = db_get_date_total(db, user_id, yesterday)
        goal_met = total >= goal
        
        snapshot = models.DailySnapshot(
            user_id=user_id,
            date=yesterday,
            goal_for_day=goal,
            total_intake=total,
            goal_met=goal_met,
            updated_at=datetime.now()
        )
        db.add(snapshot)
        db.commit()

def db_get_snapshots(db: Session, user_id: str, days: int = 365):
    """Get daily snapshots for streak calculation."""
    snapshots = db.query(models.DailySnapshot).filter(
        models.DailySnapshot.user_id == user_id
    ).order_by(models.DailySnapshot.date.desc()).limit(days).all()
    
    return [{"date": s.date, "goal": s.goal_for_day, "total": s.total_intake, "goal_met": s.goal_met} for s in snapshots]

# db_get_streak_from_snapshots DOES NOT NEED DB ACCESS directly (it takes the list from above)
# But we need to update its call signature later.
# Actually, it calls db_get_snapshots internally. We must update it.

def db_get_streak_from_snapshots(db: Session, user_id: str, client_date: str = None):
    """
    Calculate streak from daily snapshots.
    
    A streak is the number of consecutive days (ending today or yesterday) 
    where the user met their daily goal.
    
    Logic:
    1. Snapshots are sorted by date DESC (newest first)
    2. We check if TODAY or YESTERDAY starts a streak (allowing for "day not over" scenario)
    3. Then count consecutive goal_met=True days backwards
    """
    snapshots = db_get_snapshots(db, user_id, 365)
    
    if not snapshots:
        return 0
    
    # Build a dict for O(1) lookup: date_str -> goal_met
    # If duplicates exist, prefer goal_met=True (DB inconsistency handling)
    snap_dict = {}
    for snap in snapshots:
        date = snap["date"]
        if date not in snap_dict:
            snap_dict[date] = snap["goal_met"]
        elif snap["goal_met"]:
            # Prefer goal_met=True if duplicate exists
            snap_dict[date] = True
    
    # Use client_date if provided (for timezone accuracy), else server time
    if client_date:
        try:
            today = datetime.strptime(client_date, "%Y-%m-%d").date()
        except ValueError:
            today = datetime.now().date()
    else:
        today = datetime.now().date()
    
    yesterday = today - timedelta(days=1)
    
    # Determine starting point: today if goal met, or yesterday if today's goal not met yet
    # (User might still be working on today's goal)
    if snap_dict.get(today.strftime("%Y-%m-%d"), False):
        check_date = today
    elif snap_dict.get(yesterday.strftime("%Y-%m-%d"), False):
        check_date = yesterday
    else:
        # Neither today nor yesterday has goal met - no active streak
        return 0
    
    # Count consecutive days with goal_met = True
    streak = 0
    for i in range(365):
        date_str = check_date.strftime("%Y-%m-%d")
        if snap_dict.get(date_str, False):
            streak += 1
            check_date = check_date - timedelta(days=1)
        else:
            break
    
    return streak

def db_backfill_snapshots(db: Session, user_id: str, goal: int):
    """Backfill snapshots for existing data that doesn't have snapshots yet."""
    stats = db_get_stats(db, user_id, 365) # Need to implement db_get_stats with ORM next
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    for day in stats:
        if day["date"] == today_str:
            continue
        if day["total"] == 0:
            continue
            
        exists = db.query(models.DailySnapshot).filter(
            models.DailySnapshot.user_id == user_id,
            models.DailySnapshot.date == day["date"]
        ).first()
        
        if not exists:
            get_or_create_user(db, user_id)
            goal_met = day["total"] >= goal
            s = models.DailySnapshot(
                user_id=user_id,
                date=day["date"],
                goal_for_day=goal,
                total_intake=day["total"],
                goal_met=goal_met,
                updated_at=datetime.now()
            )
            db.add(s)
    
    db.commit()


# --- AI AGENT LAYER ---
def get_ai_feedback(current_intake: int, goal: int):
    """Uses Groq API directly to generate feedback."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "⚠️ AI Key missing. Please check backend .env file."

    try:
        client = Groq(api_key=api_key)
        
        percentage = (current_intake / goal) * 100 if goal > 0 else 0
        prompt = (
            f"You are a friendly hydration coach. The user has consumed {current_intake}ml of water today ({percentage:.0f}% of their {goal}ml goal). "
            f"Give a brief, encouraging message about their hydration status. "
            f"Use emojis and keep it under 2 sentences."
        )
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=150
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"AI Error: {str(e)}"


# --- STATS AGGREGATION ---
def db_get_stats(db: Session, user_id: str, days: int = 365):
    """Get daily totals for the past N days."""
    today = datetime.now()
    cutoff_date = today - timedelta(days=days)
    
    # Efficiently group by date in SQL if using Postgres, but for broad compatibility (SQLite)
    # we'll fetch range and aggregate in python or use simple group by if possible.
    # To correspond to previous logic:
    
    logs = db.query(models.WaterIntake).filter(
        models.WaterIntake.user_id == user_id,
        models.WaterIntake.timestamp >= cutoff_date
    ).all()
    
    daily_totals = {}
    for log in logs:
        date_str = log.timestamp.strftime("%Y-%m-%d")
        daily_totals[date_str] = daily_totals.get(date_str, 0) + log.intake_ml
        
    result = []
    for i in range(days):
        date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        result.append({
            "date": date,
            "total": daily_totals.get(date, 0)
        })
    
    return result

def db_get_streak(db: Session, user_id: str, goal: int = 2500):
    """Calculate current streak of days meeting the goal (Legacy Fallback)."""
    stats = db_get_stats(db, user_id, 365)
    streak = 0
    start_index = 0
    if stats and stats[0]["total"] < goal:
        start_index = 1
        
    for i in range(start_index, len(stats)):
        if stats[i]["total"] >= goal:
            streak += 1
        else:
            break
            
    return streak

# --- API MODELS ---
class LogRequest(BaseModel):
    user_id: str
    amount: int
    goal: int
    date: Optional[str] = None

class BulkLogEntry(BaseModel):
    amount: int
    timestamp: str  # ISO format datetime string
    
class BulkImportRequest(BaseModel):
    user_id: str
    logs: List[BulkLogEntry]
    goal: int

# --- API ROUTES ---
@app.get("/")
def read_root():
    return {"status": "SmartSip Backend Running"}

@app.post("/bulk-import")
def bulk_import(req: BulkImportRequest, db: Session = Depends(get_db)):
    """
    Bulk import water logs from localStorage guest data.
    Used when a user authenticates to migrate their offline data.
    """
    if not req.logs:
        return {"status": "success", "imported": 0, "message": "No logs to import"}
    
    # Ensure user exists
    get_or_create_user(db, req.user_id)
    
    imported_count = 0
    dates_to_update = set()
    
    for log_entry in req.logs:
        try:
            # Parse the timestamp
            timestamp = datetime.fromisoformat(log_entry.timestamp.replace('Z', '+00:00'))
            date_str = timestamp.strftime("%Y-%m-%d")
            
            # Check if this exact log already exists (prevent duplicates)
            existing = db.query(models.WaterIntake).filter(
                models.WaterIntake.user_id == req.user_id,
                models.WaterIntake.intake_ml == log_entry.amount,
                models.WaterIntake.timestamp == timestamp
            ).first()
            
            if not existing:
                db_log = models.WaterIntake(
                    user_id=req.user_id,
                    intake_ml=log_entry.amount,
                    timestamp=timestamp
                )
                db.add(db_log)
                imported_count += 1
                dates_to_update.add(date_str)
        except Exception as e:
            print(f"Failed to import log: {log_entry}, error: {e}")
            continue
    
    db.commit()
    
    # Update daily snapshots for all affected dates
    for date_str in dates_to_update:
        db_create_or_update_snapshot(db, req.user_id, date_str, req.goal)
    
    return {
        "status": "success",
        "imported": imported_count,
        "dates_updated": list(dates_to_update)
    }

class ClaimGuestDataRequest(BaseModel):
    user_id: str  # The authenticated user ID to claim data for
    goal: int

@app.post("/claim-guest-data")
def claim_guest_data(req: ClaimGuestDataRequest, db: Session = Depends(get_db)):
    """
    Transfer all 'guest-local-user' database records to an authenticated user.
    This is called after OAuth login to claim any guest data that was stored in the DB.
    """
    GUEST_USER_ID = "guest-local-user"
    
    if req.user_id == GUEST_USER_ID:
        return {"status": "error", "message": "Cannot claim guest data to guest account"}
    
    # Ensure user exists
    get_or_create_user(db, req.user_id)
    
    # 1. Transfer water_intake records
    guest_logs = db.query(models.WaterIntake).filter(
        models.WaterIntake.user_id == GUEST_USER_ID
    ).all()
    
    transferred_logs = 0
    dates_affected = set()
    
    for log in guest_logs:
        # Change ownership to authenticated user
        log.user_id = req.user_id
        transferred_logs += 1
        dates_affected.add(log.timestamp.strftime("%Y-%m-%d"))
    
    # 2. Transfer daily_snapshots (or recreate them)
    guest_snapshots = db.query(models.DailySnapshot).filter(
        models.DailySnapshot.user_id == GUEST_USER_ID
    ).all()
    
    transferred_snapshots = 0
    for snap in guest_snapshots:
        # Check if user already has a snapshot for this date
        existing = db.query(models.DailySnapshot).filter(
            models.DailySnapshot.user_id == req.user_id,
            models.DailySnapshot.date == snap.date
        ).first()
        
        if existing:
            # Merge: add totals, update goal_met
            existing.total_intake += snap.total_intake
            existing.goal_met = existing.total_intake >= existing.goal_for_day
            existing.updated_at = datetime.now()
            # Delete the guest snapshot
            db.delete(snap)
        else:
            # Transfer ownership
            snap.user_id = req.user_id
            transferred_snapshots += 1
    
    db.commit()
    
    # Recreate snapshots for affected dates (to ensure accuracy)
    for date_str in dates_affected:
        db_create_or_update_snapshot(db, req.user_id, date_str, req.goal)
    
    return {
        "status": "success",
        "logs_transferred": transferred_logs,
        "snapshots_transferred": transferred_snapshots,
        "dates_affected": list(dates_affected)
    }

@app.post("/log")
def log_intake(req: LogRequest, db: Session = Depends(get_db)):
    # 1. Log to DB
    log_id, timestamp = db_log_intake(db, req.user_id, req.amount, req.date)
    
    # 2. Calculate total for the logged date
    logged_date = req.date or datetime.now().strftime("%Y-%m-%d")
    total = db_get_date_total(db, req.user_id, logged_date)
    
    # 3. Get today's individual logs
    today_logs = db_get_today_logs(db, req.user_id, logged_date)
    
    # 4. Update daily snapshot
    db_create_or_update_snapshot(db, req.user_id, logged_date, req.goal)
    
    # 5. Ensure previous day's snapshot is locked
    db_lock_previous_day_snapshot(db, req.user_id, req.goal)
    
    return {
        "status": "success",
        "total_today": total,
        "today_logs": today_logs,
        "log_id": log_id,
        "logged_date": logged_date
    }

def db_get_snapshot_goal(db: Session, user_id: str, date_str: str):
    """Retrieve the locked goal for a specific date from snapshots."""
    # 1. Try to find exact snapshot
    snapshot = db.query(models.DailySnapshot).filter(
        models.DailySnapshot.user_id == user_id,
        models.DailySnapshot.date == date_str
    ).first()
    
    if snapshot:
        return snapshot.goal_for_day
    
    # 2. Find LAST KNOWN goal
    last_snapshot = db.query(models.DailySnapshot).filter(
        models.DailySnapshot.user_id == user_id,
        models.DailySnapshot.date < date_str
    ).order_by(models.DailySnapshot.date.desc()).first()
    
    return last_snapshot.goal_for_day if last_snapshot else 2500

class UpdateGoalRequest(BaseModel):
    user_id: str
    date: str
    goal: int

@app.post("/update-goal")
def update_goal(req: UpdateGoalRequest, db: Session = Depends(get_db)):
    snapshot = db_create_or_update_snapshot(db, req.user_id, req.date, req.goal)
    return {"status": "success", "snapshot": snapshot}

@app.delete("/log/{log_id}")
def delete_log(log_id: int, user_id: str, date: str = None, db: Session = Depends(get_db)):
    amount, timestamp, result = db_delete_log(db, log_id, user_id)
    if result != "success":
        raise HTTPException(status_code=404 if result == "Log not found" else 403, detail=result)
    
    log_date = timestamp[:10]
    existing_goal = db_get_snapshot_goal(db, user_id, log_date)
    db_create_or_update_snapshot(db, user_id, log_date, existing_goal)
    
    if date:
        total = db_get_date_total(db, user_id, date)
        today_logs = db_get_today_logs(db, user_id, date)
    else:
        total = db_get_today_total(db, user_id)
        today_logs = db_get_today_logs(db, user_id)
    
    return {
        "status": "success",
        "deleted_amount": amount,
        "total_today": total,
        "today_logs": today_logs
    }

@app.get("/history/{user_id}")
def get_history(user_id: str, date: str = None, db: Session = Depends(get_db)):
    today_logs = db_get_today_logs(db, user_id, date)
    snapshot_goal = None
    if date:
        total = db_get_date_total(db, user_id, date)
        snapshot_goal = db_get_snapshot_goal(db, user_id, date)
    else:
        total = db_get_today_total(db, user_id)
        today_str = datetime.now().strftime("%Y-%m-%d")
        snapshot_goal = db_get_snapshot_goal(db, user_id, today_str)
        
    return {"logs": today_logs, "total_today": total, "historical_goal": snapshot_goal}

@app.get("/ai-feedback")
def ai_feedback(user_id: str, goal: int, db: Session = Depends(get_db)):
    total = db_get_today_total(db, user_id)
    message = get_ai_feedback(total, goal)
    return {"message": message}

@app.get("/stats/{user_id}")
def get_stats(user_id: str, days: int = 30, goal: int = 2500, client_date: str = None, db: Session = Depends(get_db)):
    daily_data = db_get_stats(db, user_id, days)
    
    # Migration/Cleanup step - backfill any missing snapshots
    db_backfill_snapshots(db, user_id, goal)
    
    # Use ONLY the new streak logic with client timezone
    streak = db_get_streak_from_snapshots(db, user_id, client_date)
    
    week_data = daily_data[:7]
    week_total = sum(d["total"] for d in week_data)
    week_avg = week_total / 7 if week_data else 0
    
    month_data = daily_data[:30]
    month_total = sum(d["total"] for d in month_data)
    
    return {
        "daily": daily_data,
        "streak": streak,
        "week_avg": round(week_avg),
        "week_total": week_total,
        "month_total": month_total
    }

# DEBUG endpoint - remove in production
@app.get("/debug/snapshots/{user_id}")
def debug_snapshots(user_id: str, db: Session = Depends(get_db)):
    """View daily snapshots for debugging streak issues."""
    snapshots = db_get_snapshots(db, user_id, 30)
    today = datetime.now()
    return {
        "server_time_utc": today.isoformat(),
        "server_date_utc": today.strftime("%Y-%m-%d"),
        "user_id": user_id,
        "snapshots": snapshots,
        "snapshot_count": len(snapshots)
    }