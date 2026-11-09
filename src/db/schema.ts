import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  bio: text('bio'),
  paceCategory: text('pace_category'),
  favoriteDistance: text('favorite_distance'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Route Library where members can save favorite running routes
export const routes = pgTable('routes', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  distanceKm: text('distance_km').notNull(),
  difficulty: text('difficulty').notNull(), // 'Easy', 'Moderate', 'Challenging', 'Epic'
  startLocation: text('start_location').notNull(),
  elevationGainM: integer('elevation_gain_m'),
  surface: text('surface').notNull().default('Road'), // 'Road', 'Trail', 'Track', 'Mixed'
  description: text('description'),
  mapUrl: text('map_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Runs table posted by club members
export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  routeId: integer('route_id')
    .references(() => routes.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:MM (24h)
  meetupLocation: text('meetup_location').notNull(),
  locationDetails: text('location_details'),
  distanceKm: text('distance_km').notNull(),
  pace: text('pace').notNull(),
  runType: text('run_type').notNull(), // 'Easy Social', 'Tempo / Intervals', 'Long Run', 'Trail Run', 'Recovery'
  surface: text('surface').notNull(), // 'Road', 'Trail', 'Track', 'Mixed'
  maxParticipants: integer('max_participants'),
  coffeeSpot: text('coffee_spot'),
  routeUrl: text('route_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// RSVPs table for attendees
export const rsvps = pgTable('rsvps', {
  id: serial('id').primaryKey(),
  runId: integer('run_id')
    .references(() => runs.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('going'), // 'going', 'interested'
  createdAt: timestamp('created_at').defaultNow(),
});

// Comments / discussion on a run
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  runId: integer('run_id')
    .references(() => runs.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  runs: many(runs),
  routes: many(routes),
  rsvps: many(rsvps),
  comments: many(comments),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  creator: one(users, {
    fields: [routes.creatorId],
    references: [users.id],
  }),
  runs: many(runs),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  creator: one(users, {
    fields: [runs.creatorId],
    references: [users.id],
  }),
  route: one(routes, {
    fields: [runs.routeId],
    references: [routes.id],
  }),
  rsvps: many(rsvps),
  comments: many(comments),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  run: one(runs, {
    fields: [rsvps.runId],
    references: [runs.id],
  }),
  user: one(users, {
    fields: [rsvps.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  run: one(runs, {
    fields: [comments.runId],
    references: [runs.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));
