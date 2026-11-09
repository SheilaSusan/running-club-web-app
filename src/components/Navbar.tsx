import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Plus, User, LogOut, Flame, Compass, ChevronDown, CheckCircle2, Map } from 'lucide-react';
import { ClubStats } from '../types.ts';

interface NavbarProps {
  stats: ClubStats | null;
  routeCount: number;
  onOpenPostRun: () => void;
  onOpenProfile: () => void;
  onOpenRouteLibrary: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  routeCount,
  onOpenPostRun,
  onOpenProfile,
  onOpenRouteLibrary,
}) => {
  const { user, dbUser, signInWithGoogle, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                APEX<span className="text-emerald-400">STRIDE</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Running Club
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">Community group runs & training sessions</p>
          </div>
        </div>

        {/* Club Quick Stats Bar */}
        {stats && (
          <div className="hidden lg:flex items-center gap-5 px-4 py-1.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400">Runs:</span>
              <span className="font-bold text-zinc-100">{stats.totalRuns}</span>
            </div>
            <div className="w-px h-3 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">RSVPs:</span>
              <span className="font-bold text-zinc-100">{stats.totalRsvps}</span>
            </div>
            <div className="w-px h-3 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Runners:</span>
              <span className="font-bold text-zinc-100">{stats.totalMembers}</span>
            </div>
            <div className="w-px h-3 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Routes:</span>
              <span className="font-bold text-emerald-400">{routeCount}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Route Library Button */}
          <button
            onClick={onOpenRouteLibrary}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-750 text-zinc-200 hover:text-white font-semibold text-xs tracking-tight transition-all cursor-pointer"
            title="Browse Route Library"
          >
            <Compass className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">Route Library</span>
            <span className="px-1.5 py-0.2 rounded-full bg-teal-500/10 text-teal-300 text-[10px] font-bold border border-teal-500/20">
              {routeCount}
            </span>
          </button>

          {/* Post a Run Button */}
          <button
            onClick={onOpenPostRun}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-tight transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Post a Run</span>
            <span className="sm:hidden">Post</span>
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Member'}
                    className="w-8 h-8 rounded-lg object-cover border border-emerald-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-zinc-200 max-w-[100px] truncate hidden md:inline">
                  {dbUser?.displayName || user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl py-2 z-50 text-sm">
                    <div className="px-4 py-2.5 border-b border-zinc-800/80">
                      <p className="font-semibold text-white truncate">
                        {dbUser?.displayName || user.displayName || 'Club Runner'}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                      {dbUser?.paceCategory && (
                        <div className="mt-1.5 inline-block text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {dbUser.paceCategory}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenRouteLibrary();
                      }}
                      className="w-full text-left px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-teal-400" />
                      <span>Club Route Library</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-zinc-400" />
                      <span>Runner Bio & Preferences</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-zinc-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-sm font-semibold transition-all hover:border-zinc-500 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
