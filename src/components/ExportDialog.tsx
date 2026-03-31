import { useState } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import * as cmd from "../lib/commands";

interface ExportDialogProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "epub" | "pdf";

export default function ExportDialog({ projectId, projectTitle, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("epub");
  const [trimSize, setTrimSize] = useState("5.5x8.5");
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
      } else {
        const ext = "html";
        const path = await save({
          defaultPath: `${defaultName}-print.${ext}`,
          filters: [{ name: "Print-Ready HTML (open in browser, Print > Save as PDF)", extensions: [ext] }],
        });
        if (path) {
          await cmd.exportPdf(projectId, path, trimSize);
          setResult(`Exported to ${path}\nOpen in browser and use Print > Save as PDF`);
        }
      }
    } catch (err) {
      setResult(`Error: ${err}`);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-sand-200 dark:border-stone-700 shadow-xl p-6 w-96">
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
          <div className="flex gap-2">
            <button
              onClick={() => setFormat("epub")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${format === "epub"
                  ? "bg-sage-600 text-white"
                  : "bg-sand-100 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-200"
                }`}
            >
              EPUB
            </button>
            <button
              onClick={() => setFormat("pdf")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${format === "pdf"
                  ? "bg-sage-600 text-white"
                  : "bg-sand-100 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-200"
                }`}
            >
              PDF
            </button>
          </div>
        </div>

        {/* EPUB info */}
        {format === "epub" && (
          <div className="mb-4 px-3 py-2.5 bg-sage-50 dark:bg-sage-900/30 rounded-lg text-sm text-sage-700 dark:text-sage-300">
            Generates a valid EPUB 3.0 file ready for Kindle, Apple Books, Kobo, and other platforms.
          </div>
        )}

        {/* PDF options */}
        {format === "pdf" && (
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
            <p className="mt-2 text-xs text-ink-muted dark:text-sand-400">
              Exports a print-ready HTML file. Open it in your browser and use Print &gt; Save as PDF.
            </p>
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
          {exporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
