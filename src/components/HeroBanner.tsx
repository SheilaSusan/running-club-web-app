import React from 'react';
import { Sparkles, MapPin, Users, Coffee, Calendar, ArrowRight, ShieldCheck, Compass } from 'lucide-react';

interface HeroBannerProps {
  onPostRunClick: () => void;
  onExploreClick: () => void;
  onRouteLibraryClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onPostRunClick,
  onExploreClick,
  onRouteLibraryClick,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800 p-6 sm:p-10 mb-8 shadow-2xl">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apex Stride Community Runs & Route Library</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Never run alone. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Post strides & explore club routes.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 mb-6 leading-relaxed max-w-2xl">
          From conversational weekend 5Ks and morning river paces to tempo track nights and scenic trail long runs. Save your favorite running courses to the club library or schedule a run directly from one.
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300">
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">All Paces Welcomed</span>
          </div>
          <button
            onClick={onRouteLibraryClick}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800/80 text-xs text-zinc-300 transition-colors cursor-pointer text-left"
          >
            <Compass className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-medium">Route Library</span>
          </button>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300">
            <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">Post-Run Socials</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">Cloud SQL Verified</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onPostRunClick}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-tight transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
          >
            <span>Organize an Upcoming Run</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            onClick={onRouteLibraryClick}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-sm transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-teal-400" />
            <span>Explore Route Library</span>
          </button>
          <button
            onClick={onExploreClick}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-100 font-semibold text-sm transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>Upcoming Calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
