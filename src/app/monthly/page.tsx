"use client";

import { useEffect, useState, useCallback } from "react";
import { FinanceEntry, Settings } from "@/lib/types";
import { getSettings, getEntriesForMonth, addEntriesToMonth, getTotalFixedCosts } from "@/lib/storage";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getCurrentMonthLabel(): string {
  const now = new Date();
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export default function MonthlyPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthLabel());
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState<FinanceEntry>({
    date: new Date().toISOString().split("T")[0],
    type: "income",
    description: "",
    category: "",
    amount: 0,
    client: "",
  });

  const loadData = useCallback((month: string) => {
    setLoading(true);
    setEntries(getEntriesForMonth(month));
    setSettings(getSettings());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth, loadData]);

  const handleAdd = () => {
    if (!newEntry.description || !newEntry.amount) return;
    addEntriesToMonth(selectedMonth, [newEntry]);
    setNewEntry({ date: new Date().toISOString().split("T")[0], type: "income", description: "", category: "", amount: 0, client: "" });
    setShowForm(false);
    loadData(selectedMonth);
  };

  const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const fixedCosts = settings ? getTotalFixedCosts(settings) : 0;
  const net = income - expenses - fixedCosts;
  const currency = settings?.currency || "INR";

  const year = new Date().getFullYear();
  const monthOptions = MONTHS.map((m) => `${m} ${year}`);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Monthly View</h1>
          <p className="text-slate-500 mt-1">Track income and expenses by month</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          + Add Entry
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 mt-6 flex-wrap">
        {monthOptions.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedMonth === m ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            {m.split(" ")[0].slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="mt-6 bg-white rounded-xl border border-blue-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">New Entry for {selectedMonth}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
              <select value={newEntry.type} onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as "income" | "expense" })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
              <input type="number" value={newEntry.amount || ""} onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                placeholder="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <input type="text" value={newEntry.description} onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="What is this for?" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <input type="text" value={newEntry.category} onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                placeholder="e.g. Client Payment" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
              <input type="text" value={newEntry.client} onChange={(e) => setNewEntry({ ...newEntry, client: e.target.value })}
                placeholder="Optional" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700">Save Entry</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Income</p>
          <p className="text-xl font-bold text-green-600 mt-1">{currency} {income.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Variable Expenses</p>
          <p className="text-xl font-bold text-red-600 mt-1">{currency} {expenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Fixed Costs</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{currency} {fixedCosts.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Net P&L</p>
          <p className={`text-xl font-bold mt-1 ${net >= 0 ? "text-green-600" : "text-red-600"}`}>{currency} {net.toLocaleString()}</p>
        </div>
      </div>

      {/* Entries Table */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Category</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Client</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No entries for {selectedMonth}</td></tr>
            ) : (
              entries.map((e, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{e.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">{e.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{e.category}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    <span className={e.type === "income" ? "text-green-600" : "text-red-600"}>
                      {e.type === "income" ? "+" : "-"}{currency} {e.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{e.client}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
