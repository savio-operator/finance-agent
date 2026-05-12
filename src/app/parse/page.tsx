"use client";

import { useState } from "react";
import { FinanceEntry } from "@/lib/types";
import { addEntriesToMonth } from "@/lib/storage";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getCurrentMonthLabel(): string {
  const now = new Date();
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export default function ParsePage() {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [targetMonth, setTargetMonth] = useState(getCurrentMonthLabel());
  const [error, setError] = useState("");

  const year = new Date().getFullYear();
  const monthOptions = MONTHS.map((m) => `${m} ${year}`);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    setError("");
    setEntries([]);
    setSaved(false);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (data.entries && data.entries.length > 0) {
        setEntries(data.entries);
      } else {
        setError("No financial entries could be extracted from the text. Try pasting something with dates, amounts, and descriptions.");
      }
    } catch {
      setError("Failed to parse text. Check your Anthropic API key.");
    }

    setParsing(false);
  };

  const handleSave = () => {
    if (entries.length === 0) return;
    addEntriesToMonth(targetMonth, entries);
    setSaved(true);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof FinanceEntry, value: string | number) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900">Paste & Parse</h1>
      <p className="text-slate-500 mt-1">Paste bank messages, invoices, or notes — AI extracts structured entries</p>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Paste your text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Paste bank SMS, transaction emails, invoice notes, or any text containing financial data...

Example:
Received $5,000 from Acme Corp on May 1st for web design project
Paid $200 for Adobe Creative Suite subscription on May 3rd
Transfer of $1,500 to John for freelance work on May 5th"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleParse}
            disabled={parsing || !text.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {parsing ? "Parsing with AI..." : "Parse Text"}
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Save to:</label>
            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {entries.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Extracted Entries ({entries.length})</h2>
            <div className="flex gap-3">
              {saved && <span className="text-green-600 text-sm font-medium">Saved to {targetMonth}!</span>}
              <button
                onClick={handleSave}
                disabled={saved}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saved ? "Saved!" : `Save All to ${targetMonth}`}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    <div>
                      <label className="text-xs text-slate-400">Date</label>
                      <input type="date" value={entry.date} onChange={(e) => updateEntry(i, "date", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-0.5" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Type</label>
                      <select value={entry.type} onChange={(e) => updateEntry(i, "type", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-0.5">
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Amount</label>
                      <input type="number" value={entry.amount} onChange={(e) => updateEntry(i, "amount", Number(e.target.value))}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-0.5" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400">Description</label>
                      <input type="text" value={entry.description} onChange={(e) => updateEntry(i, "description", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-0.5" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Category</label>
                      <input type="text" value={entry.category} onChange={(e) => updateEntry(i, "category", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-0.5" />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs text-slate-400">Client</label>
                      <input type="text" value={entry.client} onChange={(e) => updateEntry(i, "client", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mt-0.5" />
                    </div>
                  </div>
                  <button onClick={() => removeEntry(i)} className="ml-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
