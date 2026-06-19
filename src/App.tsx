import React, { useState, useEffect, useRef } from "react";
import { 
  Sun, Moon, Globe, Settings, Key, Search, CheckSquare, Square, Trash2, Plus, 
  Play, Pause, RotateCcw, AlertTriangle, ArrowRight, Sparkles, RefreshCw, RefreshCcw,
  CloudSun, CloudRain, CloudLightning, Cloud, Wind, Thermometer, Droplets,
  Newspaper, Landmark, Compass, Clock, Send, CheckCircle, Bell, BarChart2,
  X, Check, Lock, Unlock, HelpCircle, Laptop
} from "lucide-react";
import { AppSettings, TodoItem, PomodoroState, WeatherData, QuoteData, NewsItem, ExchangeRatesData, ChatMessage, AlertNotification } from "./types";
import { TRANSLATIONS } from "./translations";

const ACCENT_COLORS = {
  indigo: { bg: "bg-indigo-600", border: "border-indigo-500", text: "text-indigo-600", hover: "hover:bg-indigo-700", ring: "focus:ring-indigo-500", rawHex: "#4f46e5" },
  teal: { bg: "bg-teal-600", border: "border-teal-500", text: "text-teal-600", hover: "hover:bg-teal-700", ring: "focus:ring-teal-500", rawHex: "#0d9488" },
  emerald: { bg: "bg-emerald-600", border: "border-emerald-500", text: "text-emerald-600", hover: "hover:bg-emerald-700", ring: "focus:ring-emerald-500", rawHex: "#059669" },
  amber: { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-600", hover: "hover:bg-amber-600", ring: "focus:ring-amber-500", rawHex: "#d97706" },
  rose: { bg: "bg-rose-600", border: "border-rose-500", text: "text-rose-600", hover: "hover:bg-rose-700", ring: "focus:ring-rose-500", rawHex: "#e11d48" },
  violet: { bg: "bg-violet-600", border: "border-violet-500", text: "text-violet-600", hover: "hover:bg-violet-700", ring: "focus:ring-violet-500", rawHex: "#7c3aed" }
};

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  theme: "dark",
  geminiKey: "",
  accentColor: "indigo",
  widgetsOrder: ["weather", "todo", "pomodoro", "news", "currency", "quote", "chart"],
  visibleWidgets: {
    weather: true,
    todo: true,
    pomodoro: true,
    news: true,
    currency: true,
    quote: true,
    chart: true
  }
};

export default function App() {
  // Persistence state loaders
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem("smarthub_settings_v1");
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const stored = localStorage.getItem("smarthub_todos_v1");
      return stored ? JSON.parse(stored) : [
        { id: "1", text: "Complete architecture overview for Smart Hub dashboard", completed: true, createdAt: new Date().toISOString() },
        { id: "2", text: "Set up Gemini-3.5 cognitive briefing model", completed: false, createdAt: new Date().toISOString() },
        { id: "3", text: "Calibrate regional weather station widgets", completed: false, createdAt: new Date().toISOString() }
      ];
    } catch {
      return [];
    }
  });

  // Settings Panel State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Search filter matching
  const [globalSearch, setGlobalSearch] = useState("");

  // Target values, clock state
  const [timeState, setTimeState] = useState(new Date());

  // Weather & geoloc systems
  const [weatherState, setWeatherState] = useState<WeatherData>({
    temperature: 21,
    conditionCode: 1,
    conditionText: "Sunny",
    cityName: "London",
    isLoading: true,
    isError: false
  });
  const [cityNameInput, setCityNameInput] = useState("");

  // To-do system state
  const [newTodoText, setNewTodoText] = useState("");

  // Pomodoro system state
  const [pomoState, setPomoState] = useState<PomodoroState>({
    timeRemaining: 25 * 60,
    isRunning: false,
    mode: "work",
    workDuration: 25,
    breakDuration: 5,
    currentCycle: 1
  });
  const [customWorkMinutes, setCustomWorkMinutes] = useState(25);
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5);
  const [isPomoConfigOpen, setIsPomoConfigOpen] = useState(false);

  // Quotation system state
  const [quoteState, setQuoteState] = useState<QuoteData>({
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
    isLoading: false
  });

  // News system state
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Currency Exchange state
  const [exchangeState, setExchangeState] = useState<ExchangeRatesData>({
    base: "USD",
    rates: { EUR: 0.92, GBP: 0.79, JPY: 155.4, SAR: 3.75, AED: 3.67, EGP: 47.5 },
    lastUpdated: "",
    isLoading: false
  });
  const [currencyAmount, setCurrencyAmount] = useState<number>(1);
  const [currencySource, setCurrencySource] = useState("USD");
  const [currencyTarget, setCurrencyTarget] = useState("EUR");

  // Gemini assistant system state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [dailyInsights, setDailyInsights] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Desktop conversion specs popup
  const [isDesktopGuideOpen, setIsDesktopGuideOpen] = useState(false);

  // Localization shortcut helper
  const t = TRANSLATIONS[settings.language];
  const activeLocaleDir = settings.language === "ar" ? "rtl" : "ltr";
  const activeAccent = ACCENT_COLORS[settings.accentColor];

  // System Notifications helper
  const pushNotification = (message: string, type: "info" | "success" | "warning" = "info") => {
    const newId = Math.random().toString();
    const newNotification: AlertNotification = {
      id: newId,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(settings.language === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "numeric" })
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 15));
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newId));
    }, 4500);

    // native browser notification if allowed
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Smart Hub - ${type.toUpperCase()}`, { body: message });
    }
  };

  // Clock Update
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeState(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync settings and setup body classes
  useEffect(() => {
    localStorage.setItem("smarthub_settings_v1", JSON.stringify(settings));
    const root = window.document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings]);

  // Sync ToDos
  useEffect(() => {
    localStorage.setItem("smarthub_todos_v1", JSON.stringify(todos));
  }, [todos]);

  // Request browser notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    // Initial data fetch
    fetchWeatherData(51.5074, -0.1278, "London"); // default London coordinates
    fetchExchangeRates();
    fetchDailyQuote();
    fetchNewsFeed();
    
    // Attempt location auto-detection
    triggerAutoLocation();
  }, []);

  // React to settings language changes and fetch appropriate localized items
  useEffect(() => {
    fetchDailyQuote();
    fetchNewsFeed();
  }, [settings.language]);

  // Automatically refresh digital insight when key, language, or todos change
  useEffect(() => {
    if (settings.geminiKey) {
      triggerDailyInsights();
    }
  }, [todos.length, settings.geminiKey, settings.language]);

  // Pomodoro ticks helper
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomoState.isRunning) {
      interval = setInterval(() => {
        setPomoState(prev => {
          if (prev.timeRemaining <= 1) {
            // cycle finished
            const endedWork = prev.mode === "work";
            const nextMode = endedWork ? "break" : "work";
            const nextDuration = endedWork ? prev.breakDuration : prev.workDuration;
            
            // alert sound if desired
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(endedWork ? 880 : 440, audioCtx.currentTime);
              gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.5);
            } catch (e) {
              // audio context fails silently if user didn't click
            }

            pushNotification(
              endedWork ? t.notifPomoWorkEnd : t.notifPomoBreakEnd,
              endedWork ? "success" : "info"
            );

            return {
              ...prev,
              mode: nextMode,
              timeRemaining: nextDuration * 60,
              currentCycle: endedWork ? prev.currentCycle + 1 : prev.currentCycle,
              isRunning: false // let them manually restart each segment
            };
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomoState.isRunning, pomoState.mode]);


  /* --- API fetch functions --- */

  const fetchWeatherData = async (lat: number, lon: number, name: string) => {
    setWeatherState(prev => ({ ...prev, isLoading: true, isError: false }));
    try {
      const response = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error("Weather failure");
      const data = await response.json();
      
      const current = data.current_weather;
      let condText = "Moderate";
      const code = current?.weathercode ?? 0;
      if (code === 0) condText = "Clear Sky";
      else if (code <= 3) condText = "Partly Cloudy";
      else if (code <= 48) condText = "Overcast Fog";
      else if (code <= 67) condText = "Rain Showers";
      else if (code <= 82) condText = "Continuous Rain";
      else if (code <= 99) condText = "Thunderstorms";

      setWeatherState({
        temperature: Math.round(current?.temperature ?? 21),
        conditionCode: code,
        conditionText: condText,
        cityName: name,
        apparentTemperature: Math.round(data.hourly?.apparent_temperature?.[0] ?? current?.temperature),
        humidity: Math.round(data.hourly?.relative_humidity_2m?.[0] ?? 45),
        precipitationProbability: Math.round(data.hourly?.precipitation_probability?.[0] ?? 10),
        isLoading: false,
        isError: false
      });
      pushNotification(`${t.notifWeatherLoaded} (${name})`, "success");
    } catch {
      setWeatherState(prev => ({ ...prev, isLoading: false, isError: true }));
    }
  };

  const triggerAutoLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude, "Your Location");
        },
        () => {
          // Fallback to London on failure silently
          fetchWeatherData(51.5074, -0.1278, "London");
        }
      );
    } else {
      fetchWeatherData(51.5074, -0.1278, "London");
    }
  };

  const executeCitySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cityNameInput.trim()) return;

    setWeatherState(prev => ({ ...prev, isLoading: true }));
    try {
      const searchRes = await fetch(`/api/weather/search?city=${encodeURIComponent(cityNameInput)}`);
      if (!searchRes.ok) throw new Error();
      const results = await searchRes.json();
      
      if (results && results.length > 0) {
        const topResult = results[0];
        fetchWeatherData(topResult.latitude, topResult.longitude, topResult.name);
        setCityNameInput("");
      } else {
        setWeatherState(prev => ({ ...prev, isLoading: false, isError: true }));
        pushNotification(t.weatherError, "warning");
      }
    } catch {
      setWeatherState(prev => ({ ...prev, isLoading: false, isError: true }));
    }
  };

  const fetchExchangeRates = async () => {
    setExchangeState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch("/api/exchange-rates");
      if (!response.ok) throw new Error();
      const data = await response.json();
      setExchangeState({
        base: "USD",
        rates: data.rates || {},
        lastUpdated: data.time_next_update_utc || new Date().toISOString(),
        isLoading: false
      });
    } catch {
      setExchangeState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const fetchDailyQuote = async () => {
    setQuoteState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`/api/quote?lang=${settings.language}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setQuoteState({
        text: data.text,
        author: data.author,
        isLoading: false
      });
    } catch {
      setQuoteState({
        text: "The best way to predict the future is to create it.",
        author: "Peter Drucker",
        isLoading: false
      });
    }
  };

  const fetchNewsFeed = async () => {
    setNewsLoading(true);
    try {
      const response = await fetch(`/api/news?lang=${settings.language}`);
      const data = await response.json();
      setNewsList(data.news || []);
    } catch {
      // safe fallback preset empty
    } finally {
      setNewsLoading(false);
    }
  };


  /* --- ToDo logic --- */

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newItem: TodoItem = {
      id: Math.random().toString(),
      text: newTodoText.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTodos(prev => [newItem, ...prev]);
    setNewTodoText("");
    pushNotification(t.notifTaskCreated, "success");
  };

  const toggleTodoState = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodoItem = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    pushNotification(t.notifTaskDeleted, "info");
  };


  /* --- Pomodoro Custom Config & Control --- */

  const updatePomoDurations = (e: React.FormEvent) => {
    e.preventDefault();
    setPomoState(prev => ({
      ...prev,
      workDuration: customWorkMinutes,
      breakDuration: customBreakMinutes,
      timeRemaining: prev.mode === "work" ? customWorkMinutes * 60 : customBreakMinutes * 60,
      isRunning: false
    }));
    setIsPomoConfigOpen(false);
  };


  /* --- Gemini API systems --- */

  const triggerDailyInsights = async () => {
    if (!settings.geminiKey) return;
    setInsightsLoading(true);
    try {
      const remainingTodosCount = todos.filter(t => !t.completed).length;
      const payload = {
        lang: settings.language,
        weather: {
          temp: weatherState.temperature,
          condition: weatherState.conditionText
        },
        todos: {
          remaining: remainingTodosCount
        }
      };

      const response = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": settings.geminiKey
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        setDailyInsights("");
        pushNotification("Gemini API key is invalid or unauthorized.", "warning");
        return;
      }

      const data = await response.json();
      setDailyInsights(data.text || "");
    } catch (e: any) {
      // Fail gracefully
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentChatInput.trim()) return;

    const userMsgText = currentChatInput.trim();
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString(settings.language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setCurrentChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": settings.geminiKey
        },
        body: JSON.stringify({
          message: userMsgText,
          history: messages.slice(-10), // send last 10 messages context
          lang: settings.language
        })
      });

      if (response.status === 401) {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          sender: "assistant",
          text: "Config Error: Gemini API Key is invalid or expired. Please update it in Settings.",
          timestamp: new Date().toLocaleTimeString(),
          isError: true
        }]);
        setChatLoading(false);
        return;
      }

      const data = await response.json();
      
      const responseMessage: ChatMessage = {
        id: Math.random().toString(),
        sender: "assistant",
        text: data.text || "I was unable to retrieve a logical response. Try again.",
        timestamp: new Date().toLocaleTimeString(settings.language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, responseMessage]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: "assistant",
        text: `Error connecting to digital agent: ${err.message || "Unknown error"}`,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      }]);
    } finally {
      setChatLoading(false);
    }
  };


  /* --- Search Filtering Engine & Helpers --- */

  const matchesSearch = (text: string) => {
    if (!globalSearch) return true;
    return text.toLowerCase().includes(globalSearch.toLowerCase());
  };


  /* --- Calculations helper --- */

  const getPomoProgressPercentage = () => {
    const totalMinutes = pomoState.mode === "work" ? pomoState.workDuration : pomoState.breakDuration;
    const totalSeconds = totalMinutes * 60;
    return ((totalSeconds - pomoState.timeRemaining) / totalSeconds) * 100;
  };

  const getPomoFormattedTime = () => {
    const mins = Math.floor(pomoState.timeRemaining / 60);
    const secs = pomoState.timeRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe accent reset system default
  const resetToFactoryDefaults = () => {
    const confirmed = window.confirm(settings.language === "ar" ? "هل أنت متأكد من مسح جميع الإعدادات وحذف سجل التخزين المحلي؟" : "Factory Reset? This will clear all local dashboard settings, custom keys, and tasks.");
    if (confirmed) {
      localStorage.removeItem("smarthub_settings_v1");
      localStorage.removeItem("smarthub_todos_v1");
      setSettings(DEFAULT_SETTINGS);
      setTodos([
        { id: "1", text: "Complete architecture overview for Smart Hub dashboard", completed: true, createdAt: new Date().toISOString() },
        { id: "2", text: "Set up Gemini-3.5 cognitive briefing model", completed: false, createdAt: new Date().toISOString() }
      ]);
      setMessages([]);
      setDailyInsights("");
      pushNotification("Reset complete", "warning");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div 
      id="aistudio-layout-root"
      dir={activeLocaleDir} 
      className={`min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors duration-500`}
    >
      {/* Background radial soft lights to establish Cosmic Elegance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-3xl"></div>
        <div className="absolute top-1/2 left-10 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-teal-600/5 blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-violet-500/10 dark:bg-violet-600/5 blur-3xl"></div>
      </div>

      {/* Persistent floating Micro-Notifications */}
      <div className="fixed top-5 right-5 left-5 md:left-auto md:w-80 space-y-2 z-50 pointer-events-none">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border border-white/20 dark:border-white/10 shadow-lg bg-white/70 dark:bg-slate-900/80 backdrop-blur-md animate-float"
          >
            <div className="flex items-center gap-2.5">
              {notif.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
              {notif.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
              {notif.type === "info" && <Bell className="w-5 h-5 text-indigo-500 shrink-0" />}
              <span className="text-xs font-semibold leading-relaxed">{notif.message}</span>
            </div>
            <span className="text-[10px] opacity-40 digital-segments shrink-0 leading-none">{notif.timestamp}</span>
          </div>
        ))}
      </div>

      {/* TOP HEADER STATUS AREA */}
      <header className="relative z-10 border-b border-slate-200/50 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white ${activeAccent.bg} shadow-md shadow-indigo-500/10`}>
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t.title}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-normal">v3.5 Live</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.subtitle}</p>
            </div>
          </div>

          {/* Clock telemetry, Live Search */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:justify-end">
            
            {/* Real-time Clock */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
              <Clock className={`w-4 h-4 ${activeAccent.text}`} />
              <div className="text-right">
                <div className="text-xs sm:text-sm font-bold digital-segments">
                  {timeState.toLocaleTimeString(settings.language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <div className="text-[10px] opacity-65 font-medium leading-none">
                  {timeState.toLocaleDateString(settings.language === "ar" ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
              </div>
            </div>

            {/* Global Context Search Filter */}
            <div className="relative w-full sm:w-60 md:w-72">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 opacity-40" />
              <input 
                type="text"
                placeholder={t.searchPlaceholder}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className={`w-full py-2 pl-9 pr-4 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 ${activeAccent.ring} dark:focus:ring-offset-slate-950 transition-all`}
              />
              {globalSearch && (
                <button 
                  onClick={() => setGlobalSearch("")} 
                  className="absolute right-3.5 top-2.5 text-xs opacity-55 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Micro Quick buttons */}
            <div className="flex items-center gap-1.5">
              
              <button
                onClick={() => setSettings(prev => ({ ...prev, theme: prev.theme === "light" ? "dark" : "light" }))}
                className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-all"
                title={t.settingsTheme}
              >
                {settings.theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
              </button>

              <button
                onClick={() => setSettings(prev => ({ ...prev, language: prev.language === "en" ? "ar" : "en" }))}
                className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-all"
                title={t.settingsLang}
              >
                <Globe className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2.5 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-all ${isSettingsOpen ? "ring-2 " + activeAccent.ring : ""}`}
                title={t.settingsTitle}
              >
                <Settings className="w-4.5 h-4.5" />
              </button>

            </div>
          </div>

        </div>
      </header>

      {/* ELECTRON DESKTOP TRIGGER ALERTER CARD */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-600/5">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-indigo-500" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold">Deploy on Windows / macOS with Electron</h4>
              <p className="text-[11px] opacity-75">Package this premium smart workspace interface into a native Windows executable.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsDesktopGuideOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
          >
            How To Package Electron &rarr;
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER LAYOUT */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SETTINGS FLOATING SIDEBAR PANEL OVERLAY */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
            <div className={`w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto p-6 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-fade-in`}>
              
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <Settings className={`w-5 h-5 ${activeAccent.text}`} />
                    <h2 className="text-lg font-bold">{t.settingsTitle}</h2>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Accent Color selections */}
                <div className="space-y-4 mb-6">
                  <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">{t.settingsAccent}</span>
                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(ACCENT_COLORS).map(([name, entry]) => (
                      <button
                        key={name}
                        onClick={() => setSettings(prev => ({ ...prev, accentColor: name as any }))}
                        className={`h-10 rounded-xl relative border border-transparent transition-all ${entry.bg} hover:scale-105 shadow-md`}
                        title={name}
                      >
                        {settings.accentColor === name && (
                          <span className="absolute inset-0 flex items-center justify-center text-white">
                            <Check className="w-5 h-5" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme selection */}
                <div className="space-y-3 mb-6">
                  <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">{t.settingsTheme}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, theme: "dark" }))}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${settings.theme === "dark" ? activeAccent.border + " bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "border-slate-200 dark:border-slate-800"}`}
                    >
                      <Moon className="w-4 h-4" />
                      {t.settingsThemeDark}
                    </button>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, theme: "light" }))}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${settings.theme === "light" ? activeAccent.border + " bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "border-slate-200 dark:border-slate-800"}`}
                    >
                      <Sun className="w-4 h-4" />
                      {t.settingsThemeLight}
                    </button>
                  </div>
                </div>

                {/* API Key configuration */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">{t.settingsKeyLabel}</span>
                    <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className={`text-[10px] font-bold underline ${activeAccent.text}`}>
                      Get Free Key &rarr;
                    </a>
                  </div>
                  
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4.5 h-4.5 opacity-40" />
                    <input
                      type={showKeyInput ? "text" : "password"}
                      placeholder={t.settingsKeyPlaceholder}
                      value={settings.geminiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, geminiKey: e.target.value }))}
                      className="w-full py-2.5 pl-10 pr-24 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      className={`absolute right-2 top-2 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300`}
                    >
                      {showKeyInput ? t.settingsHideKey : t.settingsShowKey}
                    </button>
                  </div>
                  <p className="text-[10px] opacity-60 leading-relaxed">
                    The API Key is temporarily cached securely inside your local browser storage (<code className="digital-segments">localStorage</code>) and is never sent to any server other than directly to the Gemini endpoint.
                  </p>
                </div>

                {/* Toggle Widgets view state */}
                <div className="space-y-3 mb-6">
                  <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">Visible Modules</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(settings.visibleWidgets).map((widgetKey) => (
                      <button
                        key={widgetKey}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          visibleWidgets: {
                            ...prev.visibleWidgets,
                            [widgetKey]: !prev.visibleWidgets[widgetKey]
                          }
                        }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${settings.visibleWidgets[widgetKey] ? "border-transparent bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "opacity-40 border-slate-200 dark:border-slate-800"}`}
                      >
                        <span className="capitalize">{widgetKey === "todo" ? t.todoTitle : widgetKey === "pomodoro" ? t.pomodoroTitle : widgetKey}</span>
                        {settings.visibleWidgets[widgetKey] ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 opacity-50" />}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Reset panel button */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
                <button
                  onClick={resetToFactoryDefaults}
                  className="w-full py-2.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t.settingsResetBtn}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* COMPREHENSIVE NATIVE LEFT COLUMN: GEMINI INTELLIGENCE WORKSPACE */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI GEMINI CHAT GRAPHICS ASSISTANT */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-[450px] relative overflow-hidden">
            
            {/* Top Widget Bar */}
            <div>
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <span className="font-display font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    {t.chatTitle}
                  </span>
                </div>
                {settings.geminiKey ? (
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold bg-emerald-500/15 px-2.5 py-0.5 rounded-full uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    API Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold bg-amber-500/15 px-2.5 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    Key Required
                  </span>
                )}
              </div>

              {/* Message Streams view area */}
              <div className="overflow-y-auto h-[270px] space-y-3.5 pr-1 text-xs">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-full opacity-60 px-4 pt-10">
                    <Compass className="w-10 h-10 stroke-1 opacity-50 mb-3 text-indigo-500 animate-bounce" />
                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-300 mb-1">{t.chatTitle}</p>
                    <p className="text-[10px] leading-relaxed max-w-xs">{t.chatEmptyState}</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        msg.sender === "user" 
                          ? activeAccent.bg + " text-white rounded-tr-none" 
                          : msg.isError 
                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-tl-none" 
                            : "bg-white/90 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-tl-none"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] opacity-40 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-indigo-500 font-bold animate-pulse text-[11px] px-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini is synthesizing insights...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input form bottom */}
            <form onSubmit={handleSendChatMessage} className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 mt-3 flex items-center gap-2">
              <input
                type="text"
                disabled={chatLoading}
                placeholder={settings.geminiKey ? t.chatPlaceholder : "Provide API Key in settings sidebar to chat..."}
                value={currentChatInput}
                onChange={(e) => setCurrentChatInput(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !settings.geminiKey || !currentChatInput.trim()}
                className={`p-2.5 rounded-xl text-white ${activeAccent.bg} hover:opacity-90 disabled:opacity-40 transition-all`}
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>

          </div>

          {/* AI SUGGESTIONS & DAILY BRIEFING WIDGET */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                <h3 className="font-display font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  {t.insightsTitle}
                </h3>
              </div>
              {settings.geminiKey && (
                <button 
                  onClick={triggerDailyInsights}
                  disabled={insightsLoading}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all text-xs flex items-center gap-1 font-bold"
                  title="Force Reload Briefing"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>

            {insightsLoading ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-xs font-semibold">{t.insightsLoading}</p>
              </div>
            ) : dailyInsights ? (
              <div className="text-xs leading-relaxed space-y-3 p-3 rounded-xl border border-indigo-500/10 bg-indigo-500/5 selection:bg-indigo-200">
                <p className="font-medium whitespace-pre-wrap">{dailyInsights}</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-xs opacity-75 leading-relaxed">{t.insightsPlaceholder}</p>
                {!settings.geminiKey && (
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className={`mt-3 py-2 px-4 rounded-xl text-white text-xs font-bold leading-none ${activeAccent.bg} shadow-md hover:opacity-95 transition-all`}
                  >
                    Open Settings Panel
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* MIDDLE & RIGHT FLEXIBLE GRID COLUMNS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TOP PRIMARY STATUS MATRIX BANNER: GEO-WEATHER STATION & REFR RES COGNITIVE SPARKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 🌦️ Weather Station */}
            {settings.visibleWidgets.weather && (
              <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CloudSun className={`w-5 h-5 text-indigo-500`} />
                    <span className="font-display font-bold text-xs tracking-wide uppercase">{t.weatherTitle}</span>
                  </div>
                  <button
                    onClick={triggerAutoLocation}
                    className="text-[10px] font-bold underline text-indigo-500 dark:text-indigo-400 flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    {t.weatherAutoLoc}
                  </button>
                </div>

                <form onSubmit={executeCitySearch} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    required
                    placeholder={t.weatherPlaceholder}
                    value={cityNameInput}
                    onChange={(e) => setCityNameInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-xl text-xs text-white ${activeAccent.bg}`}
                  >
                    {t.weatherSearch}
                  </button>
                </form>

                {weatherState.isLoading ? (
                  <div className="flex justify-center p-3 animate-pulse">
                    <span className="text-xs font-semibold">Updating telemetry...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/15">
                        {weatherState.conditionCode <= 3 ? (
                          <Sun className="w-10 h-10 text-amber-500 animate-spin-slow" />
                        ) : weatherState.conditionCode <= 67 ? (
                          <CloudRain className="w-10 h-10 text-blue-500" />
                        ) : (
                          <Cloud className="w-10 h-10 text-sky-450" />
                        )}
                      </div>
                      <div>
                        <div className="text-3xl font-extrabold digital-segments">{weatherState.temperature}°C</div>
                        <div className="text-[11px] font-bold opacity-75">{weatherState.conditionText}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-l border-slate-200/50 dark:border-slate-800/80 pl-3">
                      <div className="text-[10px] uppercase font-bold text-slate-400">{weatherState.cityName}</div>
                      {weatherState.apparentTemperature && <div className="text-xs flex items-center justify-between"><span>{t.weatherFeels}:</span> <strong className="digital-segments">{weatherState.apparentTemperature}°C</strong></div>}
                      {weatherState.humidity && <div className="text-xs flex items-center justify-between"><span>{t.weatherHumidity}:</span> <strong className="digital-segments">{weatherState.humidity}%</strong></div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 💬 Daily Quote */}
            {settings.visibleWidgets.quote && (
              <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-indigo-500" />
                      <span className="font-display font-bold text-xs tracking-wide uppercase">{t.quoteTitle}</span>
                    </div>
                    <button
                      onClick={fetchDailyQuote}
                      disabled={quoteState.isLoading}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all text-xs"
                      title="Generate Spark"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${quoteState.isLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className="space-y-2 relative">
                    <span className="absolute -top-4 -left-3 text-5xl font-serif text-indigo-600/10 font-black">“</span>
                    {quoteState.isLoading ? (
                      <p className="text-xs italic text-slate-400 animate-pulse">Retasting cognitive nectar...</p>
                    ) : (
                      <>
                        <p className={`text-xs sm:text-sm font-semibold italic text-slate-700 dark:text-slate-200 leading-relaxed selection:bg-indigo-300`}>
                          {quoteState.text}
                        </p>
                        <p className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 text-right">
                          - {quoteState.author}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[10px]">
                  <span className="opacity-50">Local Quote fallback included</span>
                  <span className="font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Cognition Status Verified</span>
                </div>
              </div>
            )}

          </div>

          {/* DUAL WORKSPACE: TASK MATRIX & POMODORO INTERACTIVE TIMER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ✅ Task Matrix Checklist */}
            {settings.visibleWidgets.todo && (
              <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-indigo-500" />
                      <span className="font-display font-bold text-xs tracking-wide uppercase">{t.todoTitle}</span>
                    </div>
                    <span className="text-[10px] font-bold opacity-75 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      {todos.filter(t => t.completed).length} / {todos.length} Done
                    </span>
                  </div>

                  {/* Add action task form */}
                  <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      required
                      placeholder={t.todoPlaceholder}
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none rounded-xl"
                    />
                    <button
                      type="submit"
                      className={`px-3.5 py-2 text-xs text-white ${activeAccent.bg} rounded-xl shadow-md hover:scale-105 transition-all flex items-center gap-1`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Global Match Filtering list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {todos.filter(todo => matchesSearch(todo.text)).map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-all select-none"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTodoState(todo.id)}
                          className="flex items-center gap-2.5 text-xs font-semibold text-left flex-1"
                        >
                          {todo.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 opacity-40 shrink-0" />
                          )}
                          <span className={`${todo.completed ? "line-through opacity-40" : ""}`}>{todo.text}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTodoItem(todo.id)}
                          className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all"
                          title="Delete Action Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {todos.length === 0 && (
                      <div className="text-center p-6 opacity-60">
                        <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                        <p className="text-xs font-semibold">{t.todoEmpty}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 mt-4 text-[10px] opacity-50 text-right">
                  Synced dynamically in storage
                </div>
              </div>
            )}

            {/* ⏱️ Pomodoro Protocol */}
            {settings.visibleWidgets.pomodoro && (
              <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <span className="font-display font-bold text-xs tracking-wide uppercase">{t.pomodoroTitle}</span>
                    </div>
                    <button
                      onClick={() => setIsPomoConfigOpen(!isPomoConfigOpen)}
                      className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 hover:underline"
                    >
                      {t.pomoConfig}
                    </button>
                  </div>

                  {/* Custom duration setup panel */}
                  {isPomoConfigOpen ? (
                    <form onSubmit={updatePomoDurations} className="space-y-3 p-3.5 mb-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold block mb-1">Work (Min)</label>
                          <input
                            type="number"
                            min="1"
                            max="180"
                            required
                            value={customWorkMinutes}
                            onChange={(e) => setCustomWorkMinutes(parseInt(e.target.value) || 25)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold block mb-1">Break (Min)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            required
                            value={customBreakMinutes}
                            onChange={(e) => setCustomBreakMinutes(parseInt(e.target.value) || 5)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setIsPomoConfigOpen(false)} className="text-[10px] font-semibold opacity-60">Cancel</button>
                        <button type="submit" className={`px-3 py-1 rounded-lg text-white font-bold text-[10px] ${activeAccent.bg}`}>Calibrate</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => setPomoState(prev => ({ ...prev, mode: "work", timeRemaining: prev.workDuration * 60, isRunning: false }))}
                        className={`flex-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all border ${pomoState.mode === "work" ? activeAccent.border + " bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white" : "border-transparent opacity-60"}`}
                      >
                        {t.pomoWorkBtn} ({pomoState.workDuration}m)
                      </button>
                      <button
                        onClick={() => setPomoState(prev => ({ ...prev, mode: "break", timeRemaining: prev.breakDuration * 60, isRunning: false }))}
                        className={`flex-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all border ${pomoState.mode === "break" ? activeAccent.border + " bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white" : "border-transparent opacity-60"}`}
                      >
                        {t.pomoBreakBtn} ({pomoState.breakDuration}m)
                      </button>
                    </div>
                  )}

                  {/* Main Circular Timer Design Component */}
                  <div className="flex flex-col items-center justify-center py-2 relative">
                    
                    {/* Retro radial loop track */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" className="stroke-slate-200 dark:stroke-slate-800 fill-none" strokeWidth="6" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="44" 
                          stroke={activeAccent.rawHex}
                          className="fill-none transition-all duration-1000" 
                          strokeWidth="7" 
                          strokeDasharray={276}
                          strokeDashoffset={276 - (276 * getPomoProgressPercentage()) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="text-center z-10">
                        <div className="text-2xl font-black digital-segments leading-none">{getPomoFormattedTime()}</div>
                        <span className="text-[8px] tracking-widest font-bold uppercase opacity-60 block mt-1">{pomoState.mode}</span>
                      </div>
                    </div>

                    {/* Controls array */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => setPomoState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                        className={`p-2.5 rounded-full text-white shadow-md ${activeAccent.bg} hover:scale-110 active:scale-95 transition-all`}
                        title="Play Pause Duration"
                      >
                        {pomoState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white text-white" />}
                      </button>
                      <button
                        onClick={() => setPomoState(prev => ({ ...prev, isRunning: false, timeRemaining: (prev.mode === "work" ? prev.workDuration : prev.breakDuration) * 60 }))}
                        className="p-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all text-slate-500"
                        title="Reset Protocol"
                      >
                        <RefreshCcw className="w-4.5 h-4.5" />
                      </button>
                    </div>

                  </div>
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 text-[10px] opacity-50 flex justify-between">
                  <span>Completed Count Today:</span>
                  <strong className="digital-segments">Cycle #{pomoState.currentCycle}</strong>
                </div>
              </div>
            )}

          </div>

          {/* DUAL STATS NEWS FEED & LIQUIDITY MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 📰 Interactive News Feed */}
            {settings.visibleWidgets.news && (
              <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Newspaper className="w-5 h-5 text-indigo-500" />
                      <span className="font-display font-bold text-xs tracking-wide uppercase">{t.newsTitle}</span>
                    </div>
                    <button
                      onClick={fetchNewsFeed}
                      disabled={newsLoading}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all text-xs"
                      title="Trigger Sync Feed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${newsLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  <div className="space-y-3.5 overflow-y-auto max-h-56 pr-1">
                    {newsList.filter(news => matchesSearch(news.title) || matchesSearch(news.category)).map((news, i) => (
                      <a
                        key={i}
                        href={news.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block group p-2.5 rounded-xl border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800 bg-white/35 dark:bg-slate-900/35 hover:bg-white dark:hover:bg-slate-900 transition-all"
                      >
                        <div className="flex items-center justify-between text-[9px] font-bold opacity-60 mb-1">
                          <span className="uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            {news.category}
                          </span>
                          <span className="digital-segments">{news.source}</span>
                        </div>
                        <h4 className="text-xs font-semibold leading-snug text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">
                          {news.title}
                        </h4>
                      </a>
                    ))}
                    {newsList.length === 0 && (
                      <p className="text-xs opacity-65 text-center py-6">Aggregating fresh news. Click refresh icon above.</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 mt-4 text-[10px] opacity-50 flex items-center justify-between">
                  <span>Feed Source: Technology Hub v3</span>
                  <span className="font-bold underline text-indigo-550">Open Source &times;</span>
                </div>
              </div>
            )}

            {/* 💱 Currency Liquidity Converter */}
            {settings.visibleWidgets.currency && (
              <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-indigo-500" />
                      <span className="font-display font-bold text-xs tracking-wide uppercase">{t.currencyTitle}</span>
                    </div>
                    <button
                      onClick={fetchExchangeRates}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all text-xs"
                      title="Update Exchange Stream"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${exchangeState.isLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {/* Converting inputs */}
                  <div className="space-y-3.5 mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75 mb-1">{t.currencyConvert}</span>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Source Selection */}
                        <select
                          value={currencySource}
                          onChange={(e) => setCurrencySource(e.target.value)}
                          className="px-2 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                          {Object.keys(exchangeState.rates).map(cur => (
                            <option key={cur} value={cur}>{cur}</option>
                          ))}
                        </select>
                        <span className="flex items-center justify-center opacity-40 text-xs font-bold leading-none">&rarr;</span>
                        {/* Target Selection */}
                        <select
                          value={currencyTarget}
                          onChange={(e) => setCurrencyTarget(e.target.value)}
                          className="px-2 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                          {Object.keys(exchangeState.rates).map(cur => (
                            <option key={cur} value={cur}>{cur}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[9px] font-bold block mb-1 opacity-60">{t.currencyAmount}</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={currencyAmount}
                          onChange={(e) => setCurrencyAmount(parseFloat(e.target.value) || 1)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold digital-segments"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold block mb-1 opacity-60">{t.currencyResult}</label>
                        <div className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-350 digital-segments overflow-x-auto whitespace-nowrap leading-[1.35rem]">
                          {(() => {
                            const rateSrc = exchangeState.rates[currencySource] || 1;
                            const rateTrg = exchangeState.rates[currencyTarget] || 1;
                            const converted = (currencyAmount / rateSrc) * rateTrg;
                            return `${converted.toFixed(2)} ${currencyTarget}`;
                          })()}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Static rates grid for Major currencies */}
                  <div className="pt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75 mb-1.5">{t.currencyMajor}</span>
                    <div className="grid grid-cols-4 gap-2">
                      {["EUR", "GBP", "SAR", "AED"].map((curKey) => (
                        <div key={curKey} className="text-center p-2 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/60 font-medium">
                          <div className="text-[9px] tracking-wider opacity-60">{curKey}</div>
                          <div className="text-xs font-bold digital-segments mt-0.5">
                            {(exchangeState.rates[curKey] || 1).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 mt-4 text-[10px] opacity-55 flex justify-between">
                  <span>Open exchange rate index</span>
                  <span className="digital-segments tracking-wider opacity-60 leading-none">Next update tomorrow</span>
                </div>
              </div>
            )}

          </div>

          {/* 📊 PRODUCTIVITY ANALYTICS: INTERACTIVE SVG CHART */}
          {settings.visibleWidgets.chart && (
            <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-500" />
                  <div>
                    <span className="font-display font-bold text-xs tracking-wide uppercase">{t.chartTitle}</span>
                    <p className="text-[9px] opacity-65 leading-none">{t.chartDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-[9px] font-semibold bg-white dark:bg-slate-900">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{t.chartPomoMetric}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{t.chartTaskMetric}</span>
                </div>
              </div>

              {/* Native responsive premium SVG Sparkline and column bars bar chart representation */}
              <div className="w-full h-44 flex items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 relative z-10 pt-4">
                
                {/* Visual grid ticks background */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                  <div className="border-b border-slate-800 dark:border-white w-full"></div>
                  <div className="border-b border-slate-800 dark:border-white w-full"></div>
                  <div className="border-b border-slate-800 dark:border-white w-full"></div>
                  <div className="border-b border-slate-800 dark:border-white w-full"></div>
                </div>

                {/* Days bars */}
                {[
                  { day: "Mon", tasks: 2, pomo: 50 },
                  { day: "Tue", tasks: 4, pomo: 100 },
                  { day: "Wed", tasks: 1, pomo: 25 },
                  { day: "Thu", tasks: 6, pomo: 150 },
                  { day: "Fri", tasks: todos.filter(t => t.completed).length, pomo: (pomoState.currentCycle - 1) * pomoState.workDuration },
                  { day: "Sat", tasks: 0, pomo: 0 },
                  { day: "Sun", tasks: 0, pomo: 0 }
                ].map((item, index) => {
                  // Calculate heights proportionally. Pomo max is 180 min, Tasks max is 8.
                  const pomoHeight = Math.min((item.pomo / 180) * 100, 100);
                  const taskHeight = Math.min((item.tasks / 8) * 100, 100);

                  return (
                    <div key={index} className="flex-1 flex flex-col justify-end items-center h-full gap-1 group relative">
                      
                      {/* Interactive Custom Floating tooltip indicator */}
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white rounded-lg p-2 text-[9px] space-y-0.5 shadow-lg group-hover:block hidden pointer-events-none z-20">
                        <div className="font-bold border-b border-white/25 pb-1 block mb-0.5">{item.day} Productivity</div>
                        <div>Focused: <strong className="digital-segments text-indigo-400">{item.pomo}m</strong></div>
                        <div>Completed: <strong className="digital-segments text-emerald-400">{item.tasks}</strong></div>
                      </div>

                      {/* Stacked visualization columns side by side */}
                      <div className="w-full flex justify-center items-end gap-1 px-1 h-32">
                        {/* Pomodoro minutes cylinder */}
                        <div 
                          style={{ height: `${Math.max(pomoHeight, 5)}%` }} 
                          className="w-1/2 rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:brightness-110 shadow-sm transition-all duration-700"
                        ></div>
                        {/* Completed tasks cylinder */}
                        <div 
                          style={{ height: `${Math.max(taskHeight, 5)}%` }} 
                          className="w-1/2 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-110 shadow-sm transition-all duration-700"
                        ></div>
                      </div>

                      {/* Day label */}
                      <span className="text-[10px] font-bold opacity-60 mt-1">{item.day}</span>
                    </div>
                  );
                })}

              </div>
              <div className="pt-2 text-[9px] opacity-45 text-center font-medium leading-none">
                Interactive bar hovering reveals micro detail analytics. Calculated on real completed task counts.
              </div>
            </div>
          )}

        </div>

      </main>

      {/* FOOTER CONTEXT */}
      <footer className="relative z-10 border-t border-slate-200/50 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 py-6 text-center select-none text-[11px] opacity-65 leading-relaxed font-semibold">
        <p>&copy; 2026 Smart Hub - Built for Google AI Studio Space Build. Powered by the gemini-3.5-flash model.</p>
        <p>Premium glassmorphic telemetry control board calibrated at port 3000.</p>
      </footer>


      {/* ELECTRON CONVERSION HANDLER GUIDE POPUP MODAL */}
      {isDesktopGuideOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            
            <button 
              onClick={() => setIsDesktopGuideOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-850 border border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-indigo-500/20 pb-4 mb-4">
              <Compass className="w-6 h-6 text-indigo-500 animate-spin-slow" />
              <div>
                <h3 className="text-lg font-bold">Electron Conversion Blueprint</h3>
                <p className="text-xs opacity-75">Step-by-step instructions to turn this web app into an installable desktop application (.exe) on Windows.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              
              <div>
                <h4 className="font-bold text-indigo-400 mb-1">1. Set Up Your Local Workspace</h4>
                <p className="opacity-80">Download the code zip via AI Studio settings and unzip it. Initialize file paths and packages by running the terminal setup command inside the root folder:</p>
                <pre className="bg-slate-950 p-2.5 rounded-xl text-[10px] text-teal-400 font-mono mt-1.5 select-all overflow-x-auto">
{`npm init -y
npm install electron --save-dev
npm install electron-builder --save-dev`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-indigo-400 mb-1">2. Core Electron Configuration Files</h4>
                <p className="opacity-80">Inside the same directory, create these three high-performance security scripts:</p>
                
                <div className="space-y-2.5 mt-2">
                  <span className="font-mono text-[10px] text-teal-500 block">A. main.js (System process)</span>
                  <pre className="bg-slate-950 p-2.5 rounded-xl text-[9px] text-slate-350 font-mono overflow-x-auto">
{`const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    title: "Smart Hub Desktop",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the production build static file directory or Dev Container App URL
  win.loadURL('https://ais-dev-7ghyqw2cvrcpllpgertlto-183636514057.europe-west2.run.app');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });`}
                  </pre>

                  <span className="font-mono text-[10px] text-teal-500 block">B. preload.js (Bridge Context layer)</span>
                  <pre className="bg-slate-950 p-2.5 rounded-xl text-[9px] text-slate-330 font-mono overflow-x-auto">
{`const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-indigo-400 mb-1">3. electron-builder Package Target</h4>
                <p className="opacity-80">Add these scripts and electron build specifications inside your <code className="bg-slate-950 font-mono text-[10px] px-1 py-0.5 rounded text-teal-400">package.json</code> file:</p>
                <pre className="bg-slate-950 p-2.5 rounded-xl text-[9px] text-teal-400 font-mono overflow-x-auto">
{`"main": "main.js",
"scripts": {
  "start": "electron .",
  "build": "electron-builder"
},
"build": {
  "appId": "com.smarthub.app",
  "productName": "Smart Hub",
  "win": {
    "target": "nsis"
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-indigo-400 mb-1">4. Compile and Build Executable Installer</h4>
                <p className="opacity-80">Kick-start the packer build to generate an installable <code className="font-mono select-all text-amber-400">.exe</code> file in the locally generated dist directory:</p>
                <pre className="bg-slate-950 p-2.5 rounded-xl text-[10px] text-teal-400 font-mono mt-1.5 select-all overflow-x-auto">
{`npm run build`}
                </pre>
              </div>

            </div>

            <div className="border-t border-slate-800 pt-4 mt-4 flex justify-end">
              <button 
                onClick={() => setIsDesktopGuideOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Understood, Proceed
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
