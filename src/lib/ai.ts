const ANTHROPIC_API = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-sonnet-4-20250514"

async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
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
      max_tokens: 1024,
      system: systemPrompt ?? "You are a professional financial analyst assistant.",
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ""
}

export async function summarizeDocument(text: string): Promise<{ bullets: string[]; summary: string }> {
  const result = await callClaude(
    `Summarize this investment document in exactly 3 bullet points and one sentence summary. Return JSON only:
{"bullets": ["...", "...", "..."], "summary": "..."}

Document:
${text.slice(0, 8000)}`,
    "You are a professional investment analyst. Return only valid JSON."
  )
  try {
    const clean = result.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return { bullets: [result.slice(0, 200)], summary: result.slice(0, 100) }
  }
}

export async function aiAnswerQuestion(question: string, projectContext: string): Promise<string> {
  return callClaude(
    `You are an investment advisor for this project. Answer the investor's question based on the project information below.
Be professional, concise (2-3 sentences max), and only answer what you know from the context.
If you cannot answer, say so professionally.

Project context:
${projectContext.slice(0, 4000)}

Investor question: ${question}`,
    "You are a professional investment advisor."
  )
}

export async function dueDiligenceAnalysis(text: string): Promise<{
  score: number; risks: string[]; positives: string[]; redFlags: string[]; recommendation: string
}> {
  const result = await callClaude(
    `Perform a due diligence analysis on this investment document. Return JSON only:
{
  "score": <0-100 investment quality score>,
  "risks": ["risk1", "risk2", "risk3"],
  "positives": ["positive1", "positive2", "positive3"],
  "redFlags": ["flag1", "flag2"],
  "recommendation": "brief 1-sentence recommendation"
}

Document:
${text.slice(0, 8000)}`,
    "You are a senior investment analyst. Return only valid JSON."
  )
  try {
    const clean = result.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch {
    return { score: 50, risks: [], positives: [], redFlags: [], recommendation: "Analysis unavailable" }
  }
}

export async function predictInvestorScore(profile: string, activity: string): Promise<number> {
  const result = await callClaude(
    `Based on this investor profile and activity data, predict their likelihood to invest (0-100 score).
Return only a number.

Investor profile: ${profile}
Recent activity: ${activity}`,
    "You are an investment relationship manager. Return only a number 0-100."
  )
  const score = parseInt(result.trim())
  return isNaN(score) ? 50 : Math.max(0, Math.min(100, score))
}
