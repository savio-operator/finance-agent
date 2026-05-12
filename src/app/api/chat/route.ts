import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAllEntries } from "@/lib/excel";
import { getSettings, getTotalFixedCosts } from "@/lib/settings";
import { readNotionPage } from "@/lib/notion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, includeNotion } = await req.json();

  // Gather all financial context
  const settings = getSettings();
  const allEntries = getAllEntries();
  const fixedCosts = getTotalFixedCosts(settings);

  let notionContent = "";
  if (includeNotion && process.env.NOTION_FINANCE_PAGE_ID) {
    notionContent = await readNotionPage(process.env.NOTION_FINANCE_PAGE_ID);
  }

  const systemPrompt = `You are the AI financial advisor for Adchemy, a digital agency. You have access to all financial data and can provide insights, projections, and recommendations.

## Settings
- Expected Monthly Income: ${settings.currency} ${settings.expectedMonthlyIncome}
- Currency: ${settings.currency}
- Total Fixed Monthly Costs: ${settings.currency} ${fixedCosts}

### Salaries
${settings.salaries.map((s) => `- ${s.name}: ${settings.currency} ${s.amount}`).join("\n") || "None configured"}

### Recurring Expenses
${settings.recurringExpenses.map((e) => `- ${e.name}: ${settings.currency} ${e.amount}`).join("\n") || "None configured"}

## Financial Data (from Excel)
${Object.entries(allEntries)
  .map(([month, entries]) => {
    const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return `### ${month}
- Total Income: ${settings.currency} ${income}
- Total Expenses: ${settings.currency} ${expenses}
- Net (before fixed costs): ${settings.currency} ${income - expenses}
- Net (after fixed costs): ${settings.currency} ${income - expenses - fixedCosts}
- Entries: ${entries.length}
${entries.map((e) => `  - ${e.date} | ${e.type} | ${e.description} | ${e.category} | ${settings.currency} ${e.amount} | ${e.client}`).join("\n")}`;
  })
  .join("\n\n") || "No data yet"}

${notionContent ? `## Notion Financial Plan\n${notionContent}` : ""}

You can help with:
- Can we pay salaries this month?
- Year-end projections
- Identifying risky months
- Cost-cutting suggestions
- What-if scenarios (e.g., "what if income drops 30%?")
- Monthly financial summaries

Be specific with numbers and reference actual data. Format currency amounts clearly.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const content = response.content[0];
  const text = content.type === "text" ? content.text : "";

  return NextResponse.json({ message: text });
}
