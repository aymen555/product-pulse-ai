export interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
}

export interface Topic {
  name: string;
  frequency: number; // 1–10 scale
  sentiment: "positive" | "neutral" | "negative";
}

export interface AnalysisResult {
  product: string;
  analyzedAt: string;
  sentiment: SentimentScore;
  overallScore: number; // 0–100
  topics: Topic[];
  complaints: string[];
  positives: string[];
  insight: string;
  dataPoints: number;
  sources: string[];
}

export interface AnalyzeRequest {
  product: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}
