'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  FileCheck,
  User,
  FileText,
  BrainCircuit,
  Activity,
  Settings,
  Menu,
  X,
  Compass
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New Job', href: '/jobs/new', icon: PlusCircle },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Applications', href: '/applications', icon: FileCheck },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Answer Memory', href: '/questions', icon: BrainCircuit },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Background ambient glow glow-ambient elements */}
      <div className="glow-ambient -top-20 -left-20" />
      <div className="glow-ambient -bottom-20 -right-20" style={{ animationDelay: '-4s' }} />

      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 glass-panel border-r border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-zinc-800">
          <Compass className="h-6 w-6 text-indigo-500 animate-spin-slow" />
          <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            ApplyPilot AI
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto subtle-scroll">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/10 text-indigo-200 border-l-4 border-indigo-500 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-zinc-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            KT
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-zinc-300">Krishna Tanwar</span>
            <span className="text-[10px] text-zinc-500">GLA University</span>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-zinc-950/80 backdrop-blur-sm">
          <aside className="w-64 glass-panel border-r border-zinc-800 flex flex-col h-full">
            <div className="flex items-center justify-between px-6 h-16 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Compass className="h-6 w-6 text-indigo-500" />
                <span className="font-extrabold text-lg text-indigo-400">ApplyPilot AI</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                        : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-zinc-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                KT
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-300">Krishna Tanwar</span>
                <span className="text-[10px] text-zinc-500">Student</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile Header bar */}
        <header className="flex md:hidden items-center justify-between px-6 h-16 glass-panel border-b border-zinc-800">
          <button onClick={() => setMobileOpen(true)} className="text-zinc-400 hover:text-zinc-100">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-extrabold text-lg text-indigo-400">ApplyPilot AI</span>
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            KT
          </div>
        </header>

        {/* Dynamic Inner views */}
        <main className="flex-1 overflow-y-auto subtle-scroll p-6 md:p-8 bg-zinc-950/20">
          {children}
        </main>
      </div>
    </div>
  );
}
