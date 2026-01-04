import unittest
import os
import sys
from datetime import datetime, timedelta

# Add parent dir to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine
import models
from backend import db_get_snapshot_goal, db_create_or_update_snapshot, db_log_intake

# Use in-memory SQLite for testing if possible, or a test file
# database.py uses 'smartsip.db' by default. 
# We'll use a specific test user ID to avoid messing with real data.
TEST_USER_ID = "unit-test-user-v1"

class TestGoalLogic(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Clean up test user data
        self.db.query(models.DailySnapshot).filter(models.DailySnapshot.user_id == TEST_USER_ID).delete()
        self.db.query(models.WaterIntake).filter(models.WaterIntake.user_id == TEST_USER_ID).delete()
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_default_goal_new_user(self):
        """Tier 3: Default fallback is 2500"""
        goal = db_get_snapshot_goal(self.db, TEST_USER_ID, "2025-01-01")
        self.assertEqual(goal, 2500)

    def test_snapshot_creation_and_carry_forward(self):
        """Tier 2: Snapshot created on Day 1 carries forward to Day 2"""
        day1 = "2025-01-01"
        day2 = "2025-01-02"
        
        # Set goal on Day 1 via logging (or explicit update)
        db_create_or_update_snapshot(self.db, TEST_USER_ID, day1, 3000)
        
        # Check Day 1
        goal1 = db_get_snapshot_goal(self.db, TEST_USER_ID, day1)
        self.assertEqual(goal1, 3000)
        
        # Check Day 2 (should inherit Day 1)
        goal2 = db_get_snapshot_goal(self.db, TEST_USER_ID, day2)
        self.assertEqual(goal2, 3000)

    def test_backward_isolation(self):
        """Tier 2: Future goal change should NOT affect past"""
        day1 = "2025-01-01"
        day2 = "2025-01-02" # Date of change
        
        # Setup: Day 1 has goal 3000
        db_create_or_update_snapshot(self.db, TEST_USER_ID, day1, 3000)
        
        # Action: Change Day 2 to 4000
        db_create_or_update_snapshot(self.db, TEST_USER_ID, day2, 4000)
        
        # Check Day 2
        self.assertEqual(db_get_snapshot_goal(self.db, TEST_USER_ID, day2), 4000)
        
        # Check Day 1 (should STILL be 3000)
        self.assertEqual(db_get_snapshot_goal(self.db, TEST_USER_ID, day1), 3000)

    def test_explicit_snapshot_isolation(self):
        """Tier 2: If snapshot exists for Day 2, changing Day 1 shouldn't affect Day 2"""
        day1 = "2025-01-01"
        day2 = "2025-01-02"
        
        # Setup: Both days have logs/snapshots
        db_create_or_update_snapshot(self.db, TEST_USER_ID, day1, 3000)
        db_create_or_update_snapshot(self.db, TEST_USER_ID, day2, 3000)
        
        # Change Day 1
        db_create_or_update_snapshot(self.db, TEST_USER_ID, day1, 3500)
        
        # Check Day 1
        self.assertEqual(db_get_snapshot_goal(self.db, TEST_USER_ID, day1), 3500)
        
        # Check Day 2 (Locked at 3000)
        self.assertEqual(db_get_snapshot_goal(self.db, TEST_USER_ID, day2), 3000)

    def test_implicit_snapshot_propagation(self):
        """Tier 2: If NO snapshot for Day 2, changing Day 1 DOES affect Day 2 (Timeline view)"""
        day1 = "2025-01-01"
        day2 = "2025-01-02"
        
        # Setup: Only Day 1 matches
        db_create_or_update_snapshot(self.db, TEST_USER_ID, day1, 3000)
        
        # Check Day 2 (Implicit 3000)
        self.assertEqual(db_get_snapshot_goal(self.db, TEST_USER_ID, day2), 3000)
        
        # Change Day 1
        db_create_or_update_snapshot(self.db, TEST_USER_ID, day1, 3500)
        
        # Check Day 2 (Implicit 3500 now, because it looks back to Day 1)
        self.assertEqual(db_get_snapshot_goal(self.db, TEST_USER_ID, day2), 3500)

if __name__ == '__main__':
    unittest.main()
