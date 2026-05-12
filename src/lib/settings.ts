import fs from "fs";
import path from "path";
import { Settings } from "./types";

const SETTINGS_PATH = path.join(process.cwd(), "settings.json");

export function getSettings(): Settings {
  if (!fs.existsSync(SETTINGS_PATH)) {
    const defaults: Settings = {
      expectedMonthlyIncome: 0,
      salaries: [],
      recurringExpenses: [],
      currency: "USD",
    };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
}

export function saveSettings(settings: Settings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

export function getTotalFixedCosts(settings: Settings): number {
  const salaryTotal = settings.salaries.reduce((sum, s) => sum + s.amount, 0);
  const expenseTotal = settings.recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  return salaryTotal + expenseTotal;
}
