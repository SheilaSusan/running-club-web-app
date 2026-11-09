import React from 'react';
import { Search, Filter, Compass, Zap, Map, Mountain, CheckCircle2 } from 'lucide-react';

interface RunFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedDistance: string;
  setSelectedDistance: (dist: string) => void;
  myRunsOnly: boolean;
  setMyRunsOnly: (val: boolean) => void;
  isLoggedIn: boolean;
  totalCount: number;
}

const RUN_TYPES = [
  { id: 'all', label: 'All Runs', icon: Compass },
  { id: 'Easy Social', label: 'Easy Social', icon: Zap },
  { id: 'Tempo / Intervals', label: 'Tempo & Track', icon: Zap },
  { id: 'Long Run', label: 'Long Run', icon: Map },
  { id: 'Trail', label: 'Trail & Woods', icon: Mountain },
];

const DISTANCE_OPTIONS = [
  { id: 'all', label: 'Any Distance' },
  { id: '5k', label: '5K (3.1 mi)' },
  { id: '10k', label: '10K (6.2 mi)' },
  { id: '15k', label: '12K - 16K' },
  { id: 'half', label: 'Half+ (21K+)' },
];

export const RunFilters: React.FC<RunFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedDistance,
  setSelectedDistance,
  myRunsOnly,
  setMyRunsOnly,
  isLoggedIn,
  totalCount,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Search and Secondary Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by route, landmark, meetup point, or organizer..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Distance Selector Dropdown & My Runs Toggle */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDistance}
            onChange={(e) => setSelectedDistance(e.target.value)}
            aria-label="Filter runs by distance"
            className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {DISTANCE_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>

          {isLoggedIn && (
            <button
              onClick={() => setMyRunsOnly(!myRunsOnly)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                myRunsOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${myRunsOnly ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>My RSVP'd Runs</span>
            </button>
          )}
        </div>
      </div>

      {/* Run Type Filter Tabs */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2 scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {RUN_TYPES.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 shadow-md shadow-white/10'
                    : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-850 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-zinc-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-zinc-500 font-medium whitespace-nowrap pl-2">
          {totalCount} upcoming {totalCount === 1 ? 'stride' : 'strides'}
        </span>
      </div>
    </div>
  );
};
