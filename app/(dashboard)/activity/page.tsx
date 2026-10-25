'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Loader2,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function ActivityPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch('/api/activity');
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

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
          Activity Logs
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Audit timeline of browser worker actions and AI match operations.</p>
      </div>

      <div className="glass-panel border border-zinc-800 rounded-3xl overflow-hidden shadow-xl p-6">
        <div className="space-y-4 max-h-[600px] overflow-y-auto subtle-scroll p-1">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-1.5">
              <Activity className="h-8 w-8 text-zinc-650" />
              <span className="text-xs">No audit logs found.</span>
            </div>
          ) : (
            logs.map(log => {
              const date = new Date(log.timestamp).toLocaleTimeString();
              const level = log.level || 'info';
              
              // Color styles
              const colorClasses = ({
                info: 'text-indigo-400 border-indigo-500/10 bg-indigo-500/5',
                warn: 'text-orange-400 border-orange-500/10 bg-orange-500/5',
                error: 'text-red-400 border-red-500/10 bg-red-500/5',
                debug: 'text-zinc-400 border-zinc-900 bg-zinc-900/40',
                trace: 'text-zinc-500 border-zinc-900 bg-zinc-900/20'
              } as Record<string, string>)[level] || 'text-zinc-400';

              return (
                <div key={log._id} className={`flex items-start gap-4 p-4 border rounded-2xl ${colorClasses} text-xs`}>
                  <Clock className="h-4.5 w-4.5 shrink-0 mt-0.5 text-zinc-500" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300">
                        {log.jobId?.company ? `${log.jobId.company} — ${log.jobId.role}` : 'System Engine'}
                      </span>
                      <span className="text-[10px] text-zinc-500">{date}</span>
                    </div>
                    <p className="leading-relaxed font-mono">{log.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
