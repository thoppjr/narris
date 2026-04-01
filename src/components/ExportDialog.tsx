import { useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import * as cmd from "../lib/commands";
import { useProjectStore } from "../stores/projectStore";

interface ExportDialogProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "epub" | "pdf" | "docx" | "large-print" | "box-set";

export default function ExportDialog({ projectId, projectTitle, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("epub");
  const [trimSize, setTrimSize] = useState("5.5x8.5");
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const projects = useProjectStore((s) => s.projects);
  const [boxSetIds, setBoxSetIds] = useState<string[]>([]);
  const [boxSetTitle, setBoxSetTitle] = useState("");
  const [boxSetAuthor, setBoxSetAuthor] = useState("");

  const handleExport = async () => {
    setExporting(true);
    setResult(null);

    try {
      const defaultName = projectTitle.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase();

      if (format === "epub") {
        const path = await save({
          defaultPath: `${defaultName}.epub`,
          filters: [{ name: "EPUB", extensions: ["epub"] }],
        });
        if (path) {
          await cmd.exportEpub(projectId, path);
          setResult(`Exported to ${path}`);
        }
      } else if (format === "pdf") {
        const path = await save({
          defaultPath: `${defaultName}-print.html`,
          filters: [{ name: "Print-Ready HTML", extensions: ["html"] }],
        });
        if (path) {
          await cmd.exportPdf(projectId, path, trimSize);
          setResult(`Exported to ${path}\nOpen in browser and use Print > Save as PDF`);
        }
      } else if (format === "docx") {
        const path = await save({
          defaultPath: `${defaultName}.docx`,
          filters: [{ name: "Word Document", extensions: ["docx"] }],
        });
        if (path) {
          await cmd.exportDocx(projectId, path);
          setResult(`Exported to ${path}`);
        }
      } else if (format === "large-print") {
        const path = await save({
          defaultPath: `${defaultName}-large-print.html`,
          filters: [{ name: "Large Print HTML", extensions: ["html"] }],
        });
        if (path) {
          await cmd.exportPdfLargePrint(projectId, path, trimSize);
          setResult(`Exported to ${path}\nOpen in browser and use Print > Save as PDF`);
        }
      } else if (format === "box-set") {
        if (boxSetIds.length === 0) {
          setResult("Error: Select at least one project for the box set");
          setExporting(false);
          return;
        }
        const path = await save({
          defaultPath: `${(boxSetTitle || "box-set").replace(/\s+/g, "-").toLowerCase()}.epub`,
          filters: [{ name: "EPUB", extensions: ["epub"] }],
        });
        if (path) {
          await cmd.exportBoxSetEpub(boxSetIds, boxSetTitle || "Box Set", boxSetAuthor, path);
          setResult(`Box set exported to ${path}`);
        }
      }
    } catch (err) {
      setResult(`Error: ${err}`);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const formatBtn = (f: ExportFormat, label: string) => (
    <button
      onClick={() => { setFormat(f); setResult(null); }}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors
        ${format === f
          ? "bg-sage-600 text-white"
          : "bg-sand-100 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-200"
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-sand-200 dark:border-stone-700 shadow-xl p-6 w-[420px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium text-stone-800 dark:text-sand-100">Export Book</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-sand-100 dark:hover:bg-stone-700 text-ink-muted transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Format selection */}
        <div className="mb-4">
          <label className="text-xs font-medium uppercase tracking-wider text-ink-muted dark:text-sand-400 mb-2 block">
            Format
          </label>
          <div className="flex gap-2 flex-wrap">
            {formatBtn("epub", "EPUB")}
            {formatBtn("pdf", "PDF")}
            {formatBtn("docx", "DOCX")}
            {formatBtn("large-print", "Large Print")}
            {formatBtn("box-set", "Box Set")}
          </div>
        </div>

        {/* EPUB info */}
        {format === "epub" && (
          <div className="mb-4 px-3 py-2.5 bg-sage-50 dark:bg-sage-900/30 rounded-lg text-sm text-sage-700 dark:text-sage-300">
            Generates a valid EPUB 3.0 file ready for Kindle, Apple Books, Kobo, and other platforms.
          </div>
        )}

        {/* DOCX info */}
        {format === "docx" && (
          <div className="mb-4 px-3 py-2.5 bg-sage-50 dark:bg-sage-900/30 rounded-lg text-sm text-sage-700 dark:text-sage-300">
            Exports a Word-compatible .docx file. Preserves headings, bold, italic, and basic formatting. Suitable for sending to editors.
          </div>
        )}

        {/* PDF / Large Print trim size options */}
        {(format === "pdf" || format === "large-print") && (
          <div className="mb-4">
            <label className="text-xs font-medium uppercase tracking-wider text-ink-muted dark:text-sand-400 mb-2 block">
              Trim Size
            </label>
            <div className="flex gap-2 flex-wrap">
              {["5x8", "5.25x8", "5.5x8.5", "6x9", "8.5x11"].map((size) => (
                <button
                  key={size}
                  onClick={() => setTrimSize(size)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${trimSize === size
                      ? "bg-sage-600 text-white"
                      : "bg-sand-100 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-200"
                    }`}
                >
                  {size.replace("x", '" x ')}"
                </button>
              ))}
            </div>
            {format === "large-print" && (
              <p className="mt-2 text-xs text-ink-muted dark:text-sand-400">
                Large print uses 16pt Arial, 1.8x line height, and increased margins for accessibility.
              </p>
            )}
            <p className="mt-2 text-xs text-ink-muted dark:text-sand-400">
              Exports print-ready HTML. Open in browser and use Print &gt; Save as PDF.
            </p>
          </div>
        )}

        {/* Box Set options */}
        {format === "box-set" && (
          <div className="mb-4 space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-ink-muted dark:text-sand-400 mb-1 block">
                Box Set Title
              </label>
              <input
                type="text"
                value={boxSetTitle}
                onChange={(e) => setBoxSetTitle(e.target.value)}
                placeholder="The Complete Series"
                className="w-full input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-ink-muted dark:text-sand-400 mb-1 block">
                Author
              </label>
              <input
                type="text"
                value={boxSetAuthor}
                onChange={(e) => setBoxSetAuthor(e.target.value)}
                placeholder="Author Name"
                className="w-full input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-ink-muted dark:text-sand-400 mb-1 block">
                Select Projects to Include
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sand-50 dark:hover:bg-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={boxSetIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBoxSetIds([...boxSetIds, p.id]);
                        } else {
                          setBoxSetIds(boxSetIds.filter((id) => id !== p.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-stone-700 dark:text-sand-300">{p.title}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted dark:text-sand-400">
                Merges multiple projects into a single EPUB with combined table of contents.
              </p>
            </div>
          </div>
        )}

        {/* Result message */}
        {result && (
          <div className={`mb-4 px-3 py-2.5 rounded-lg text-sm whitespace-pre-wrap ${
            result.startsWith("Error")
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              : "bg-sage-50 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300"
          }`}>
            {result}
          </div>
        )}

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full px-4 py-2.5 rounded-lg bg-sage-600 text-white font-medium
                     hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {exporting ? "Exporting..." : format === "box-set" ? "Export Box Set" : `Export as ${format.toUpperCase().replace("-", " ")}`}
        </button>
      </div>
    </div>
  );
}
