import { FinanceEntry, Settings } from "./types";

const ENTRIES_KEY = "adchemy_entries";
const SETTINGS_KEY = "adchemy_settings";

const DEFAULT_SETTINGS: Settings = {
  expectedMonthlyIncome: 0,
  salaries: [],
  recurringExpenses: [],
  currency: "INR",
};

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getAllEntries(): Record<string, FinanceEntry[]> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(ENTRIES_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function getEntriesForMonth(month: string): FinanceEntry[] {
  const all = getAllEntries();
  return all[month] || [];
}

export function addEntriesToMonth(month: string, entries: FinanceEntry[]): void {
  const all = getAllEntries();
  const existing = all[month] || [];
  all[month] = [...existing, ...entries];
  if (typeof window === "undefined") return;
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(all));
}

export function getSheetNames(): string[] {
  return Object.keys(getAllEntries());
}

export function getTotalFixedCosts(settings: Settings): number {
  const salaryTotal = settings.salaries.reduce((sum, s) => sum + s.amount, 0);
  const expenseTotal = settings.recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  return salaryTotal + expenseTotal;
}
