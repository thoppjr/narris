import { useState, useRef, useCallback } from "react";

interface CoverEditorProps {
  projectId: string;
  projectTitle: string;
  authorName: string;
  pageCount: number;
  trimWidth: number; // inches, e.g. 6
  trimHeight: number; // inches, e.g. 9
  onClose: () => void;
}

interface CoverState {
  frontBgColor: string;
  frontBgImage: string; // data URL
  frontTitle: string;
  frontSubtitle: string;
  frontAuthor: string;
  frontTitleSize: number;
  frontSubtitleSize: number;
  frontAuthorSize: number;
  frontTitleColor: string;
  frontSubtitleColor: string;
  frontAuthorColor: string;
  spineBgColor: string;
  spineTitle: string;
  spineAuthor: string;
  spineTitleColor: string;
  backBgColor: string;
  backBgImage: string;
  backBlurb: string;
  backBlurbSize: number;
  backBlurbColor: string;
  barcodeImage: string; // data URL for imported barcode
  paperType: "white" | "cream";
}

// KDP spine width formulas
function calcSpineWidth(pages: number, paperType: "white" | "cream"): number {
  const multiplier = paperType === "cream" ? 0.0025 : 0.002252;
  return pages * multiplier + 0.06;
}

const BLEED = 0.125; // inches
const SAFE_ZONE = 0.25; // inches
const BARCODE_W = 2; // inches
const BARCODE_H = 1.2; // inches
const MIN_SPINE_TEXT_PAGES = 79;

export default function CoverEditor({
  projectId: _projectId,
  projectTitle,
  authorName,
  pageCount,
  trimWidth,
  trimHeight,
  onClose,
}: CoverEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cover, setCover] = useState<CoverState>({
    frontBgColor: "#1a3a2a",
    frontBgImage: "",
    frontTitle: projectTitle,
    frontSubtitle: "",
    frontAuthor: authorName,
    frontTitleSize: 48,
    frontSubtitleSize: 24,
    frontAuthorSize: 20,
    frontTitleColor: "#ffffff",
    frontSubtitleColor: "#cccccc",
    frontAuthorColor: "#dddddd",
    spineBgColor: "#1a3a2a",
    spineTitle: projectTitle,
    spineAuthor: authorName,
    spineTitleColor: "#ffffff",
    backBgColor: "#1a3a2a",
    backBgImage: "",
    backBlurb: "Your book description goes here. Write a compelling back cover blurb that hooks readers...",
    backBlurbSize: 14,
    backBlurbColor: "#dddddd",
    barcodeImage: "",
    paperType: "white",
  });

  const [activeTab, setActiveTab] = useState<"front" | "spine" | "back">("front");

  const update = (field: keyof CoverState, value: string | number) => {
    setCover((prev) => ({ ...prev, [field]: value }));
  };

  const spineWidth = calcSpineWidth(pageCount, cover.paperType);
  const totalWidth = BLEED + trimWidth + spineWidth + trimWidth + BLEED;
  const totalHeight = BLEED + trimHeight + BLEED;
  const canSpineText = pageCount >= MIN_SPINE_TEXT_PAGES;

  // Scale factor for preview (fit in ~700px width)
  const scale = Math.min(700 / totalWidth, 500 / totalHeight);

  const handleImageUpload = (field: "frontBgImage" | "backBgImage" | "barcodeImage") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => update(field, reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const DPI = 300;
    const w = Math.round(totalWidth * DPI);
    const h = Math.round(totalHeight * DPI);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Dimensions in pixels
    const bleedPx = BLEED * DPI;
    const backX = bleedPx;
    const backW = trimWidth * DPI;
    const spineX = bleedPx + backW;
    const spineW = spineWidth * DPI;
    const frontX = spineX + spineW;
    const frontW = trimWidth * DPI;
    const contentH = trimHeight * DPI;
    const safeZone = SAFE_ZONE * DPI;

    // Back cover background
    ctx.fillStyle = cover.backBgColor;
    ctx.fillRect(0, 0, bleedPx + backW + spineW / 2, h);

    // Front cover background
    ctx.fillStyle = cover.frontBgColor;
    ctx.fillRect(frontX - spineW / 2, 0, frontW + bleedPx + spineW / 2, h);

    // Spine background
    ctx.fillStyle = cover.spineBgColor;
    ctx.fillRect(spineX, 0, spineW, h);

    // Front cover text
    const frontCenterX = frontX + frontW / 2;
    ctx.textAlign = "center";

    ctx.fillStyle = cover.frontTitleColor;
    ctx.font = `bold ${cover.frontTitleSize * (DPI / 72)}px Georgia`;
    wrapText(ctx, cover.frontTitle, frontCenterX, bleedPx + contentH * 0.3, frontW - safeZone * 2, cover.frontTitleSize * (DPI / 72) * 1.2);

    if (cover.frontSubtitle) {
      ctx.fillStyle = cover.frontSubtitleColor;
      ctx.font = `italic ${cover.frontSubtitleSize * (DPI / 72)}px Georgia`;
      ctx.fillText(cover.frontSubtitle, frontCenterX, bleedPx + contentH * 0.5, frontW - safeZone * 2);
    }

    ctx.fillStyle = cover.frontAuthorColor;
    ctx.font = `${cover.frontAuthorSize * (DPI / 72)}px Georgia`;
    ctx.fillText(cover.frontAuthor, frontCenterX, bleedPx + contentH * 0.8, frontW - safeZone * 2);

    // Spine text (only if enough pages)
    if (canSpineText) {
      ctx.save();
      ctx.translate(spineX + spineW / 2, bleedPx + contentH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = cover.spineTitleColor;
      const spineFontSize = Math.min(12, spineWidth * DPI * 0.5) * (DPI / 72);
      ctx.font = `bold ${spineFontSize}px Georgia`;
      ctx.textAlign = "center";
      const spineText = `${cover.spineTitle}    ${cover.spineAuthor}`;
      ctx.fillText(spineText, 0, 0, contentH - safeZone * 2);
      ctx.restore();
    }

    // Back cover blurb
    const backCenterX = backX + backW / 2;
    ctx.fillStyle = cover.backBlurbColor;
    ctx.font = `${cover.backBlurbSize * (DPI / 72)}px Georgia`;
    ctx.textAlign = "center";
    wrapText(ctx, cover.backBlurb, backCenterX, bleedPx + safeZone + contentH * 0.15, backW - safeZone * 2, cover.backBlurbSize * (DPI / 72) * 1.5);

    // Barcode area (bottom-right of back cover)
    const barcodeW = BARCODE_W * DPI;
    const barcodeH = BARCODE_H * DPI;
    const barcodeX = backX + backW - safeZone - barcodeW;
    const barcodeY = bleedPx + contentH - safeZone - barcodeH;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(barcodeX, barcodeY, barcodeW, barcodeH);

    if (cover.barcodeImage) {
      // Draw imported barcode image
      const img = new Image();
      img.src = cover.barcodeImage;
      try { ctx.drawImage(img, barcodeX, barcodeY, barcodeW, barcodeH); } catch (_) { /* image not loaded yet */ }
    } else {
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 2;
      ctx.strokeRect(barcodeX, barcodeY, barcodeW, barcodeH);
      ctx.fillStyle = "#999999";
      ctx.font = `${10 * (DPI / 72)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("BARCODE AREA", barcodeX + barcodeW / 2, barcodeY + barcodeH / 2 + 5);
      ctx.fillText("(Auto-placed by KDP)", barcodeX + barcodeW / 2, barcodeY + barcodeH / 2 + 20 * (DPI / 72));
    }

    // Guide lines (trim lines)
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "rgba(255,0,0,0.3)";
    ctx.lineWidth = 1;
    // Horizontal trim
    ctx.beginPath();
    ctx.moveTo(0, bleedPx);
    ctx.lineTo(w, bleedPx);
    ctx.moveTo(0, h - bleedPx);
    ctx.lineTo(w, h - bleedPx);
    ctx.stroke();
    // Vertical fold lines
    ctx.beginPath();
    ctx.moveTo(spineX, 0);
    ctx.lineTo(spineX, h);
    ctx.moveTo(spineX + spineW, 0);
    ctx.lineTo(spineX + spineW, h);
    ctx.stroke();
    ctx.setLineDash([]);

    return canvas;
  }, [cover, totalWidth, totalHeight, trimWidth, trimHeight, spineWidth, pageCount, canSpineText]);

  const handleExportPDF = () => {
    const canvas = renderToCanvas();
    if (!canvas) return;
    // Convert canvas to data URL and trigger download
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.download = `${cover.frontTitle.replace(/[^a-zA-Z0-9]/g, "_")}_cover_${Math.round(totalWidth * 300)}x${Math.round(totalHeight * 300)}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Preview render
  const previewStyle = {
    width: totalWidth * scale,
    height: totalHeight * scale,
  };

  const px = (inches: number) => inches * scale;

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sand-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink dark:hover:text-sand-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-sm font-medium text-stone-800 dark:text-sand-200">Cover Editor</h2>
          <span className="text-xs text-ink-muted dark:text-sand-400">
            {trimWidth}" x {trimHeight}" | {pageCount} pages | Spine: {spineWidth.toFixed(3)}" | Full: {totalWidth.toFixed(2)}" x {totalHeight.toFixed(2)}"
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="px-4 py-1.5 text-sm rounded-lg bg-sage-600 text-white font-medium hover:bg-sage-700 transition-colors">
            Export Cover (300 DPI PNG)
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Settings panel */}
        <div className="w-80 border-r border-sand-200 dark:border-stone-700 overflow-y-auto p-4 space-y-4">
          {/* Paper type */}
          <div>
            <label className="text-xs font-medium text-ink-muted dark:text-sand-400 uppercase tracking-wider">Paper Type</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => update("paperType", "white")} className={`flex-1 px-3 py-1.5 text-xs rounded-lg ${cover.paperType === "white" ? "bg-sage-600 text-white" : "bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300"}`}>
                White
              </button>
              <button onClick={() => update("paperType", "cream")} className={`flex-1 px-3 py-1.5 text-xs rounded-lg ${cover.paperType === "cream" ? "bg-sage-600 text-white" : "bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300"}`}>
                Cream
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-sand-200 dark:border-stone-700 pb-2">
            {(["front", "spine", "back"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-1.5 text-xs rounded-t-lg font-medium ${activeTab === tab ? "bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-200" : "text-ink-muted hover:text-ink"}`}
              >
                {tab === "front" ? "Front Cover" : tab === "spine" ? "Spine" : "Back Cover"}
              </button>
            ))}
          </div>

          {/* Front cover settings */}
          {activeTab === "front" && (
            <div className="space-y-3">
              <FieldRow label="Background Color">
                <input type="color" value={cover.frontBgColor} onChange={(e) => update("frontBgColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              </FieldRow>
              <FieldRow label="Background Image">
                <div className="flex gap-1">
                  <button onClick={() => handleImageUpload("frontBgImage")} className="px-3 py-1 text-xs rounded bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300">
                    {cover.frontBgImage ? "Replace" : "Upload"}
                  </button>
                  {cover.frontBgImage && (
                    <button onClick={() => update("frontBgImage", "")} className="px-2 py-1 text-xs rounded text-red-500 hover:bg-red-50">Clear</button>
                  )}
                </div>
              </FieldRow>
              <FieldRow label="Title">
                <input type="text" value={cover.frontTitle} onChange={(e) => update("frontTitle", e.target.value)} className="input-sm" />
              </FieldRow>
              <div className="flex gap-2">
                <FieldRow label="Title Size">
                  <input type="number" value={cover.frontTitleSize} onChange={(e) => update("frontTitleSize", +e.target.value)} min={12} max={96} className="input-sm w-16" />
                </FieldRow>
                <FieldRow label="Color">
                  <input type="color" value={cover.frontTitleColor} onChange={(e) => update("frontTitleColor", e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                </FieldRow>
              </div>
              <FieldRow label="Subtitle">
                <input type="text" value={cover.frontSubtitle} onChange={(e) => update("frontSubtitle", e.target.value)} className="input-sm" placeholder="Optional" />
              </FieldRow>
              <FieldRow label="Author">
                <input type="text" value={cover.frontAuthor} onChange={(e) => update("frontAuthor", e.target.value)} className="input-sm" />
              </FieldRow>
              <div className="flex gap-2">
                <FieldRow label="Author Size">
                  <input type="number" value={cover.frontAuthorSize} onChange={(e) => update("frontAuthorSize", +e.target.value)} min={8} max={48} className="input-sm w-16" />
                </FieldRow>
                <FieldRow label="Color">
                  <input type="color" value={cover.frontAuthorColor} onChange={(e) => update("frontAuthorColor", e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                </FieldRow>
              </div>
            </div>
          )}

          {/* Spine settings */}
          {activeTab === "spine" && (
            <div className="space-y-3">
              <div className="text-xs text-ink-muted dark:text-sand-400 bg-sand-100 dark:bg-stone-800 rounded-lg p-3">
                Spine width: {spineWidth.toFixed(3)}" ({(spineWidth * 25.4).toFixed(1)}mm)
                {!canSpineText && (
                  <div className="mt-1 text-amber-600 dark:text-amber-400">
                    Spine text requires 79+ pages. Current: {pageCount} pages.
                  </div>
                )}
              </div>
              <FieldRow label="Background Color">
                <input type="color" value={cover.spineBgColor} onChange={(e) => update("spineBgColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              </FieldRow>
              {canSpineText && (
                <>
                  <FieldRow label="Title">
                    <input type="text" value={cover.spineTitle} onChange={(e) => update("spineTitle", e.target.value)} className="input-sm" />
                  </FieldRow>
                  <FieldRow label="Author">
                    <input type="text" value={cover.spineAuthor} onChange={(e) => update("spineAuthor", e.target.value)} className="input-sm" />
                  </FieldRow>
                  <FieldRow label="Text Color">
                    <input type="color" value={cover.spineTitleColor} onChange={(e) => update("spineTitleColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  </FieldRow>
                </>
              )}
            </div>
          )}

          {/* Back cover settings */}
          {activeTab === "back" && (
            <div className="space-y-3">
              <FieldRow label="Background Color">
                <input type="color" value={cover.backBgColor} onChange={(e) => update("backBgColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
              </FieldRow>
              <FieldRow label="Background Image">
                <div className="flex gap-1">
                  <button onClick={() => handleImageUpload("backBgImage")} className="px-3 py-1 text-xs rounded bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300">
                    {cover.backBgImage ? "Replace" : "Upload"}
                  </button>
                  {cover.backBgImage && (
                    <button onClick={() => update("backBgImage", "")} className="px-2 py-1 text-xs rounded text-red-500 hover:bg-red-50">Clear</button>
                  )}
                </div>
              </FieldRow>
              <FieldRow label="Blurb">
                <textarea value={cover.backBlurb} onChange={(e) => update("backBlurb", e.target.value)} rows={5} className="input-sm" />
              </FieldRow>
              <div className="flex gap-2">
                <FieldRow label="Text Size">
                  <input type="number" value={cover.backBlurbSize} onChange={(e) => update("backBlurbSize", +e.target.value)} min={8} max={24} className="input-sm w-16" />
                </FieldRow>
                <FieldRow label="Color">
                  <input type="color" value={cover.backBlurbColor} onChange={(e) => update("backBlurbColor", e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                </FieldRow>
              </div>
              <FieldRow label="Barcode Image">
                <div className="flex gap-1">
                  <button onClick={() => handleImageUpload("barcodeImage")} className="px-3 py-1 text-xs rounded bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300">
                    {cover.barcodeImage ? "Replace Barcode" : "Import Barcode"}
                  </button>
                  {cover.barcodeImage && (
                    <button onClick={() => update("barcodeImage", "")} className="px-2 py-1 text-xs rounded text-red-500 hover:bg-red-50">Clear</button>
                  )}
                </div>
              </FieldRow>
              <div className="text-xs text-ink-muted dark:text-sand-400 bg-sand-100 dark:bg-stone-800 rounded-lg p-3">
                Barcode area (2" x 1.2") is reserved in the bottom-right corner. {cover.barcodeImage ? "Your barcode image will be used." : "KDP will auto-place the barcode if not provided. Import your own barcode image if you have one."}
              </div>
            </div>
          )}
        </div>

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center overflow-auto bg-stone-200 dark:bg-stone-950 p-8">
          <div style={previewStyle} className="relative shadow-2xl">
            {/* Back cover */}
            <div
              className="absolute"
              style={{
                left: 0,
                top: 0,
                width: px(BLEED + trimWidth),
                height: px(totalHeight),
                backgroundColor: cover.backBgColor,
                backgroundImage: cover.backBgImage ? `url(${cover.backBgImage})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div style={{ padding: `${px(BLEED + SAFE_ZONE)}px`, paddingTop: px(BLEED + SAFE_ZONE + trimHeight * 0.1) }}>
                <p style={{ color: cover.backBlurbColor, fontSize: cover.backBlurbSize * scale / 72, lineHeight: 1.5, textAlign: "center" }}>
                  {cover.backBlurb}
                </p>
              </div>
              {/* Barcode area */}
              <div
                className="absolute bg-white border border-gray-300 flex items-center justify-center overflow-hidden"
                style={{
                  right: px(SAFE_ZONE),
                  bottom: px(BLEED + SAFE_ZONE),
                  width: px(BARCODE_W),
                  height: px(BARCODE_H),
                  fontSize: 8 * scale / 72,
                  color: "#999",
                }}
              >
                {cover.barcodeImage ? (
                  <img src={cover.barcodeImage} alt="Barcode" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : "BARCODE"}
              </div>
            </div>

            {/* Spine */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: px(BLEED + trimWidth),
                top: 0,
                width: px(spineWidth),
                height: px(totalHeight),
                backgroundColor: cover.spineBgColor,
              }}
            >
              {canSpineText && (
                <div style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", color: cover.spineTitleColor, fontSize: Math.min(10, spineWidth * scale * 0.4), fontWeight: "bold" }}>
                  {cover.spineTitle} &nbsp;&nbsp; {cover.spineAuthor}
                </div>
              )}
            </div>

            {/* Front cover */}
            <div
              className="absolute flex flex-col items-center justify-center"
              style={{
                left: px(BLEED + trimWidth + spineWidth),
                top: 0,
                width: px(trimWidth + BLEED),
                height: px(totalHeight),
                backgroundColor: cover.frontBgColor,
                backgroundImage: cover.frontBgImage ? `url(${cover.frontBgImage})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div style={{ textAlign: "center", padding: `0 ${px(SAFE_ZONE)}px` }}>
                <div style={{ color: cover.frontTitleColor, fontSize: cover.frontTitleSize * scale / 72, fontWeight: "bold", fontFamily: "Georgia, serif", marginBottom: 8 }}>
                  {cover.frontTitle}
                </div>
                {cover.frontSubtitle && (
                  <div style={{ color: cover.frontSubtitleColor, fontSize: cover.frontSubtitleSize * scale / 72, fontStyle: "italic", fontFamily: "Georgia, serif", marginBottom: 12 }}>
                    {cover.frontSubtitle}
                  </div>
                )}
                <div style={{ color: cover.frontAuthorColor, fontSize: cover.frontAuthorSize * scale / 72, fontFamily: "Georgia, serif", marginTop: px(trimHeight * 0.3) }}>
                  {cover.frontAuthor}
                </div>
              </div>
            </div>

            {/* Guide labels */}
            <div className="absolute text-[8px] text-red-400/60 pointer-events-none" style={{ left: px(trimWidth / 2), top: 2 }}>BACK</div>
            <div className="absolute text-[8px] text-red-400/60 pointer-events-none" style={{ left: px(BLEED + trimWidth + spineWidth + trimWidth / 2), top: 2 }}>FRONT</div>
          </div>

          {/* Hidden canvas for export */}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-ink-muted dark:text-sand-400 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
  }
}
