import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { RunFilters } from './components/RunFilters.tsx';
import { RunCard } from './components/RunCard.tsx';
import { RunDetailModal } from './components/RunDetailModal.tsx';
import { PostRunModal } from './components/PostRunModal.tsx';
import { RouteLibraryModal } from './components/RouteLibraryModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { RunSummary, ClubStats, RouteItem } from './types.ts';
import { Calendar, Compass, RefreshCw, Plus, Sparkles } from 'lucide-react';

function RunningClubApp() {
  const { user, dbUser, getToken, signInWithGoogle } = useAuth();

  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isRouteLibraryOpen, setIsRouteLibraryOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [routeToSchedule, setRouteToSchedule] = useState<RouteItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDistance, setSelectedDistance] = useState('all');
  const [myRunsOnly, setMyRunsOnly] = useState(false);

  // Handle invite links (?run=123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runParam = params.get('run');
    if (runParam) {
      const id = Number(runParam);
      if (!isNaN(id)) {
        setSelectedRunId(id);
      }
    }
  }, []);

  const handleOpenRunModal = (id: number) => {
    setSelectedRunId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('run', String(id));
    window.history.replaceState({}, '', url.toString());
  };

  const handleCloseRunModal = () => {
    setSelectedRunId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('run');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  };

  // Fetch runs
  const fetchRuns = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/runs', { headers });
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      const res = await fetch('/api/routes');
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.error('Failed to fetch routes:', err);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
    fetchRoutes();
    fetchStats();
  }, [fetchRuns, fetchRoutes, fetchStats, user]);

  // Handle quick RSVP ("Join Run") from card
  const handleQuickToggleRsvp = async (
    e: React.MouseEvent,
    runId: number,
    status: 'going' | 'interested'
  ) => {
    e.stopPropagation();

    if (!user) {
      await signInWithGoogle();
      return;
    }

    try {
      const token = await getToken();

      // Optimistic update
      setRuns((prev) =>
        prev.map((r) => {
          if (r.id !== runId) return r;
          const wasGoing = r.userRsvp === 'going';
          const newStatus = wasGoing ? null : status;
          const diff = wasGoing ? -1 : 1;

          let newAttendees = [...(r.attendees || [])];
          if (newStatus === 'going') {
            const currentUserId = dbUser?.id || -1;
            const alreadyInList = newAttendees.some(
              (a) => a.userId === currentUserId && a.status === 'going'
            );
            if (!alreadyInList) {
              newAttendees.push({
                userId: currentUserId,
                status: 'going',
                displayName:
                  dbUser?.displayName || user.displayName || user.email?.split('@')[0] || 'You',
                photoUrl: dbUser?.photoUrl || user.photoURL || null,
              });
            }
          } else {
            const currentUserId = dbUser?.id;
            newAttendees = newAttendees.filter(
              (a) =>
                a.userId !== currentUserId &&
                a.displayName !== (dbUser?.displayName || user.displayName)
            );
          }

          return {
            ...r,
            userRsvp: newStatus,
            goingCount: Math.max(0, r.goingCount + diff),
            attendees: newAttendees,
          };
        })
      );

      const res = await fetch(`/api/runs/${runId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchRuns();
        fetchStats();
      }
    } catch (err) {
      console.error('Quick RSVP failed:', err);
      fetchRuns();
    }
  };

  // Filtered runs calculation
  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesLocation = r.meetupLocation.toLowerCase().includes(q);
        const matchesOrganizer = (r.creatorName || '').toLowerCase().includes(q);
        const matchesCoffee = (r.coffeeSpot || '').toLowerCase().includes(q);
        const matchesRoute = (r.routeTitle || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesOrganizer && !matchesCoffee && !matchesRoute) {
          return false;
        }
      }

      // Run Type
      if (selectedType !== 'all') {
        if (selectedType === 'Trail') {
          if (r.runType !== 'Trail Run' && r.surface !== 'Trail') return false;
        } else if (r.runType !== selectedType) {
          return false;
        }
      }

      // Distance
      const dist = Number(r.distanceKm) || 0;
      if (selectedDistance === '5k' && (dist < 4 || dist > 6.5)) return false;
      if (selectedDistance === '10k' && (dist < 7 || dist > 11.5)) return false;
      if (selectedDistance === '15k' && (dist < 12 || dist > 18)) return false;
      if (selectedDistance === 'half' && dist < 19) return false;

      // My RSVP'd runs only
      if (myRunsOnly && !r.userRsvp) {
        return false;
      }

      return true;
    });
  }, [runs, searchQuery, selectedType, selectedDistance, myRunsOnly]);

  const handleRunDeleted = (runId: number) => {
    setRuns((prev) => prev.filter((r) => r.id !== runId));
    setSelectedRunId(null);
    fetchStats();
  };

  const handleSelectRouteToSchedule = (route: RouteItem) => {
    setRouteToSchedule(route);
    setIsPostModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar
        stats={stats}
        routeCount={routes.length}
        onOpenPostRun={() => {
          setRouteToSchedule(null);
          setIsPostModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenRouteLibrary={() => setIsRouteLibraryOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroBanner
          onPostRunClick={() => {
            setRouteToSchedule(null);
            setIsPostModalOpen(true);
          }}
          onRouteLibraryClick={() => setIsRouteLibraryOpen(true)}
          onExploreClick={() => {
            const el = document.getElementById('runs-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <section id="runs-section" className="scroll-mt-24">
          <RunFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedDistance={selectedDistance}
            setSelectedDistance={setSelectedDistance}
            myRunsOnly={myRunsOnly}
            setMyRunsOnly={setMyRunsOnly}
            isLoggedIn={!!user}
            totalCount={filteredRuns.length}
          />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 h-72 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-1/3 h-5 bg-zinc-800 rounded-lg" />
                    <div className="w-4/5 h-6 bg-zinc-800 rounded-lg" />
                    <div className="w-full h-12 bg-zinc-850 rounded-lg" />
                  </div>
                  <div className="w-full h-8 bg-zinc-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-12 text-center max-w-lg mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No upcoming runs match</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Try loosening your distance or surface filters, or pick a course from our Route Library!
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedDistance('all');
                    setMyRunsOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
                <button
                  onClick={() => setIsRouteLibraryOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Browse Routes</span>
                </button>
                <button
                  onClick={() => {
                    setRouteToSchedule(null);
                    setIsPostModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Post a Run</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRuns.map((run) => (
                <RunCard
                  key={run.id}
                  run={run}
                  isLoggedIn={!!user}
                  onSelect={() => handleOpenRunModal(run.id)}
                  onToggleRsvp={(e, status) => handleQuickToggleRsvp(e, run.id, status)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 bg-zinc-950 mt-16 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-zinc-300">APEX STRIDE RUNNING CLUB</span>
            <span>•</span>
            <span>Cloud SQL & PostgreSQL Route Library</span>
          </div>
          <p>© {new Date().getFullYear()} Apex Stride. Run fast, run together, finish with coffee.</p>
        </div>
      </footer>

      {/* Modals */}
      {selectedRunId !== null && (
        <RunDetailModal
          runId={selectedRunId}
          onClose={handleCloseRunModal}
          onRunUpdated={() => {
            fetchRuns();
            fetchStats();
            fetchRoutes();
          }}
          onRunDeleted={handleRunDeleted}
        />
      )}

      {isPostModalOpen && (
        <PostRunModal
          routes={routes}
          initialRoute={routeToSchedule}
          onClose={() => {
            setIsPostModalOpen(false);
            setRouteToSchedule(null);
          }}
          onRunCreated={() => {
            fetchRuns();
            fetchStats();
            fetchRoutes();
          }}
        />
      )}

      {isRouteLibraryOpen && (
        <RouteLibraryModal
          routes={routes}
          onClose={() => setIsRouteLibraryOpen(false)}
          onRefreshRoutes={() => {
            fetchRoutes();
            fetchStats();
          }}
          onSelectRouteToSchedule={handleSelectRouteToSchedule}
        />
      )}

      {isProfileModalOpen && (
        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RunningClubApp />
    </AuthProvider>
  );
}
