import React, { useEffect, useMemo, useState } from 'react';
import { appendSupportChatMessage, getSupportChats, updateSupportChatSession } from '../../../services/backend';
import { SupportChatSession } from '../../../types';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';

export const SupportTab: React.FC = () => {
  const [sessions, setSessions] = useState<SupportChatSession[]>([]);
  const [filterUnsatisfied, setFilterUnsatisfied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replyBySession, setReplyBySession] = useState<Record<string, string>>({});
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await getSupportChats();
      setSessions(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
    const timer = window.setInterval(() => void loadSessions(), 8000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleSessions = useMemo(() => {
    if (!filterUnsatisfied) return sessions;
    return sessions.filter((session) => !session.satisfied);
  }, [sessions, filterUnsatisfied]);

  useEffect(() => {
    if (!visibleSessions.length) {
      setExpandedSessionId(null);
      setHasAutoExpanded(false);
      return;
    }

    // Only auto-open once per list/filter load; respect manual "Hide Query".
    if (!hasAutoExpanded && !expandedSessionId) {
      setExpandedSessionId(visibleSessions[0].id);
      setHasAutoExpanded(true);
      return;
    }

    // If selected session disappears (e.g. filter switch), open first available.
    if (expandedSessionId && !visibleSessions.some((session) => session.id === expandedSessionId)) {
      setExpandedSessionId(visibleSessions[0].id);
      setHasAutoExpanded(true);
    }
  }, [expandedSessionId, hasAutoExpanded, visibleSessions]);

  useEffect(() => {
    // Reset auto-expand behavior when changing filters.
    setHasAutoExpanded(false);
  }, [filterUnsatisfied]);

  const markResolved = async (session: SupportChatSession) => {
    if (session.status === 'resolved' && session.satisfied) return;
    setActionSessionId(session.id);
    setActionError('');
    try {
      setSessions((prev) =>
        prev.map((item) =>
          item.id === session.id ? { ...item, status: 'resolved', satisfied: true } : item
        )
      );
      await updateSupportChatSession(session.id, { status: 'resolved', satisfied: true });
      await loadSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark resolved';
      setActionError(message);
      await loadSessions();
    } finally {
      setActionSessionId(null);
    }
  };

  const sendManualReply = async (session: SupportChatSession) => {
    const reply = (replyBySession[session.id] || '').trim();
    if (!reply) return;
    setActionSessionId(session.id);
    setActionError('');
    try {
      await appendSupportChatMessage(
        session.id,
        {
          id: `admin_${Date.now()}`,
          sender: 'admin',
          text: reply,
          timestamp: new Date().toISOString(),
        },
        { status: 'open' }
      );
      setReplyBySession((prev) => ({ ...prev, [session.id]: '' }));
      await loadSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reply';
      setActionError(message);
    } finally {
      setActionSessionId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        title="Support Chats"
        subtitle="Monitor customer chat sessions, unresolved conversations, and send manual replies"
      />

      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-4 flex flex-wrap gap-2">
        <Button size="sm" variant={filterUnsatisfied ? 'outline' : 'primary'} onClick={() => setFilterUnsatisfied(false)}>
          All Sessions ({sessions.length})
        </Button>
        <Button size="sm" variant={filterUnsatisfied ? 'primary' : 'outline'} onClick={() => setFilterUnsatisfied(true)}>
          Unsatisfied ({sessions.filter((session) => !session.satisfied).length})
        </Button>
        <Button size="sm" variant="outline" onClick={() => void loadSessions()} isLoading={isLoading}>
          Refresh
        </Button>
      </div>
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {actionError}
        </div>
      )}

      <div className="space-y-4">
        {visibleSessions.map((session) => {
          const lastMessage = session.messages?.[session.messages.length - 1];
          return (
            <div key={session.id} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {session.userName || session.userEmail || session.userId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Session: {session.id} | Last: {new Date(session.lastMessageAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${session.satisfied ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {session.satisfied ? 'Satisfied' : 'Unsatisfied'}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${session.status === 'resolved' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                    {session.status === 'resolved' ? 'Resolved' : 'Open'}
                  </span>
                </div>
              </div>

              {lastMessage && (
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Latest:</span> {lastMessage.text}
                </p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={expandedSessionId === session.id ? 'outline' : 'primary'}
                    onClick={() => setExpandedSessionId((prev) => (prev === session.id ? null : session.id))}
                  >
                    {expandedSessionId === session.id ? 'Hide Query' : 'Open Query'}
                  </Button>
                </div>

                {expandedSessionId === session.id && (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 space-y-2">
                    {(session.messages || []).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                            message.sender === 'user'
                              ? 'bg-primary-600 text-white'
                              : message.sender === 'admin'
                              ? 'bg-emerald-600/90 text-white'
                              : 'bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className="mt-1 text-[11px] opacity-80">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!session.messages?.length && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">No messages in this session yet.</p>
                    )}
                  </div>
                )}

                <textarea
                  value={replyBySession[session.id] || ''}
                  onChange={(e) => setReplyBySession((prev) => ({ ...prev, [session.id]: e.target.value }))}
                  placeholder="Write manual reply..."
                  className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 p-3 text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void sendManualReply(session)}
                    isLoading={actionSessionId === session.id}
                  >
                    Send Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void markResolved(session)}
                    isLoading={actionSessionId === session.id}
                    disabled={session.status === 'resolved' && session.satisfied}
                  >
                    {session.status === 'resolved' && session.satisfied ? 'Resolved' : 'Mark Resolved'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {visibleSessions.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-6 text-center text-sm text-gray-500">
            No chat sessions found.
          </div>
        )}
      </div>
    </div>
  );
};
