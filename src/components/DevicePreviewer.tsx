import { useState, useMemo } from "react";
import { useChapterStore } from "../stores/chapterStore";
import { useFormattingStore } from "../stores/formattingStore";
import { DEFAULT_SETTINGS } from "../stores/formattingStore";

interface DevicePreviewerProps {
  projectId: string;
  onClose: () => void;
}

interface DeviceProfile {
  name: string;
  label: string;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  bgColor: string;
  textColor: string;
  padding: number;
  lineHeight: number;
  category: "print" | "ereader" | "tablet" | "phone";
}

const DEVICES: DeviceProfile[] = [
  {
    name: "print-5x8",
    label: "Print (5×8)",
    width: 300,
    height: 480,
    fontSize: 10,
    fontFamily: "Georgia, serif",
    bgColor: "#fffff8",
    textColor: "#1a1a1a",
    padding: 28,
    lineHeight: 1.6,
    category: "print",
  },
  {
    name: "print-6x9",
    label: "Print (6×9)",
    width: 336,
    height: 504,
    fontSize: 10.5,
    fontFamily: "Georgia, serif",
    bgColor: "#fffff8",
    textColor: "#1a1a1a",
    padding: 32,
    lineHeight: 1.6,
    category: "print",
  },
  {
    name: "kindle-paperwhite",
    label: "Kindle Paperwhite",
    width: 300,
    height: 400,
    fontSize: 11,
    fontFamily: "Georgia, serif",
    bgColor: "#f5f1e8",
    textColor: "#2c2c2c",
    padding: 20,
    lineHeight: 1.7,
    category: "ereader",
  },
  {
    name: "kindle-oasis",
    label: "Kindle Oasis",
    width: 320,
    height: 430,
    fontSize: 11.5,
    fontFamily: "Georgia, serif",
    bgColor: "#f5f1e8",
    textColor: "#2c2c2c",
    padding: 22,
    lineHeight: 1.7,
    category: "ereader",
  },
  {
    name: "ipad",
    label: "iPad",
    width: 390,
    height: 520,
    fontSize: 12,
    fontFamily: "Georgia, serif",
    bgColor: "#ffffff",
    textColor: "#1a1a1a",
    padding: 32,
    lineHeight: 1.7,
    category: "tablet",
  },
  {
    name: "phone",
    label: "Phone",
    width: 240,
    height: 420,
    fontSize: 10,
    fontFamily: "Georgia, serif",
    bgColor: "#ffffff",
    textColor: "#1a1a1a",
    padding: 16,
    lineHeight: 1.6,
    category: "phone",
  },
];

export default function DevicePreviewer({ onClose }: DevicePreviewerProps) {
  const chapters = useChapterStore((s) => s.chapters);
  const activeChapterId = useChapterStore((s) => s.activeChapterId);
  const formatting = useFormattingStore((s) => s.settings);
  const [selectedDevice, setSelectedDevice] = useState("kindle-paperwhite");
  const [previewChapterId, setPreviewChapterId] = useState(activeChapterId);

  const device = DEVICES.find((d) => d.name === selectedDevice) ?? DEVICES[2];
  const chapter = chapters.find((c) => c.id === previewChapterId) ?? chapters[0];

  const f = formatting ?? { ...DEFAULT_SETTINGS, id: "", project_id: "" };

  // Build preview content with formatting applied
  const previewContent = useMemo(() => {
    if (!chapter) return "";
    let content = chapter.content || "<p>No content yet...</p>";

    // Replace <hr> tags with scene break style
    const breakHtml = getSceneBreakHtml(f.scene_break_style);
    content = content.replace(/<hr\s*\/?>/g, breakHtml);

    return content;
  }, [chapter, f.scene_break_style]);

  const chapterItems = chapters.filter(
    (c) => c.chapter_type === "chapter" || c.chapter_type === "part"
  );

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-sand-200 dark:border-stone-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-sand-200">Device Preview</h2>
        <button
          onClick={onClose}
          className="px-4 py-1.5 text-sm rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 transition-colors"
        >
          Done
        </button>
      </div>

      {/* Controls */}
      <div className="px-6 py-3 border-b border-sand-200 dark:border-stone-700 flex items-center gap-4 flex-wrap">
        {/* Device selector */}
        <div className="flex gap-1.5">
          {DEVICES.map((d) => (
            <button
              key={d.name}
              onClick={() => setSelectedDevice(d.name)}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                selectedDevice === d.name
                  ? "bg-sage-600 text-white"
                  : "bg-sand-100 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-sand-300 dark:bg-stone-600" />

        {/* Chapter selector */}
        <select
          value={previewChapterId ?? ""}
          onChange={(e) => setPreviewChapterId(e.target.value)}
          className="input-field max-w-xs text-xs"
        >
          {chapterItems.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-8">
        <div className="flex flex-col items-center">
          {/* Device frame */}
          <div
            className="relative rounded-2xl shadow-2xl overflow-hidden"
            style={{
              width: device.width + (device.category === "phone" ? 16 : device.category === "ereader" ? 24 : 20),
              backgroundColor: device.category === "ereader" ? "#333" : device.category === "phone" ? "#1a1a1a" : "#666",
              padding: device.category === "ereader" ? "12px" : device.category === "phone" ? "8px 4px" : "10px",
              borderRadius: device.category === "phone" ? "24px" : device.category === "ereader" ? "12px" : "8px",
            }}
          >
            {/* Screen */}
            <div
              className="overflow-y-auto device-preview-content"
              style={{
                width: device.width,
                height: device.height,
                backgroundColor: device.bgColor,
                color: device.textColor,
                padding: device.padding,
                fontFamily: f.body_font + ", " + device.fontFamily,
                fontSize: device.fontSize,
                lineHeight: device.lineHeight,
                borderRadius: device.category === "phone" ? "16px" : "4px",
              }}
            >
              {/* Chapter title */}
              {chapter && (
                <h2
                  style={{
                    fontFamily: f.heading_font + ", sans-serif",
                    fontSize: device.fontSize * 1.5,
                    fontWeight: 600,
                    textAlign: "center",
                    marginBottom: "1em",
                    marginTop: "0.5em",
                  }}
                >
                  {chapter.title}
                </h2>
              )}
              {/* Chapter content */}
              <div
                className="device-preview-body"
                dangerouslySetInnerHTML={{ __html: previewContent }}
                style={{
                  textAlign: f.justify_text ? "justify" : "left",
                }}
              />
            </div>
          </div>

          {/* Device label */}
          <div className="mt-3 text-xs text-ink-muted dark:text-sand-400 text-center">
            {device.label}
            <span className="mx-2">·</span>
            {device.width}×{device.height}
          </div>
        </div>
      </div>

      {/* Inline style for preview content */}
      <style>{`
        .device-preview-body p {
          margin: 0 0 ${f.paragraph_spacing_em}em 0;
          text-indent: ${f.paragraph_indent_em}em;
        }
        .device-preview-body p:first-of-type {
          text-indent: 0;
        }
        .device-preview-body blockquote {
          border-left: 2px solid #ccc;
          padding-left: 0.8em;
          margin: 0.8em 0;
          font-style: italic;
          color: #666;
        }
        .device-preview-body h2, .device-preview-body h3 {
          font-family: ${f.heading_font}, sans-serif;
          margin: 1em 0 0.5em 0;
        }
        .device-preview-body .scene-break {
          text-align: center;
          margin: 1.5em 0;
          color: #888;
        }
        ${f.drop_cap_enabled ? `
        .device-preview-body p:first-of-type::first-letter {
          float: left;
          font-size: ${f.drop_cap_lines}em;
          line-height: 0.8;
          padding-right: 0.08em;
          font-weight: bold;
        }` : ""}
      `}</style>
    </div>
  );
}

function getSceneBreakHtml(style: string): string {
  switch (style) {
    case "flourish":
      return '<div class="scene-break">❧ ❧ ❧</div>';
    case "line":
      return '<div class="scene-break" style="border-top: 1px solid #ccc; margin: 1.5em 3em;"></div>';
    case "dots":
      return '<div class="scene-break">• • •</div>';
    case "blank":
      return '<div class="scene-break" style="height: 2em;"></div>';
    default:
      return '<div class="scene-break">* * *</div>';
  }
}
