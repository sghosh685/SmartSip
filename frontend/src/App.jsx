import React, { useState, useEffect } from 'react';
import { 
  Bell, Flame, Activity, Clock, 
  MoreHorizontal, ChevronLeft, ChevronDown, 
  Home, BarChart2, Settings, Plus, Sparkles, Edit2, Check,
  Wifi, WifiOff
} from 'lucide-react';

// --- CONFIGURATION ---
// Updated to port 8001 to match your backend
const API_URL = "/api"; 
const USER_ID = "alex_johnson_user"; 

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

const BottomNav = ({ activeTab, setActiveTab, onQuickAdd }) => (
  <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-end pb-8 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-400'}`}>
      <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
      <span className="text-[10px] font-medium">Home</span>
    </button>
    <button onClick={() => setActiveTab('alarm')} className={`flex flex-col items-center gap-1 ${activeTab === 'alarm' ? 'text-indigo-600' : 'text-gray-400'}`}>
      <Clock size={24} strokeWidth={activeTab === 'alarm' ? 2.5 : 2} />
      <span className="text-[10px] font-medium">Alarm</span>
    </button>
    <div className="relative -top-8">
      <button 
        onClick={onQuickAdd}
        className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 transform transition-transform active:scale-95 flex items-center justify-center rotate-45"
      >
        <Plus size={28} className="-rotate-45" />
      </button>
    </div>
    <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-indigo-600' : 'text-gray-400'}`}>
      <BarChart2 size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
      <span className="text-[10px] font-medium">Stats</span>
    </button>
    <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-gray-400'}`}>
      <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
      <span className="text-[10px] font-medium">Settings</span>
    </button>
  </div>
);

// --- SCREEN 1: HOME ---
const HomeScreen = ({ 
  totalWater, 
  goal, 
  setGoal,
  drinkAmount,
  setDrinkAmount,
  onAddWater, 
  aiMessage, 
  loadingAi, 
  triggerAi,
  isBackendConnected
}) => {
  const percentage = Math.min((totalWater / goal) * 100, 100);
  const circumference = 2 * Math.PI * 48; 
  const offset = circumference - (percentage / 100) * circumference;
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="px-6 pb-32 pt-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">Good Morning</p>
              {isBackendConnected ? 
                <span className="bg-green-100 text-green-700 text-[8px] px-1 rounded flex items-center gap-1"><Wifi size={8}/> Online</span> : 
                <span className="bg-gray-200 text-gray-500 text-[8px] px-1 rounded flex items-center gap-1"><WifiOff size={8}/> Offline Mode</span>
              }
            </div>
            <h2 className="text-lg font-bold text-gray-800">Alex Johnson</h2>
          </div>
        </div>
        <button className="p-2 bg-white rounded-full shadow-sm border border-gray-100">
          <Bell size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Date Strip */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-gray-800">Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</h3>
        </div>
        <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
            const isToday = idx === new Date().getDay();
            return (
              <div key={day} className={`flex flex-col items-center justify-center min-w-[3.5rem] h-20 rounded-[20px] transition-all ${isToday ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-white text-gray-400'}`}>
                <span className="text-xs font-medium mb-1">{day}</span>
                <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-800'}`}>{20 + idx}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', val: '140 Kcal', label: 'Calories' },
          { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', val: '200 bpm', label: 'Heart Rate' },
          { icon: Clock, color: 'text-pink-500', bg: 'bg-pink-50', val: '03:00', label: 'Workout' },
        ].map((item, i) => (
          <div key={i} className={`${item.bg.replace('50', '50')} bg-opacity-50 p-4 rounded-3xl flex flex-col gap-3 shadow-sm`}>
             <div className="p-2 bg-white rounded-full w-min"><item.icon size={16} className={item.color} /></div>
             <div><p className="text-sm font-bold text-gray-800">{item.val}</p><p className="text-[10px] text-gray-500">{item.label}</p></div>
          </div>
        ))}
      </div>

      {/* MAIN TARGET CARD */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm mb-6 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-800">Daily Target</h3>
              <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                {isEditing ? <Check size={14} className="text-green-500"/> : <Edit2 size={14} />}
              </button>
            </div>
            
            {isEditing ? (
              <div className="mb-4 space-y-2 animate-in fade-in slide-in-from-left-2">
                 <div>
                   <label className="text-[10px] text-gray-400 uppercase font-bold">Goal Amount</label>
                   <div className="flex items-center gap-1">
                     <input type="number" value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="w-20 border-b border-indigo-300 focus:outline-none font-bold text-gray-800 bg-transparent"/>
                     <span className="text-xs text-gray-500">ml</span>
                   </div>
                 </div>
                 <div>
                   <label className="text-[10px] text-gray-400 uppercase font-bold">Drink Size</label>
                   <div className="flex items-center gap-1">
                     <input type="number" value={drinkAmount} onChange={(e) => setDrinkAmount(Number(e.target.value))} className="w-20 border-b border-indigo-300 focus:outline-none font-bold text-gray-800 bg-transparent"/>
                     <span className="text-xs text-gray-500">ml</span>
                   </div>
                 </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-6">Goal: {goal}ml</p>
                <button 
                  onClick={() => onAddWater(drinkAmount)}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-600 text-sm font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-colors active:scale-95"
                >
                  Drink {drinkAmount} ml <Plus size={16} />
                </button>
              </>
            )}
          </div>
          <div className="w-28 h-28 relative flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="48" stroke="#6366F1" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out"/>
             </svg>
             <div className="absolute flex flex-col items-center">
                <span className="text-sm font-bold text-gray-800">{totalWater}ml</span>
                <span className="text-[10px] text-gray-400">{(percentage).toFixed(0)}%</span>
             </div>
          </div>
        </div>
      </div>

      {/* AI COACH CARD */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-[32px] shadow-lg text-white relative overflow-hidden">
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h3 className="font-bold">AI Coach Insight</h3>
          </div>
          <button onClick={triggerAi} disabled={loadingAi} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            {loadingAi ? <Activity size={16} className="animate-spin"/> : <ChevronDown size={16} />}
          </button>
        </div>
        <p className="text-sm font-medium opacity-90 relative z-10 min-h-[40px] flex items-center">
           {loadingAi ? "Analyzing hydration levels..." : (aiMessage || "Click the button to get personalized advice based on your intake.")}
        </p>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </div>
    </div>
  );
};

// --- SCREEN 2: ALARM ---
const AlarmScreen = ({ totalWater, goal, logs }) => {
  const percentage = Math.min((totalWater / goal) * 100, 100);
  
  // Convert timestamp if it comes from DB (ISO string) or local state
  const formatTime = (timeStr) => {
      try {
          return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) { return timeStr; }
  };

  return (
    <div className="px-6 pb-32 pt-6 h-full flex flex-col animate-in slide-in-from-right duration-300">
       <div className="flex justify-between items-center mb-6">
        <button className="p-2 bg-white rounded-full shadow-sm"><ChevronLeft size={20} /></button>
        <h2 className="text-lg font-bold">Hydration Level</h2>
        <button className="p-2 bg-white rounded-full shadow-sm"><MoreHorizontal size={20} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mb-8">
        <div className="relative w-64 h-64">
           <div className="absolute inset-0 rounded-full border-[12px] border-indigo-50"></div>
           <div className="absolute inset-4 rounded-full bg-white overflow-hidden border-4 border-white shadow-inner flex items-end justify-center">
              <div className="w-full bg-indigo-500 opacity-80 wave-animation transition-all duration-1000 ease-in-out" style={{ height: `${percentage}%` }}></div>
              <div className="absolute w-full bg-indigo-300 opacity-60 wave-animation-delayed transition-all duration-1000 ease-in-out" style={{ height: `${Math.max(0, percentage - 5)}%` }}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                 <span className="text-3xl font-bold text-gray-800 drop-shadow-sm">{totalWater}</span>
                 <span className="text-lg text-gray-500">/{goal}ml</span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
         <h4 className="font-bold text-gray-800 mb-4 sticky top-0 bg-[#F3F6FF] py-2">Today's Records</h4>
         <div className="space-y-3 pb-4">
            {logs.length === 0 && <p className="text-center text-gray-400 text-sm italic">No drinks logged yet today.</p>}
            {[...logs].reverse().map((log, i) => (
                <div key={log.id || i} className="flex items-center p-4 rounded-2xl bg-white shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-lg mr-4">💧</div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{formatTime(log.time || log.timestamp)}</p>
                        <p className="text-xs text-gray-400">Water</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-indigo-600 text-sm">+{log.amount || log.intake_ml} ml</span>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

// --- SCREEN 3: STATS ---
const StatsScreen = ({ logs }) => (
  <div className="px-6 pb-32 pt-6 animate-in slide-in-from-right duration-300">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg font-bold">Statistics</h2>
      <button className="p-2 bg-white rounded-full shadow-sm"><MoreHorizontal size={20} /></button>
    </div>
    <div className="bg-white p-1 rounded-2xl flex mb-8 shadow-sm">
      {['Day', 'Week', 'Month'].map((t) => (
        <button key={t} className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all ${t === 'Week' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{t}</button>
      ))}
    </div>
    <div className="bg-white p-6 rounded-[32px] mb-6 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-bold text-gray-800">Hydration Stats</h3>
        <button className="text-xs text-gray-500 flex items-center gap-1">This Week <ChevronDown size={14}/></button>
      </div>
      <div className="h-48 flex items-end justify-between gap-3 px-2">
        {[35, 55, 90, 65, 45, 80, (logs.length * 10)].map((h, i) => (
           <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full bg-purple-50 rounded-xl h-full relative overflow-hidden">
                <div className={`absolute bottom-0 w-full rounded-xl transition-all duration-1000 ${i === 6 ? 'bg-indigo-600' : 'bg-indigo-300'}`} style={{ height: `${Math.min(h, 100)}%` }}></div>
              </div>
              <span className="text-[10px] text-gray-400">{['Mon','Tue','Wed','Thu','Fri','Sat','Today'][i]}</span>
           </div>
        ))}
      </div>
    </div>
    <div className="bg-blue-50 p-6 rounded-[32px] text-center">
        <p className="text-blue-800 font-bold mb-2">Weekly Insight</p>
        <p className="text-sm text-blue-600">You are drinking 15% more water than last week. Keep it up!</p>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [totalWater, setTotalWater] = useState(0);
  const [logs, setLogs] = useState([]);
  const [aiMessage, setAiMessage] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [goal, setGoal] = useState(2500);
  const [drinkAmount, setDrinkAmount] = useState(200);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/history/${USER_ID}`);
      if (!response.ok) throw new Error("Backend offline");
      const data = await response.json();
      setLogs(data.logs);
      setTotalWater(data.total_today);
      setIsBackendConnected(true);
    } catch (error) {
      console.log("Backend offline, using local state");
      setIsBackendConnected(false);
    }
  };

  // 2. Logic: Add Water
  const handleAddWater = async (amount) => {
    try {
      // Optimistic UI Update
      const tempId = Date.now();
      const newTotal = totalWater + amount;
      setTotalWater(newTotal);
      setLogs([...logs, { id: tempId, amount, time: new Date().toISOString() }]);

      // API Call
      const response = await fetch(`${API_URL}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID, amount, goal }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Sync with server truth
        setTotalWater(data.total_today);
        setLogs(data.logs); 
        setIsBackendConnected(true);
      } else {
        throw new Error("API Failed");
      }
    } catch (e) {
      console.log("Offline mode: Logged locally");
      // Keep optimistic update, just set flag
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
    <div className="min-h-screen bg-[#EBEFFF] flex items-center justify-center font-sans">
      <div className="w-full max-w-md h-screen md:h-[844px] bg-[#F3F6FF] md:rounded-[40px] shadow-2xl overflow-hidden relative border-[6px] border-white ring-1 ring-gray-200">
        <div className="h-full overflow-y-auto scrollbar-hide">
           {activeTab === 'home' && (
             <HomeScreen 
               totalWater={totalWater} 
               goal={goal} setGoal={setGoal}
               drinkAmount={drinkAmount} setDrinkAmount={setDrinkAmount}
               onAddWater={handleAddWater}
               aiMessage={aiMessage}
               loadingAi={loadingAi}
               triggerAi={handleTriggerAi}
               isBackendConnected={isBackendConnected}
             />
           )}
           {activeTab === 'stats' && <StatsScreen logs={logs} />}
           {activeTab === 'alarm' && <AlarmScreen totalWater={totalWater} goal={goal} logs={logs} />}
           {activeTab === 'settings' && <div className="p-10 text-center text-gray-400 mt-20">Settings Area</div>}
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onQuickAdd={() => handleAddWater(drinkAmount)}/>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .wave-animation { animation: wave 4s linear infinite; }
        .wave-animation-delayed { animation: wave 6s linear infinite; }
        @keyframes wave {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-5px) rotate(2deg); }
            100% { transform: translateY(0) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
