export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
  await requireAdmin()
  const { text, type } = await req.json()
  if (!text) return NextResponse.json({ error: "No text" }, { status: 400 })

  const prompts: Record<string, string> = {
    summary: `Summarize this investment document in exactly 3 bullet points. Each bullet should be one clear sentence. Format: • Point 1\n• Point 2\n• Point 3\n\nDocument:\n${text.slice(0, 8000)}`,
    diligence: `You are an expert M&A analyst. Analyze this document and identify:\n1. KEY STRENGTHS (2-3 points)\n2. RED FLAGS / RISKS (2-3 points)\n3. MISSING INFORMATION (1-2 points)\n\nBe direct and professional.\n\nDocument:\n${text.slice(0, 8000)}`,
    qa: `You are an investment analyst. Answer this investor question based on the project context provided.\n\nBe professional, accurate, and concise (2-3 sentences max).\n\nContext: ${text}\n\nQuestion: ${type}`,
  }

  const prompt = type === "qa" ? prompts.qa : (prompts[type] ?? prompts.summary)

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })
  })

  if (!response.ok) return NextResponse.json({ error: "AI error" }, { status: 500 })
  const data = await response.json()
  const result = data.content?.[0]?.text ?? ""
  return NextResponse.json({ result })  } catch (e: any) {
    console.error("[AI]", e)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
