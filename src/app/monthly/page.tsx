"use client";

import { useEffect, useState, useCallback } from "react";
import { FinanceEntry, Settings, MonthlyFixedCosts } from "@/lib/types";
import { getSettings, getEntriesForMonth, addEntriesToMonth, updateEntryInMonth, deleteEntryFromMonth, getFixedCostsForMonth, saveFixedCostsForMonth } from "@/lib/storage";

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

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<FinanceEntry>({ date: "", type: "income", description: "", category: "", amount: 0, client: "" });
  const [showFixedCosts, setShowFixedCosts] = useState(false);
  const [monthFixedCosts, setMonthFixedCosts] = useState<MonthlyFixedCosts>({ salaries: [], recurringExpenses: [] });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditEntry({ ...entries[index] });
  };

  const handleEditSave = () => {
    if (editingIndex === null || !editEntry.description || !editEntry.amount) return;
    updateEntryInMonth(selectedMonth, editingIndex, editEntry);
    setEditingIndex(null);
    loadData(selectedMonth);
  };

  const handleDelete = () => {
    if (editingIndex === null) return;
    if (!confirm("Are you sure you want to delete this entry?")) return;
    deleteEntryFromMonth(selectedMonth, editingIndex);
    setEditingIndex(null);
    loadData(selectedMonth);
  };

  const loadData = useCallback((month: string) => {
    setLoading(true);
    const s = getSettings();
    setEntries(getEntriesForMonth(month));
    setSettings(s);
    setMonthFixedCosts(getFixedCostsForMonth(month, s));
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
  const fixedCosts = monthFixedCosts.salaries.reduce((s, x) => s + x.amount, 0) + monthFixedCosts.recurringExpenses.reduce((s, x) => s + x.amount, 0);
  const net = income - expenses - fixedCosts;
  const currency = settings?.currency || "INR";

  const [downloading, setDownloading] = useState(false);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          entries,
          settings: settings || { expectedMonthlyIncome: 0, salaries: [], recurringExpenses: [], currency: "INR" },
          monthlyFixedCosts: monthFixedCosts,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Adchemy_Report_${selectedMonth.replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate report");
    }
    setDownloading(false);
  };

  const year = new Date().getFullYear();
  const monthOptions = MONTHS.map((m) => `${m} ${year}`);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Monthly View</h1>
          <p className="text-slate-500 mt-1">Track income and expenses by month</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadReport}
            disabled={downloading || entries.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloading ? "Generating..." : "Download Report"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            + Add Entry
          </button>
        </div>
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
        <button onClick={() => setShowFixedCosts(!showFixedCosts)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-orange-300 transition-colors">
          <p className="text-xs text-slate-500">Fixed Costs <span className="text-orange-400">(click to edit)</span></p>
          <p className="text-xl font-bold text-orange-600 mt-1">{currency} {fixedCosts.toLocaleString()}</p>
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Net P&L</p>
          <p className={`text-xl font-bold mt-1 ${net >= 0 ? "text-green-600" : "text-red-600"}`}>{currency} {net.toLocaleString()}</p>
        </div>
      </div>

      {/* Per-Month Fixed Costs Editor */}
      {showFixedCosts && (
        <div className="mt-4 bg-white rounded-xl border border-orange-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Fixed Costs for {selectedMonth}</h3>
              <p className="text-xs text-slate-400 mt-0.5">These values are specific to this month. Changes here won&apos;t affect other months.</p>
            </div>
            <button onClick={() => {
              if (settings) {
                setMonthFixedCosts({ salaries: settings.salaries.map(s => ({ ...s })), recurringExpenses: settings.recurringExpenses.map(e => ({ ...e })) });
              }
            }} className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg">
              Reset to Default
            </button>
          </div>

          {/* Salaries */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-600 uppercase">Salaries</p>
              <button onClick={() => setMonthFixedCosts({ ...monthFixedCosts, salaries: [...monthFixedCosts.salaries, { name: "", amount: 0 }] })}
                className="text-xs text-blue-600 hover:text-blue-800">+ Add</button>
            </div>
            {monthFixedCosts.salaries.map((s, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="text" value={s.name} onChange={(e) => {
                  const updated = [...monthFixedCosts.salaries];
                  updated[i] = { ...updated[i], name: e.target.value };
                  setMonthFixedCosts({ ...monthFixedCosts, salaries: updated });
                }} placeholder="Name" className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" value={s.amount || ""} onChange={(e) => {
                  const updated = [...monthFixedCosts.salaries];
                  updated[i] = { ...updated[i], amount: Number(e.target.value) };
                  setMonthFixedCosts({ ...monthFixedCosts, salaries: updated });
                }} placeholder="Amount" className="w-28 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => setMonthFixedCosts({ ...monthFixedCosts, salaries: monthFixedCosts.salaries.filter((_, idx) => idx !== i) })}
                  className="p-1 text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            ))}
            {monthFixedCosts.salaries.length === 0 && <p className="text-xs text-slate-400">No salaries</p>}
          </div>

          {/* Recurring Expenses */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-600 uppercase">Recurring Expenses</p>
              <button onClick={() => setMonthFixedCosts({ ...monthFixedCosts, recurringExpenses: [...monthFixedCosts.recurringExpenses, { name: "", amount: 0 }] })}
                className="text-xs text-blue-600 hover:text-blue-800">+ Add</button>
            </div>
            {monthFixedCosts.recurringExpenses.map((e, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="text" value={e.name} onChange={(ev) => {
                  const updated = [...monthFixedCosts.recurringExpenses];
                  updated[i] = { ...updated[i], name: ev.target.value };
                  setMonthFixedCosts({ ...monthFixedCosts, recurringExpenses: updated });
                }} placeholder="Name" className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" value={e.amount || ""} onChange={(ev) => {
                  const updated = [...monthFixedCosts.recurringExpenses];
                  updated[i] = { ...updated[i], amount: Number(ev.target.value) };
                  setMonthFixedCosts({ ...monthFixedCosts, recurringExpenses: updated });
                }} placeholder="Amount" className="w-28 px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => setMonthFixedCosts({ ...monthFixedCosts, recurringExpenses: monthFixedCosts.recurringExpenses.filter((_, idx) => idx !== i) })}
                  className="p-1 text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            ))}
            {monthFixedCosts.recurringExpenses.length === 0 && <p className="text-xs text-slate-400">No recurring expenses</p>}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700">Total: {currency} {fixedCosts.toLocaleString()}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowFixedCosts(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={() => {
                saveFixedCostsForMonth(selectedMonth, monthFixedCosts);
                setShowFixedCosts(false);
              }} className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">Save for {selectedMonth.split(" ")[0]}</button>
            </div>
          </div>
        </div>
      )}

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
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No entries for {selectedMonth}</td></tr>
            ) : (
              entries.map((e, i) => (
                editingIndex === i ? (
                  <tr key={i} className="border-b border-slate-50 bg-blue-50">
                    <td className="px-4 py-2">
                      <input type="date" value={editEntry.date} onChange={(ev) => setEditEntry({ ...editEntry, date: ev.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <select value={editEntry.type} onChange={(ev) => setEditEntry({ ...editEntry, type: ev.target.value as "income" | "expense" })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={editEntry.description} onChange={(ev) => setEditEntry({ ...editEntry, description: ev.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={editEntry.category} onChange={(ev) => setEditEntry({ ...editEntry, category: ev.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={editEntry.amount || ""} onChange={(ev) => setEditEntry({ ...editEntry, amount: Number(ev.target.value) })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={editEntry.client} onChange={(ev) => setEditEntry({ ...editEntry, client: ev.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={handleEditSave} className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Save</button>
                        <button onClick={() => setEditingIndex(null)} className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs">Cancel</button>
                        <button onClick={handleDelete} className="px-2.5 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ) : (
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
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(i)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit entry">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
