"use client";

import { useEffect, useState } from "react";
import { Settings } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/storage";

export default function SetupPage() {
  const [settings, setSettings] = useState<Settings>({
    expectedMonthlyIncome: 0,
    salaries: [],
    recurringExpenses: [],
    currency: "INR",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const save = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addSalary = () => {
    setSettings({ ...settings, salaries: [...settings.salaries, { name: "", amount: 0 }] });
  };

  const removeSalary = (i: number) => {
    setSettings({ ...settings, salaries: settings.salaries.filter((_, idx) => idx !== i) });
  };

  const updateSalary = (i: number, field: "name" | "amount", value: string | number) => {
    const updated = [...settings.salaries];
    updated[i] = { ...updated[i], [field]: field === "amount" ? Number(value) : value };
    setSettings({ ...settings, salaries: updated });
  };

  const addExpense = () => {
    setSettings({ ...settings, recurringExpenses: [...settings.recurringExpenses, { name: "", amount: 0 }] });
  };

  const removeExpense = (i: number) => {
    setSettings({ ...settings, recurringExpenses: settings.recurringExpenses.filter((_, idx) => idx !== i) });
  };

  const updateExpense = (i: number, field: "name" | "amount", value: string | number) => {
    const updated = [...settings.recurringExpenses];
    updated[i] = { ...updated[i], [field]: field === "amount" ? Number(value) : value };
    setSettings({ ...settings, recurringExpenses: updated });
  };

  const totalSalaries = settings.salaries.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = settings.recurringExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900">Setup</h1>
      <p className="text-slate-500 mt-1">Configure your financial settings</p>

      <div className="mt-8 space-y-8">
        {/* General */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">General</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Monthly Income</label>
              <input
                type="number"
                value={settings.expectedMonthlyIncome || ""}
                onChange={(e) => setSettings({ ...settings, expectedMonthlyIncome: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>
        </section>

        {/* Salaries */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Monthly Salaries</h2>
              <p className="text-sm text-slate-400">Total: {settings.currency} {totalSalaries.toLocaleString()}</p>
            </div>
            <button onClick={addSalary} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              + Add Salary
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {settings.salaries.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => updateSalary(i, "name", e.target.value)}
                  placeholder="Employee name"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={s.amount || ""}
                  onChange={(e) => updateSalary(i, "amount", e.target.value)}
                  placeholder="Amount"
                  className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => removeSalary(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {settings.salaries.length === 0 && <p className="text-sm text-slate-400">No salaries configured</p>}
          </div>
        </section>

        {/* Recurring Expenses */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recurring Expenses</h2>
              <p className="text-sm text-slate-400">Total: {settings.currency} {totalExpenses.toLocaleString()}</p>
            </div>
            <button onClick={addExpense} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              + Add Expense
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {settings.recurringExpenses.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  value={e.name}
                  onChange={(ev) => updateExpense(i, "name", ev.target.value)}
                  placeholder="Expense name"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={e.amount || ""}
                  onChange={(ev) => updateExpense(i, "amount", ev.target.value)}
                  placeholder="Amount"
                  className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => removeExpense(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {settings.recurringExpenses.length === 0 && <p className="text-sm text-slate-400">No recurring expenses configured</p>}
          </div>
        </section>

        {/* Summary & Save */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Fixed Monthly Costs</p>
              <p className="text-2xl font-bold text-slate-900">{settings.currency} {(totalSalaries + totalExpenses).toLocaleString()}</p>
            </div>
            <button
              onClick={save}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              {saved ? "Saved!" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
