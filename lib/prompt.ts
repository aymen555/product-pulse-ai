export function buildAnalysisPrompt(product: string, context: string): string {
  return `Analyze consumer sentiment for: "${product}"

COMMENTS:
${context.slice(0, 2000)}

Reply ONLY with this JSON (no markdown):
{"sentiment":{"positive":0,"neutral":0,"negative":0},"overallScore":0,"topics":[{"name":"","frequency":0,"sentiment":""}],"complaints":[""],"positives":[""],"insight":"","dataPoints":0}

Rules: sentiment sums to 100, max 5 topics, max 4 each for complaints/positives.`;
}

export function buildFallbackPrompt(product: string): string {
  return `Analyze consumer sentiment for: "${product}" based on your knowledge.

Reply ONLY with this JSON (no markdown):
{"sentiment":{"positive":0,"neutral":0,"negative":0},"overallScore":0,"topics":[{"name":"","frequency":0,"sentiment":""}],"complaints":[""],"positives":[""],"insight":"","dataPoints":0}

Rules: sentiment sums to 100, max 5 topics, max 4 each for complaints/positives.`;
}
