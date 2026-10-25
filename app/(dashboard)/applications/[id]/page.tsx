'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Compass,
  Star,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText,
  Clock,
  Play,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Poll application state shifts during active automation runs
  useEffect(() => {
    if (!id) return;
    
    let isMounted = true;
    
    const loadApp = async () => {
      try {
        const res = await fetch(`/api/applications/${id}`);
        const data = await res.json();
        if (data.application && isMounted) {
          setApp(data.application);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadApp();

    const poll = setInterval(() => {
      // Poll only when application is in active state or waiting
      if (app && ['In Progress', 'Ready', 'Waiting for User', 'Review Required'].includes(app.status)) {
        loadApp();
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(poll);
    };
  }, [id, app?.status]);

  if (loading || !app) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const job = app.jobId;

  // Actions
  const handleStartApplication = async () => {
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      const data = await res.json();
      if (data.success) {
        setApp(data.application);
      }
    } catch (err) {
      alert('Failed to start');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResumeApplication = async () => {
    if (!userAnswer.trim()) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume',
          answer: userAnswer,
          saveForFuture,
          originalQuestion: app.humanActionRequired?.questionText,
          category: app.humanActionRequired?.category,
          intent: app.humanActionRequired?.normalizedIntent
        })
      });
      const data = await res.json();
      if (data.success) {
        setApp(data.application);
        setUserAnswer('');
      }
    } catch (err) {
      alert('Failed to submit answer');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproveSubmit = async () => {
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_submit' })
      });
      const data = await res.json();
      if (data.success) {
        setApp(data.application);
      }
    } catch (err) {
      alert('Submit approval failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCancelApplication = async () => {
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
      const data = await res.json();
      if (data.success) {
        setApp(data.application);
      }
    } catch (err) {
      alert('Cancel failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      
      {/* LEFT COL: Application Info & Matching breakdown */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Header Summary */}
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-100">{job.role}</h1>
              <span className="text-sm font-semibold text-zinc-400 mt-1 block">{job.company} — {job.location}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              app.status === 'Submitted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              app.status === 'Waiting for User' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse' :
              app.status === 'Review Required' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
              'bg-zinc-800 text-zinc-300'
            }`}>
              {app.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Match Score</span>
              <span className="text-xl font-bold text-indigo-400 block mt-1">{app.matchScore}%</span>
            </div>
            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Eligibility</span>
              <span className={`text-xs font-bold block mt-2 ${
                app.eligibility === 'ELIGIBLE' ? 'text-green-400' :
                app.eligibility === 'LIKELY_ELIGIBLE' ? 'text-indigo-400' :
                app.eligibility === 'UNCERTAIN' ? 'text-yellow-400' : 'text-red-400'
              }`}>{app.eligibility}</span>
            </div>
            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">ATS Format</span>
              <span className="text-xs font-bold text-zinc-300 block mt-2 uppercase">{app.atsType}</span>
            </div>
            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Work Mode</span>
              <span className="text-xs font-bold text-zinc-300 block mt-2 capitalize">{job.workMode}</span>
            </div>
          </div>

          {/* Links */}
          <div className="pt-2 border-t border-zinc-900 flex flex-wrap gap-4 text-xs">
            <a href={job.originalUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Original Link <ChevronRight className="h-3 w-3" />
            </a>
            {job.finalUrl && (
              <a href={job.finalUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                Resolved Page <ChevronRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Match breakdown explanation */}
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <h2 className="text-base font-extrabold text-zinc-200">Matching Metrics Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-green-400">Matching Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills?.map((s: string) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/10 text-[10px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-orange-400">Missing / Preferred Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {job.preferredSkills?.length > 0 ? (
                  job.preferredSkills.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/10 text-[10px]">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-650">None identified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Automation logs */}
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <h2 className="text-base font-extrabold text-zinc-200">Activity Audits</h2>
          <div className="bg-zinc-900/60 p-4 border border-zinc-900 rounded-2xl h-48 overflow-y-auto subtle-scroll font-mono text-[10px] text-zinc-400 space-y-1">
            {app.logs?.map((log: string, idx: number) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COL: State Machine Controller & Interactivity */}
      <div className="space-y-6">
        
        {/* Main Automation Controller */}
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-5">
          <h2 className="text-base font-extrabold text-zinc-200">Automation Control Panel</h2>
          
          {/* STATE: READY_TO_APPLY */}
          {app.currentState === 'READY_TO_APPLY' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                The job parser has analyzed the requirements. Ready to spin up local headed Playwright Chromium browser to scan fields.
              </p>
              <button
                onClick={handleStartApplication}
                disabled={submittingAction}
                className="glow-btn w-full py-3 rounded-xl font-bold text-white text-xs flex items-center justify-center gap-1.5"
              >
                {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Launch Browser Automation
              </button>
            </div>
          )}

          {/* STATE: BROWSER_STARTING / FORM_SCANNING / FORM_FILLING */}
          {['BROWSER_STARTING', 'FORM_SCANNING', 'FORM_FILLING', 'SUBMITTING'].includes(app.currentState) && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-300">Automated filling in progress...</span>
                <p className="text-[10px] text-zinc-500">Headed Chromium browser is running. Watch fields being filled.</p>
              </div>
            </div>
          )}

          {/* STATE: WAITING_FOR_USER (Human in the loop paused wizard!) */}
          {app.currentState === 'WAITING_FOR_USER' && app.humanActionRequired && (
            <div className="space-y-4 border border-orange-500/20 bg-orange-500/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-orange-400">
                <AlertCircle className="h-5 w-5 animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-wider">Application Paused</span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Question asked:</span>
                <p className="text-xs text-zinc-200 font-semibold">"{app.humanActionRequired.questionText}"</p>
              </div>

              {app.humanActionRequired.options && app.humanActionRequired.options.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {app.humanActionRequired.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setUserAnswer(opt)}
                      className={`px-3 py-2 rounded-xl text-left text-xs transition border ${
                        userAnswer === opt ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200' : 'border-zinc-800 bg-zinc-900/30 text-zinc-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              )}

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="saveFuture"
                  checked={saveForFuture}
                  onChange={e => setSaveForFuture(e.target.checked)}
                  className="h-4 w-4 accent-indigo-500"
                />
                <label htmlFor="saveFuture" className="text-[10px] text-zinc-400 cursor-pointer select-none">
                  Save answer to memory for future applications
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResumeApplication}
                  disabled={submittingAction || !userAnswer.trim()}
                  className="glow-btn flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Send className="h-3 w-3" /> Resume
                </button>
                <button
                  onClick={handleCancelApplication}
                  disabled={submittingAction}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STATE: REVIEW_REQUIRED */}
          {app.currentState === 'REVIEW_REQUIRED' && (
            <div className="space-y-4 border border-indigo-500/20 bg-indigo-500/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Review Required</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Confirm all fields are correct. Clicking submit will trigger the browser script to complete the application.
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleApproveSubmit}
                  disabled={submittingAction}
                  className="glow-btn flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                >
                  Submit Application
                </button>
                <button
                  onClick={handleCancelApplication}
                  disabled={submittingAction}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STATE: SUBMITTED */}
          {app.currentState === 'SUBMITTED' && (
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-green-300">Application Submitted!</span>
                <p className="text-[10px] text-zinc-500">
                  Completed on {new Date(app.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* STATE: FAILED */}
          {app.currentState === 'FAILED' && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              <X className="h-10 w-10 text-red-500 border border-red-500/20 rounded-full p-2" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-red-300">Automation Session Failed</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Reason: {app.failureReason || 'Unknown error'}
                </p>
              </div>
              <button onClick={handleStartApplication} className="glow-btn px-4 py-2 rounded-xl text-[10px] font-bold text-white">
                Retry Application
              </button>
            </div>
          )}
        </div>

        {/* Paused/Checkpoints screenshots */}
        {app.screenshots?.length > 0 && (
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
            <h2 className="text-base font-extrabold text-zinc-200">Captured Viewports</h2>
            <div className="grid grid-cols-1 gap-2">
              {app.screenshots.map((ss: string, idx: number) => {
                const basename = ss.split(/[\\/]/).pop();
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <ImageIcon className="h-4 w-4 text-zinc-650" />
                      {basename}
                    </span>
                    <a
                      href={`/api/storage/screenshots/${basename}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      View
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
