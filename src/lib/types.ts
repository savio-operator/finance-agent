export interface FinanceEntry {
  date: string;
  type: "income" | "expense";
  description: string;
  category: string;
  amount: number;
  client: string;
}

export interface Settings {
  expectedMonthlyIncome: number;
  salaries: { name: string; amount: number }[];
  recurringExpenses: { name: string; amount: number }[];
  currency: string;
}

export interface MonthlyFixedCosts {
  salaries: { name: string; amount: number }[];
  recurringExpenses: { name: string; amount: number }[];
}

export interface MonthSummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
}
