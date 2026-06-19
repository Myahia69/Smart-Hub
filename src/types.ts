export interface AppSettings {
  language: "en" | "ar";
  theme: "light" | "dark";
  geminiKey: string;
  accentColor: "indigo" | "teal" | "emerald" | "amber" | "rose" | "violet";
  widgetsOrder: string[]; 
  visibleWidgets: Record<string, boolean>;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface PomodoroState {
  timeRemaining: number;
  isRunning: boolean;
  mode: "work" | "break";
  workDuration: number;
  breakDuration: number;
  currentCycle: number;
}

export interface WeatherData {
  temperature: number;
  conditionCode: number;
  conditionText: string;
  apparentTemperature?: number;
  humidity?: number;
  precipitationProbability?: number;
  cityName: string;
  isLoading: boolean;
  isError: boolean;
}

export interface QuoteData {
  text: string;
  author: string;
  isLoading: boolean;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  category: string;
}

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  isLoading: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  isError?: boolean;
}

export interface AlertNotification {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: string;
}
