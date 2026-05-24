import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readNotionPage } from "@/lib/notion";
import { FinanceEntry, Settings, MonthlyFixedCosts } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, includeNotion, entries, settings, allMonthlyFixedCosts } = await req.json() as {
    messages: { role: string; content: string }[];
    includeNotion?: boolean;
    entries?: Record<string, FinanceEntry[]>;
    settings?: Settings;
    allMonthlyFixedCosts?: Record<string, MonthlyFixedCosts>;
  };

  const allEntries: Record<string, FinanceEntry[]> = entries || {};
  const s: Settings = settings || { expectedMonthlyIncome: 0, salaries: [], recurringExpenses: [], currency: "INR" };
  const monthOverrides: Record<string, MonthlyFixedCosts> = allMonthlyFixedCosts || {};

  const defaultSalaryTotal = s.salaries.reduce((sum, x) => sum + x.amount, 0);
  const defaultExpenseTotal = s.recurringExpenses.reduce((sum, x) => sum + x.amount, 0);
  const defaultFixedCosts = defaultSalaryTotal + defaultExpenseTotal;

  const getMonthFixedCosts = (month: string) => {
    const override = monthOverrides[month];
    if (override) {
      return override.salaries.reduce((sum, x) => sum + x.amount, 0) + override.recurringExpenses.reduce((sum, x) => sum + x.amount, 0);
    }
    return defaultFixedCosts;
  };

  let notionContent = "";
  if (includeNotion && process.env.NOTION_FINANCE_PAGE_ID) {
    notionContent = await readNotionPage(process.env.NOTION_FINANCE_PAGE_ID);
  }

  const systemPrompt = `You are the AI financial advisor for Adchemy, a digital agency. You have access to all financial data and can provide insights, projections, and recommendations.

## Settings
- Expected Monthly Income: ${s.currency} ${s.expectedMonthlyIncome}
- Currency: ${s.currency}
- Default Fixed Monthly Costs: ${s.currency} ${defaultFixedCosts} (may vary per month)

### Salaries
${s.salaries.map((x) => `- ${x.name}: ${s.currency} ${x.amount}`).join("\n") || "None configured"}

### Recurring Expenses
${s.recurringExpenses.map((e) => `- ${e.name}: ${s.currency} ${e.amount}`).join("\n") || "None configured"}

## Financial Data
${Object.entries(allEntries)
  .map(([month, monthEntries]) => {
    const income = monthEntries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
    const expenses = monthEntries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
    const monthFixed = getMonthFixedCosts(month);
    return `### ${month}
- Total Income: ${s.currency} ${income}
- Total Expenses: ${s.currency} ${expenses}
- Fixed Costs: ${s.currency} ${monthFixed}
- Net (before fixed costs): ${s.currency} ${income - expenses}
- Net (after fixed costs): ${s.currency} ${income - expenses - monthFixed}
- Entries: ${monthEntries.length}
${monthEntries.map((e) => `  - ${e.date} | ${e.type} | ${e.description} | ${e.category} | ${s.currency} ${e.amount} | ${e.client}`).join("\n")}`;
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
    model: "claude-sonnet-4-6",
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
