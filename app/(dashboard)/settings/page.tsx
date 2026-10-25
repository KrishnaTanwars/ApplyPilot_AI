'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Loader2,
  Save,
  ShieldAlert,
  Compass,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings states
  const [applicationPolicy, setApplicationPolicy] = useState('Always Review Before Submit');
  const [matchThreshold, setMatchThreshold] = useState(60);
  const [browserMode, setBrowserMode] = useState('Headed');
  const [aiProvider, setAIProvider] = useState('Gemini');
  const [duplicateProtection, setDuplicateProtection] = useState(true);
  const [resumeSelectionPolicy, setResumeSelectionPolicy] = useState('Automatic');
  const [screenshotFailure, setScreenshotFailure] = useState(true);
  const [screenshotPause, setScreenshotPause] = useState(true);
  const [screenshotPreSubmit, setScreenshotPreSubmit] = useState(true);
  const [screenshotPostSubmit, setScreenshotPostSubmit] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.settings) {
          const s = data.settings;
          setApplicationPolicy(s.application_policy || 'Always Review Before Submit');
          setMatchThreshold(s.match_threshold || 60);
          setBrowserMode(s.browser_mode || 'Headed');
          setAIProvider(s.ai_provider || 'Gemini');
          setDuplicateProtection(s.duplicate_protection !== false);
          setResumeSelectionPolicy(s.resume_selection_policy || 'Automatic');
          
          if (s.screenshot_policy) {
            setScreenshotFailure(s.screenshot_policy.failure !== false);
            setScreenshotPause(s.screenshot_policy.pause !== false);
            setScreenshotPreSubmit(s.screenshot_policy.preSubmit !== false);
            setScreenshotPostSubmit(s.screenshot_policy.postSubmit !== false);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_policy: applicationPolicy,
          match_threshold: matchThreshold,
          browser_mode: browserMode,
          ai_provider: aiProvider,
          duplicate_protection: duplicateProtection,
          resume_selection_policy: resumeSelectionPolicy,
          screenshot_policy: {
            failure: screenshotFailure,
            pause: screenshotPause,
            preSubmit: screenshotPreSubmit,
            postSubmit: screenshotPostSubmit
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch {
      alert('Network error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            System Settings
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Configure orchestrator behaviors and security bounds.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="glow-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-zinc-800 space-y-6">
        
        {/* Policy */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Submission Policy</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Default Submission Policy</label>
              <select
                value={applicationPolicy}
                onChange={e => setApplicationPolicy(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="Always Review Before Submit">Always Review Before Submit</option>
                <option value="Review Only Risky Applications">Review Only Risky Applications</option>
                <option value="Auto Submit Trusted Adapters">Auto Submit Trusted Adapters (Greenhouse, Lever, Ashby)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Browser Mode</label>
              <select
                value={browserMode}
                onChange={e => setBrowserMode(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="Headed">Headed Mode (Headed browser opens visibly)</option>
                <option value="Headless">Headless Mode (Automation runs silently)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Scoring & Safety Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Minimum Match Threshold</label>
              <input
                type="number"
                min="0"
                max="100"
                value={matchThreshold}
                onChange={e => setMatchThreshold(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2 text-xs text-zinc-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Resume Selection Mode</label>
              <select
                value={resumeSelectionPolicy}
                onChange={e => setResumeSelectionPolicy(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="Automatic">Automatic with manual override</option>
                <option value="Manual">Manual Selection Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/30 p-4 border border-zinc-850 rounded-2xl">
            <input
              type="checkbox"
              id="dupecheck"
              checked={duplicateProtection}
              onChange={e => setDuplicateProtection(e.target.checked)}
              className="h-4.5 w-4.5 accent-indigo-500"
            />
            <label htmlFor="dupecheck" className="text-xs text-zinc-300 cursor-pointer select-none">
              Enable Duplicate Application Protection (warning on matching canonical URLs)
            </label>
          </div>
        </div>

        {/* Screenshots */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Screenshot Rules</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={screenshotFailure}
                onChange={e => setScreenshotFailure(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
              Capture on failure
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={screenshotPause}
                onChange={e => setScreenshotPause(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
              Capture on pause
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={screenshotPreSubmit}
                onChange={e => setScreenshotPreSubmit(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
              Capture pre-submit
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={screenshotPostSubmit}
                onChange={e => setScreenshotPostSubmit(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
              Capture post-submit
            </label>
          </div>
        </div>

      </div>

    </div>
  );
}
