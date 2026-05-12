import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { FinanceEntry } from "./types";

const EXCEL_PATH = path.join(process.cwd(), "finances.xlsx");

function readWorkbook(): XLSX.WorkBook | null {
  if (!fs.existsSync(EXCEL_PATH)) return null;
  const buf = fs.readFileSync(EXCEL_PATH);
  return XLSX.read(buf, { type: "buffer" });
}

function writeWorkbook(wb: XLSX.WorkBook): void {
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  fs.writeFileSync(EXCEL_PATH, buf);
}

function ensureWorkbook(): XLSX.WorkBook {
  const existing = readWorkbook();
  if (existing) return existing;

  const wb = XLSX.utils.book_new();
  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const ws = XLSX.utils.json_to_sheet([], { header: ["Date", "Type", "Description", "Category", "Amount", "Client"] });
  XLSX.utils.book_append_sheet(wb, ws, monthName);
  try {
    writeWorkbook(wb);
  } catch {
    // Vercel has a read-only filesystem; skip writing
  }
  return wb;
}

export function getSheetNames(): string[] {
  const wb = ensureWorkbook();
  return wb.SheetNames;
}

export function getEntriesForMonth(month: string): FinanceEntry[] {
  const wb = ensureWorkbook();
  const ws = wb.Sheets[month];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  return rows.map((row) => ({
    date: String(row["Date"] || ""),
    type: (String(row["Type"] || "").toLowerCase() === "income" ? "income" : "expense") as "income" | "expense",
    description: String(row["Description"] || ""),
    category: String(row["Category"] || ""),
    amount: Number(row["Amount"] || 0),
    client: String(row["Client"] || ""),
  }));
}

export function addEntriesToMonth(month: string, entries: FinanceEntry[]): void {
  const wb = ensureWorkbook();

  let existing: FinanceEntry[] = [];
  if (wb.Sheets[month]) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[month]);
    existing = rows.map((row) => ({
      date: String(row["Date"] || ""),
      type: (String(row["Type"] || "").toLowerCase() === "income" ? "income" : "expense") as "income" | "expense",
      description: String(row["Description"] || ""),
      category: String(row["Category"] || ""),
      amount: Number(row["Amount"] || 0),
      client: String(row["Client"] || ""),
    }));
  }

  const all = [...existing, ...entries];
  const wsData = all.map((e) => ({
    Date: e.date,
    Type: e.type,
    Description: e.description,
    Category: e.category,
    Amount: e.amount,
    Client: e.client,
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);
  if (wb.SheetNames.includes(month)) {
    wb.Sheets[month] = ws;
  } else {
    XLSX.utils.book_append_sheet(wb, ws, month);
  }

  try {
    writeWorkbook(wb);
  } catch {
    // Vercel has a read-only filesystem; skip writing
  }
}

export function getAllEntries(): Record<string, FinanceEntry[]> {
  const wb = ensureWorkbook();
  const result: Record<string, FinanceEntry[]> = {};
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
    result[name] = rows.map((row) => ({
      date: String(row["Date"] || ""),
      type: (String(row["Type"] || "").toLowerCase() === "income" ? "income" : "expense") as "income" | "expense",
      description: String(row["Description"] || ""),
      category: String(row["Category"] || ""),
      amount: Number(row["Amount"] || 0),
      client: String(row["Client"] || ""),
    }));
  }
  return result;
}
