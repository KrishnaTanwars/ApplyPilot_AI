'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Loader2,
  ExternalLink,
  Search,
  Star,
  Compass
} from 'lucide-react';

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        if (data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(
    j =>
      j.company.toLowerCase().includes(query.toLowerCase()) ||
      j.role.toLowerCase().includes(query.toLowerCase()) ||
      j.location.toLowerCase().includes(query.toLowerCase())
  );

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
            Jobs Registry
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Registry of parsed jobs from alerts or urls.</p>
        </div>
        <Link href="/jobs/new" className="glow-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
          Analyze New Job
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-650" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter by company, role or location..."
          className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Grid of jobs */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/10 border border-zinc-900 rounded-3xl text-zinc-500 flex flex-col items-center gap-2">
          <Briefcase className="h-10 w-10 text-zinc-650" />
          <span className="text-xs font-semibold">No parsed jobs matched your query.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <div key={job._id} className="glass-panel p-5 rounded-3xl border border-zinc-800 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 uppercase">
                    {job.atsType}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-zinc-200">{job.role}</h3>
                <p className="text-xs text-zinc-400">{job.company} — {job.location}</p>
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {job.requiredSkills?.slice(0, 4).map((s: string) => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 text-[9px] font-bold border border-zinc-850">
                      {s}
                    </span>
                  ))}
                  {job.requiredSkills?.length > 4 && (
                    <span className="text-[9px] text-zinc-650 font-bold mt-0.5">
                      +{job.requiredSkills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-900/60 text-xs">
                <span className={`text-[10px] font-bold capitalize ${
                  job.status === 'analyzed' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  • Status: {job.status}
                </span>
                <a
                  href={job.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  Apply Link <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
