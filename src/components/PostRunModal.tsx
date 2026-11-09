import React, { useState, useEffect } from 'react';
import { RouteItem } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Coffee,
  Navigation,
  Gauge,
  Sparkles,
  Compass,
  Check,
  RotateCcw,
} from 'lucide-react';

interface PostRunModalProps {
  routes: RouteItem[];
  initialRoute?: RouteItem | null;
  onClose: () => void;
  onRunCreated: () => void;
}

const DISTANCE_PRESETS = ['5.0', '8.0', '10.0', '15.0', '21.1'];
const PACE_PRESETS = [
  'All Paces Welcome',
  'Conversational (6:15 - 7:00 min/km)',
  'Steady (5:15 - 5:45 min/km)',
  'Tempo (4:30 - 5:00 min/km)',
  'Fast / Race Pace (<4:15 min/km)',
];

export const PostRunModal: React.FC<PostRunModalProps> = ({
  routes,
  initialRoute,
  onClose,
  onRunCreated,
}) => {
  const { user, getToken, signInWithGoogle } = useAuth();

  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(
    initialRoute ? initialRoute.id : null
  );

  const [title, setTitle] = useState(
    initialRoute ? `Club Stride: ${initialRoute.title}` : ''
  );
  const [description, setDescription] = useState(initialRoute?.description || '');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('08:30');
  const [meetupLocation, setMeetupLocation] = useState(
    initialRoute ? initialRoute.startLocation : ''
  );
  const [locationDetails, setLocationDetails] = useState('');
  const [distanceKm, setDistanceKm] = useState(
    initialRoute ? initialRoute.distanceKm : '10.0'
  );
  const [pace, setPace] = useState('Steady (5:15 - 5:45 min/km)');
  const [runType, setRunType] = useState(
    initialRoute?.surface === 'Trail' ? 'Trail Run' : 'Easy Social'
  );
  const [surface, setSurface] = useState(initialRoute?.surface || 'Road');
  const [maxParticipants, setMaxParticipants] = useState<string>('30');
  const [coffeeSpot, setCoffeeSpot] = useState('');
  const [routeUrl, setRouteUrl] = useState(initialRoute?.mapUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRoute = (routeIdStr: string) => {
    if (!routeIdStr) {
      setSelectedRouteId(null);
      return;
    }
    const rId = Number(routeIdStr);
    const chosenRoute = routes.find((r) => r.id === rId);
    if (!chosenRoute) return;

    setSelectedRouteId(chosenRoute.id);
    setTitle(`Club Stride: ${chosenRoute.title}`);
    setDistanceKm(chosenRoute.distanceKm);
    setMeetupLocation(chosenRoute.startLocation);
    setSurface(chosenRoute.surface);
    if (chosenRoute.surface === 'Trail') setRunType('Trail Run');
    if (chosenRoute.mapUrl) setRouteUrl(chosenRoute.mapUrl);
    if (chosenRoute.description && !description) {
      setDescription(chosenRoute.description);
    }
  };

  const handleClearSelectedRoute = () => {
    setSelectedRouteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      try {
        await signInWithGoogle();
      } catch {
        setError('Please sign in with Google to post your run.');
        return;
      }
    }

    if (!title.trim() || !meetupLocation.trim() || !date || !time) {
      setError('Please provide a run title, meetup location, date, and start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await getToken();

      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          routeId: selectedRouteId,
          title: title.trim(),
          description: description.trim() || 'Join us for this group stride! All runners welcome.',
          date,
          time,
          meetupLocation: meetupLocation.trim(),
          locationDetails: locationDetails.trim() || null,
          distanceKm: distanceKm.trim(),
          pace: pace.trim(),
          runType,
          surface,
          maxParticipants: maxParticipants ? Number(maxParticipants) : null,
          coffeeSpot: coffeeSpot.trim() || null,
          routeUrl: routeUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to post run');
      }

      onRunCreated();
      onClose();
    } catch (err: any) {
      console.error('Error posting run:', err);
      setError(err.message || 'Failed to post run');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSelectedRoute = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Schedule an Upcoming Run</h2>
              <p className="text-xs text-zinc-400">
                Organize a club stride using a saved route or custom course
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Route Library Selector */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-teal-500/20">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Select from Route Library (Optional)
                </span>
              </div>
              {selectedRouteId && (
                <button
                  type="button"
                  onClick={handleClearSelectedRoute}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Custom Route</span>
                </button>
              )}
            </div>

            <select
              value={selectedRouteId ? String(selectedRouteId) : ''}
              onChange={(e) => handleSelectRoute(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">-- Choose a saved favorite route or build custom --</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.distanceKm} km • {r.difficulty} • {r.startLocation})
                </option>
              ))}
            </select>

            {currentSelectedRoute && (
              <div className="mt-2.5 flex items-center justify-between p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  <span className="font-semibold text-teal-200">
                    Route loaded: {currentSelectedRoute.title}
                  </span>
                </div>
                <span className="text-[11px] text-teal-400 font-mono">
                  {currentSelectedRoute.distanceKm} km
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Run Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Saturday Morning Thames Loop & Bakery"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type & Surface */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Run Category
              </label>
              <select
                value={runType}
                onChange={(e) => setRunType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Easy Social">Easy Social</option>
                <option value="Tempo / Intervals">Tempo & Intervals</option>
                <option value="Long Run">Long Run</option>
                <option value="Trail Run">Trail Run</option>
                <option value="Recovery Run">Recovery Shakeout</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Surface
              </label>
              <select
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Road">Road / Pavement</option>
                <option value="Trail">Trail / Off-road</option>
                <option value="Track">Synthetic Track</option>
                <option value="Mixed">Mixed Terrain</option>
              </select>
            </div>
          </div>

          {/* Distance Selection with Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Distance (Kilometers) *
              </label>
              <span className="text-xs text-zinc-400">
                ≈ {(Number(distanceKm || 0) * 0.621371).toFixed(1)} miles
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {DISTANCE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setDistanceKm(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    distanceKm === preset
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {preset} km
                </button>
              ))}
            </div>

            <input
              type="number"
              step="0.1"
              min="1"
              max="100"
              required
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Target Pace */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Pace Bracket
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PACE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPace(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    pace === p
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              placeholder="e.g. 5:30 - 6:00 min/km or All Paces"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Meetup Time *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Location & Landmark */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Meetup Point / Address *
            </label>
            <input
              type="text"
              required
              value={meetupLocation}
              onChange={(e) => setMeetupLocation(e.target.value)}
              placeholder="e.g. Battersea Park Millennium Arena Entrance"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Specific Landmark Details (Optional)
            </label>
            <input
              type="text"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              placeholder="e.g., Look for the runners under the covered pergola by the track"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Social Coffee Spot & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Post-Run Coffee / Social Spot
              </label>
              <input
                type="text"
                value={coffeeSpot}
                onChange={(e) => setCoffeeSpot(e.target.value)}
                placeholder="e.g., Monmouth Coffee or Local Cafe"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Max Participant Limit (Optional)
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Strava / Map Route Link */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Route Link / Strava URL (Optional)
            </label>
            <input
              type="url"
              value={routeUrl}
              onChange={(e) => setRouteUrl(e.target.value)}
              placeholder="https://strava.com/routes/..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Run Notes & Briefing
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell runners what to expect: bag drop info, hydration stops, loop structure, elevation profile..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-tight transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Posting Run...' : 'Publish to Club Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
