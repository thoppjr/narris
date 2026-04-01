import { useEffect, useState, useRef } from "react";
import * as cmd from "../lib/commands";
import type { ProjectImage } from "../lib/commands";

interface ImageManagerProps {
  projectId: string;
  onClose: () => void;
  onInsert?: (image: ProjectImage) => void;
}

export default function ImageManager({ projectId, onClose, onInsert }: ImageManagerProps) {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [selected, setSelected] = useState<ProjectImage | null>(null);
  const [caption, setCaption] = useState("");
  const [layout, setLayout] = useState<string>("inline");
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cmd.listProjectImages(projectId).then(setImages).catch(console.error);
  }, [projectId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Extract base64 data
        const base64 = dataUrl.split(",")[1] || "";
        const mimeType = file.type || "image/png";

        // Get image dimensions
        const img = new Image();
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = dataUrl;
        });

        const image: ProjectImage = {
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
          project_id: projectId,
          filename: file.name,
          data_base64: base64,
          mime_type: mimeType,
          width: dims.w,
          height: dims.h,
          caption: "",
          layout: "inline",
          created_at: new Date().toISOString(),
        };

        await cmd.saveProjectImage(image);
        setImages((prev) => [...prev, image]);
        setMessage(`Added "${file.name}"`);
      } catch (err) {
        setMessage(`Error uploading ${file.name}: ${err}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpdateImage = async () => {
    if (!selected) return;
    try {
      const updated = { ...selected, caption, layout };
      await cmd.saveProjectImage(updated);
      setImages(images.map((img) => img.id === updated.id ? updated : img));
      setMessage("Image updated");
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cmd.deleteProjectImage(id);
      setImages(images.filter((img) => img.id !== id));
      if (selected?.id === id) setSelected(null);
      setMessage("Image deleted");
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleInsert = (image: ProjectImage) => {
    if (onInsert) {
      onInsert(image);
      setMessage(`Inserted "${image.filename}" into editor`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <h1 className="text-lg font-medium text-stone-800 dark:text-sand-100">Image Manager</h1>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 text-sm transition-colors">
          Back to Editor
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {message && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
            message.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-sage-50 text-sage-700 dark:bg-sage-900/30 dark:text-sage-300"
          }`}>
            {message}
          </div>
        )}

        {/* Upload */}
        <div className="mb-6 bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 p-5">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-3">Upload Images</h2>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-sage-600 text-white text-sm font-medium hover:bg-sage-700 transition-colors"
            >
              Choose Images
            </button>
            <span className="text-xs text-ink-muted dark:text-sand-400">PNG, JPG, SVG, WebP</span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Image grid */}
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-3">
              Project Images ({images.length})
            </h2>
            {images.length === 0 ? (
              <p className="text-sm text-ink-muted dark:text-sand-400">No images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`rounded-lg border overflow-hidden cursor-pointer transition-all ${
                      selected?.id === img.id
                        ? "border-sage-400 ring-2 ring-sage-200"
                        : "border-sand-200 dark:border-stone-700 hover:border-sage-300"
                    }`}
                    onClick={() => {
                      setSelected(img);
                      setCaption(img.caption);
                      setLayout(img.layout);
                    }}
                  >
                    <div className="aspect-square bg-sand-100 dark:bg-stone-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={`data:${img.mime_type};base64,${img.data_base64}`}
                        alt={img.filename}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium text-stone-600 dark:text-sand-300 truncate">{img.filename}</div>
                      <div className="text-[10px] text-ink-muted">{img.width}x{img.height}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-72 bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 p-4 self-start">
              <div className="aspect-video bg-sand-100 dark:bg-stone-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <img
                  src={`data:${selected.mime_type};base64,${selected.data_base64}`}
                  alt={selected.filename}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="text-sm font-medium text-stone-700 dark:text-sand-200 mb-1">{selected.filename}</div>
              <div className="text-xs text-ink-muted dark:text-sand-400 mb-3">{selected.width}x{selected.height}px</div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted dark:text-sand-400 mb-1 block">Caption</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Image caption..."
                    className="w-full input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted dark:text-sand-400 mb-1 block">Layout</label>
                  <select
                    value={layout}
                    onChange={(e) => setLayout(e.target.value)}
                    className="w-full input-field text-xs"
                  >
                    <option value="inline">Inline (within text)</option>
                    <option value="full-page">Full Page</option>
                    <option value="full-bleed">Full Bleed (no margins)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateImage}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-sage-600 text-white text-xs font-medium hover:bg-sage-700 transition-colors"
                  >
                    Save
                  </button>
                  {onInsert && (
                    <button
                      onClick={() => handleInsert(selected)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-stone-600 text-stone-600 dark:text-sand-300 text-xs hover:bg-sand-300 transition-colors"
                    >
                      Insert
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
