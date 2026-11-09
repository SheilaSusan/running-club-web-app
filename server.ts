import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUserByUid,
  updateUserProfile,
  getRunsList,
  getRunDetails,
  createNewRun,
  deleteRun,
  toggleRsvp,
  addCommentToRun,
  getClubStats,
  getRoutesList,
  createRoute,
  deleteRoute,
} from './src/db/queries.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Apex Stride Running Club API' });
});

// Club stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getClubStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Failed to get club stats:', error);
    res.status(500).json({ error: error.message || 'Failed to get stats' });
  }
});

// Current user sync & profile retrieval
app.get('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const token = req.user!;
    const user = await getOrCreateUser(
      token.uid,
      token.email || `${token.uid}@apexstride.club`,
      token.name || null,
      token.picture || null
    );
    res.json(user);
  } catch (error: any) {
    console.error('Failed to get current user:', error);
    res.status(500).json({ error: error.message || 'Failed to authenticate member' });
  }
});

// Update member running profile
app.put('/api/users/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { displayName, bio, paceCategory, favoriteDistance } = req.body;
    const updated = await updateUserProfile(req.user!.uid, {
      displayName,
      bio,
      paceCategory,
      favoriteDistance,
    });
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Route Library Endpoints
app.get('/api/routes', async (req, res) => {
  try {
    const routesList = await getRoutesList();
    res.json(routesList);
  } catch (error: any) {
    console.error('Failed to list routes:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch route library' });
  }
});

app.post('/api/routes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const token = req.user!;
    const user = await getOrCreateUser(
      token.uid,
      token.email || `${token.uid}@apexstride.club`,
      token.name || null,
      token.picture || null
    );

    const {
      title,
      distanceKm,
      difficulty,
      startLocation,
      elevationGainM,
      surface,
      description,
      mapUrl,
    } = req.body;

    if (!title || !distanceKm || !difficulty || !startLocation) {
      return res.status(400).json({
        error: 'Missing required route fields: title, distanceKm, difficulty, startLocation',
      });
    }

    const newRoute = await createRoute({
      creatorId: user.id,
      title: title.trim(),
      distanceKm: String(distanceKm).trim(),
      difficulty: difficulty.trim(),
      startLocation: startLocation.trim(),
      elevationGainM: elevationGainM ? Number(elevationGainM) : undefined,
      surface: surface?.trim() || 'Road',
      description: description?.trim() || undefined,
      mapUrl: mapUrl?.trim() || undefined,
    });

    res.status(201).json(newRoute);
  } catch (error: any) {
    console.error('Failed to create route:', error);
    res.status(500).json({ error: error.message || 'Failed to save route to library' });
  }
});

app.delete('/api/routes/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const routeId = Number(req.params.id);
    if (isNaN(routeId)) return res.status(400).json({ error: 'Invalid route ID' });

    const user = await getUserByUid(req.user!.uid);
    if (!user) return res.status(401).json({ error: 'User record not found' });

    const success = await deleteRoute(routeId, user.id);
    if (!success) {
      return res.status(403).json({ error: 'Only the author can delete this route' });
    }

    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete route:', error);
    res.status(500).json({ error: error.message || 'Failed to delete route' });
  }
});

// List upcoming runs
app.get('/api/runs', optionalAuth, async (req: AuthRequest, res) => {
  try {
    let currentUserId: number | undefined;
    if (req.user?.uid) {
      const user = await getUserByUid(req.user.uid);
      if (user) currentUserId = user.id;
    }

    const runs = await getRunsList(currentUserId);
    res.json(runs);
  } catch (error: any) {
    console.error('Failed to list runs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch runs' });
  }
});

// Post a new run
app.post('/api/runs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const token = req.user!;
    const user = await getOrCreateUser(
      token.uid,
      token.email || `${token.uid}@apexstride.club`,
      token.name || null,
      token.picture || null
    );

    const {
      title,
      description,
      date,
      time,
      meetupLocation,
      locationDetails,
      distanceKm,
      pace,
      runType,
      surface,
      maxParticipants,
      coffeeSpot,
      routeUrl,
      routeId,
    } = req.body;

    if (!title || !description || !date || !time || !meetupLocation || !distanceKm || !pace) {
      return res.status(400).json({
        error: 'Missing required run details: title, description, date, time, meetupLocation, distance, pace',
      });
    }

    const newRun = await createNewRun({
      creatorId: user.id,
      routeId: routeId ? Number(routeId) : undefined,
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      meetupLocation: meetupLocation.trim(),
      locationDetails: locationDetails?.trim() || undefined,
      distanceKm: String(distanceKm).trim(),
      pace: pace.trim(),
      runType: runType || 'Easy Social',
      surface: surface || 'Road',
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      coffeeSpot: coffeeSpot?.trim() || undefined,
      routeUrl: routeUrl?.trim() || undefined,
    });

    res.status(201).json(newRun);
  } catch (error: any) {
    console.error('Failed to create run:', error);
    res.status(500).json({ error: error.message || 'Failed to create run' });
  }
});

// Run details with RSVPs and comments
app.get('/api/runs/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const runId = Number(req.params.id);
    if (isNaN(runId)) return res.status(400).json({ error: 'Invalid run ID' });

    let currentUserId: number | undefined;
    if (req.user?.uid) {
      const user = await getUserByUid(req.user.uid);
      if (user) currentUserId = user.id;
    }

    const run = await getRunDetails(runId, currentUserId);
    if (!run) return res.status(404).json({ error: 'Run not found' });

    res.json(run);
  } catch (error: any) {
    console.error('Failed to fetch run details:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch run details' });
  }
});

// Delete run (organizer only)
app.delete('/api/runs/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const runId = Number(req.params.id);
    if (isNaN(runId)) return res.status(400).json({ error: 'Invalid run ID' });

    const user = await getUserByUid(req.user!.uid);
    if (!user) return res.status(401).json({ error: 'User record not found' });

    const success = await deleteRun(runId, user.id);
    if (!success) {
      return res.status(403).json({ error: 'Only the organizer can cancel this run' });
    }

    res.json({ success: true, message: 'Run deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete run:', error);
    res.status(500).json({ error: error.message || 'Failed to delete run' });
  }
});

// RSVP toggle
app.post('/api/runs/:id/rsvp', requireAuth, async (req: AuthRequest, res) => {
  try {
    const runId = Number(req.params.id);
    if (isNaN(runId)) return res.status(400).json({ error: 'Invalid run ID' });

    const token = req.user!;
    const user = await getOrCreateUser(
      token.uid,
      token.email || `${token.uid}@apexstride.club`,
      token.name || null,
      token.picture || null
    );

    const status = req.body.status === 'interested' ? 'interested' : 'going';
    const result = await toggleRsvp(runId, user.id, status);

    res.json(result);
  } catch (error: any) {
    console.error('Failed to update RSVP:', error);
    res.status(500).json({ error: error.message || 'Failed to update RSVP' });
  }
});

// Add comment to run
app.post('/api/runs/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const runId = Number(req.params.id);
    if (isNaN(runId)) return res.status(400).json({ error: 'Invalid run ID' });

    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Comment content cannot be empty' });

    const token = req.user!;
    const user = await getOrCreateUser(
      token.uid,
      token.email || `${token.uid}@apexstride.club`,
      token.name || null,
      token.picture || null
    );

    const comment = await addCommentToRun(runId, user.id, content);
    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Failed to post comment:', error);
    res.status(500).json({ error: error.message || 'Failed to post comment' });
  }
});

// Seed starter club runs if database has no runs
app.post('/api/seed', async (req, res) => {
  try {
    const existing = await getRunsList();
    if (existing.length > 0) {
      return res.json({ message: 'Database already has runs', count: existing.length });
    }

    // Create a club captain user
    const captain = await getOrCreateUser(
      'apex-captain-seed-001',
      'captain@apexstride.club',
      'Coach Elena Vance',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    );
    await updateUserProfile(captain.uid, {
      bio: 'Marathon pacer & Head Coach at Apex Stride. 2h58m PR. Always ready for a post-run flat white!',
      paceCategory: 'Tempo (4:30 - 5:15 min/km)',
      favoriteDistance: 'Half Marathon / Marathon',
    });

    // Seed 4 exciting upcoming runs
    const seedRuns = [
      {
        creatorId: captain.id,
        title: 'Sunrise Thames River Path 10K & Coffee',
        description:
          'Join us for our signature Saturday morning riverside stride! Flat, scenic route along the south embankment. We split into three pace groups (5:00, 5:30, and 6:15 min/km) so everyone finds their rhythm. Bag drop available at our clubhouse partner.',
        date: '2026-11-14',
        time: '08:00',
        meetupLocation: 'Tower Bridge South Steps, London',
        locationDetails: 'Gather by the shaded benches next to the Scoop amphitheatre.',
        distanceKm: '10.0',
        pace: '5:00 - 6:15 min/km',
        runType: 'Easy Social',
        surface: 'Road',
        maxParticipants: 45,
        coffeeSpot: 'WatchHouse Tower Bridge (Pastries & Espresso)',
        routeUrl: 'https://www.strava.com/routes/30588231',
      },
      {
        creatorId: captain.id,
        title: 'Wednesday Track Intervals: 800m Repeats',
        description:
          'Speed development night! Structure: 2km easy warm-up, dynamic mobility drills, 6 x 800m at 5k race pace with 90s active jog recovery, 1.5km cooldown. Perfect for tuning up your cadence and lactate threshold.',
        date: '2026-11-18',
        time: '18:45',
        meetupLocation: 'Battersea Park Millennium Arena Track',
        locationDetails: 'Track infield near lane 1 start line. Changing rooms on site.',
        distanceKm: '7.5',
        pace: '4:15 - 5:00 min/km',
        runType: 'Tempo / Intervals',
        surface: 'Track',
        maxParticipants: 25,
        coffeeSpot: 'Pear Tree Cafe post-track hydrate',
        routeUrl: '',
      },
      {
        creatorId: captain.id,
        title: 'Sunday Long Run: Hampstead Heath Trails 16K',
        description:
          'Build that aerobic engine! A picturesque loop taking in Parliament Hill viewpoint, Highgate Woods, and rolling heath paths. Trail shoes or versatile road shoes recommended as some autumn woodland paths are soft.',
        date: '2026-11-22',
        time: '09:00',
        meetupLocation: 'Parliament Hill Cafe, Hampstead Heath',
        locationDetails: 'Outside the cafe terrace near the outdoor seating.',
        distanceKm: '16.0',
        pace: '5:45 - 6:30 min/km',
        runType: 'Long Run',
        surface: 'Trail',
        maxParticipants: 35,
        coffeeSpot: 'Kenwood Brew Bar & bakery',
        routeUrl: 'https://www.strava.com/routes/31289110',
      },
      {
        creatorId: captain.id,
        title: 'Friday Sunset Social 5K + Shakeout',
        description:
          'Cap off the work week with an easy, conversational pace shakeout. Pure community vibes, zero pressure, all running abilities and beginners heartily welcomed. We finish right at our favorite local brewery taproom.',
        date: '2026-11-20',
        time: '18:00',
        meetupLocation: 'Regents Park Bandstand',
        locationDetails: 'Under the green gazebo by the lake.',
        distanceKm: '5.2',
        pace: '6:30 - 7:30 min/km',
        runType: 'Easy Social',
        surface: 'Road',
        maxParticipants: 50,
        coffeeSpot: 'The Hub Cafe & Craft Beer Tap',
        routeUrl: '',
      },
    ];

    for (const r of seedRuns) {
      await createNewRun(r);
    }

    res.json({ message: 'Seeded initial community runs successfully', count: seedRuns.length });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message || 'Failed to seed runs' });
  }
});

// Vite middleware or static serving
async function setupApp() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Stride server listening on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
