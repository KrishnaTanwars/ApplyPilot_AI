'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CheckCircle,
  Play,
  AlertCircle,
  FileX,
  Star,
  ExternalLink,
  ChevronRight,
  Loader2,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/applications')
        ]);
        const jobsData = await jobsRes.json();
        const appsData = await appsRes.json();
        
        setJobs(jobsData.jobs || []);
        setApps(appsData.applications || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Calculate Metrics
  const totalJobs = jobs.length;
  const eligibleApps = apps.filter(a => ['ELIGIBLE', 'LIKELY_ELIGIBLE'].includes(a.eligibility)).length;
  const startedApps = apps.filter(a => ['In Progress', 'Ready', 'Review Required', 'Submitted'].includes(a.status)).length;
  const submittedApps = apps.filter(a => a.status === 'Submitted').length;
  const pendingHumanApps = apps.filter(a => a.status === 'Waiting for User').length;
  const failedApps = apps.filter(a => a.status === 'Failed').length;

  const validScores = apps.map(a => a.matchScore).filter(s => s > 0);
  const avgMatchScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            Overview
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Real-time status of ApplyPilot AI application assistant.</p>
        </div>
        <Link href="/jobs/new" className="glow-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
          <Briefcase className="h-4 w-4" /> Analyze New Job
        </Link>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Total Jobs */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Jobs Analyzed</p>
              <h3 className="text-3xl font-bold mt-2 text-zinc-100">{totalJobs}</h3>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-indigo-400">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Eligible Jobs */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Eligible Jobs</p>
              <h3 className="text-3xl font-bold mt-2 text-zinc-100">{eligibleApps}</h3>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-green-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Pending Human Action */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending Action</p>
              <h3 className="text-3xl font-bold mt-2 text-orange-400">{pendingHumanApps}</h3>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-orange-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Avg Match Score */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avg Match Score</p>
              <h3 className="text-3xl font-bold mt-2 text-indigo-400">{avgMatchScore}%</h3>
            </div>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-indigo-400">
              <Star className="h-5 w-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Second Line of Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400">Applications Started</span>
          <span className="text-lg font-bold text-zinc-200">{startedApps}</span>
        </div>
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400">Applications Submitted</span>
          <span className="text-lg font-bold text-green-400">{submittedApps}</span>
        </div>
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400">Failed Applications</span>
          <span className="text-lg font-bold text-red-400">{failedApps}</span>
        </div>
      </div>

      {/* Applications Table */}
      <div className="glass-panel border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold text-zinc-100">Recent Applications</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Status history of parsed positions.</p>
          </div>
        </div>
        
        {apps.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
            <FileX className="h-10 w-10 text-zinc-650" />
            <p className="text-xs font-semibold">No applications found. Paste a WhatsApp alert to get started!</p>
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
                {apps.slice(0, 10).map((app) => {
                  const company = app.jobId?.company || 'Unknown';
                  const role = app.jobId?.role || 'Unknown';
                  const date = new Date(app.createdAt).toLocaleDateString();
                  
                  // Style configurations
                  const eligibilityStyles: Record<string, string> = {
                    ELIGIBLE: 'bg-green-500/10 text-green-400',
                    LIKELY_ELIGIBLE: 'bg-indigo-500/10 text-indigo-400',
                    UNCERTAIN: 'bg-yellow-500/10 text-yellow-400',
                    NOT_ELIGIBLE: 'bg-red-500/10 text-red-400'
                  };

                  const statusStyles: Record<string, string> = {
                    Submitted: 'bg-green-500/15 text-green-400 border border-green-500/25',
                    'Waiting for User': 'bg-orange-500/15 text-orange-400 border border-orange-500/25 animate-pulse',
                    'Review Required': 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
                    'In Progress': 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
                    Failed: 'bg-red-500/15 text-red-400 border border-red-500/25',
                    Ready: 'bg-zinc-800 text-zinc-300'
                  };

                  return (
                    <tr key={app._id} className="hover:bg-zinc-900/20 transition duration-150">
                      <td className="px-6 py-4.5 font-bold text-zinc-200">{company}</td>
                      <td className="px-6 py-4.5 text-zinc-300">{role}</td>
                      <td className="px-6 py-4.5 font-semibold text-zinc-300">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-indigo-500 text-indigo-500" />
                          {app.matchScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${eligibilityStyles[app.eligibility] || 'bg-zinc-800'}`}>
                          {app.eligibility}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusStyles[app.status] || 'bg-zinc-800'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-zinc-500">{date}</td>
                      <td className="px-6 py-4.5 text-right">
                        <Link
                          href={`/applications/${app._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                        >
                          Details <ChevronRight className="h-3.5 w-3.5" />
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
