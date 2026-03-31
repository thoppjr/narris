import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import { DOMSerializer } from "@tiptap/pm/model";
import { useEffect, useRef, useCallback, useState } from "react";
import { useChapterStore } from "../stores/chapterStore";
import { useThemeStore } from "../stores/themeStore";
import FindReplace from "./FindReplace";
import SprintTimer from "./SprintTimer";

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function Toolbar({ editor, onToggleFindReplace, onToggleSprint, onSplit, onMerge, canMerge }: {
  editor: ReturnType<typeof useEditor>;
  onToggleFindReplace: () => void;
  onToggleSprint: () => void;
  onSplit: () => void;
  onMerge: () => void;
  canMerge: boolean;
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tools */}
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

export default function Editor() {
  const { chapters, activeChapterId, updateContent, splitChapter, mergeWithNext } = useChapterStore();
  const activeChapter = chapters.find((c) => c.id === activeChapterId);
  const activeIdx = chapters.findIndex((c) => c.id === activeChapterId);
  const canMerge = activeIdx >= 0 && activeIdx < chapters.length - 1;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSettingContent = useRef(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSprint, setShowSprint] = useState(false);

  const handleSave = useCallback(
    (id: string, content: string) => {
      const words = countWords(content.replace(/<[^>]*>/g, " "));
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateContent(id, content, words);
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
      Typography, // Smart quotes, em dashes, etc.
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

  const handleSplit = useCallback(() => {
    if (!editor || !activeChapter) return;

    const { from } = editor.state.selection;

    // Split the HTML at cursor position by creating two documents
    // We'll serialize the content before and after the cursor
    const docSize = editor.state.doc.content.size;
    const beforeJson = editor.state.doc.cut(0, from).toJSON();
    const afterJson = editor.state.doc.cut(from, docSize).toJSON();

    // Create temporary editors to get HTML (using schema)
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

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-stone-900 relative">
      <Toolbar
        editor={editor}
        onToggleFindReplace={() => setShowFindReplace((v) => !v)}
        onToggleSprint={() => setShowSprint((v) => !v)}
        onSplit={handleSplit}
        onMerge={handleMerge}
        canMerge={canMerge}
      />

      <FindReplace
        editor={editor}
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
      />

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-12 py-10">
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
        <span>{activeChapter.title}</span>
        <span>{wordCount.toLocaleString()} words</span>
      </div>
    </div>
  );
}
