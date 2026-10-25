'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Loader2,
  Trash,
  CheckCircle,
  XCircle,
  Plus,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function ResumesPage() {
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('General Tech');
  const [targetRoles, setTargetRoles] = useState('');

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes/upload');
      const data = await res.json();
      if (data.resumes) {
        setResumes(data.resumes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('targetRoles', targetRoles);

    try {
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchResumes();
        setTargetRoles('');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
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
          Resume Manager
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Manage multiple resume variants mapped to target roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        {/* Upload form card */}
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Upload New Variant</h2>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Variant Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
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
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Roles</label>
            <input
              type="text"
              value={targetRoles}
              onChange={e => setTargetRoles(e.target.value)}
              placeholder="e.g. SQL Developer, Data Lead"
              className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex flex-col items-center justify-center w-full border border-dashed border-zinc-800 rounded-2xl py-8 cursor-pointer hover:bg-zinc-900/30 transition">
              {uploading ? (
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
              ) : (
                <Upload className="h-6 w-6 text-zinc-500 mb-2" />
              )}
              <span className="text-[10px] text-zinc-400 font-bold">Select PDF Resume File</span>
              <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Resumes lists table */}
        <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Resumes</h2>
          
          {resumes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-1">
              <FileText className="h-8 w-8 text-zinc-650" />
              <span className="text-xs">No resumes uploaded yet.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto subtle-scroll p-1">
              {resumes.map(r => (
                <div key={r._id} className="p-4 bg-zinc-900/10 border border-zinc-900 rounded-2xl flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-indigo-400" />
                      <span className="text-xs font-bold text-zinc-200">{r.originalFilename}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[9px] text-zinc-500 font-semibold">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                        {r.category}
                      </span>
                      {r.targetRoles?.map((tr: string) => (
                        <span key={tr} className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400">
                          {tr}
                        </span>
                      ))}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-650">MD5: {r.fileHash}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 text-zinc-500 hover:text-red-400"
                      onClick={() => handleDelete(r._id)}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
