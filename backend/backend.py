import os
import sqlite3
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
# UPDATED IMPORT: This is the fix for the new LangChain version
from langchain_core.messages import HumanMessage

# --- CONFIGURATION ---
load_dotenv()
app = FastAPI(title="SmartSip API")

# Enable CORS so your React App can talk to this Python Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Config
DB_NAME = "water_tracker.db"

# --- DATABASE LAYER ---
def init_db():
    """Initialize the SQLite database with the water_intake table."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_intake (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            intake_ml INTEGER,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()

def db_log_intake(user_id: str, amount: int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Storing timestamp as ISO string
    timestamp = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO water_intake (user_id, intake_ml, timestamp) VALUES (?, ?, ?)",
        (user_id, amount, timestamp)
    )
    conn.commit()
    # Return the ID of the new row
    new_id = cursor.lastrowid
    conn.close()
    return new_id, timestamp

def db_get_history(user_id: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Get all logs for the user
    cursor.execute(
        "SELECT id, intake_ml, timestamp FROM water_intake WHERE user_id = ? ORDER BY id DESC",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "amount": r[1], "time": r[2]} for r in rows]

def db_get_today_total(user_id: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # Simple logic: Get all logs and filter for 'today' in Python for simplicity
    cursor.execute("SELECT intake_ml, timestamp FROM water_intake WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    total = 0
    today_logs = []
    
    for r in rows:
        # Check if the timestamp string starts with today's date
        if r[1].startswith(today_str):
            total += r[0]
            
    return total

# Initialize DB on startup
init_db()

# --- AI AGENT LAYER ---
def get_ai_feedback(current_intake: int, goal: int):
    """Uses LangChain to generate feedback."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "⚠️ AI Key missing. Please check backend .env file."

    try:
        llm = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0.7)
        
        prompt = (
            f"You are a hydration assistant. The user has consumed {current_intake}ml of water today. "
            f"Their daily goal is {goal}ml. "
            "Provide hydration status and suggest if they need to drink more water. "
            "Keep it short, encouraging, and use emojis."
        )
        
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        return f"AI Error: {str(e)}"

# --- API MODELS ---
class LogRequest(BaseModel):
    user_id: str
    amount: int
    goal: int

# --- API ROUTES ---
@app.get("/")
def read_root():
    return {"status": "SmartSip Backend Running"}

@app.post("/log")
def log_intake(req: LogRequest):
    # 1. Log to DB
    log_id, timestamp = db_log_intake(req.user_id, req.amount)
    
    # 2. Calculate new total
    total = db_get_today_total(req.user_id)
    
    # 3. Get History
    logs = db_get_history(req.user_id)
    
    return {
        "status": "success",
        "total_today": total,
        "logs": logs
    }

@app.get("/history/{user_id}")
def get_history(user_id: str):
    logs = db_get_history(user_id)
    total = db_get_today_total(user_id)
    return {"logs": logs, "total_today": total}

@app.get("/ai-feedback")
def ai_feedback(user_id: str, goal: int):
    total = db_get_today_total(user_id)
    message = get_ai_feedback(total, goal)
    return {"message": message}
