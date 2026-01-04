from sqlalchemy.orm import Session
from database import SessionLocal
import models
import sys

def cleanup_corrupted_goals(db: Session, dry_run: bool = True):
    print(f"--- Phase C: Data Cleanup ({'DRY RUN' if dry_run else 'LIVE'}) ---")
    
    # query all snapshots
    snapshots = db.query(models.DailySnapshot).all()
    print(f"Checking {len(snapshots)} snapshots...")
    
    corrupted_count = 0
    fixed_count = 0
    
    for snap in snapshots:
        original_goal = snap.goal_for_day
        new_goal = original_goal
        
        # Heuristic for corruption
        # 1. Too large (concatenation bug: 1500 -> 15001500)
        # 2. Too small (invalid input: < 500)
        # 3. NaN check (handled by python type, but DB stores int, so mostly range check)
        
        if original_goal > 10000:
            # Likely concatenation bug
            # Try to recover: take first 4 digits? Or just reset to 2500.
            # 15001500 -> 1500. 
            # 25002500 -> 2500.
            str_goal = str(original_goal)
            if len(str_goal) >= 8 and str_goal[:4] == str_goal[4:8]:
                 # Double pattern detected
                 try:
                     new_goal = int(str_goal[:4])
                 except:
                     new_goal = 2500
            else:
                new_goal = 2500
            
            corrupted_count += 1
            print(f"  [CORRUPT] User {snap.user_id} on {snap.date}: {original_goal} -> {new_goal}")
            
        elif original_goal < 500:
            # Likely invalid input
            new_goal = 2500
            corrupted_count += 1
            print(f"  [INVALID] User {snap.user_id} on {snap.date}: {original_goal} -> {new_goal}")

        if new_goal != original_goal:
            if not dry_run:
                snap.goal_for_day = new_goal
                # Re-evaluate goal_met
                snap.goal_met = snap.total_intake >= new_goal
                fixed_count += 1

    if not dry_run:
        db.commit()
        print(f"Successfully fixed {fixed_count} corrupted records.")
    else:
        print(f"Found {corrupted_count} potential fixes. Run with --live to apply.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        is_live = False
        if len(sys.argv) > 1 and sys.argv[1] == "--live":
            is_live = True
        
        cleanup_corrupted_goals(db, dry_run=not is_live)
    finally:
        db.close()
