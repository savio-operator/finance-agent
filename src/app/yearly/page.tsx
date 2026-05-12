"use client";

import { useEffect, useState } from "react";
import { FinanceEntry, Settings } from "@/lib/types";
import { getSettings, getAllEntries, getTotalFixedCosts } from "@/lib/storage";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function YearlyPage() {
  const [allEntries, setAllEntries] = useState<Record<string, FinanceEntry[]>>({});
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setAllEntries(getAllEntries());
    setSettings(getSettings());
    setLoading(false);
  }, []);

  if (loading || !settings) {
    return <div className="flex items-center justify-center h-64"><div className="text-slate-400">Loading...</div></div>;
  }

  const currency = settings.currency;
  const fixedCosts = getTotalFixedCosts(settings);

  const monthData = MONTHS.map((month) => {
    const key = `${month} ${year}`;
    const entries = allEntries[key] || [];
    const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    const net = income - expenses - fixedCosts;
    return { month, key, income, expenses, fixedCosts, net, hasData: entries.length > 0 };
  });

  let running = 0;
  const withBalance = monthData.map((m) => {
    running += m.net;
    return { ...m, balance: running };
  });

  const monthsWithData = monthData.filter((m) => m.hasData);
  const avgIncome = monthsWithData.length > 0 ? monthsWithData.reduce((s, m) => s + m.income, 0) / monthsWithData.length : 0;
  const avgExpenses = monthsWithData.length > 0 ? monthsWithData.reduce((s, m) => s + m.expenses, 0) / monthsWithData.length : 0;
  const avgNet = avgIncome - avgExpenses - fixedCosts;
  const monthsRemaining = 12 - monthsWithData.length;
  const projectedYearEnd = running + avgNet * monthsRemaining;

  const totalIncome = monthData.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthData.reduce((s, m) => s + m.expenses, 0);
  const totalNet = monthData.reduce((s, m) => s + m.net, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Year Overview</h1>
          <p className="text-slate-500 mt-1">Full year financial summary and projections</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(year - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">&larr;</button>
          <span className="text-lg font-bold text-slate-900 w-16 text-center">{year}</span>
          <button onClick={() => setYear(year + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">&rarr;</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Months Logged</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{monthsWithData.length} / 12</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Avg Monthly Net</p>
          <p className={`text-2xl font-bold mt-1 ${avgNet >= 0 ? "text-green-600" : "text-red-600"}`}>{currency} {avgNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Current Balance</p>
          <p className={`text-2xl font-bold mt-1 ${running >= 0 ? "text-green-600" : "text-red-600"}`}>{currency} {running.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <p className="text-xs text-blue-600">Projected Year-End</p>
          <p className={`text-2xl font-bold mt-1 ${projectedYearEnd >= 0 ? "text-green-600" : "text-red-600"}`}>{currency} {projectedYearEnd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-blue-400 mt-1">Based on {monthsWithData.length} month avg</p>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Month</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Income</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Var. Expenses</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Fixed Costs</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Net</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {withBalance.map((m) => (
              <tr key={m.month} className={`border-b border-slate-50 ${m.hasData ? "hover:bg-slate-50" : "opacity-50"}`}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{m.month}</td>
                <td className="px-4 py-3 text-sm text-right text-green-600">{m.hasData ? `${currency} ${m.income.toLocaleString()}` : "-"}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">{m.hasData ? `${currency} ${m.expenses.toLocaleString()}` : "-"}</td>
                <td className="px-4 py-3 text-sm text-right text-orange-600">{currency} {m.fixedCosts.toLocaleString()}</td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${m.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {m.hasData ? `${currency} ${m.net.toLocaleString()}` : "-"}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-bold ${m.balance >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {m.hasData ? `${currency} ${m.balance.toLocaleString()}` : "-"}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td className="px-4 py-3 text-sm text-slate-900">Total</td>
              <td className="px-4 py-3 text-sm text-right text-green-700">{currency} {totalIncome.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm text-right text-red-700">{currency} {totalExpenses.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm text-right text-orange-700">{currency} {(fixedCosts * 12).toLocaleString()}</td>
              <td className={`px-4 py-3 text-sm text-right ${totalNet >= 0 ? "text-green-700" : "text-red-700"}`}>{currency} {totalNet.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm text-right">{currency} {running.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
