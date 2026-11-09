import React, { useState, useMemo } from 'react';
import { RouteItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Plus,
  MapPin,
  Mountain,
  Navigation,
  ExternalLink,
  Search,
  Trash2,
  Calendar,
  Compass,
  ArrowRight,
  Gauge,
  CheckCircle2,
} from 'lucide-react';

interface RouteLibraryModalProps {
  routes: RouteItem[];
  onClose: () => void;
  onRefreshRoutes: () => void;
  onSelectRouteToSchedule: (route: RouteItem) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Moderate: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Challenging: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Epic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export const RouteLibraryModal: React.FC<RouteLibraryModalProps> = ({
  routes,
  onClose,
  onRefreshRoutes,
  onSelectRouteToSchedule,
}) => {
  const { user, dbUser, getToken, signInWithGoogle } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);

  // New route form fields
  const [title, setTitle] = useState('');
  const [distanceKm, setDistanceKm] = useState('10.0');
  const [difficulty, setDifficulty] = useState('Moderate');
  const [startLocation, setStartLocation] = useState('');
  const [elevationGainM, setElevationGainM] = useState('');
  const [surface, setSurface] = useState('Road');
  const [description, setDescription] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesLocation = r.startLocation.toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesDesc) return false;
      }

      if (selectedDifficulty !== 'all' && r.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [routes, searchQuery, selectedDifficulty]);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      await signInWithGoogle();
      return;
    }

    if (!title.trim() || !distanceKm || !difficulty || !startLocation.trim()) {
      setFormError('Please fill in route title, distance, difficulty, and start location.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await getToken();
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          distanceKm: distanceKm.trim(),
          difficulty,
          startLocation: startLocation.trim(),
          elevationGainM: elevationGainM ? Number(elevationGainM) : null,
          surface,
          description: description.trim() || null,
          mapUrl: mapUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save route');
      }

      onRefreshRoutes();
      setIsCreatingRoute(false);
      // Reset form
      setTitle('');
      setDistanceKm('10.0');
      setStartLocation('');
      setElevationGainM('');
      setDescription('');
      setMapUrl('');
    } catch (err: any) {
      console.error('Error saving route:', err);
      setFormError(err.message || 'Failed to save route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoute = async (routeId: number) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onRefreshRoutes();
      }
    } catch (err) {
      console.error('Failed to delete route:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 to-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">Club Route Library</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                  {routes.length} routes
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Curated member running loops, river paths, and trail courses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingRoute(!isCreatingRoute)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-tight transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isCreatingRoute ? 'View All Routes' : 'Save New Route'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isCreatingRoute ? (
            /* Create Route Form */
            <form onSubmit={handleCreateRoute} className="space-y-4 max-w-2xl mx-auto">
              <div className="border-b border-zinc-800 pb-3 mb-4">
                <h3 className="text-base font-bold text-white">Add a Route to the Club Library</h3>
                <p className="text-xs text-zinc-400">
                  Once saved, organizers can select this route when scheduling upcoming group runs.
                </p>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Route Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Thames River Southbank 10K Loop"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="150"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    placeholder="10.0"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Difficulty *
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Easy">Easy (Flat / Conversational)</option>
                    <option value="Moderate">Moderate (Rolling hills)</option>
                    <option value="Challenging">Challenging (Steep / Technical)</option>
                    <option value="Epic">Epic (Long / High Elevation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Surface
                  </label>
                  <select
                    value={surface}
                    onChange={(e) => setSurface(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Road">Road / Pavement</option>
                    <option value="Trail">Trail / Off-road</option>
                    <option value="Track">Track</option>
                    <option value="Mixed">Mixed Surfaces</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Start / Meetup Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    placeholder="e.g., Tower Bridge South Steps, London"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Elevation Gain (meters, optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={elevationGainM}
                    onChange={(e) => setElevationGainM(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Strava / Map URL (Optional)
                </label>
                <input
                  type="url"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://www.strava.com/routes/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Route Highlights & Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe waypoints, water fountains, elevation landmarks, lighting for night runs..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingRoute(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                >
                  {isSubmitting ? 'Saving Route...' : 'Save to Route Library'}
                </button>
              </div>
            </form>
          ) : (
            /* Route List View */
            <>
              {/* Search and Difficulty Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search routes by name, starting point, or terrain..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'Easy', 'Moderate', 'Challenging', 'Epic'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedDifficulty === diff
                          ? 'bg-zinc-100 text-zinc-950'
                          : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {diff === 'all' ? 'All Difficulties' : diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Route Cards */}
              {filteredRoutes.length === 0 ? (
                <div className="text-center py-12 bg-zinc-950/40 rounded-2xl border border-zinc-800/80">
                  <Compass className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white mb-1">No matching routes</p>
                  <p className="text-xs text-zinc-400 mb-4">
                    Be the first to add your favorite neighborhood run or trail loop!
                  </p>
                  <button
                    onClick={() => setIsCreatingRoute(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
                  >
                    Add a Route
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRoutes.map((route) => {
                    const isAuthor = dbUser && dbUser.id === route.creatorId;
                    return (
                      <div
                        key={route.id}
                        className="rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 p-4 flex flex-col justify-between transition-all group"
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                DIFFICULTY_COLORS[route.difficulty] ||
                                'bg-zinc-800 text-zinc-300 border-zinc-700'
                              }`}
                            >
                              {route.difficulty}
                            </span>

                            <div className="flex items-center gap-2">
                              {route.usageCount !== undefined && route.usageCount > 0 && (
                                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-emerald-400" />
                                  <span>Run {route.usageCount}x</span>
                                </span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-400 border border-zinc-800">
                                {route.surface}
                              </span>
                            </div>
                          </div>

                          {/* Route Title */}
                          <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-1.5">
                            {route.title}
                          </h4>

                          {/* Distance & Elevation */}
                          <div className="flex items-center gap-3 mb-2.5 text-xs">
                            <div className="font-extrabold text-emerald-400">
                              {route.distanceKm} km{' '}
                              <span className="text-[11px] text-zinc-500 font-normal">
                                ({(Number(route.distanceKm) * 0.621371).toFixed(1)} mi)
                              </span>
                            </div>
                            {route.elevationGainM && (
                              <div className="flex items-center gap-1 text-zinc-400 text-xs">
                                <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                                <span>+{route.elevationGainM}m elevation</span>
                              </div>
                            )}
                          </div>

                          {/* Start Location */}
                          <div className="flex items-start gap-1.5 text-xs text-zinc-300 mb-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{route.startLocation}</span>
                          </div>

                          {/* Description */}
                          {route.description && (
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                              {route.description}
                            </p>
                          )}
                        </div>

                        {/* Card Bottom CTA & Map link */}
                        <div className="pt-3 border-t border-zinc-850 flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            {route.mapUrl && (
                              <a
                                href={route.mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                              >
                                <span>Strava Map</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {isAuthor && (
                              <button
                                onClick={() => handleDeleteRoute(route.id)}
                                className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete route"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              onSelectRouteToSchedule(route);
                              onClose();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            <span>Schedule Run</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
