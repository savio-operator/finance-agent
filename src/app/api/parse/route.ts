import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const client = new Anthropic();

export async function POST(req: Request) {
  const { text } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are a financial data extractor for a digital agency called Adchemy.
Extract structured financial entries from raw text (bank messages, notes, invoices).
Return a JSON array of objects with these fields:
- date: string (YYYY-MM-DD format)
- type: "income" or "expense"
- description: string
- category: string (e.g. "Client Payment", "Software", "Office", "Marketing", "Salary", "Freelancer", "Tax", "Other")
- amount: number (positive value)
- client: string (client name if applicable, empty string otherwise)

Only return the JSON array, nothing else. If you can't extract any entries, return an empty array [].`,
    messages: [
      {
        role: "user",
        content: `Extract financial entries from this text:\n\n${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ entries: [] });
  }

  try {
    // Try to parse JSON from the response, handling potential markdown code blocks
    let jsonStr = content.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }
    const entries = JSON.parse(jsonStr);
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [], raw: content.text });
  }
}
