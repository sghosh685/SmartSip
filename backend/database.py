from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get DATABASE_URL from environment variable, fallback to local SQLite for dev
# This is key for the "Smart MVP" strategy: One code, two environments.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./water_tracker.db")

# Fix for some PaaS (Heroku/Render) that use 'postgres://' instead of 'postgresql://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connection arguments (check_same_thread is needed only for SQLite)
connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
