const ANTHROPIC_API = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"

async function callClaude(prompt: string, systemPrompt: string, maxTokens = 1024): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set")

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ""
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim())
  } catch {
    return fallback
  }
}

// Deal Scoring (0-100)
export async function scoreDeal(project: {
  name: string
  sector?: string | null
  description?: string | null
  targetRaise?: number | null
  minTicket?: number | null
  irrTargetBps?: number | null
  riskLevel?: string | null
  lifecycle: string
}): Promise<{
  score: number
  breakdown: { category: string; score: number; comment: string }[]
  summary: string
  recommendation: "STRONG_BUY" | "BUY" | "NEUTRAL" | "AVOID"
}> {
  const result = await callClaude(
    `Score this investment opportunity on a scale of 0-100. Return JSON only:
{
  "score": <0-100>,
  "breakdown": [
    {"category": "Market Opportunity", "score": <0-20>, "comment": "..."},
    {"category": "Return Profile", "score": <0-20>, "comment": "..."},
    {"category": "Risk Level", "score": <0-20>, "comment": "..."},
    {"category": "Deal Structure", "score": <0-20>, "comment": "..."},
    {"category": "Information Quality", "score": <0-20>, "comment": "..."}
  ],
  "summary": "2-sentence summary",
  "recommendation": "STRONG_BUY|BUY|NEUTRAL|AVOID"
}

Project: ${JSON.stringify(project)}`,
    "You are a senior investment analyst. Score objectively. Return only valid JSON.",
    1500
  )
  return parseJson(result, {
    score: 50, breakdown: [], summary: "Analysis unavailable",
    recommendation: "NEUTRAL" as const
  })
}

// Investor-Project Matching
export async function matchInvestorToProjects(
  investorProfile: string,
  projects: { id: string; name: string; sector?: string; riskLevel?: string; minTicket?: number }[]
): Promise<{ projectId: string; matchScore: number; reason: string }[]> {
  const result = await callClaude(
    `Match this investor to the best projects. Return JSON array only:
[{"projectId": "...", "matchScore": <0-100>, "reason": "..."}]

Investor: ${investorProfile}
Projects: ${JSON.stringify(projects)}`,
    "You are an investment relationship manager. Match based on profile fit, risk tolerance, and ticket size. Return only valid JSON array.",
    1000
  )
  return parseJson(result, [])
}

// Red Flag Detection
export async function detectRedFlags(content: string): Promise<{
  flags: { severity: "HIGH" | "MEDIUM" | "LOW"; category: string; description: string; clause?: string }[]
  overallRisk: "HIGH" | "MEDIUM" | "LOW"
  summary: string
}> {
  const result = await callClaude(
    `Analyze this investment document for red flags. Return JSON only:
{
  "flags": [{"severity": "HIGH|MEDIUM|LOW", "category": "...", "description": "...", "clause": "exact text if found"}],
  "overallRisk": "HIGH|MEDIUM|LOW",
  "summary": "2-sentence risk summary"
}

Document: ${content.slice(0, 6000)}`,
    "You are a legal and financial risk analyst specializing in investment documents. Be thorough but concise. Return only valid JSON.",
    2000
  )
  return parseJson(result, { flags: [], overallRisk: "MEDIUM", summary: "Analysis unavailable" })
}

// Financial Projection
export async function generateFinancialProjection(project: {
  targetRaise?: number | null
  irrTargetBps?: number | null
  duration?: string | null
  type?: string | null
}): Promise<{
  scenarios: {
    name: string
    irr: number
    roi: number
    monthlyIncome: number
    totalReturn: number
  }[]
  assumptions: string[]
}> {
  const result = await callClaude(
    `Generate 3 investment scenarios (bear/base/bull) for this project. Return JSON only:
{
  "scenarios": [
    {"name": "Bear Case", "irr": <percent>, "roi": <percent>, "monthlyIncome": <per $10k invested>, "totalReturn": <percent>},
    {"name": "Base Case", "irr": <percent>, "roi": <percent>, "monthlyIncome": <per $10k invested>, "totalReturn": <percent>},
    {"name": "Bull Case", "irr": <percent>, "roi": <percent>, "monthlyIncome": <per $10k invested>, "totalReturn": <percent>}
  ],
  "assumptions": ["key assumption 1", "key assumption 2", "key assumption 3"]
}

Project details: ${JSON.stringify(project)}`,
    "You are a financial modeler. Create realistic scenarios. Return only valid JSON.",
    1000
  )
  return parseJson(result, { scenarios: [], assumptions: [] })
}
