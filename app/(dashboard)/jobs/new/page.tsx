'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface ProgressStep {
  label: string;
  keyword: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

const initialSteps: ProgressStep[] = [
  { label: 'Parsing alert message', keyword: 'parser started', status: 'pending' },
  { label: 'Extracting application URLs', keyword: 'parsed by Gemini', status: 'pending' },
  { label: 'Validating safety and redirects', keyword: 'Following redirects', status: 'pending' },
  { label: 'Reading official job page', keyword: 'Crawling official', status: 'pending' },
  { label: 'Extracting job requirements', keyword: 'Job details extracted', status: 'pending' },
  { label: 'Checking profile eligibility', keyword: 'Evaluating candidate', status: 'pending' },
  { label: 'Calculating resume match score', keyword: 'Calculating match', status: 'pending' },
  { label: 'Selecting specialized resume file', keyword: 'Application record created', status: 'pending' }
];

export default function NewJobPage() {
  const router = useRouter();
  const [rawMessage, setRawMessage] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Progress tracking steps state
  const [steps, setSteps] = useState<ProgressStep[]>(initialSteps);

  // Poll logs when analysis starts
  useEffect(() => {
    if (!jobId) return;

    let pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/activity`);
        const data = await res.json();
        const logs = data.logs || [];
        
        // Filter logs matching this jobId
        const jobLogs = logs.filter((l: any) => l.jobId?._id === jobId || l.jobId === jobId);

        // Update progress state based on logs keywords
        setSteps(prevSteps => {
          let updated = [...prevSteps];
          let lastCompletedIdx = -1;

          updated.forEach((step, idx) => {
            const hasKeyword = jobLogs.some((l: any) => l.message.includes(step.keyword));
            if (hasKeyword) {
              step.status = 'completed';
              lastCompletedIdx = idx;
            }
          });

          // Check failures
          const failureLog = jobLogs.find((l: any) => l.level === 'error' || l.message.includes('failed'));
          if (failureLog) {
            setErrorMsg(failureLog.message);
            clearInterval(pollInterval);
            // Set current pending/active steps to failed
            updated = updated.map(s => s.status === 'completed' ? s : { ...s, status: 'failed' });
            return updated;
          }

          // Mark current active step
          const nextActiveIdx = lastCompletedIdx + 1;
          if (nextActiveIdx < updated.length && updated[nextActiveIdx].status !== 'failed') {
            updated[nextActiveIdx].status = 'active';
          }

          // If last step is completed, transition page!
          if (updated[updated.length - 1].status === 'completed') {
            clearInterval(pollInterval);
            
            // Find application created and redirect to it!
            setTimeout(async () => {
              try {
                const appsRes = await fetch('/api/applications');
                const appsData = await appsRes.json();
                const matchedApp = appsData.applications?.find((a: any) => a.jobId?._id === jobId || a.jobId === jobId);
                if (matchedApp) {
                  router.push(`/applications/${matchedApp._id}`);
                } else {
                  router.push('/dashboard');
                }
              } catch {
                router.push('/dashboard');
              }
            }, 1500);
          }

          return updated;
        });

      } catch (err) {
        console.error('Progress polling failure:', err);
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [jobId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawMessage && !directUrl) {
      setErrorMsg('Please paste either a WhatsApp job post or a direct application link.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSteps(initialSteps.map(s => ({ ...s, status: 'pending' })));

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawMessage, directUrl })
      });
      const data = await res.json();
      if (data.success) {
        setJobId(data.jobId);
        // Start showing the first active parsing step
        setSteps(prev => {
          const u = [...prev];
          u[0].status = 'active';
          return u;
        });
      } else {
        setErrorMsg(data.error || 'Job submission failed');
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMsg('Network error initiating analysis.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
          Analyze New Job Alert
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Paste your copied job alert text or input direct URL to start automated analysis.</p>
      </div>

      {!submitting ? (
        <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-xl">
          {/* Main textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">WhatsApp Message Text</label>
            <textarea
              value={rawMessage}
              onChange={e => setRawMessage(e.target.value)}
              placeholder="Paste complete WhatsApp job message here... e.g. 'Accenture is hiring freshers for Associate Software Engineer... Apply here: https://example.com/jobs/123'"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 h-44 resize-none subtle-scroll"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-zinc-600 uppercase">
            <div className="h-[1px] bg-zinc-800 flex-1" />
            <span>Or</span>
            <div className="h-[1px] bg-zinc-800 flex-1" />
          </div>

          {/* Direct URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Direct Application URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-3.5 h-4 w-4 text-zinc-650" />
              <input
                type="text"
                value={directUrl}
                onChange={e => setDirectUrl(e.target.value)}
                placeholder="https://company.greenhouse.io/careers/job-123"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 border border-red-500/20 bg-red-500/5 p-4 rounded-2xl">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button type="submit" className="glow-btn w-full py-3.5 rounded-2xl font-extrabold text-white text-sm flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> Start Application Analysis
            </button>
          </div>
        </form>
      ) : (
        /* Progress Indicator view */
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
            <h2 className="text-base font-extrabold text-zinc-200">Processing Job Alert...</h2>
          </div>
          
          <div className="space-y-4">
            {steps.map((step, index) => {
              return (
                <div key={index} className="flex items-center justify-between p-3.5 bg-zinc-900/30 border border-zinc-900 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-600">0{index + 1}</span>
                    <span className={`text-xs ${
                      step.status === 'active' ? 'text-zinc-200 font-bold' : step.status === 'completed' ? 'text-zinc-400' : step.status === 'failed' ? 'text-red-400' : 'text-zinc-600'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  <div>
                    {step.status === 'completed' && <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />}
                    {step.status === 'active' && <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />}
                    {step.status === 'pending' && <Clock className="h-4 w-4 text-zinc-700" />}
                    {step.status === 'failed' && <AlertCircle className="h-4.5 w-4.5 text-red-500" />}
                  </div>
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-red-400 border border-red-500/20 bg-red-500/5 p-4 rounded-2xl mt-4">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Analysis Failed</span>
                <p className="text-zinc-400">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
