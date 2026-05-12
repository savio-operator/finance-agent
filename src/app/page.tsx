"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, FinanceEntry } from "@/lib/types";

export default function Dashboard() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [allEntries, setAllEntries] = useState<Record<string, FinanceEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/entries").then((r) => r.json()),
    ]).then(([s, e]) => {
      setSettings(s);
      setAllEntries(e.allEntries || {});
      setLoading(false);
    });
  }, []);

  if (loading || !settings) {
    return <div className="flex items-center justify-center h-64"><div className="text-slate-400">Loading...</div></div>;
  }

  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const currentEntries = allEntries[currentMonth] || [];
  const totalIncome = currentEntries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpenses = currentEntries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const fixedCosts = settings.salaries.reduce((s, e) => s + e.amount, 0) + settings.recurringExpenses.reduce((s, e) => s + e.amount, 0);
  const netPL = totalIncome - totalExpenses - fixedCosts;

  const monthCount = Object.keys(allEntries).length;
  const totalYearIncome = Object.values(allEntries).flat().filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalYearExpenses = Object.values(allEntries).flat().filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  const isSetup = settings.expectedMonthlyIncome > 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mt-1">Welcome to Adchemy Finance Manager</p>

      {!isSetup && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 font-medium">Setup required</p>
          <p className="text-amber-600 text-sm mt-1">
            Configure your expected income, salaries, and recurring expenses to get started.
          </p>
          <Link href="/setup" className="inline-block mt-3 text-sm font-medium text-amber-700 hover:text-amber-900 underline">
            Go to Setup &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="Current Month" value={currentMonth} sub={`${currentEntries.length} entries`} />
        <StatCard
          label="Income (This Month)"
          value={`${settings.currency} ${totalIncome.toLocaleString()}`}
          sub={`Expected: ${settings.currency} ${settings.expectedMonthlyIncome.toLocaleString()}`}
          color={totalIncome >= settings.expectedMonthlyIncome ? "green" : "amber"}
        />
        <StatCard
          label="Expenses (This Month)"
          value={`${settings.currency} ${(totalExpenses + fixedCosts).toLocaleString()}`}
          sub={`Fixed: ${settings.currency} ${fixedCosts.toLocaleString()}`}
        />
        <StatCard
          label="Net P&L"
          value={`${settings.currency} ${netPL.toLocaleString()}`}
          sub="After all costs"
          color={netPL >= 0 ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <QuickLink href="/monthly" label="Add Income/Expense" desc="Log a new financial entry" />
            <QuickLink href="/parse" label="Paste & Parse" desc="Extract entries from text using AI" />
            <QuickLink href="/advisor" label="Ask AI Advisor" desc="Get financial insights and projections" />
            <QuickLink href="/yearly" label="Year Overview" desc="See full year financial summary" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Year Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Months logged</span><span className="font-medium">{monthCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Income</span><span className="font-medium text-green-600">{settings.currency} {totalYearIncome.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Expenses</span><span className="font-medium text-red-600">{settings.currency} {totalYearExpenses.toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-3"><span className="text-slate-500">Net</span><span className={`font-bold ${totalYearIncome - totalYearExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>{settings.currency} {(totalYearIncome - totalYearExpenses).toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  const colorClass = color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : color === "amber" ? "text-amber-600" : "text-slate-900";
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
      <div>
        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
