import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import { DOMSerializer } from "@tiptap/pm/model";
import { useEffect, useRef, useCallback, useState } from "react";
import { useChapterStore } from "../stores/chapterStore";
import { useThemeStore } from "../stores/themeStore";
import FindReplace from "./FindReplace";
import SprintTimer from "./SprintTimer";
import { Footnote } from "../extensions/Footnote";
import { TextMessage } from "../extensions/TextMessage";
import { InlineImage } from "../extensions/InlineImage";

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function Toolbar({ editor, onToggleFindReplace, onToggleSprint, onSplit, onMerge, canMerge, onInsertFootnote, onInsertTextMessage, onInsertImage, onToggleDyslexic, dyslexicFont, typewriterMode, onToggleTypewriter, focusMode, onToggleFocus }: {
  editor: ReturnType<typeof useEditor>;
  onToggleFindReplace: () => void;
  onToggleSprint: () => void;
  onSplit: () => void;
  onMerge: () => void;
  canMerge: boolean;
  onInsertFootnote: () => void;
  onInsertTextMessage: () => void;
  onInsertImage: () => void;
  onToggleDyslexic: () => void;
  dyslexicFont: boolean;
  typewriterMode: boolean;
  onToggleTypewriter: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
}) {
  const { dark, toggle: toggleDark } = useThemeStore();

  if (!editor) return null;

  const btn = (active: boolean) =>
    `px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-150
     ${active
       ? "bg-sage-200 dark:bg-sage-800 text-sage-800 dark:text-sage-200"
       : "text-ink-muted hover:bg-sand-100 dark:hover:bg-stone-700 hover:text-ink dark:hover:text-sand-200"}`;

  const toolBtn = "px-2.5 py-1.5 rounded-md text-sm font-medium text-ink-muted hover:bg-sand-100 dark:hover:bg-stone-700 hover:text-ink dark:hover:text-sand-200 transition-colors duration-150";

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-sand-200 dark:border-stone-700 bg-sand-50 dark:bg-stone-800 flex-wrap">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Bold">
        <strong>B</strong>
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italic">
        <em>I</em>
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} title="Underline">
        <u>U</u>
      </button>
      <div className="w-px h-5 bg-sand-300 dark:bg-stone-600 mx-1" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Heading 2">
        H2
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} title="Heading 3">
        H3
      </button>
      <div className="w-px h-5 bg-sand-300 dark:bg-stone-600 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet List">
        List
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Numbered List">
        1.
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} title="Blockquote">
        Quote
      </button>
      <div className="w-px h-5 bg-sand-300 dark:bg-stone-600 mx-1" />
      <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btn(editor.isActive({ textAlign: "left" }))} title="Align Left">
        Left
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btn(editor.isActive({ textAlign: "center" }))} title="Align Center">
        Center
      </button>
      <div className="w-px h-5 bg-sand-300 dark:bg-stone-600 mx-1" />
      <button onClick={onInsertFootnote} className={toolBtn} title="Insert Footnote">
        Fn
      </button>
      <button onClick={onInsertTextMessage} className={toolBtn} title="Insert Text Message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      <button onClick={onInsertImage} className={toolBtn} title="Insert Image">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tools */}
      <button onClick={onToggleTypewriter} className={btn(typewriterMode)} title="Typewriter Scrolling (keep cursor centered)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="12" x2="18" y2="12"/>
        </svg>
      </button>
      <button onClick={onToggleFocus} className={btn(focusMode)} title="Paragraph Focus (dim other paragraphs)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" opacity="0.3"/>
        </svg>
      </button>
      <button onClick={onToggleDyslexic} className={btn(dyslexicFont)} title="Toggle OpenDyslexic Font">
        Aa
      </button>
      <button onClick={onToggleFindReplace} className={toolBtn} title="Find & Replace (Ctrl+F)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
      </button>
      <button onClick={onSplit} className={toolBtn} title="Split Chapter at Cursor">
        Split
      </button>
      {canMerge && (
        <button onClick={onMerge} className={toolBtn} title="Merge with Next Chapter">
          Merge
        </button>
      )}
      <button onClick={onToggleSprint} className={toolBtn} title="Sprint Timer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
      <button onClick={toggleDark} className={toolBtn} title="Toggle Dark Mode">
        {dark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// Dialog for inserting footnotes
function FootnoteDialog({ isOpen, onClose, onInsert }: { isOpen: boolean; onClose: () => void; onInsert: (text: string) => void }) {
  const [text, setText] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 shadow-lg p-5 w-96">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-3">Insert Footnote</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Footnote text..."
          rows={3}
          className="w-full input-field mb-3"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 text-sm hover:bg-sand-300 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (text.trim()) { onInsert(text.trim()); setText(""); onClose(); } }}
            className="px-3 py-1.5 rounded-lg bg-sage-600 text-white text-sm font-medium hover:bg-sage-700 transition-colors"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

// Dialog for inserting text messages
function TextMessageDialog({ isOpen, onClose, onInsert }: { isOpen: boolean; onClose: () => void; onInsert: (attrs: { sender: string; text: string; side: "left" | "right"; color: string }) => void }) {
  const [sender, setSender] = useState("");
  const [text, setText] = useState("");
  const [side, setSide] = useState<"left" | "right">("left");
  const [color, setColor] = useState("#4a6249");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 shadow-lg p-5 w-96">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-3">Insert Text Message</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Contact name..."
            className="w-full input-field"
            autoFocus
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message text..."
            rows={2}
            className="w-full input-field"
          />
          <div className="flex gap-3 items-center">
            <label className="text-xs text-ink-muted dark:text-sand-400">Side:</label>
            <button
              onClick={() => setSide("left")}
              className={`px-3 py-1 rounded text-xs font-medium ${side === "left" ? "bg-sage-600 text-white" : "bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300"}`}
            >
              Left (received)
            </button>
            <button
              onClick={() => setSide("right")}
              className={`px-3 py-1 rounded text-xs font-medium ${side === "right" ? "bg-sage-600 text-white" : "bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300"}`}
            >
              Right (sent)
            </button>
          </div>
          <div className="flex gap-3 items-center">
            <label className="text-xs text-ink-muted dark:text-sand-400">Bubble color:</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
          </div>
          {/* Preview */}
          <div className="bg-sand-50 dark:bg-stone-700 rounded-lg p-3">
            <div style={{ display: "flex", flexDirection: "column", alignItems: side === "right" ? "flex-end" : "flex-start" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2, padding: "0 12px" }}>{sender || "Contact"}</div>
              <div style={{
                background: side === "right" ? color : "#e8e0d4",
                color: side === "right" ? "#fff" : "#333",
                padding: "8px 14px",
                borderRadius: 18,
                maxWidth: "75%",
                fontSize: 14,
                lineHeight: 1.4,
                ...(side === "right" ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
              }}>
                {text || "Message preview..."}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 text-sm hover:bg-sand-300 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (text.trim()) { onInsert({ sender: sender || "Contact", text: text.trim(), side, color }); setText(""); onClose(); } }}
            className="px-3 py-1.5 rounded-lg bg-sage-600 text-white text-sm font-medium hover:bg-sage-700 transition-colors"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Editor() {
  const { chapters, activeChapterId, updateContent, splitChapter, mergeWithNext } = useChapterStore();
  const activeChapter = chapters.find((c) => c.id === activeChapterId);
  const activeIdx = chapters.findIndex((c) => c.id === activeChapterId);
  const canMerge = activeIdx >= 0 && activeIdx < chapters.length - 1;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSettingContent = useRef(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSprint, setShowSprint] = useState(false);
  const [showFootnoteDialog, setShowFootnoteDialog] = useState(false);
  const [showTextMessageDialog, setShowTextMessageDialog] = useState(false);
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const editorScrollRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(
    (id: string, content: string) => {
      const words = countWords(content.replace(/<[^>]*>/g, " "));
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(() => {
        updateContent(id, content, words).then(() => {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        }).catch(() => setSaveStatus("idle"));
      }, 500);
    },
    [updateContent]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
      Highlight,
      Footnote,
      TextMessage,
      InlineImage,
    ],
    content: "",
    onUpdate: ({ editor: ed }) => {
      if (isSettingContent.current) return;
      if (activeChapterId) {
        handleSave(activeChapterId, ed.getHTML());
      }
    },
  });

  // Ctrl+F shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowFindReplace((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync editor content when switching chapters
  useEffect(() => {
    if (editor && activeChapter) {
      isSettingContent.current = true;
      editor.commands.setContent(activeChapter.content || "");
      isSettingContent.current = false;
    }
  }, [editor, activeChapterId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typewriter scrolling: keep cursor vertically centered
  useEffect(() => {
    if (!editor || !typewriterMode) return;
    const handleTransaction = () => {
      requestAnimationFrame(() => {
        const scrollEl = editorScrollRef.current;
        if (!scrollEl) return;
        const { view } = editor;
        const coords = view.coordsAtPos(view.state.selection.from);
        const containerRect = scrollEl.getBoundingClientRect();
        const cursorY = coords.top - containerRect.top + scrollEl.scrollTop;
        const targetScroll = cursorY - containerRect.height / 2;
        scrollEl.scrollTo({ top: targetScroll, behavior: "smooth" });
      });
    };
    editor.on("selectionUpdate", handleTransaction);
    editor.on("update", handleTransaction);
    return () => {
      editor.off("selectionUpdate", handleTransaction);
      editor.off("update", handleTransaction);
    };
  }, [editor, typewriterMode]);

  const handleSplit = useCallback(() => {
    if (!editor || !activeChapter) return;

    const { from } = editor.state.selection;
    const docSize = editor.state.doc.content.size;
    const beforeJson = editor.state.doc.cut(0, from).toJSON();
    const afterJson = editor.state.doc.cut(from, docSize).toJSON();

    const { schema } = editor.state;
    const beforeDoc = schema.nodeFromJSON(beforeJson);
    const afterDoc = schema.nodeFromJSON(afterJson);

    const serializer = DOMSerializer.fromSchema(schema);

    const beforeFrag = serializer.serializeFragment(beforeDoc.content);
    const afterFrag = serializer.serializeFragment(afterDoc.content);

    const beforeDiv = document.createElement("div");
    beforeDiv.appendChild(beforeFrag);
    const afterDiv = document.createElement("div");
    afterDiv.appendChild(afterFrag);

    const beforeHtml = beforeDiv.innerHTML;
    const afterHtml = afterDiv.innerHTML;
    const beforeWords = countWords(beforeHtml.replace(/<[^>]*>/g, " "));
    const afterWords = countWords(afterHtml.replace(/<[^>]*>/g, " "));

    const chapterNum = chapters.findIndex((c) => c.id === activeChapter.id) + 2;
    splitChapter(
      activeChapter.id,
      `Chapter ${chapterNum}`,
      beforeHtml,
      beforeWords,
      afterHtml,
      afterWords
    );
  }, [editor, activeChapter, chapters, splitChapter]);

  const handleMerge = useCallback(() => {
    if (!activeChapterId) return;
    mergeWithNext(activeChapterId);
  }, [activeChapterId, mergeWithNext]);

  const handleInsertImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        editor?.commands.insertInlineImage({ src, alt: file.name });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  if (!activeChapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-muted dark:text-sand-400">
        <div className="text-center">
          <p className="text-lg mb-1">No chapter selected</p>
          <p className="text-sm">Create or select a chapter from the sidebar.</p>
        </div>
      </div>
    );
  }

  const wordCount = activeChapter.content
    ? countWords(activeChapter.content.replace(/<[^>]*>/g, " "))
    : 0;

  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
  const pageEstimate = Math.ceil(totalWords / 250);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-stone-900 relative">
      <Toolbar
        editor={editor}
        onToggleFindReplace={() => setShowFindReplace((v) => !v)}
        onToggleSprint={() => setShowSprint((v) => !v)}
        onSplit={handleSplit}
        onMerge={handleMerge}
        canMerge={canMerge}
        onInsertFootnote={() => setShowFootnoteDialog(true)}
        onInsertTextMessage={() => setShowTextMessageDialog(true)}
        onInsertImage={handleInsertImage}
        onToggleDyslexic={() => setDyslexicFont((v) => !v)}
        dyslexicFont={dyslexicFont}
        typewriterMode={typewriterMode}
        onToggleTypewriter={() => setTypewriterMode((v) => !v)}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((v) => !v)}
      />

      <FindReplace
        editor={editor}
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
      />

      <FootnoteDialog
        isOpen={showFootnoteDialog}
        onClose={() => setShowFootnoteDialog(false)}
        onInsert={(text) => editor?.commands.insertFootnote(text)}
      />

      <TextMessageDialog
        isOpen={showTextMessageDialog}
        onClose={() => setShowTextMessageDialog(false)}
        onInsert={(attrs) => editor?.commands.insertTextMessage(attrs)}
      />

      {/* Editor area */}
      <div ref={editorScrollRef} className="flex-1 overflow-y-auto">
        <div className={`max-w-3xl mx-auto px-12 py-10 ${dyslexicFont ? "font-opendyslexic" : ""} ${focusMode ? "focus-mode" : ""}`}
          style={dyslexicFont ? { fontFamily: "'OpenDyslexic', sans-serif" } : undefined}>
          <EditorContent editor={editor} />
        </div>
      </div>

      <SprintTimer
        isOpen={showSprint}
        onClose={() => setShowSprint(false)}
        currentWordCount={totalWords}
      />

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-sand-200 dark:border-stone-700 bg-sand-50 dark:bg-stone-800 flex justify-between text-xs text-ink-muted dark:text-sand-400">
        <div className="flex items-center gap-3">
          <span>{activeChapter.title}</span>
          {saveStatus === "saving" && (
            <span className="text-amber-600 dark:text-amber-400">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-sage-600 dark:text-sage-400">Saved</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-ink-muted/60">|</span>
          <span>{totalWords.toLocaleString()} total</span>
          <span className="text-ink-muted/60">|</span>
          <span>~{pageEstimate} pages</span>
        </div>
      </div>
    </div>
  );
}
