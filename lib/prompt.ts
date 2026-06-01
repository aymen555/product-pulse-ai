export function buildAnalysisPrompt(product: string, context: string): string {
  return `Analyze consumer sentiment for: "${product}"

COMMENTS:
${context.slice(0, 2000)}

Reply ONLY with this JSON (no markdown):
{
  "sentiment": {"positive": <0-100>, "neutral": <0-100>, "negative": <0-100>},
  "overallScore": <0-100>,
  "topics": [{"name": "<topic>", "frequency": <1-10>, "sentiment": "<positive|neutral|negative>"}],
  "complaints": ["<complaint>", "<complaint>"],
  "positives": ["<positive>", "<positive>"],
  "insight": "<one sentence for buyer>",
  "dataPoints": <number>
}
Rules: sentiment sums to 100, max 5 topics, max 4 complaints, max 4 positives.`;
}

export function buildFallbackPrompt(product: string): string {
  return `Analyze consumer sentiment for: "${product}" based on your knowledge.

Reply ONLY with this JSON (no markdown):
{
  "sentiment": {"positive": <0-100>, "neutral": <0-100>, "negative": <0-100>},
  "overallScore": <0-100>,
  "topics": [{"name": "<topic>", "frequency": <1-10>, "sentiment": "<positive|neutral|negative>"}],
  "complaints": ["<complaint>", "<complaint>"],
  "positives": ["<positive>", "<positive>"],
  "insight": "<one sentence for buyer>",
  "dataPoints": <number>
}
Rules: sentiment sums to 100, max 5 topics, max 4 complaints, max 4 positives.`;
}
