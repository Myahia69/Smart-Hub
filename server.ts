import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Multi-language curated Quote of the Day fallback to avoid API failures
const CURATED_QUOTES = {
  en: [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "Do not wait for leaders; do it alone, person to person.", author: "Mother Teresa" },
    { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { text: "Be the change that you want to see in the world.", author: "Mahatma Gandhi" }
  ],
  ar: [
    { text: "الحد الوحيد لتحقيق الغد هو شكوكنا اليوم.", author: "فرانكلين روزفلت" },
    { text: "الجودة ليست فعلاً، بل هي عادة.", author: "أرسطو" },
    { text: "يبدو الأمر دائماً مستحيلاً حتى يكتمل.", author: "نيلسون مانديلا" },
    { text: "وقتك محدود، فلا تضيعه في عيش حياة شخص آخر.", author: "ستيف جوبز" },
    { text: "أفضل طريقة للتنبؤ بالمستقبل هي صناعته.", author: "بيتر دراكر" },
    { text: "لا تنتظر القادة؛ افعل ذلك بمفردك، من شخص لآخر.", author: "الأم تيريزا" },
    { text: "لا تسعَ لتكون ناجحاً فقط، بل لتكون ذا قيمة.", author: "ألبرت أينشتاين" },
    { text: "كن التغيير الذي تريد أن تراه في هذا العالم.", author: "غاندي" }
  ]
};

// Curated tech and productivity news index (can be refreshed and enhanced by Gemini if configured)
const TECH_NEWS = {
  en: [
    { title: "Gemini 3.5 Flash released with extreme speed improvements", url: "https://ai.google/discover/gemini", source: "Google AI Portal", category: "Artificial Intelligence" },
    { title: "Top productivity hacks to master deep work in a noisy workspace", url: "https://blog.hubspot.com/sales/habits-of-productive-people", source: "Productivity Press", category: "Productivity" },
    { title: "The resurgence of hand-crafted elegant retro user interfaces in UI/UX in 2026", url: "https://medium.com/design-journal", source: "UX Collective", category: "Design" },
    { title: "Building native desktop apps with Electron: Security best practices for engineers", url: "https://electronjs.org", source: "Electron Core", category: "Engineering" }
  ],
  ar: [
    { title: "إطلاق نموذج جيميناي 3.5 فلاش مع تحسينات فائقة في سرعة الاستجابة والذكاء", url: "https://ai.google/discover/gemini", source: "بوابة جوجل للذكاء الاصطناعي", category: "الذكاء الاصطناعي" },
    { title: "أهم نصائح الإنتاجية المتقدمة للتركيز والعمل العميق في بيئة العمل الصاخبة", url: "https://blog.hubspot.com/sales/habits-of-productive-people", source: "صحافة الإنتاجية", category: "الإنتاجية" },
    { title: "عودة تصميم واجهات المستخدم المستقبلية البسيطة والنيومورفيزم في عام 2026", url: "https://medium.com/design-journal", source: "جمعية تجربة المستخدم", category: "التصميم" },
    { title: "تطوير تطبيقات سطح المكتب الآمنة باستخدام إلكترون وجافا سكريبت خطوة بخطوة", url: "https://electronjs.org", source: "إلكترون ديفرنس", category: "الهندسة والبرمجة" }
  ]
};

// Setup Gemini Helper
const getGeminiClient = (req: Request) => {
  // Get API key from header 'x-gemini-key' if user input it in the UI setting,
  // otherwise fallback to process.env.GEMINI_API_KEY
  const userKeyInput = req.headers["x-gemini-key"] as string;
  const apiKey = userKeyInput || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("API_KEY_MISSING");
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

/* --- API Endpoints --- */

// 1. Weather Current Forecast Proxy (Open-Meteo API - Free, keyless)
app.get("/api/weather/current", async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and Longitude are required." });
    }
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch from OpenMeteo");
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Weather City Search proxy (Geocoding - Free, keyless)
app.get("/api/weather/search", async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ error: "City query is required." });
    }
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city as string)}&count=5&language=en&format=json`
    );
    if (!response.ok) {
      throw new Error("Failed to search city logo details");
    }
    const data = await response.json();
    res.json(data.results || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Currency Exchange Rates (Free, keyless API)
app.get("/api/exchange-rates", async (req: Request, res: Response) => {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) {
      throw new Error("Failed to fetch open exchange rates");
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Quote of the day (Multi-language helper with dynamic fallback)
app.get("/api/quote", async (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang as string) === "ar" ? "ar" : "en";
    
    // Attempt to enrich with random external fetch or fallback directly to curated beautifully localized quotes
    try {
      const resp = await fetch("https://dummyjson.com/quotes/random", { signal: AbortSignal.timeout(2000) });
      if (resp.ok) {
        const payload = await resp.json();
        if (lang === "ar") {
          // If we want Arabic, we use our curated list or let Gemini translate it if possible, but safe fallback is CURATED
          const idx = Math.floor(Math.random() * CURATED_QUOTES.ar.length);
          return res.json(CURATED_QUOTES.ar[idx]);
        }
        return res.json({ text: payload.quote, author: payload.author });
      }
    } catch (e) {
      // ignore, use curated fallback below
    }

    const quotes = CURATED_QUOTES[lang];
    const item = quotes[Math.floor(Math.random() * quotes.length)];
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. News aggregator (Localized + falls back cleanly)
app.get("/api/news", async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) === "ar" ? "ar" : "en";
  res.json({ news: TECH_NEWS[lang] });
});

// 6. Gemini API endpoints
// A. Interactive Chat Response
app.post("/api/gemini/chat", async (req: Request, res: Response) => {
  try {
    const { message, history, lang } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient(req);

    const systemPrompt = lang === "ar"
      ? "أنت المساعد الذكي الفائق ولوحة التحكم التفاعلية لمركزنا الذكي. أجب بإيجاز، بطريقة ودية، ومفيدة جداً باللغة العربية. ساعد المستخدم في إدارة إنتاجيته، وقدم نصائح مميزة، واجعل حياته أسهل بذكاء."
      : "You are the advanced Smart Hub Companion embedded in the All-in-One Smart Dashboard. Respond conversationally, concisely, and with elegant visual formatting or markdown bullet points if helpful. Provide quick productivity tips or dashboard assistance in English.";

    // Configure chat session with history using official @google/genai guidelines
    const model = "gemini-3.5-flash";
    
    // Map simple chat history to Gemini schema: { role: 'user' | 'model', parts: [{ text: '...' }] }
    const geminiHistory = (history || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // Generate content using the official chat pattern
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...geminiHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    if (error.message === "API_KEY_MISSING") {
      res.status(401).json({ error: "API_KEY_MISSING" });
    } else {
      res.status(500).json({ error: error.message || "An error occurred with Gemini API compilation or model response." });
    }
  }
});

// B. Smart Daily Insights / Smart Suggestions generator
app.post("/api/gemini/insights", async (req: Request, res: Response) => {
  try {
    const { weather, todos, lang } = req.body;
    const ai = getGeminiClient(req);

    const promptMessage = lang === "ar"
      ? `قم بصياغة تلخيص ذكي ملهم وموجز للغاية (مكون من جملتين أو ثلاث) لبداية يوم المستخدم بناءً على البيانات التالية:
      الطقس الحالي: درجة الحرارة ${weather?.temp || "غير معروف"}، حالة الجو: ${weather?.condition || "غير معلومة"}.
      قائمة المهام اليومية: المتبقي ${todos?.remaining || 0} مهام.
      تحدث معهم بود وحماس، وقدم توصية واحدة ذكية ومحفزة في النهاية.`
      : `Draft a concise, highly inspiring, 2-3 sentence personalized morning digest based on these dashboard stats:
      Current Weather: Temperature is ${weather?.temp || "unknown"}°C, Condition: ${weather?.condition || "unknown"}.
      To-Do List: ${todos?.remaining || 0} tasks pending.
      Provide a warm, premium response, ending with one smart encouraging call-to-action or tip.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        temperature: 0.8,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Insights Error:", error);
    if (error.message === "API_KEY_MISSING") {
      res.status(401).json({ error: "API_KEY_MISSING" });
    } else {
      res.status(500).json({ error: error.message || "An error occurred with daily insights generation." });
    }
  }
});

// 7. Desktop Application / PWA Manifest and Beautiful Icon Enpoints
app.get("/manifest.json", (req: Request, res: Response) => {
  res.json({
    name: "Smart Hub Dashboard",
    short_name: "Smart Hub",
    description: "An elegant, interactive All-in-One Smart Dashboard featuring premium custom visual styling and smart features.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    orientation: "any",
    icons: [
      {
        src: "/app_icon.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any maskable"
      }
    ]
  });
});

app.get("/app_icon.jpg", (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "src/assets/images/app_icon_1781877109100.jpg"));
});

/* --- Vite Middleware / Static Asset Setup --- */

const startApp = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Hub Container running successfully at http://localhost:${PORT}`);
  });
};

startApp();
