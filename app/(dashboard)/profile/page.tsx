'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Link2,
  FileCheck2,
  ListRestart,
  Save,
  Loader2,
  CheckCircle,
  Plus,
  Trash,
  X
} from 'lucide-react';

type SectionType = 'personal' | 'professional' | 'education' | 'links' | 'workAuth' | 'skills' | 'projects';

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<SectionType>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Form states mapping
  const [personal, setPersonal] = useState({
    fullName: '', preferredName: '', email: '', phone: '', alternatePhone: '',
    dateOfBirth: '', currentCity: '', state: '', country: '', postalCode: '', fullAddress: ''
  });
  const [professional, setProfessional] = useState({
    currentStatus: 'student', yearsOfExperience: 0, noticePeriod: '',
    currentSalary: '', expectedSalary: '', preferredRoles: [] as string[],
    preferredLocations: [] as string[], remotePreference: 'any', relocationPreference: true
  });
  const [education, setEducation] = useState({
    degree: '', specialization: '', university: '', startDate: '', endDate: '',
    graduationYear: 2027, cgpa: 8.3, percentage: 83.0, classXII: 93.2, classX: 95.0
  });
  const [links, setLinks] = useState({
    linkedin: '', github: '', portfolio: '', personalWebsite: ''
  });
  const [workAuth, setWorkAuth] = useState({
    country: 'India', authorizationStatus: 'authorized', sponsorshipRequirement: false
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  
  // Projects
  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', skillsUsed: '', link: '' });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.profile) {
          const p = data.profile;
          setProfile(p);
          
          // Set inputs
          setPersonal({
            fullName: p.personal?.fullName?.value || '',
            preferredName: p.personal?.preferredName?.value || '',
            email: p.personal?.email?.value || '',
            phone: p.personal?.phone?.value || '',
            alternatePhone: p.personal?.alternatePhone?.value || '',
            dateOfBirth: p.personal?.dateOfBirth?.value || '',
            currentCity: p.personal?.currentCity?.value || '',
            state: p.personal?.state?.value || '',
            country: p.personal?.country?.value || '',
            postalCode: p.personal?.postalCode?.value || '',
            fullAddress: p.personal?.fullAddress?.value || ''
          });

          setProfessional({
            currentStatus: p.professional?.currentStatus?.value || 'student',
            yearsOfExperience: p.professional?.yearsOfExperience?.value || 0,
            noticePeriod: p.professional?.noticePeriod?.value || '',
            currentSalary: p.professional?.currentSalary?.value || '',
            expectedSalary: p.professional?.expectedSalary?.value || '',
            preferredRoles: p.professional?.preferredRoles?.value || [],
            preferredLocations: p.professional?.preferredLocations?.value || [],
            remotePreference: p.professional?.remotePreference?.value || 'any',
            relocationPreference: p.professional?.relocationPreference?.value !== false
          });

          setEducation({
            degree: p.education?.degree?.value || '',
            specialization: p.education?.specialization?.value || '',
            university: p.education?.university?.value || '',
            startDate: p.education?.startDate?.value || '',
            endDate: p.education?.endDate?.value || '',
            graduationYear: p.education?.graduationYear?.value || 2027,
            cgpa: p.education?.cgpa?.value || 8.3,
            percentage: p.education?.percentage?.value || 83.0,
            classXII: p.education?.classXII?.value || 93.2,
            classX: p.education?.classX?.value || 95.0
          });

          setLinks({
            linkedin: p.links?.linkedin?.value || '',
            github: p.links?.github?.value || '',
            portfolio: p.links?.portfolio?.value || '',
            personalWebsite: p.links?.personalWebsite?.value || ''
          });

          setWorkAuth({
            country: p.workAuthorization?.country?.value || 'India',
            authorizationStatus: p.workAuthorization?.authorizationStatus?.value || 'authorized',
            sponsorshipRequirement: p.workAuthorization?.sponsorshipRequirement?.value === true
          });

          setSkills(p.skills?.value || []);
          setProjects(p.projects?.value || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal,
          professional,
          education,
          links,
          workAuthorization: workAuth,
          skills,
          projects
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        alert('Profile saved successfully!');
      } else {
        alert('Save failed: ' + data.error);
      }
    } catch {
      alert('Save error');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (sk: string) => {
    setSkills(skills.filter(s => s !== sk));
  };

  const addProj = () => {
    if (newProject.title.trim() && newProject.description.trim()) {
      setProjects([...projects, {
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        skillsUsed: newProject.skillsUsed.split(',').map(s => s.trim()).filter(s => s.length > 0),
        link: newProject.link.trim()
      }]);
      setNewProject({ title: '', description: '', skillsUsed: '', link: '' });
    }
  };

  const removeProj = (idx: number) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            Edit Profile
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage verified credentials and preferences.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="glow-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation tabs */}
        <div className="space-y-1.5">
          {[
            { id: 'personal', name: 'Personal Details', icon: User },
            { id: 'professional', name: 'Preferences', icon: Briefcase },
            { id: 'education', name: 'Education', icon: GraduationCap },
            { id: 'links', name: 'Social Links', icon: Link2 },
            { id: 'workAuth', name: 'Work Authorization', icon: FileCheck2 },
            { id: 'skills', name: 'Skills List', icon: ListRestart },
            { id: 'projects', name: 'Project Portfolio', icon: Briefcase },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as SectionType)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl text-left transition ${
                  activeSection === tab.id
                    ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content details cards */}
        <div className="md:col-span-3 glass-panel p-6 rounded-3xl border border-zinc-800 space-y-6">
          
          {/* PERSONAL */}
          {activeSection === 'personal' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Personal contact coordinates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={personal.fullName}
                    onChange={e => setPersonal({ ...personal, fullName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Preferred Name</label>
                  <input
                    type="text"
                    value={personal.preferredName}
                    onChange={e => setPersonal({ ...personal, preferredName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={personal.email}
                    onChange={e => setPersonal({ ...personal, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    value={personal.phone}
                    onChange={e => setPersonal({ ...personal, phone: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Street Address</label>
                <textarea
                  value={personal.fullAddress}
                  onChange={e => setPersonal({ ...personal, fullAddress: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none h-16 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    value={personal.currentCity}
                    onChange={e => setPersonal({ ...personal, currentCity: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Postal Code</label>
                  <input
                    type="text"
                    value={personal.postalCode}
                    onChange={e => setPersonal({ ...personal, postalCode: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PROFESSIONAL */}
          {activeSection === 'professional' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Employment Preferences</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Expected Salary</label>
                  <input
                    type="text"
                    value={professional.expectedSalary}
                    onChange={e => setProfessional({ ...professional, expectedSalary: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Remote Preference</label>
                  <select
                    value={professional.remotePreference}
                    onChange={e => setProfessional({ ...professional, remotePreference: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="any">Flexible / Any</option>
                    <option value="remote">Remote Only</option>
                    <option value="hybrid">Hybrid Only</option>
                    <option value="onsite">On-site Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/30 p-4 border border-zinc-850 rounded-2xl">
                <input
                  type="checkbox"
                  id="reloccheck"
                  checked={professional.relocationPreference}
                  onChange={e => setProfessional({ ...professional, relocationPreference: e.target.checked })}
                  className="h-4.5 w-4.5 accent-indigo-500"
                />
                <label htmlFor="reloccheck" className="text-xs text-zinc-300 cursor-pointer select-none">
                  Willing to relocate
                </label>
              </div>
            </div>
          )}

          {/* EDUCATION */}
          {activeSection === 'education' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Academic Qualifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Degree</label>
                  <input
                    type="text"
                    value={education.degree}
                    onChange={e => setEducation({ ...education, degree: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Specialization</label>
                  <input
                    type="text"
                    value={education.specialization}
                    onChange={e => setEducation({ ...education, specialization: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">University</label>
                  <input
                    type="text"
                    value={education.university}
                    onChange={e => setEducation({ ...education, university: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={education.cgpa}
                    onChange={e => setEducation({ ...education, cgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Graduation Year</label>
                  <input
                    type="number"
                    value={education.graduationYear}
                    onChange={e => setEducation({ ...education, graduationYear: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Class XII %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={education.classXII}
                    onChange={e => setEducation({ ...education, classXII: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Class X %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={education.classX}
                    onChange={e => setEducation({ ...education, classX: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SOCIAL LINKS */}
          {activeSection === 'links' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Online Profile Links</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">LinkedIn URL</label>
                  <input
                    type="text"
                    value={links.linkedin}
                    onChange={e => setLinks({ ...links, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">GitHub URL</label>
                  <input
                    type="text"
                    value={links.github}
                    onChange={e => setLinks({ ...links, github: e.target.value })}
                    placeholder="https://github.com/username"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Portfolio URL</label>
                  <input
                    type="text"
                    value={links.portfolio}
                    onChange={e => setLinks({ ...links, portfolio: e.target.value })}
                    placeholder="https://username.dev"
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* WORK AUTH */}
          {activeSection === 'workAuth' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Visa & Work Authorization</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Citizenship Country</label>
                  <input
                    type="text"
                    value={workAuth.country}
                    onChange={e => setWorkAuth({ ...workAuth, country: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Authorization Status</label>
                  <select
                    value={workAuth.authorizationStatus}
                    onChange={e => setWorkAuth({ ...workAuth, authorizationStatus: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="authorized">Citizen / Authorized to work</option>
                    <option value="student_visa">Student Visa / OPT / CPT</option>
                    <option value="needs_sponsorship">Needs visa sponsorship</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/30 p-4 border border-zinc-850 rounded-2xl">
                <input
                  type="checkbox"
                  id="sponscheck"
                  checked={workAuth.sponsorshipRequirement}
                  onChange={e => setWorkAuth({ ...workAuth, sponsorshipRequirement: e.target.checked })}
                  className="h-4.5 w-4.5 accent-indigo-500"
                />
                <label htmlFor="sponscheck" className="text-xs text-zinc-300 cursor-pointer select-none">
                  Require sponsorship now or in the future
                </label>
              </div>
            </div>
          )}

          {/* SKILLS */}
          {activeSection === 'skills' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Skills Inventory</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  placeholder="Add skill (e.g. Docker, PyTorch)"
                  className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                />
                <button onClick={addSkill} className="glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto subtle-scroll p-1">
                {skills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-300 text-xs font-medium">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-zinc-500 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {activeSection === 'projects' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Project Portfolio</h2>
              
              {/* Add Project Form */}
              <div className="bg-zinc-900/30 p-4 border border-zinc-850 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-400">Add New Project</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                    placeholder="Project Title"
                    className="bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300"
                  />
                  <input
                    type="text"
                    value={newProject.link}
                    onChange={e => setNewProject({ ...newProject, link: e.target.value })}
                    placeholder="GitHub Link (optional)"
                    className="bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300"
                  />
                </div>
                <input
                  type="text"
                  value={newProject.skillsUsed}
                  onChange={e => setNewProject({ ...newProject, skillsUsed: e.target.value })}
                  placeholder="Skills used (comma-separated: Python, SQL)"
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300"
                />
                <textarea
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Project description..."
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300 h-16 resize-none"
                />
                <button onClick={addProj} className="glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Save Project
                </button>
              </div>

              {/* Projects List */}
              <div className="space-y-3 max-h-60 overflow-y-auto subtle-scroll p-1">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-4 bg-zinc-900/10 border border-zinc-900 rounded-2xl flex justify-between items-start">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-zinc-200">{proj.title}</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{proj.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {proj.skillsUsed?.map((sk: string) => (
                          <span key={sk} className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 text-[9px] font-semibold">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => removeProj(idx)} className="p-2 text-zinc-600 hover:text-red-400">
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
