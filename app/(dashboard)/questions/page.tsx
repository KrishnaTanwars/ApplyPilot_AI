'use client';

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Loader2,
  Trash,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  Eye
} from 'lucide-react';

export default function QuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<any[]>([]);

  const fetchAnswers = async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      if (data.answers) {
        setAnswers(data.answers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, []);

  const handleToggleAutoFill = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, autoFillAllowed: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        await fetchAnswers();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this answer from memory?')) return;
    try {
      const res = await fetch('/api/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteId: id })
      });
      const data = await res.json();
      if (data.success) {
        await fetchAnswers();
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
          Answer Memory
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Reusable responses saved for complex or sensitive screening questions.</p>
      </div>

      <div className="glass-panel border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-zinc-800">
          <h2 className="text-base font-extrabold text-zinc-200">Saved Question Memory</h2>
        </div>

        {answers.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
            <BrainCircuit className="h-10 w-10 text-zinc-650" />
            <p className="text-xs">No saved answers yet. Paused questionnaire answers will accumulate here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto subtle-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-400 font-bold bg-zinc-900/30">
                  <th className="px-6 py-4">Original Question</th>
                  <th className="px-6 py-4">Saved Answer</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Usage</th>
                  <th className="px-6 py-4">Auto-Fill</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {answers.map(ans => {
                  return (
                    <tr key={ans._id} className="hover:bg-zinc-900/20 transition duration-150">
                      <td className="px-6 py-4 font-bold text-zinc-200 max-w-xs truncate">{ans.originalQuestion}</td>
                      <td className="px-6 py-4 text-zinc-300 font-medium max-w-xs truncate">{ans.answer}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 font-semibold uppercase text-[9px]">
                          {ans.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-indigo-400">{ans.usageCount} times</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleAutoFill(ans._id, ans.autoFillAllowed)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition border ${
                            ans.autoFillAllowed
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-850'
                          }`}
                        >
                          {ans.autoFillAllowed ? 'Allowed' : 'Manual Only'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(ans._id)}
                          className="px-2 py-1.5 rounded-lg border border-zinc-900 text-zinc-600 hover:text-red-400 hover:border-zinc-800 transition"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
