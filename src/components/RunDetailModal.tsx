import React, { useState, useEffect } from 'react';
import { RunDetails, RunComment } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Coffee,
  Users,
  Gauge,
  ExternalLink,
  MessageSquare,
  Send,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Share2,
  Navigation,
  Compass,
} from 'lucide-react';

interface RunDetailModalProps {
  runId: number;
  onClose: () => void;
  onRunUpdated: () => void;
  onRunDeleted: (runId: number) => void;
}

export const RunDetailModal: React.FC<RunDetailModalProps> = ({
  runId,
  onClose,
  onRunUpdated,
  onRunDeleted,
}) => {
  const { user, dbUser, getToken, signInWithGoogle } = useAuth();
  const [run, setRun] = useState<RunDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRun = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/runs/${runId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRun(data);
        }
      } catch (err) {
        console.error('Failed to load run details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRun();
    return () => {
      isMounted = false;
    };
  }, [runId, getToken]);

  const handleRsvp = async (status: 'going' | 'interested') => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    try {
      setIsSubmittingRsvp(true);
      const token = await getToken();
      const res = await fetch(`/api/runs/${runId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const result = await res.json();
        // Optimistically update
        setRun((prev) => {
          if (!prev) return prev;
          const newStatus = result.status;
          return {
            ...prev,
            userRsvp: newStatus,
          };
        });
        onRunUpdated();

        // Refetch complete details to update attendee list
        const refreshed = await fetch(`/api/runs/${runId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshed.ok) {
          setRun(await refreshed.json());
        }
      }
    } catch (err) {
      console.error('RSVP toggle failed:', err);
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      await signInWithGoogle();
      return;
    }

    try {
      setIsSubmittingComment(true);
      const token = await getToken();
      const res = await fetch(`/api/runs/${runId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setRun((prev) => (prev ? { ...prev, comments: [...prev.comments, newComment] } : prev));
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      setIsDeleting(true);
      const token = await getToken();
      const res = await fetch(`/api/runs/${runId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        onRunDeleted(runId);
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete run:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyAddress = () => {
    if (!run) return;
    navigator.clipboard.writeText(run.meetupLocation);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 2000);
  };

  const handleCopyInviteLink = () => {
    if (!run) return;
    const inviteUrl = `${window.location.origin}/?run=${run.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2200);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-400">Loading run details...</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return null;
  }

  const isCreator = dbUser && dbUser.id === run.creatorId;
  const isGoing = run.userRsvp === 'going';
  const isInterested = run.userRsvp === 'interested';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between gap-4 bg-gradient-to-r from-zinc-900 to-zinc-900/60">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {run.runType}
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-400">{run.surface} Surface</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {run.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyInviteLink}
              title="Copy shareable invite link"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                copiedInvite
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              }`}
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-300 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Invite Link</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Date</span>
              </div>
              <p className="font-bold text-white text-sm">{run.date}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Start Time</span>
              </div>
              <p className="font-bold text-white text-sm">{run.time}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Distance</span>
              </div>
              <p className="font-bold text-white text-sm">
                {run.distanceKm} km{' '}
                <span className="text-xs text-zinc-500 font-normal">
                  ({(Number(run.distanceKm) * 0.621371).toFixed(1)} mi)
                </span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Target Pace</span>
              </div>
              <p className="font-bold text-white text-sm">{run.pace}</p>
            </div>
          </div>

          {run.routeTitle && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs">
              <Navigation className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                Course from Club Route Library: <strong className="text-white">{run.routeTitle}</strong>
              </span>
            </div>
          )}

          {/* Organizer Details */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80">
            <div className="flex items-center gap-3">
              {run.creatorPhoto ? (
                <img
                  src={run.creatorPhoto}
                  alt={run.creatorName || 'Organizer'}
                  className="w-11 h-11 rounded-xl object-cover border border-emerald-500/30"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-base">
                  {(run.creatorName || 'O')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-400 font-medium">Run Organizer</p>
                <p className="font-bold text-white text-sm">
                  {run.creatorName || 'Club Member'}
                </p>
              </div>
            </div>

            {run.routeUrl && (
              <a
                href={run.routeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-emerald-400 border border-zinc-700 transition-colors cursor-pointer"
              >
                <span>Strava Route</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Run Details & Briefing
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/60">
              {run.description}
            </p>
          </div>

          {/* Meetup & Location Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <MapPin className="w-4 h-4" />
                  <span>Meetup Point</span>
                </div>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  {copiedLocation ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-semibold text-white text-sm mb-1">{run.meetupLocation}</p>
              {run.locationDetails && (
                <p className="text-xs text-zinc-400">{run.locationDetails}</p>
              )}
            </div>

            {run.coffeeSpot ? (
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                  <Coffee className="w-4 h-4" />
                  <span>Post-Run Social & Coffee</span>
                </div>
                <p className="font-semibold text-white text-sm mb-1">{run.coffeeSpot}</p>
                <p className="text-xs text-zinc-400">Pastries, espresso, and runner chats afterwards</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-center text-center">
                <p className="text-xs text-zinc-500">Post-run meetup decided on the day!</p>
              </div>
            )}
          </div>

          {/* RSVP Control Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-base">
                  {run.rsvps.filter((r) => r.status === 'going').length} Runners Going
                </span>
                {run.maxParticipants && (
                  <span className="text-xs text-zinc-400">
                    ({run.maxParticipants - run.rsvps.filter((r) => r.status === 'going').length} spots left)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isGoing
                  ? "You're registered for this run! See you at the meetup."
                  : isInterested
                  ? 'Marked as interested. Lock in your spot when ready.'
                  : 'Join the group or mark as interested to stay updated.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRsvp('going')}
                disabled={isSubmittingRsvp}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs tracking-tight transition-all cursor-pointer ${
                  isGoing
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold shadow-md shadow-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isGoing ? 'Joined ✓ (Leave Run)' : 'Join Run'}</span>
              </button>

              <button
                onClick={() => handleRsvp('interested')}
                disabled={isSubmittingRsvp}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  isInterested
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Maybe</span>
              </button>
            </div>
          </div>

          {/* Attendee Roster */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Attendees Roster</span>
              <span className="text-zinc-500 font-normal">{run.rsvps.length} total</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {run.rsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80"
                >
                  {rsvp.photoUrl ? (
                    <img
                      src={rsvp.photoUrl}
                      alt={rsvp.displayName || 'Runner'}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center">
                      {(rsvp.displayName || rsvp.email || 'R')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-200 truncate">
                      {rsvp.displayName || rsvp.email.split('@')[0]}
                    </p>
                    <span
                      className={`text-[10px] font-medium ${
                        rsvp.status === 'going' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {rsvp.status === 'going' ? 'Going' : 'Interested'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Run Discussion & Comments Feed */}
          <div className="border-t border-zinc-800 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Runner Coordination & Discussion</span>
            </h4>

            {/* Comment List */}
            <div className="space-y-3 mb-4">
              {run.comments.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">
                  No questions or comments yet. Ask about pacing, gear, or bag drop!
                </p>
              ) : (
                run.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-3"
                  >
                    {comment.photoUrl ? (
                      <img
                        src={comment.photoUrl}
                        alt={comment.displayName || 'Member'}
                        className="w-7 h-7 rounded-lg object-cover shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {(comment.displayName || 'M')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-200 truncate">
                          {comment.displayName || 'Member'}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  user
                    ? 'Write a comment, question, or note...'
                    : 'Sign in with Google to post a comment'
                }
                disabled={!user && false}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Bottom Bar (Organizer controls & Close) */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          {isCreator ? (
            <div className="flex items-center gap-2">
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 font-medium">Cancel this run?</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete Run'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel / Delete Run</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-zinc-500">
              Run organized by {run.creatorName || 'Club Member'}
            </div>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
