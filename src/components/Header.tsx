/**
 * Header Component for DualSync BT.
 * Complies with Top Bar Contract:
 * Zone 1: Brand title wordmark
 * Zone 2: 5 single-line nav links (Home, Library, Devices, Sync, Settings)
 * Zone 3: 1 primary action button
 */

import React from 'react';
import { Bluetooth, Activity, Terminal, Menu, X, Disc } from 'lucide-react';

export type NavTab = 'home' | 'library' | 'devices' | 'sync' | 'settings';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isPlaying: boolean;
  onOpenDiagnostics: () => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isPlaying,
  onOpenDiagnostics,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const navItems: Array<{ id: NavTab; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'library', label: 'Music Library' },
    { id: 'devices', label: 'Devices' },
    { id: 'sync', label: 'Synchronization' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B1020]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single Text Element Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#00D4FF] flex items-center justify-center text-white shadow-md shadow-[#6C63FF]/30 transition-transform group-hover:scale-105">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap block">
                DualSync BT
              </span>
            </div>
          </button>

          {isPlaying && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded border border-[#00D4FF]/20">
              <Disc className="w-3 h-3 animate-spin" />
              <span>Playing</span>
            </div>
          )}
        </div>

        {/* Zone 2: 4-5 Clean Single-Line Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
                activeTab === item.id
                  ? 'text-white border-[#6C63FF]'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenDiagnostics}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Run Unit & Verification Tests"
          >
            <Terminal className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span className="hidden sm:inline">Diagnostics</span>
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#080D1B] border-b border-slate-800 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onToggleMobileMenu();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-[#6C63FF]/20 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
