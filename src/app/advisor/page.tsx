"use client";

import { useState, useRef, useEffect } from "react";
import { getAllEntries, getSettings, getAllMonthlyFixedCosts } from "@/lib/storage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [includeNotion, setIncludeNotion] = useState(false);
  const [notionConfigured, setNotionConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notion")
      .then((r) => r.json())
      .then((data) => setNotionConfigured(data.configured))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          includeNotion,
          entries: getAllEntries(),
          settings: getSettings(),
          allMonthlyFixedCosts: getAllMonthlyFixedCosts(),
        }),
      });
      const data = await res.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.message }]);
    } catch {
      setMessages([...updatedMessages, { role: "assistant", content: "Error: Failed to get a response. Check your API key." }]);
    }

    setLoading(false);
  };

  const writeReport = async () => {
    if (messages.length === 0) return;
    setLoading(true);

    const reportMessages: Message[] = [
      ...messages,
      { role: "user", content: "Please generate a concise monthly financial report summary suitable for writing to Notion. Include key metrics, highlights, concerns, and recommendations." },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: reportMessages,
          includeNotion,
          entries: getAllEntries(),
          settings: getSettings(),
          allMonthlyFixedCosts: getAllMonthlyFixedCosts(),
        }),
      });
      const data = await res.json();

      const now = new Date();
      const title = `Financial Report - ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
      const notionRes = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: data.message }),
      });
      const notionData = await notionRes.json();

      if (notionData.success) {
        setMessages([...messages, { role: "assistant", content: `Monthly report has been written to Notion!\n\n${data.message}` }]);
      } else {
        setMessages([...messages, { role: "assistant", content: `Could not write to Notion: ${notionData.error || "Unknown error"}.\n\nHere's the report:\n\n${data.message}` }]);
      }
    } catch {
      setMessages([...messages, { role: "assistant", content: "Failed to generate report." }]);
    }

    setLoading(false);
  };

  const quickQuestions = [
    "Can we afford to pay all salaries this month?",
    "Project our year-end financial position",
    "Which months look risky based on current data?",
    "Where can we cut costs?",
    "What if our income drops by 30%?",
    "Give me a monthly financial summary",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Advisor</h1>
          <p className="text-slate-500 mt-1">Financial insights powered by AI</p>
        </div>
        <div className="flex items-center gap-3">
          {notionConfigured && (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={includeNotion}
                  onChange={(e) => setIncludeNotion(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Include Notion data
              </label>
              <button
                onClick={writeReport}
                disabled={loading || messages.length === 0}
                className="px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 border border-purple-200 rounded-lg disabled:opacity-50"
              >
                Write Report to Notion
              </button>
            </>
          )}
          <button
            onClick={() => setMessages([])}
            className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mt-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Ask me anything about your finances</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              I have access to all your financial data, settings, and can read your Notion financial plan.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 max-w-lg justify-center">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-900"
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about your finances..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
