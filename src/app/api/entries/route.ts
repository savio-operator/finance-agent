import { NextResponse } from "next/server";
import { getEntriesForMonth, addEntriesToMonth, getAllEntries, getSheetNames } from "@/lib/excel";
import { FinanceEntry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  if (month) {
    const entries = getEntriesForMonth(month);
    return NextResponse.json({ entries });
  }

  // Return all entries and sheet names
  const allEntries = getAllEntries();
  const sheets = getSheetNames();
  return NextResponse.json({ allEntries, sheets });
}

export async function POST(req: Request) {
  const { month, entries }: { month: string; entries: FinanceEntry[] } = await req.json();
  addEntriesToMonth(month, entries);
  return NextResponse.json({ success: true });
}
