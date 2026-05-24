import { FinanceEntry, Settings, MonthlyFixedCosts } from "./types";

const ENTRIES_KEY = "adchemy_entries";
const SETTINGS_KEY = "adchemy_settings";
const MONTHLY_FIXED_COSTS_KEY = "adchemy_monthly_fixed_costs";

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

export function updateEntryInMonth(month: string, index: number, updated: FinanceEntry): void {
  const all = getAllEntries();
  const entries = all[month] || [];
  if (index < 0 || index >= entries.length) return;
  entries[index] = updated;
  all[month] = entries;
  if (typeof window === "undefined") return;
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(all));
}

export function deleteEntryFromMonth(month: string, index: number): void {
  const all = getAllEntries();
  const entries = all[month] || [];
  if (index < 0 || index >= entries.length) return;
  entries.splice(index, 1);
  all[month] = entries;
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

export function getAllMonthlyFixedCosts(): Record<string, MonthlyFixedCosts> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(MONTHLY_FIXED_COSTS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function getFixedCostsForMonth(month: string, settings: Settings): MonthlyFixedCosts {
  const all = getAllMonthlyFixedCosts();
  if (all[month]) return all[month];
  return { salaries: settings.salaries, recurringExpenses: settings.recurringExpenses };
}

export function saveFixedCostsForMonth(month: string, costs: MonthlyFixedCosts): void {
  if (typeof window === "undefined") return;
  const all = getAllMonthlyFixedCosts();
  all[month] = costs;
  localStorage.setItem(MONTHLY_FIXED_COSTS_KEY, JSON.stringify(all));
}

export function getTotalFixedCostsForMonth(month: string, settings: Settings): number {
  const costs = getFixedCostsForMonth(month, settings);
  const salaryTotal = costs.salaries.reduce((sum, s) => sum + s.amount, 0);
  const expenseTotal = costs.recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  return salaryTotal + expenseTotal;
}
