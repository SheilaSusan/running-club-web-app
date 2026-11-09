import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { comments, routes, rsvps, runs, users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null,
  photoUrl?: string | null
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoUrl: photoUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
          ...(photoUrl ? { photoUrl } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query getOrCreateUser failed:', error);
    throw new Error('Failed to synchronize user profile', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query getUserByUid failed:', error);
    throw new Error('Failed to retrieve user record', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  profile: {
    displayName?: string;
    bio?: string;
    paceCategory?: string;
    favoriteDistance?: string;
  }
) {
  try {
    const updated = await db
      .update(users)
      .set(profile)
      .where(eq(users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query updateUserProfile failed:', error);
    throw new Error('Failed to update user profile', { cause: error });
  }
}

// Route Library queries
export async function getRoutesList() {
  try {
    const allRoutes = await db
      .select({
        id: routes.id,
        creatorId: routes.creatorId,
        title: routes.title,
        distanceKm: routes.distanceKm,
        difficulty: routes.difficulty,
        startLocation: routes.startLocation,
        elevationGainM: routes.elevationGainM,
        surface: routes.surface,
        description: routes.description,
        mapUrl: routes.mapUrl,
        createdAt: routes.createdAt,
        creatorName: users.displayName,
        creatorPhoto: users.photoUrl,
      })
      .from(routes)
      .innerJoin(users, eq(routes.creatorId, users.id))
      .orderBy(routes.title);

    // Get usage count per route
    const usageCounts = await db
      .select({
        routeId: runs.routeId,
        count: sql<number>`count(*)`,
      })
      .from(runs)
      .where(sql`${runs.routeId} IS NOT NULL`)
      .groupBy(runs.routeId);

    const usageMap = new Map<number, number>();
    for (const u of usageCounts) {
      if (u.routeId) usageMap.set(u.routeId, Number(u.count));
    }

    return allRoutes.map((r) => ({
      ...r,
      usageCount: usageMap.get(r.id) || 0,
    }));
  } catch (error) {
    console.error('Database query getRoutesList failed:', error);
    throw new Error('Failed to fetch route library', { cause: error });
  }
}

export async function createRoute(data: {
  creatorId: number;
  title: string;
  distanceKm: string;
  difficulty: string;
  startLocation: string;
  elevationGainM?: number;
  surface?: string;
  description?: string;
  mapUrl?: string;
}) {
  try {
    const inserted = await db
      .insert(routes)
      .values({
        creatorId: data.creatorId,
        title: data.title,
        distanceKm: data.distanceKm,
        difficulty: data.difficulty,
        startLocation: data.startLocation,
        elevationGainM: data.elevationGainM || null,
        surface: data.surface || 'Road',
        description: data.description || null,
        mapUrl: data.mapUrl || null,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database query createRoute failed:', error);
    throw new Error('Failed to save route to library', { cause: error });
  }
}

export async function deleteRoute(routeId: number, creatorId: number) {
  try {
    const deleted = await db
      .delete(routes)
      .where(and(eq(routes.id, routeId), eq(routes.creatorId, creatorId)))
      .returning();
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query deleteRoute failed:', error);
    throw new Error('Failed to delete route', { cause: error });
  }
}

// Scheduled Runs queries
export async function getRunsList(currentUserId?: number) {
  try {
    const allRuns = await db
      .select({
        id: runs.id,
        creatorId: runs.creatorId,
        routeId: runs.routeId,
        title: runs.title,
        description: runs.description,
        date: runs.date,
        time: runs.time,
        meetupLocation: runs.meetupLocation,
        locationDetails: runs.locationDetails,
        distanceKm: runs.distanceKm,
        pace: runs.pace,
        runType: runs.runType,
        surface: runs.surface,
        maxParticipants: runs.maxParticipants,
        coffeeSpot: runs.coffeeSpot,
        routeUrl: runs.routeUrl,
        createdAt: runs.createdAt,
        creatorName: users.displayName,
        creatorPhoto: users.photoUrl,
        creatorEmail: users.email,
        routeTitle: routes.title,
      })
      .from(runs)
      .innerJoin(users, eq(runs.creatorId, users.id))
      .leftJoin(routes, eq(runs.routeId, routes.id))
      .orderBy(runs.date, runs.time);

    // Fetch all RSVPs to aggregate counts and check user status
    const allRsvps = await db
      .select({
        runId: rsvps.runId,
        userId: rsvps.userId,
        status: rsvps.status,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
      })
      .from(rsvps)
      .innerJoin(users, eq(rsvps.userId, users.id));

    // Group RSVPs by run
    const rsvpsByRun = new Map<number, typeof allRsvps>();
    for (const r of allRsvps) {
      const list = rsvpsByRun.get(r.runId) || [];
      list.push(r);
      rsvpsByRun.set(r.runId, list);
    }

    // Attach RSVP counts & attendee details
    return allRuns.map((run) => {
      const runRsvps = rsvpsByRun.get(run.id) || [];
      const goingCount = runRsvps.filter((r) => r.status === 'going').length;
      const interestedCount = runRsvps.filter((r) => r.status === 'interested').length;
      const userRsvp = currentUserId
        ? runRsvps.find((r) => r.userId === currentUserId)?.status || null
        : null;

      return {
        ...run,
        goingCount,
        interestedCount,
        userRsvp,
        attendees: runRsvps.map((r) => ({
          userId: r.userId,
          status: r.status,
          displayName: r.displayName || 'Runner',
          photoUrl: r.photoUrl,
        })),
      };
    });
  } catch (error) {
    console.error('Database query getRunsList failed:', error);
    throw new Error('Failed to fetch scheduled runs', { cause: error });
  }
}

export async function getRunDetails(runId: number, currentUserId?: number) {
  try {
    const runRows = await db
      .select({
        id: runs.id,
        creatorId: runs.creatorId,
        routeId: runs.routeId,
        title: runs.title,
        description: runs.description,
        date: runs.date,
        time: runs.time,
        meetupLocation: runs.meetupLocation,
        locationDetails: runs.locationDetails,
        distanceKm: runs.distanceKm,
        pace: runs.pace,
        runType: runs.runType,
        surface: runs.surface,
        maxParticipants: runs.maxParticipants,
        coffeeSpot: runs.coffeeSpot,
        routeUrl: runs.routeUrl,
        createdAt: runs.createdAt,
        creatorName: users.displayName,
        creatorPhoto: users.photoUrl,
        creatorEmail: users.email,
        creatorUid: users.uid,
        routeTitle: routes.title,
      })
      .from(runs)
      .innerJoin(users, eq(runs.creatorId, users.id))
      .leftJoin(routes, eq(runs.routeId, routes.id))
      .where(eq(runs.id, runId))
      .limit(1);

    if (!runRows.length) return null;
    const run = runRows[0];

    const runRsvps = await db
      .select({
        id: rsvps.id,
        userId: rsvps.userId,
        status: rsvps.status,
        createdAt: rsvps.createdAt,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
        email: users.email,
      })
      .from(rsvps)
      .innerJoin(users, eq(rsvps.userId, users.id))
      .where(eq(rsvps.runId, runId));

    const runComments = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.runId, runId))
      .orderBy(comments.createdAt);

    const userRsvp = currentUserId
      ? runRsvps.find((r) => r.userId === currentUserId)?.status || null
      : null;

    return {
      ...run,
      userRsvp,
      rsvps: runRsvps,
      comments: runComments,
    };
  } catch (error) {
    console.error('Database query getRunDetails failed:', error);
    throw new Error('Failed to retrieve run details', { cause: error });
  }
}

export async function createNewRun(data: {
  creatorId: number;
  routeId?: number;
  title: string;
  description: string;
  date: string;
  time: string;
  meetupLocation: string;
  locationDetails?: string;
  distanceKm: string;
  pace: string;
  runType: string;
  surface: string;
  maxParticipants?: number;
  coffeeSpot?: string;
  routeUrl?: string;
}) {
  try {
    const insertedRun = await db
      .insert(runs)
      .values({
        creatorId: data.creatorId,
        routeId: data.routeId || null,
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        meetupLocation: data.meetupLocation,
        locationDetails: data.locationDetails || null,
        distanceKm: data.distanceKm,
        pace: data.pace,
        runType: data.runType,
        surface: data.surface,
        maxParticipants: data.maxParticipants || null,
        coffeeSpot: data.coffeeSpot || null,
        routeUrl: data.routeUrl || null,
      })
      .returning();

    const created = insertedRun[0];

    // Automatically RSVP organizer as 'going'
    await db.insert(rsvps).values({
      runId: created.id,
      userId: data.creatorId,
      status: 'going',
    });

    return created;
  } catch (error) {
    console.error('Database query createNewRun failed:', error);
    throw new Error('Failed to post new run', { cause: error });
  }
}

export async function deleteRun(runId: number, creatorId: number) {
  try {
    const result = await db
      .delete(runs)
      .where(and(eq(runs.id, runId), eq(runs.creatorId, creatorId)))
      .returning();
    return result.length > 0;
  } catch (error) {
    console.error('Database query deleteRun failed:', error);
    throw new Error('Failed to delete run', { cause: error });
  }
}

export async function toggleRsvp(
  runId: number,
  userId: number,
  status: 'going' | 'interested'
) {
  try {
    const existing = await db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.runId, runId), eq(rsvps.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].status === status) {
        // Toggle off
        await db.delete(rsvps).where(eq(rsvps.id, existing[0].id));
        return { status: null };
      } else {
        // Switch status
        await db
          .update(rsvps)
          .set({ status })
          .where(eq(rsvps.id, existing[0].id));
        return { status };
      }
    } else {
      await db.insert(rsvps).values({
        runId,
        userId,
        status,
      });
      return { status };
    }
  } catch (error) {
    console.error('Database query toggleRsvp failed:', error);
    throw new Error('Failed to update RSVP status', { cause: error });
  }
}

export async function addCommentToRun(
  runId: number,
  userId: number,
  content: string
) {
  try {
    const inserted = await db
      .insert(comments)
      .values({
        runId,
        userId,
        content,
      })
      .returning();

    const commentId = inserted[0].id;
    const commentWithUser = await db
      .select({
        id: comments.id,
        runId: comments.runId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        displayName: users.displayName,
        photoUrl: users.photoUrl,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, commentId))
      .limit(1);

    return commentWithUser[0];
  } catch (error) {
    console.error('Database query addCommentToRun failed:', error);
    throw new Error('Failed to post comment', { cause: error });
  }
}

export async function getClubStats() {
  try {
    const totalRunsResult = await db.select({ count: sql<number>`count(*)` }).from(runs);
    const totalRsvpsResult = await db.select({ count: sql<number>`count(*)` }).from(rsvps);
    const totalMembersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalRoutesResult = await db.select({ count: sql<number>`count(*)` }).from(routes);

    return {
      totalRuns: Number(totalRunsResult[0]?.count || 0),
      totalRsvps: Number(totalRsvpsResult[0]?.count || 0),
      totalMembers: Number(totalMembersResult[0]?.count || 0),
      totalRoutes: Number(totalRoutesResult[0]?.count || 0),
    };
  } catch (error) {
    console.error('Database query getClubStats failed:', error);
    throw new Error('Failed to fetch club statistics', { cause: error });
  }
}
