import { useMemo, useState } from "react";
import {
  Calendar,
  Droplet,
  FlaskConical,
  Leaf,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  ThermometerSun
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { GoogleGenAI } from "@google/genai";
import { cropCalendarData } from "./data/cropCalendar";
import type { CropData, FertilizerPlan } from "./types";

const months = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر"
];

const categoryColors: Record<string, string> = {
  خضروات: "bg-emerald-100 text-emerald-700",
  فواكه: "bg-amber-100 text-amber-700",
  "محاصيل حقلية": "bg-sky-100 text-sky-700",
  أعشاب: "bg-teal-100 text-teal-700",
  مكسرات: "bg-orange-100 text-orange-700"
};

const placeholderImage =
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80";

const mockCropData = (name: string): CropData => ({
  name,
  scientificName: "Solanum lycopersicum",
  description:
    "محصول غني بالفيتامينات يناسب الزراعة المنزلية والحقول المفتوحة ويتميز بإنتاجية عالية عند ضبط الري والتسميد.",
  plantingSeason: "الربيع والخريف",
  harvestSeason: "بعد 90-120 يومًا من الشتل",
  growthDuration: "3-4 أشهر",
  soilType: "تربة طميية جيدة الصرف غنية بالمادة العضوية",
  phLevel: "6.0 - 6.8",
  optimalTemp: "20-28°م",
  waterNeeds: "ري منتظم بدون إغراق، مع الحفاظ على رطوبة معتدلة",
  sunNeeds: "شمس كاملة 6-8 ساعات",
  bestMethod: "الشتل على مصاطب مع تغطية عضوية",
  methods: [
    {
      name: "الشتل التقليدي",
      description: "تجهيز مشتل صغير ثم نقل الشتلات بعد 4-6 أسابيع.",
      steps: [
        "تحضير صواني الشتلات بتربة خفيفة.",
        "زراعة البذور على عمق 0.5 سم.",
        "إضاءة جيدة ورطوبة منتظمة.",
        "نقل الشتلات عند ظهور 4-6 أوراق حقيقية.",
        "تثبيت الري بالتنقيط بعد الشتل مباشرة."
      ]
    }
  ],
  topProducers: [
    { country: "الصين", production: 65, percentage: "30%" },
    { country: "الهند", production: 45, percentage: "21%" },
    { country: "تركيا", production: 20, percentage: "9%" },
    { country: "مصر", production: 18, percentage: "8%" },
    { country: "إسبانيا", production: 12, percentage: "6%" }
  ],
  funFact: "الطماطم كانت تصنف تاريخيًا كنبات زينة قبل اعتمادها غذائيًا."
});

const mockFertilizerPlan = (crop: string): FertilizerPlan => ({
  crop,
  phases: [
    {
      phase: "تجهيز التربة",
      description: "تحسين خصوبة التربة قبل الزراعة.",
      chemical: "NPK 10-20-10 بمعدل 50 كجم/هكتار",
      organic: "كمبوست ناضج 4-6 كجم/م²"
    },
    {
      phase: "مرحلة الشتلات",
      description: "دعم النمو الجذري المبكر.",
      chemical: "فوسفات أحادي 12-61-0",
      organic: "شاي الكمبوست أو مستخلص الطحالب"
    },
    {
      phase: "النمو الخضري",
      description: "زيادة المجموع الخضري والتوازن الغذائي.",
      chemical: "NPK 20-10-10 كل 10 أيام",
      organic: "سماد دجاج مختمر أو روث معالج"
    },
    {
      phase: "الإزهار",
      description: "تعزيز العقد وتقوية الأزهار.",
      chemical: "NPK 10-30-20 مع بورون",
      organic: "رماد خشب منخول + مستخلص أعشاب بحرية"
    },
    {
      phase: "الإثمار",
      description: "تحسين حجم وجودة الثمار.",
      chemical: "NPK 15-5-30 مرتين شهريًا",
      organic: "مستخلص قشور الموز + شاي بوتاسيوم"
    }
  ],
  notes: [
    "اختبر ملوحة التربة قبل إضافة أي أسمدة.",
    "يفضل الري بعد التسميد لضمان امتصاص أفضل.",
    "اضبط الجرعات حسب مرحلة النمو وملوحة الماء."
  ]
});

const systemJsonSchema = `أنت مساعد زراعي ذكي. أعِد إجابتك بصيغة JSON فقط بدون أي نص إضافي. يجب أن يطابق JSON هذا المخطط:
{
  "name": "string",
  "scientificName": "string",
  "description": "string",
  "plantingSeason": "string",
  "harvestSeason": "string",
  "growthDuration": "string",
  "soilType": "string",
  "phLevel": "string",
  "optimalTemp": "string",
  "waterNeeds": "string",
  "sunNeeds": "string",
  "bestMethod": "string",
  "methods": [
    {
      "name": "string",
      "description": "string",
      "steps": ["string"]
    }
  ],
  "topProducers": [
    { "country": "string", "production": number, "percentage": "string" }
  ],
  "funFact": "string"
}`;

const fertilizerSchema = `أنت مساعد زراعي ذكي. أعد إجابتك بصيغة JSON فقط بدون أي نص إضافي. يجب أن يطابق JSON هذا المخطط:
{
  "crop": "string",
  "phases": [
    { "phase": "تحضير التربة", "description": "string", "chemical": "string", "organic": "string" },
    { "phase": "مرحلة الشتلات", "description": "string", "chemical": "string", "organic": "string" },
    { "phase": "النمو الخضري", "description": "string", "chemical": "string", "organic": "string" },
    { "phase": "الإزهار", "description": "string", "chemical": "string", "organic": "string" },
    { "phase": "الإثمار", "description": "string", "chemical": "string", "organic": "string" }
  ],
  "notes": ["string"]
}`;

const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const generateCropGuide = async (crop: string): Promise<CropData> => {
  const client = getGeminiClient();
  if (!client) {
    return mockCropData(crop);
  }

  const prompt = `${systemJsonSchema}\n\nالمحصول المطلوب: ${crop}. أضف بيانات واقعية عن أهم الدول المنتجة.`;
  const response = (await client.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  })) as unknown as { text?: string; candidates?: { content?: { parts?: { text?: string }[] } }[] };

  const text = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    return JSON.parse(text) as CropData;
  } catch {
    return mockCropData(crop);
  }
};

const generateCropImage = async (crop: string): Promise<string> => {
  const client = getGeminiClient();
  if (!client) {
    return placeholderImage;
  }

  try {
    const result = (await client.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: `صورة عالية الجودة لمحصول ${crop} في مزرعة عربية خضراء، إضاءة طبيعية.`
    })) as unknown as { generatedImages?: { image?: { imageBytes?: string } }[] };

    const bytes = result.generatedImages?.[0]?.image?.imageBytes;
    if (!bytes) {
      return placeholderImage;
    }
    return `data:image/png;base64,${bytes}`;
  } catch {
    return placeholderImage;
  }
};

const generateFertilizerPlan = async (crop: string): Promise<FertilizerPlan> => {
  const client = getGeminiClient();
  if (!client) {
    return mockFertilizerPlan(crop);
  }

  const prompt = `${fertilizerSchema}\n\nالمحصول المطلوب: ${crop}.`;
  const response = (await client.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  })) as unknown as { text?: string; candidates?: { content?: { parts?: { text?: string }[] } }[] };

  const text = response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    return JSON.parse(text) as FertilizerPlan;
  } catch {
    return mockFertilizerPlan(crop);
  }
};

const tabs = [
  { id: "guide", label: "دليل المحاصيل", icon: Leaf },
  { id: "fertilizer", label: "خطة التسميد", icon: FlaskConical },
  { id: "calendar", label: "تقويم الزراعة", icon: Calendar }
] as const;

type TabId = (typeof tabs)[number]["id"];

const App = () => {
  const [activeTab, setActiveTab] = useState<TabId>("guide");
  const [cropInput, setCropInput] = useState("طماطم");
  const [fertilizerInput, setFertilizerInput] = useState("طماطم");
  const [cropData, setCropData] = useState<CropData | null>(null);
  const [cropImage, setCropImage] = useState<string>(placeholderImage);
  const [fertilizerPlan, setFertilizerPlan] = useState<FertilizerPlan | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [loadingFertilizer, setLoadingFertilizer] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState<
    "الكل" | "خضروات" | "فواكه" | "محاصيل حقلية" | "أعشاب" | "مكسرات"
  >("الكل");

  const filteredCalendar = useMemo(() => {
    if (calendarFilter === "الكل") {
      return cropCalendarData;
    }
    return cropCalendarData.filter((item) => item.mainCategory === calendarFilter);
  }, [calendarFilter]);

  const handleGuideSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cropInput.trim()) {
      return;
    }
    setLoadingGuide(true);
    const [guide, image] = await Promise.all([
      generateCropGuide(cropInput),
      generateCropImage(cropInput)
    ]);
    setCropData(guide);
    setCropImage(image);
    setLoadingGuide(false);
  };

  const handleFertilizerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fertilizerInput.trim()) {
      return;
    }
    setLoadingFertilizer(true);
    const plan = await generateFertilizerPlan(fertilizerInput);
    setFertilizerPlan(plan);
    setLoadingFertilizer(false);
  };

  const producerData = cropData?.topProducers ?? [];

  return (
    <div className="min-h-screen bg-agri-soft text-slate-900">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-agri-green text-white shadow-lg">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-600">Zira'a</p>
              <h1 className="text-2xl font-bold text-slate-900">الدليل الزراعي الذكي</h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="أوضاع التطبيق">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-transparent bg-white text-slate-600 hover:border-emerald-100"
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        {activeTab === "guide" && (
          <section className="space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">ابحث عن محصولك</h2>
                  <p className="text-sm text-slate-600">
                    أدخل اسم المحصول للحصول على توصيات بيئية، أفضل طرق الزراعة، وأهم المنتجين عالميًا.
                  </p>
                </div>
                <form className="flex w-full max-w-md gap-2" onSubmit={handleGuideSubmit}>
                  <label className="sr-only" htmlFor="crop-search">
                    اسم المحصول
                  </label>
                  <input
                    id="crop-search"
                    value={cropInput}
                    onChange={(event) => setCropInput(event.target.value)}
                    className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
                    placeholder="مثال: طماطم"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-2xl bg-agri-green px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                  >
                    <Search className="h-4 w-4" />
                    بحث
                  </button>
                </form>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                يعتمد على Gemini API عند توفر المفتاح، وإلا سيتم استخدام بيانات افتراضية.
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="relative overflow-hidden rounded-3xl bg-slate-900">
                <img
                  src={cropImage}
                  alt={`صورة محصول ${cropData?.name ?? cropInput}`}
                  className="h-96 w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 right-6 left-6 text-white">
                  <p className="text-sm text-emerald-200">محصول اليوم</p>
                  <h3 className="text-3xl font-bold">{cropData?.name ?? "اختر محصولًا"}</h3>
                  <p className="mt-2 text-sm text-emerald-100">
                    {cropData?.scientificName ?? "الاسم العلمي سيظهر هنا"}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-slate-900">ملخص سريع</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {cropData?.description ??
                    "ابدأ البحث للحصول على وصف شامل للمحصول واحتياجاته البيئية."}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "درجة الحرارة",
                      value: cropData?.optimalTemp ?? "--",
                      icon: ThermometerSun
                    },
                    {
                      label: "احتياج الماء",
                      value: cropData?.waterNeeds ?? "--",
                      icon: Droplet
                    },
                    { label: "احتياج الشمس", value: cropData?.sunNeeds ?? "--", icon: Sun },
                    { label: "نوع التربة", value: cropData?.soilType ?? "--", icon: Leaf }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-emerald-100 p-4">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-semibold">{item.label}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-700">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-600">معلومة ممتعة</p>
                  <p className="mt-2 text-sm text-slate-700">{cropData?.funFact ?? "--"}</p>
                </div>
              </div>
            </div>

            {loadingGuide && (
              <div className="animate-fade-in rounded-3xl bg-white p-6 text-center text-sm text-slate-600 shadow">
                جارٍ تحضير الدليل الزراعي...
              </div>
            )}

            {cropData && !loadingGuide && (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <div className="rounded-3xl bg-white p-6 shadow-lg">
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <LineChart className="h-5 w-5 text-emerald-600" />
                      بيانات النمو والزراعة
                    </h4>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {[
                        { label: "موسم الزراعة", value: cropData.plantingSeason },
                        { label: "موسم الحصاد", value: cropData.harvestSeason },
                        { label: "مدة النمو", value: cropData.growthDuration },
                        { label: "الرقم الهيدروجيني", value: cropData.phLevel }
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-emerald-100 p-4">
                          <p className="text-xs font-semibold text-emerald-600">{item.label}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-lg">
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      أفضل طريقة للزراعة
                    </h4>
                    <p className="mt-2 text-sm text-slate-600">{cropData.bestMethod}</p>
                    <div className="mt-4 space-y-4">
                      {cropData.methods.map((method, index) => (
                        <div key={method.name + index} className="rounded-2xl bg-emerald-50 p-4">
                          <p className="text-sm font-semibold text-emerald-700">{method.name}</p>
                          <p className="mt-1 text-xs text-emerald-800/80">{method.description}</p>
                          <ol className="mt-3 list-decimal space-y-1 pr-4 text-xs text-slate-700">
                            {method.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-lg">
                  <h4 className="text-lg font-semibold text-slate-900">أكبر الدول المنتجة</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    بيانات تقديرية للمشاركة العالمية في الإنتاج.
                  </p>
                  <div className="mt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={producerData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="production" fill="#16a34a" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {producerData.map((item) => (
                      <div key={item.country} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{item.country}</span>
                        <span className="text-slate-500">{item.percentage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "fertilizer" && (
          <section className="space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">خطة التسميد الذكية</h2>
                  <p className="text-sm text-slate-600">
                    احصل على برنامج تغذية متوازن للمحصول عبر مراحل النمو المختلفة.
                  </p>
                </div>
                <form className="flex w-full max-w-md gap-2" onSubmit={handleFertilizerSubmit}>
                  <label className="sr-only" htmlFor="fertilizer-search">
                    اسم المحصول للتسميد
                  </label>
                  <input
                    id="fertilizer-search"
                    value={fertilizerInput}
                    onChange={(event) => setFertilizerInput(event.target.value)}
                    className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none"
                    placeholder="مثال: خيار"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-2xl bg-agri-green px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                  >
                    <Search className="h-4 w-4" />
                    توليد
                  </button>
                </form>
              </div>
            </div>

            {loadingFertilizer && (
              <div className="animate-fade-in rounded-3xl bg-white p-6 text-center text-sm text-slate-600 shadow">
                جارٍ بناء جدول التسميد...
              </div>
            )}

            {fertilizerPlan && !loadingFertilizer && (
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-slate-900">برنامج {fertilizerPlan.crop}</h3>
                <div className="mt-6 space-y-6">
                  {fertilizerPlan.phases.map((phase, index) => (
                    <div key={phase.phase} className="flex flex-col gap-4 md:flex-row">
                      <div className="flex items-start gap-3 md:w-48">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{phase.phase}</p>
                          <p className="text-xs text-slate-500">{phase.description}</p>
                        </div>
                      </div>
                      <div className="grid flex-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-100 p-4">
                          <p className="text-xs font-semibold text-emerald-600">تسميد كيميائي</p>
                          <p className="mt-2 text-sm text-slate-700">{phase.chemical}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 p-4">
                          <p className="text-xs font-semibold text-emerald-600">بدائل عضوية</p>
                          <p className="mt-2 text-sm text-slate-700">{phase.organic}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-700">ملاحظات إضافية</p>
                  <ul className="mt-2 list-disc space-y-1 pr-4 text-sm text-slate-700">
                    {fertilizerPlan.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "calendar" && (
          <section className="space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">تقويم زراعة المحاصيل</h2>
                  <p className="text-sm text-slate-600">
                    قاعدة بيانات محلية تضم أكثر من 200 محصول مع أشهر الزراعة المثالية.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    "الكل",
                    "خضروات",
                    "فواكه",
                    "محاصيل حقلية",
                    "أعشاب",
                    "مكسرات"
                  ].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setCalendarFilter(
                          category as "الكل" | "خضروات" | "فواكه" | "محاصيل حقلية" | "أعشاب" | "مكسرات"
                        )
                      }
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        calendarFilter === category
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCalendar.map((item) => (
                <div key={item.id} className="rounded-3xl bg-white p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        categoryColors[item.mainCategory]
                      }`}
                    >
                      {item.mainCategory}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-slate-500">أشهر الزراعة</p>
                    <div className="mt-2 grid grid-cols-12 gap-1">
                      {months.map((month, index) => {
                        const monthNumber = index + 1;
                        const isPlanting = item.plantingMonths.includes(monthNumber);
                        return (
                          <span
                            key={month}
                            title={month}
                            className={`h-2 rounded-full ${
                              isPlanting ? "bg-emerald-500" : "bg-emerald-100"
                            }`}
                            aria-label={month}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-slate-600">
                    <p>{item.plantingText}</p>
                    <p>{item.harvestText}</p>
                    <p className="mt-1 text-emerald-700">مناخ: {item.climate}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
