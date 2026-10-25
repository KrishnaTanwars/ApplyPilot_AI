'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Upload,
  Play,
  Loader2,
  Check,
  AlertCircle,
  Trash
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [browserTesting, setBrowserTesting] = useState(false);
  const [browserTested, setBrowserTested] = useState(false);
  const [browserTestError, setBrowserTestError] = useState('');
  
  // Profile fields (preloaded with seed data from user instructions where known)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // Professional
  const [expectedSalary, setExpectedSalary] = useState('8-12 LPA');
  const [remotePreference, setRemotePreference] = useState('any');
  const [relocationPreference, setRelocationPreference] = useState(true);
  
  // Work Auth
  const [country, setCountry] = useState('India');
  const [authStatus, setAuthStatus] = useState('authorized');
  const [sponsorshipRequired, setSponsorshipRequired] = useState(false);

  // Policy Settings
  const [applicationPolicy, setApplicationPolicy] = useState('Always Review Before Submit');
  const [browserMode, setBrowserMode] = useState('Headed');

  // Resumes upload list
  const [resumes, setResumes] = useState<any[]>([]);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeCategory, setResumeCategory] = useState('General Tech');
  const [resumeRoles, setResumeRoles] = useState('');

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes/upload');
      const data = await res.json();
      if (data.resumes) {
        setResumes(data.resumes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      const res = await fetch(`/api/resumes/upload?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchResumes();
      } else {
        alert(data.error || 'Failed to delete resume');
      }
    } catch {
      alert('Network error deleting resume');
    }
  };

  // Fetch already uploaded resumes
  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingResume(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', resumeCategory);
    formData.append('targetRoles', resumeRoles);

    try {
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchResumes();
        setResumeRoles('');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload error');
    } finally {
      setUploadingResume(false);
    }
  };

  // Test browser automation handler
  const handleTestBrowser = async () => {
    setBrowserTesting(true);
    setBrowserTestError('');
    setBrowserTested(false);
    try {
      const res = await fetch('/api/automation/test-browser', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBrowserTested(true);
      } else {
        setBrowserTestError(data.error || 'Browser run failed');
      }
    } catch (err: any) {
      setBrowserTestError('Failed to trigger browser test api');
    } finally {
      setBrowserTesting(false);
    }
  };

  // Submit all onboarding variables
  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal: {
            email,
            phone,
            fullAddress: address,
            currentCity: city,
            postalCode
          },
          professional: {
            expectedSalary,
            remotePreference,
            relocationPreference
          },
          workAuthorization: {
            country,
            authorizationStatus: authStatus,
            sponsorshipRequirement: sponsorshipRequired
          },
          policy: {
            applicationPolicy,
            browserMode
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        alert(data.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      alert('Network error completing onboarding');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-zinc-950 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="glow-ambient -top-10 -left-10" />
      <div className="glow-ambient -bottom-10 -right-10" />

      {/* Main Glassmorphic Container Card */}
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 md:p-10 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-indigo-500 animate-pulse" />
            <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              ApplyPilot AI
            </span>
          </div>
          <div className="text-sm font-semibold text-zinc-500">
            Step {step} of 8
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-indigo-400">
              <Sparkles className="h-8 w-8 text-indigo-400" />
              <h2 className="text-2xl font-bold">Welcome, Krishna Tanwar!</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              We have pre-seeded your academic profile with your GLA University metrics (B.Tech, 8.3 CGPA, 2027 batch) and known skills (Python, SQL, React, LLMs).
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Let's complete your profile settings, link your resumes, and run a quick browser diagnostic check to enable ApplyPilot AI.
            </p>
            <div className="pt-4">
              <button onClick={nextStep} className="glow-btn flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white">
                Get Started <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Profile */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">Personal Contact Information</h2>
            <p className="text-xs text-zinc-500">These details are used to fill your job application files.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Phone Number *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Full Home Address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Street Name, Area..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Gurgaon"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  placeholder="122001"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={!email || !phone}
                className="glow-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Professional Preferences */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">Professional Preferences</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Expected Salary</label>
              <input
                type="text"
                value={expectedSalary}
                onChange={e => setExpectedSalary(e.target.value)}
                placeholder="e.g. 10 LPA"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Work Mode Preference</label>
              <select
                value={remotePreference}
                onChange={e => setRemotePreference(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none"
              >
                <option value="any">Flexible / Any</option>
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid Only</option>
                <option value="onsite">On-site Only</option>
              </select>
            </div>
            <div className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-800/80 rounded-2xl">
              <input
                type="checkbox"
                id="reloc"
                checked={relocationPreference}
                onChange={e => setRelocationPreference(e.target.checked)}
                className="h-4.5 w-4.5 accent-indigo-500"
              />
              <label htmlFor="reloc" className="text-xs text-zinc-300 select-none cursor-pointer">
                Are you willing to relocate for work?
              </label>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={nextStep} className="glow-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Work Authorization */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">Work Authorization</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Country of Citizenship</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">Authorization Status</label>
              <select
                value={authStatus}
                onChange={e => setAuthStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none"
              >
                <option value="authorized">Citizen / Authorized to work</option>
                <option value="student_visa">Student Visa / OPT / CPT</option>
                <option value="needs_sponsorship">Needs visa sponsorship</option>
              </select>
            </div>
            <div className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-800/80 rounded-2xl">
              <input
                type="checkbox"
                id="spons"
                checked={sponsorshipRequired}
                onChange={e => setSponsorshipRequired(e.target.checked)}
                className="h-4.5 w-4.5 accent-indigo-500"
              />
              <label htmlFor="spons" className="text-xs text-zinc-300 select-none cursor-pointer">
                Will you now or in the future require visa sponsorship?
              </label>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={nextStep} className="glow-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Upload Resumes */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">Upload Your Resumes</h2>
            <p className="text-xs text-zinc-500">Upload specialized versions matching role categories to trigger the auto-resume selection engine.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/40 p-4 border border-zinc-850 rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Resume Category</label>
                <select
                  value={resumeCategory}
                  onChange={e => setResumeCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="General Tech">General Tech</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="BI Analyst">BI Analyst</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Python">Python</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Target Roles (comma-separated)</label>
                <input
                  type="text"
                  value={resumeRoles}
                  onChange={e => setResumeRoles(e.target.value)}
                  placeholder="e.g. Data Analyst, BI Analyst"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2 pt-2">
                <label className="flex flex-col items-center justify-center w-full border border-dashed border-zinc-800 rounded-xl py-6 cursor-pointer hover:bg-zinc-900/30 transition">
                  {uploadingResume ? (
                    <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-zinc-500 mb-2" />
                  )}
                  <span className="text-xs text-zinc-400 font-semibold">Click to select PDF resume file</span>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* List of uploaded resumes */}
            {resumes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Uploaded Resumes</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto subtle-scroll">
                  {resumes.map(r => (
                    <div key={r._id} className="flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl text-xs">
                      <span className="text-zinc-300 font-semibold">{r.originalFilename}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">{r.category}</span>
                        <button
                          onClick={() => handleDeleteResume(r._id)}
                          className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={resumes.length === 0}
                className="glow-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Application Policy */}
        {step === 6 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">Application Policy</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Submission Approval Policy</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                    applicationPolicy === 'Always Review Before Submit'
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : 'border-zinc-850 bg-zinc-900/20'
                  }`}>
                    <input
                      type="radio"
                      name="policy"
                      checked={applicationPolicy === 'Always Review Before Submit'}
                      onChange={() => setApplicationPolicy('Always Review Before Submit')}
                      className="mt-0.5 h-4.5 w-4.5 accent-indigo-500"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-200">Always Review Before Submit</span>
                      <span className="text-[10px] text-zinc-500">Wait for explicit manual approval click on every single application form.</span>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                    applicationPolicy === 'Auto Submit Trusted Adapters'
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : 'border-zinc-850 bg-zinc-900/20'
                  }`}>
                    <input
                      type="radio"
                      name="policy"
                      checked={applicationPolicy === 'Auto Submit Trusted Adapters'}
                      onChange={() => setApplicationPolicy('Auto Submit Trusted Adapters')}
                      className="mt-0.5 h-4.5 w-4.5 accent-indigo-500"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-200">Auto Submit Trusted Adapters</span>
                      <span className="text-[10px] text-zinc-500">Auto-submit applications running on standard Greenhouse, Lever, and Ashby adapter pages.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Browser Display Mode</label>
                <select
                  value={browserMode}
                  onChange={e => setBrowserMode(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none"
                >
                  <option value="Headed">Headed Mode (Headed Chromium opens visibly)</option>
                  <option value="Headless">Headless Mode (Low-risk automation runs silently)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={nextStep} className="glow-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Test Browser */}
        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-zinc-100">Verify Local Playwright Setup</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Before running automation, let's launch a test headed browser to ensure Chrome binaries are correctly configured.
            </p>
            <div className="p-5 bg-zinc-900/40 border border-zinc-850 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
              {browserTesting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                  <span className="text-xs text-indigo-400 font-bold">Launching headed Chromium... Check your desktop!</span>
                </div>
              ) : browserTested ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <span className="text-xs text-green-400 font-bold">Headed Browser launched and loaded example.com!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Play className="h-12 w-12 text-indigo-500 mb-2" />
                  <button onClick={handleTestBrowser} className="glow-btn px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
                    Launch Headed Test Browser
                  </button>
                </div>
              )}

              {browserTestError && (
                <div className="flex items-center gap-2 text-xs text-red-400 border border-red-500/20 bg-red-500/5 p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{browserTestError}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-sm">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={!browserTested}
                className="glow-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Ready */}
        {step === 8 && (
          <div className="space-y-6 text-center py-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500 stroke-[3]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Profile Setup Complete!</h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
              Krishna, your local job application agent is now ready to parse copy-pastes, inspect URLs, and auto-fill forms with human-in-the-loop validation.
            </p>
            <div className="pt-6">
              <button
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="glow-btn px-8 py-3.5 rounded-xl font-extrabold text-white text-sm flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enter ApplyPilot Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
