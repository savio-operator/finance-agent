import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { FinanceEntry, Settings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { month, entries, settings } = (await req.json()) as {
    month: string;
    entries: FinanceEntry[];
    settings: Settings;
  };

  const currency = settings.currency || "INR";
  const salaryTotal = settings.salaries.reduce((s, x) => s + x.amount, 0);
  const expenseTotal = settings.recurringExpenses.reduce((s, x) => s + x.amount, 0);
  const fixedCosts = salaryTotal + expenseTotal;

  const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const variableExpenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const net = income - variableExpenses - fixedCosts;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ["Adchemy Finance Report", ""],
    ["Month", month],
    ["Currency", currency],
    ["", ""],
    ["INCOME", ""],
    ["Total Income", income],
    ["", ""],
    ["VARIABLE EXPENSES", ""],
    ["Total Variable Expenses", variableExpenses],
    ["", ""],
    ["FIXED COSTS", ""],
    ...settings.salaries.map((s) => [`Salary: ${s.name}`, s.amount]),
    ...settings.recurringExpenses.map((e) => [`Recurring: ${e.name}`, e.amount]),
    ["Total Fixed Costs", fixedCosts],
    ["", ""],
    ["NET P&L", net],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // Sheet 2: All Entries
  const entriesData = entries.map((e) => ({
    Date: e.date,
    Type: e.type,
    Description: e.description,
    Category: e.category,
    Amount: e.amount,
    Client: e.client,
  }));
  const entriesSheet = XLSX.utils.json_to_sheet(entriesData);
  entriesSheet["!cols"] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, entriesSheet, "Entries");

  // Sheet 3: Income breakdown
  const incomeEntries = entries.filter((e) => e.type === "income");
  if (incomeEntries.length > 0) {
    const incomeSheet = XLSX.utils.json_to_sheet(
      incomeEntries.map((e) => ({
        Date: e.date,
        Description: e.description,
        Category: e.category,
        Amount: e.amount,
        Client: e.client,
      }))
    );
    XLSX.utils.book_append_sheet(wb, incomeSheet, "Income");
  }

  // Sheet 4: Expense breakdown
  const expenseEntries = entries.filter((e) => e.type === "expense");
  if (expenseEntries.length > 0) {
    const expenseSheet = XLSX.utils.json_to_sheet(
      expenseEntries.map((e) => ({
        Date: e.date,
        Description: e.description,
        Category: e.category,
        Amount: e.amount,
        Client: e.client,
      }))
    );
    XLSX.utils.book_append_sheet(wb, expenseSheet, "Expenses");
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `Adchemy_Report_${month.replace(/\s+/g, "_")}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
