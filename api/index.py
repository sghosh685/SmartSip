from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime
from urllib.parse import urlparse, parse_qs

try:
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

# In-memory storage (use Vercel KV or external DB for production)
water_logs = []

def get_ai_feedback(current_intake, goal):
    """Generate AI feedback using LangChain"""
    if not LANGCHAIN_AVAILABLE:
        return "💧 AI features require LangChain. Install dependencies."
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "⚠️ OpenAI API key missing. Add OPENAI_API_KEY to environment variables."
    
    try:
        llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7)
        prompt = (
            f"You are a hydration assistant. The user has consumed {current_intake}ml today. "
            f"Their goal is {goal}ml. Provide status and suggestions. Keep it short with emojis."
        )
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        return f"AI Error: {str(e)}"

class handler(BaseHTTPRequestHandler):
    def send_json_response(self, status_code, data):
        """Helper to send JSON responses"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)
        
        # Root endpoint
        if path == '/api' or path == '/api/' or path == '/api/index':
            self.send_json_response(200, {"status": "SmartSip API Running"})
            return
        
        # Get history
        if path.startswith('/api/history/'):
            user_id = path.split('/')[-1]
            user_logs = [log for log in water_logs if log.get('user_id') == user_id]
            today_str = datetime.now().strftime("%Y-%m-%d")
            total = sum(
                log['amount'] for log in user_logs 
                if log['timestamp'].startswith(today_str)
            )
            self.send_json_response(200, {"logs": user_logs, "total_today": total})
            return
        
        # AI Feedback
        if path == '/api/ai-feedback' or path == '/api/index/ai-feedback':
            user_id = query_params.get('user_id', ['alex_johnson_user'])[0]
            goal = int(query_params.get('goal', [2500])[0])
            
            user_logs = [log for log in water_logs if log.get('user_id') == user_id]
            today_str = datetime.now().strftime("%Y-%m-%d")
            total = sum(
                log['amount'] for log in user_logs 
                if log['timestamp'].startswith(today_str)
            )
            
            message = get_ai_feedback(total, goal)
            self.send_json_response(200, {"message": message})
            return
        
        self.send_json_response(404, {"error": "Not found"})
    
    def do_POST(self):
        if self.path == '/api/log' or self.path == '/api/index/log':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            log_entry = {
                "id": len(water_logs) + 1,
                "user_id": data.get('user_id', 'alex_johnson_user'),
                "amount": data['amount'],
                "timestamp": datetime.now().isoformat()
            }
            water_logs.append(log_entry)
            
            user_logs = [log for log in water_logs if log['user_id'] == log_entry['user_id']]
            today_str = datetime.now().strftime("%Y-%m-%d")
            total = sum(
                log['amount'] for log in user_logs 
                if log['timestamp'].startswith(today_str)
            )
            
            self.send_json_response(200, {
                "status": "success",
                "total_today": total,
                "logs": user_logs
            })
            return
        
        self.send_json_response(404, {"error": "Not found"})
