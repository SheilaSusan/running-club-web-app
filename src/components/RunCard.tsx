import React, { useState } from 'react';
import { RunSummary } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Calendar,
  Clock,
  MapPin,
  Coffee,
  Users,
  Gauge,
  Check,
  Navigation,
  Link as LinkIcon,
  Share2,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';

interface RunCardProps {
  run: RunSummary;
  onSelect: () => void;
  onToggleRsvp: (e: React.MouseEvent, status: 'going' | 'interested') => void;
  isLoggedIn: boolean;
}

export const RunCard: React.FC<RunCardProps> = ({ run, onSelect, onToggleRsvp, isLoggedIn }) => {
  const { user, dbUser } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllAttendees, setShowAllAttendees] = useState(false);

  // Format human-friendly date
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Convert 24h time to 12h AM/PM
  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getRunTypeBadge = (type: string) => {
    switch (type) {
      case 'Tempo / Intervals':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Long Run':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Trail Run':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    }
  };

  const isGoing = run.userRsvp === 'going';

  // Filter attending runners who marked 'going'
  const attendingRunners = (run.attendees || []).filter((a) => a.status === 'going');

  // Copy shareable invite link
  const handleCopyInviteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const inviteUrl = `${window.location.origin}/?run=${run.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const visibleAttendees = showAllAttendees
    ? attendingRunners
    : attendingRunners.slice(0, 4);

  const hasRemainingAttendees = attendingRunners.length > 4;

  const capacityPercent = run.maxParticipants
    ? Math.min(100, Math.round((run.goingCount / run.maxParticipants) * 100))
    : null;

  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col justify-between rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 p-5 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/5 cursor-pointer"
    >
      <div>
        {/* Top Header: Date, Time, Run Type, and Copy Invite Link */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/90 text-emerald-400 border border-zinc-700/60 font-mono text-[11px] font-bold">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(run.date)}
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(run.time)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copyable Invite Link Button */}
            <button
              onClick={handleCopyInviteLink}
              title="Copy shareable invite link"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-800/80 hover:bg-zinc-700/90 text-zinc-400 hover:text-zinc-200 border-zinc-700/60'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-300 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200" />
                  <span className="hidden sm:inline">Invite Link</span>
                </>
              )}
            </button>

            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRunTypeBadge(
                run.runType
              )}`}
            >
              {run.runType}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
          {run.title}
        </h3>

        {/* Key Metrics: Distance & Pace Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold text-xs">
            <span>{run.distanceKm} km</span>
            <span className="text-emerald-500/50">/</span>
            <span className="text-[11px] font-normal text-emerald-400/80">
              {(Number(run.distanceKm) * 0.621371).toFixed(1)} mi
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 text-xs font-medium">
            <Gauge className="w-3.5 h-3.5 text-zinc-400" />
            <span>{run.pace}</span>
          </div>

          <div className="px-2 py-1 rounded-lg bg-zinc-800/40 text-zinc-400 text-xs border border-zinc-800">
            {run.surface}
          </div>
        </div>

        {/* Associated Route if scheduled from library */}
        {run.routeTitle && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 mb-3">
            <Navigation className="w-3 h-3 text-teal-400 shrink-0" />
            <span className="truncate">Route: {run.routeTitle}</span>
          </div>
        )}

        {/* Description snippet */}
        <p className="text-xs text-zinc-400 line-clamp-2 mb-3.5 leading-relaxed">
          {run.description}
        </p>

        {/* Meetup Location */}
        <div className="space-y-1 mb-4 text-xs text-zinc-300">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1 font-medium">{run.meetupLocation}</span>
          </div>

          {run.coffeeSpot && (
            <div className="flex items-start gap-2 text-zinc-400">
              <Coffee className="w-4 h-4 text-amber-400/90 shrink-0 mt-0.5" />
              <span className="line-clamp-1 text-[11px]">Post-run: {run.coffeeSpot}</span>
            </div>
          )}
        </div>

        {/* Attendee Counter Box */}
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 mb-3.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-100">
                {run.goingCount} {run.goingCount === 1 ? 'Runner Attending' : 'Runners Attending'}
              </span>
            </div>

            {run.maxParticipants && (
              <span className="text-[11px] font-semibold text-zinc-400">
                {run.goingCount} / {run.maxParticipants} max capacity
              </span>
            )}
          </div>

          {/* Capacity Progress Bar if limit exists */}
          {run.maxParticipants && (
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  (capacityPercent || 0) >= 90
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          )}

          {/* List of Attending Runners on the Card */}
          <div className="mt-2 pt-2 border-t border-zinc-850">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attending Runners ({attendingRunners.length})</span>
              </span>

              {hasRemainingAttendees && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllAttendees(!showAllAttendees);
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-semibold cursor-pointer"
                >
                  <span>{showAllAttendees ? 'Show Less' : `+${attendingRunners.length - 4} more`}</span>
                  {showAllAttendees ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {attendingRunners.length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic py-0.5">
                No runners joined yet. Be the first to join!
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visibleAttendees.map((attendee, idx) => {
                  const isCurrentUser =
                    (dbUser && dbUser.id === attendee.userId) ||
                    (user && user.displayName === attendee.displayName);

                  return (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        isCurrentUser
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {attendee.photoUrl ? (
                        <img
                          src={attendee.photoUrl}
                          alt={attendee.displayName}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-zinc-800 text-emerald-400 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {(attendee.displayName || 'R')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="max-w-[110px] truncate">{attendee.displayName}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                          You
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: RSVP CTA & Quick Actions */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <button
          onClick={handleCopyInviteLink}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 transition-colors cursor-pointer"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              <span className="text-emerald-300 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Invite Link</span>
            </>
          )}
        </button>

        {/* RSVP button: Join Run / Joined */}
        <button
          onClick={(e) => onToggleRsvp(e, 'going')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isGoing
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 group/btn'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20 font-extrabold'
          }`}
          title={isGoing ? 'Click to leave run' : 'RSVP to join this upcoming stride'}
        >
          {isGoing ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] group-hover/btn:hidden" />
              <span className="group-hover/btn:hidden">Joined ✓</span>
              <span className="hidden group-hover/btn:inline">Leave Run</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Join Run</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
