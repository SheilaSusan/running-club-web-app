export interface DbUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  bio: string | null;
  paceCategory: string | null;
  favoriteDistance: string | null;
  createdAt: string;
}

export interface RouteItem {
  id: number;
  creatorId: number;
  title: string;
  distanceKm: string;
  difficulty: string; // 'Easy', 'Moderate', 'Challenging', 'Epic'
  startLocation: string;
  elevationGainM: number | null;
  surface: string;
  description: string | null;
  mapUrl: string | null;
  createdAt: string;
  creatorName?: string | null;
  creatorPhoto?: string | null;
  usageCount?: number;
}

export interface RunAttendee {
  userId: number;
  status: 'going' | 'interested';
  displayName: string;
  photoUrl: string | null;
}

export interface RunSummary {
  id: number;
  creatorId: number;
  routeId: number | null;
  title: string;
  description: string;
  date: string;
  time: string;
  meetupLocation: string;
  locationDetails: string | null;
  distanceKm: string;
  pace: string;
  runType: string;
  surface: string;
  maxParticipants: number | null;
  coffeeSpot: string | null;
  routeUrl: string | null;
  createdAt: string;
  creatorName: string | null;
  creatorPhoto: string | null;
  creatorEmail: string;
  routeTitle?: string | null;
  goingCount: number;
  interestedCount: number;
  userRsvp: 'going' | 'interested' | null;
  attendees: RunAttendee[];
}

export interface RunComment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  displayName: string | null;
  photoUrl: string | null;
}

export interface RunDetails extends RunSummary {
  creatorUid?: string;
  comments: RunComment[];
  rsvps: Array<{
    id: number;
    userId: number;
    status: string;
    createdAt: string;
    displayName: string | null;
    photoUrl: string | null;
    email: string;
  }>;
}

export interface ClubStats {
  totalRuns: number;
  totalRsvps: number;
  totalMembers: number;
  totalRoutes?: number;
}
