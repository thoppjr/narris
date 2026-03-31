import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useRef, useCallback } from "react";
import { useChapterStore } from "../stores/chapterStore";

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-150
     ${active ? "bg-sage-200 text-sage-800" : "text-ink-muted hover:bg-sand-100 hover:text-ink"}`;

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-sand-200 bg-sand-50 flex-wrap">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}>
        B
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}>
        <em>I</em>
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))}>
        <u>U</u>
      </button>
      <div className="w-px h-5 bg-sand-300 mx-1" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))}>
        H2
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))}>
        H3
      </button>
      <div className="w-px h-5 bg-sand-300 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))}>
        List
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))}>
        1. List
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))}>
        Quote
      </button>
      <div className="w-px h-5 bg-sand-300 mx-1" />
      <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btn(editor.isActive({ textAlign: "left" }))}>
        Left
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btn(editor.isActive({ textAlign: "center" }))}>
        Center
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btn(editor.isActive({ textAlign: "right" }))}>
        Right
      </button>
    </div>
  );
}

export default function Editor() {
  const { chapters, activeChapterId, updateContent } = useChapterStore();
  const activeChapter = chapters.find((c) => c.id === activeChapterId);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSettingContent = useRef(false);

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
    ],
    content: "",
    onUpdate: ({ editor: ed }) => {
      if (isSettingContent.current) return;
      if (activeChapterId) {
        handleSave(activeChapterId, ed.getHTML());
      }
    },
  });

  // Sync editor content when switching chapters
  useEffect(() => {
    if (editor && activeChapter) {
      isSettingContent.current = true;
      editor.commands.setContent(activeChapter.content || "");
      isSettingContent.current = false;
    }
  }, [editor, activeChapterId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeChapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-muted">
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

  return (
    <div className="flex-1 flex flex-col bg-white">
      <Toolbar editor={editor} />

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-12 py-10">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-sand-200 bg-sand-50 flex justify-between text-xs text-ink-muted">
        <span>{activeChapter.title}</span>
        <span>{wordCount.toLocaleString()} words</span>
      </div>
    </div>
  );
}
