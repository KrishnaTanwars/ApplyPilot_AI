'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  Loader2,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    async function loadApps() {
      try {
        const res = await fetch('/api/applications');
        const data = await res.json();
        if (data.applications) {
          setApps(data.applications);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  const filteredApps = apps.filter(app => {
    const company = app.jobId?.company || '';
    const role = app.jobId?.role || '';
    const matchesQuery =
      company.toLowerCase().includes(query.toLowerCase()) ||
      role.toLowerCase().includes(query.toLowerCase());
      
    if (statusFilter === 'All') return matchesQuery;
    return matchesQuery && app.status === statusFilter;
  });

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            Application History
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Audit status tracker of automated job submissions.</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-650" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by company or role..."
            className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-300 placeholder:text-zinc-650 focus:outline-none"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none w-full sm:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="Ready">Ready</option>
          <option value="In Progress">In Progress</option>
          <option value="Waiting for User">Waiting for User</option>
          <option value="Review Required">Review Required</option>
          <option value="Submitted">Submitted</option>
          <option value="Failed">Failed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="glass-panel border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredApps.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 flex flex-col items-center gap-2">
            <FileCheck className="h-10 w-10 text-zinc-650" />
            <span className="text-xs font-semibold">No applications fit the filter criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto subtle-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-400 font-bold bg-zinc-900/30">
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Match Score</th>
                  <th className="px-6 py-4">Eligibility</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredApps.map(app => {
                  const company = app.jobId?.company || 'Unknown';
                  const role = app.jobId?.role || 'Unknown';
                  const date = new Date(app.createdAt).toLocaleDateString();

                  const statusStyles: Record<string, string> = {
                    Submitted: 'bg-green-500/15 text-green-400 border border-green-500/25',
                    'Waiting for User': 'bg-orange-500/15 text-orange-400 border border-orange-500/25 animate-pulse',
                    'Review Required': 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
                    'In Progress': 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
                    Failed: 'bg-red-500/15 text-red-400 border border-red-500/25',
                    Ready: 'bg-zinc-850 text-zinc-300'
                  };

                  return (
                    <tr key={app._id} className="hover:bg-zinc-900/20 transition duration-150">
                      <td className="px-6 py-4 font-bold text-zinc-200">{company}</td>
                      <td className="px-6 py-4 text-zinc-300">{role}</td>
                      <td className="px-6 py-4 font-semibold text-indigo-400">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-indigo-500 text-indigo-500" />
                          {app.matchScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 text-zinc-400`}>
                          {app.eligibility}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusStyles[app.status] || 'bg-zinc-800'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{date}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/applications/${app._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                        >
                          View Details <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
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
