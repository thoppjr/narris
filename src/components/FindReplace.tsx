import { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface FindReplaceProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FindReplace({ editor, isOpen, onClose }: FindReplaceProps) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const clearHighlights = useCallback(() => {
    if (!editor) return;
    // Remove all search-related decorations (no-op if mark type doesn't exist)
    try {
      editor.commands.unsetMark("highlight");
    } catch {
      // highlight mark may not be registered
    }
  }, [editor]);

  const findMatches = useCallback(() => {
    if (!editor || !findText) {
      setMatchCount(0);
      setCurrentMatch(0);
      return [];
    }

    const text = editor.getText();
    const flags = caseSensitive ? "g" : "gi";
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, flags);
    const matches: { index: number; length: number }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ index: match.index, length: match[0].length });
    }
    setMatchCount(matches.length);
    if (matches.length > 0 && currentMatch === 0) {
      setCurrentMatch(1);
    } else if (matches.length === 0) {
      setCurrentMatch(0);
    }
    return matches;
  }, [editor, findText, caseSensitive, currentMatch]);

  useEffect(() => {
    findMatches();
  }, [findText, caseSensitive, findMatches]);

  useEffect(() => {
    if (!isOpen) {
      clearHighlights();
      setFindText("");
      setReplaceText("");
      setMatchCount(0);
      setCurrentMatch(0);
    }
  }, [isOpen, clearHighlights]);

  // Keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        // Toggle is handled by parent
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleFindNext = useCallback(() => {
    if (!editor || !findText) return;

    const text = editor.getText();
    const flags = caseSensitive ? "g" : "gi";
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, flags);
    const matches: number[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match.index);
    }

    if (matches.length === 0) return;

    const nextIdx = currentMatch >= matches.length ? 1 : currentMatch;
    setCurrentMatch(nextIdx);

    // Find the position in the document and select it
    const pos = findPosInDoc(editor, matches[nextIdx - 1], findText.length);
    if (pos) {
      editor.chain().focus().setTextSelection({ from: pos.from, to: pos.to }).run();
    }
    setCurrentMatch(nextIdx >= matches.length ? 1 : nextIdx + 1);
  }, [editor, findText, caseSensitive, currentMatch]);

  const handleReplace = useCallback(() => {
    if (!editor || !findText) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const isMatch = caseSensitive
      ? selectedText === findText
      : selectedText.toLowerCase() === findText.toLowerCase();

    if (isMatch) {
      editor.chain().focus().insertContentAt({ from, to }, replaceText).run();
      findMatches();
    }
    handleFindNext();
  }, [editor, findText, replaceText, caseSensitive, handleFindNext, findMatches]);

  const handleReplaceAll = useCallback(() => {
    if (!editor || !findText) return;

    const flags = caseSensitive ? "g" : "gi";
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, flags);

    // Get the full HTML and do replacement
    const html = editor.getHTML();
    // We need to be careful to only replace text content, not HTML tags
    // Use a DOM parser approach
    const div = document.createElement("div");
    div.innerHTML = html;

    function replaceTextInNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent?.replace(regex, replaceText) ?? "";
      } else {
        node.childNodes.forEach(replaceTextInNode);
      }
    }
    replaceTextInNode(div);

    editor.commands.setContent(div.innerHTML);
    setMatchCount(0);
    setCurrentMatch(0);
  }, [editor, findText, replaceText, caseSensitive]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 z-50 m-4 bg-white rounded-xl border border-sand-200 shadow-lg p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-stone-700">Find & Replace</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-sand-100 text-ink-muted hover:text-ink transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Find input */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFindNext()}
            placeholder="Find..."
            autoFocus
            className="w-full px-3 py-2 text-sm rounded-lg bg-sand-50 border border-sand-200
                       placeholder-ink-muted
                       focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-transparent"
          />
          {findText && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
              {matchCount > 0 ? `${currentMatch}/${matchCount}` : "0 results"}
            </span>
          )}
        </div>
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReplace()}
          placeholder="Replace with..."
          className="w-full px-3 py-2 text-sm rounded-lg bg-sand-50 border border-sand-200
                     placeholder-ink-muted
                     focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-transparent"
        />
      </div>

      {/* Options */}
      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="rounded border-sand-300 text-sage-600 focus:ring-sage-300"
          />
          Case sensitive
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleFindNext}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-sand-100 text-stone-700
                     hover:bg-sand-200 transition-colors"
        >
          Find Next
        </button>
        <button
          onClick={handleReplace}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-sand-100 text-stone-700
                     hover:bg-sand-200 transition-colors"
        >
          Replace
        </button>
        <button
          onClick={handleReplaceAll}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-sage-600 text-white
                     hover:bg-sage-700 transition-colors"
        >
          All
        </button>
      </div>
    </div>
  );
}

// Helper to convert plain text offset to ProseMirror document position
function findPosInDoc(
  editor: Editor,
  textOffset: number,
  length: number
): { from: number; to: number } | null {
  let currentOffset = 0;
  let result: { from: number; to: number } | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (result) return false;
    if (node.isText && node.text) {
      const nodeEnd = currentOffset + node.text.length;
      if (textOffset >= currentOffset && textOffset < nodeEnd) {
        const relativeOffset = textOffset - currentOffset;
        result = {
          from: pos + relativeOffset,
          to: pos + relativeOffset + length,
        };
        return false;
      }
      currentOffset = nodeEnd;
    }
    return;
  });

  return result;
}
