export interface CropData {
  name: string;
  scientificName: string;
  description: string;
  plantingSeason: string;
  harvestSeason: string;
  growthDuration: string;
  soilType: string;
  phLevel: string;
  optimalTemp: string;
  waterNeeds: string;
  sunNeeds: string;
  bestMethod: string;
  methods: { name: string; description: string; steps: string[] }[];
  topProducers: { country: string; production: number; percentage: string }[];
  funFact: string;
}

export interface CropCalendarItem {
  id: number;
  name: string;
  category: string;
  mainCategory: "خضروات" | "فواكه" | "محاصيل حقلية" | "أعشاب" | "مكسرات";
  plantingMonths: number[];
  plantingText: string;
  harvestText: string;
  climate: string;
}

export interface FertilizerPhase {
  phase: string;
  description: string;
  chemical: string;
  organic: string;
}

export interface FertilizerPlan {
  crop: string;
  phases: FertilizerPhase[];
  notes: string[];
}
