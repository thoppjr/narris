import { useEffect, useState } from "react";
import * as cmd from "../lib/commands";
import type { EditorComment, CommentReply } from "../lib/commands";

interface CommentPaneProps {
  chapterId: string;
  projectId: string;
  authorName: string;
  commentColor: string;
  onSelectComment?: (comment: EditorComment) => void;
  onResolveComment?: (comment: EditorComment) => void;
  onDeleteComment?: (comment: EditorComment) => void;
  onAcceptSuggestion?: (comment: EditorComment) => void;
  onRejectSuggestion?: (comment: EditorComment) => void;
}

export default function CommentPane({ chapterId, projectId: _projectId, authorName, commentColor: _commentColor, onSelectComment, onResolveComment, onDeleteComment, onAcceptSuggestion, onRejectSuggestion }: CommentPaneProps) {
  const [comments, setComments] = useState<EditorComment[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<string, CommentReply[]>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadComments = async () => {
    if (!chapterId) return;
    const list = await cmd.listEditorComments(chapterId);
    setComments(list);
    // Load replies for all comments
    const rmap: Record<string, CommentReply[]> = {};
    for (const c of list) {
      rmap[c.id] = await cmd.listCommentReplies(c.id);
    }
    setRepliesMap(rmap);
  };

  useEffect(() => { loadComments(); }, [chapterId]); // eslint-disable-line

  const handleResolve = async (c: EditorComment) => {
    await cmd.resolveEditorComment(c.id, !c.resolved);
    if (!c.resolved) {
      // Resolving: remove highlight
      onResolveComment?.(c);
    }
    loadComments();
  };

  const handleDelete = async (c: EditorComment) => {
    onDeleteComment?.(c);
    await cmd.deleteEditorComment(c.id);
    loadComments();
  };

  const handleAccept = async (c: EditorComment) => {
    onAcceptSuggestion?.(c);
    await cmd.resolveEditorComment(c.id, true);
    loadComments();
  };

  const handleReject = async (c: EditorComment) => {
    onRejectSuggestion?.(c);
    await cmd.resolveEditorComment(c.id, true);
    loadComments();
  };

  const handleReply = async (commentId: string) => {
    const text = replyText[commentId]?.trim();
    if (!text) return;
    await cmd.createCommentReply(commentId, text, authorName);
    setReplyText((prev) => ({ ...prev, [commentId]: "" }));
    loadComments();
  };

  const unresolvedCount = comments.filter((c) => !c.resolved).length;
  const resolvedCount = comments.filter((c) => c.resolved).length;

  return (
    <div className="w-80 h-full border-l border-sand-200 dark:border-stone-700 bg-sand-50 dark:bg-stone-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sand-200 dark:border-stone-700">
        <h3 className="text-sm font-semibold text-stone-800 dark:text-sand-200">Comments</h3>
        <div className="text-[10px] text-ink-muted dark:text-sand-400 mt-0.5">
          {unresolvedCount} open {resolvedCount > 0 && `\u00B7 ${resolvedCount} resolved`}
        </div>
      </div>

      {/* Comment threads */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.length === 0 && (
          <div className="text-center text-xs text-ink-muted dark:text-sand-400 py-8">
            No comments yet. Select text in the editor and click the comment button to add one.
          </div>
        )}

        {comments.map((c) => {
          const replies = repliesMap[c.id] || [];
          const isExpanded = expandedId === c.id;
          const isSuggestion = c.comment_type === "suggestion";

          return (
            <div
              key={c.id}
              className={`rounded-lg border transition-all ${
                c.resolved
                  ? "bg-sand-100/50 dark:bg-stone-800/50 border-sand-200/50 dark:border-stone-700/50 opacity-60"
                  : "bg-white dark:bg-stone-800 border-sand-200 dark:border-stone-700"
              }`}
              style={{ borderLeftColor: c.color, borderLeftWidth: 3 }}
            >
              {/* Comment header */}
              <div
                className="px-3 py-2 cursor-pointer"
                onClick={() => {
                  setExpandedId(isExpanded ? null : c.id);
                  onSelectComment?.(c);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-stone-700 dark:text-sand-300">{c.author}</span>
                    {isSuggestion && (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 uppercase">
                        Edit
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-ink-muted dark:text-sand-400">
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>

                {isSuggestion ? (
                  <div className="mt-1.5 space-y-1">
                    <div className="text-[10px] text-ink-muted dark:text-sand-400 uppercase tracking-wider">Original:</div>
                    <p className="text-xs text-red-600 dark:text-red-400 line-through">{c.suggested_text}</p>
                    <div className="text-[10px] text-ink-muted dark:text-sand-400 uppercase tracking-wider">Suggested:</div>
                    <p className="text-xs text-green-600 dark:text-green-400">{c.content}</p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-600 dark:text-sand-300 mt-1 line-clamp-2">{c.content}</p>
                )}

                {replies.length > 0 && !isExpanded && (
                  <div className="text-[10px] text-sage-600 dark:text-sage-400 mt-1">{replies.length} repl{replies.length === 1 ? "y" : "ies"}</div>
                )}
              </div>

              {/* Expanded view */}
              {isExpanded && (
                <div className="border-t border-sand-200 dark:border-stone-700">
                  {/* Action buttons */}
                  <div className="px-3 py-1.5 flex gap-2 border-b border-sand-100 dark:border-stone-700 flex-wrap">
                    {isSuggestion && !c.resolved ? (
                      <>
                        <button
                          onClick={() => handleAccept(c)}
                          className="px-2 py-0.5 text-[10px] rounded font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(c)}
                          className="px-2 py-0.5 text-[10px] rounded font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleResolve(c)}
                        className={`px-2 py-0.5 text-[10px] rounded font-medium ${
                          c.resolved
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300"
                        }`}
                      >
                        {c.resolved ? "Reopen" : "Resolve"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c)}
                      className="px-2 py-0.5 text-[10px] rounded font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="px-3 py-2 space-y-2">
                      {replies.map((r) => (
                        <div key={r.id} className="pl-2 border-l-2 border-sand-200 dark:border-stone-600">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-stone-600 dark:text-sand-400">{r.author}</span>
                            <span className="text-[9px] text-ink-muted">
                              {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 dark:text-sand-300 mt-0.5">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  <div className="px-3 py-2 flex gap-1.5">
                    <input
                      type="text"
                      value={replyText[c.id] || ""}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleReply(c.id); }}
                      placeholder="Reply..."
                      className="flex-1 px-2 py-1 text-xs rounded bg-sand-50 dark:bg-stone-700 border border-sand-200 dark:border-stone-600 text-stone-700 dark:text-sand-200 focus:outline-none focus:ring-1 focus:ring-sage-300"
                    />
                    <button
                      onClick={() => handleReply(c.id)}
                      className="px-2 py-1 text-xs rounded bg-sage-600 text-white hover:bg-sage-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
