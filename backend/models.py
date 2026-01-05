from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=True) # Nullable for Guest Mode
    is_guest = Column(Boolean, default=True)
    default_goal = Column(Integer, default=2500)  # Cloud-synced daily goal
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    logs = relationship("WaterIntake", back_populates="user")
    snapshots = relationship("DailySnapshot", back_populates="user")

class WaterIntake(Base):
    __tablename__ = "water_intake"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id")) # FK to User UUID
    intake_ml = Column(Integer)
    drink_type = Column(String, default="Water")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    local_date = Column(String, index=True)  # Store user's local date for timezone-safe grouping

    user = relationship("User", back_populates="logs")

class DailySnapshot(Base):
    __tablename__ = "daily_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id")) # FK to User UUID
    date = Column(String, index=True) # Storing as YYYY-MM-DD string for simplicity
    goal_for_day = Column(Integer)
    total_intake = Column(Integer)
    goal_met = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="snapshots")

# --- SOCIAL CHALLENGES ---

class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(String, ForeignKey("users.id"))
    name = Column(String(100))
    goal_ml = Column(Integer, default=2500)
    duration_days = Column(Integer, default=7)
    start_date = Column(String)  # YYYY-MM-DD
    end_date = Column(String)    # YYYY-MM-DD
    invite_code = Column(String(8), unique=True, index=True)
    status = Column(String, default='active')  # active, completed, cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    creator = relationship("User", backref="created_challenges")
    participants = relationship("ChallengeParticipant", back_populates="challenge")

class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    user_id = Column(String, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    challenge = relationship("Challenge", back_populates="participants")
    user = relationship("User", backref="challenge_memberships")
