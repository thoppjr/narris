/// Generates a PDF file by first creating print-ready HTML, then converting via system Chromium.
/// Returns an error (with no file written) if no PDF converter is available.

pub fn generate_pdf(
    metadata: &PdfMetadata,
    chapters: &[PdfChapter],
    formatting: Option<&PdfFormatting>,
    output_path: &std::path::Path,
) -> Result<(), Box<dyn std::error::Error>> {
    // Generate HTML to a temp file alongside the output path
    let temp_html = output_path.with_file_name({
        let stem = output_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("narras_export");
        format!("{}_temp.html", stem)
    });
    generate_print_html(metadata, chapters, formatting, &temp_html)?;

    // Ensure output does not pre-exist (stale file would fool the exists() check)
    let _ = std::fs::remove_file(output_path);

    let temp_html_uri = format!("file://{}", temp_html.display());
    let output_str = output_path
        .to_str()
        .ok_or("Invalid output path")?
        .to_string();

    // Try available Chromium/Chrome installations
    let browsers = [
        "chromium-browser",
        "chromium",
        "google-chrome-stable",
        "google-chrome",
    ];

    let mut pdf_generated = false;

    for browser in &browsers {
        let result = std::process::Command::new(browser)
            .args([
                "--headless",
                "--disable-gpu",
                "--no-sandbox",
                "--no-pdf-header-footer",
                "--disable-software-rasterizer",
                "--run-all-compositor-stages-before-draw",
                "--virtual-time-budget=5000",
                &format!("--print-to-pdf={}", output_str),
                &temp_html_uri,
            ])
            .output();

        if let Ok(proc) = result {
            if proc.status.success() && is_valid_pdf(output_path) {
                pdf_generated = true;
                break;
            }
            // Some Chrome versions ignore --print-to-pdf path and write to output.pdf
            // in the working directory; try to move it if that happened
            let cwd_pdf = std::env::current_dir()
                .map(|d| d.join("output.pdf"))
                .unwrap_or_default();
            if cwd_pdf.exists() && is_valid_pdf(&cwd_pdf) {
                std::fs::rename(&cwd_pdf, output_path)?;
                pdf_generated = true;
                break;
            }
        }
    }

    // Try wkhtmltopdf as fallback
    if !pdf_generated {
        let result = std::process::Command::new("wkhtmltopdf")
            .args([
                "--quiet",
                "--no-stop-slow-scripts",
                temp_html.to_str().unwrap_or(""),
                output_path.to_str().unwrap_or(""),
            ])
            .output();

        if let Ok(proc) = result {
            if proc.status.success() && is_valid_pdf(output_path) {
                pdf_generated = true;
            }
        }
    }

    // Clean up temp HTML file
    let _ = std::fs::remove_file(&temp_html);

    if !pdf_generated {
        // Remove any partial/corrupt output so callers don't see a bad file
        let _ = std::fs::remove_file(output_path);
        return Err(
            "No PDF converter found. Run: sudo apt install chromium-browser\n\
             Then retry the export. Alternatively install wkhtmltopdf."
                .into(),
        );
    }

    Ok(())
}

/// Returns true only if the file at `path` begins with the PDF magic bytes and is >500 bytes.
fn is_valid_pdf(path: &std::path::Path) -> bool {
    use std::io::Read;
    let Ok(mut f) = std::fs::File::open(path) else {
        return false;
    };
    let mut magic = [0u8; 5];
    if f.read_exact(&mut magic).is_err() {
        return false;
    }
    if &magic != b"%PDF-" {
        return false;
    }
    // Confirm non-trivial size
    let Ok(meta) = std::fs::metadata(path) else {
        return false;
    };
    meta.len() > 500
}


/// Generates a print-ready HTML file styled for PDF printing.
/// Users can open this in a browser and use Print > Save as PDF.

pub struct PdfChapter {
    pub title: String,
    pub content: String,
    pub chapter_type: String,
}

pub struct PdfMetadata {
    pub title: String,
    pub author: String,
    pub trim_size: String,
}

pub struct PdfFormatting {
    pub body_font: String,
    pub heading_font: String,
    pub body_size_pt: f64,
    pub heading_size_pt: f64,
    pub line_height: f64,
    pub paragraph_spacing_em: f64,
    pub paragraph_indent_em: f64,
    pub margin_top_in: f64,
    pub margin_bottom_in: f64,
    pub margin_inner_in: f64,
    pub margin_outer_in: f64,
    pub drop_cap_enabled: bool,
    pub drop_cap_lines: i32,
    pub lead_in_style: String,
    pub lead_in_words: i32,
    pub scene_break_style: String,
    pub justify_text: bool,
}

pub fn generate_print_html(
    metadata: &PdfMetadata,
    chapters: &[PdfChapter],
    formatting: Option<&PdfFormatting>,
    output_path: &std::path::Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let (width, height) = parse_trim_size(&metadata.trim_size);

    // Formatting values with defaults
    let body_font = formatting.map(|f| f.body_font.as_str()).unwrap_or("Georgia");
    let heading_font = formatting.map(|f| f.heading_font.as_str()).unwrap_or("sans-serif");
    let body_size = formatting.map(|f| f.body_size_pt).unwrap_or(11.0);
    let heading_size = formatting.map(|f| f.heading_size_pt).unwrap_or(18.0);
    let line_h = formatting.map(|f| f.line_height).unwrap_or(1.6);
    let para_spacing = formatting.map(|f| f.paragraph_spacing_em).unwrap_or(0.0);
    let indent = formatting.map(|f| f.paragraph_indent_em).unwrap_or(1.5);
    let margin_top = formatting.map(|f| f.margin_top_in).unwrap_or(0.75);
    let margin_bottom = formatting.map(|f| f.margin_bottom_in).unwrap_or(0.75);
    let margin_inner = formatting.map(|f| f.margin_inner_in).unwrap_or(0.875);
    let margin_outer = formatting.map(|f| f.margin_outer_in).unwrap_or(0.625);
    let drop_cap = formatting.map(|f| f.drop_cap_enabled).unwrap_or(false);
    let drop_cap_lines = formatting.map(|f| f.drop_cap_lines).unwrap_or(3);
    let lead_in_style = formatting.map(|f| f.lead_in_style.as_str()).unwrap_or("none");
    let scene_break = formatting.map(|f| f.scene_break_style.as_str()).unwrap_or("asterisks");
    let justify = formatting.map(|f| f.justify_text).unwrap_or(true);
    let text_align = if justify { "justify" } else { "left" };

    // Separate front matter, body, back matter
    let front_matter: Vec<&PdfChapter> = chapters.iter().filter(|c| is_front_matter(&c.chapter_type)).collect();
    let body_sections: Vec<&PdfChapter> = chapters.iter().filter(|c| !is_front_matter(&c.chapter_type) && !is_back_matter(&c.chapter_type)).collect();
    let back_matter: Vec<&PdfChapter> = chapters.iter().filter(|c| is_back_matter(&c.chapter_type)).collect();

    let mut chapter_html = String::new();

    // Front matter
    for section in &front_matter {
        let content = process_footnotes(&process_text_messages(&section.content));
        chapter_html.push_str(&format!(
            r#"<div class="front-matter">
<h1 class="front-title">{}</h1>
{}
</div>
<div class="page-break"></div>
"#,
            escape_html(&section.title),
            &content,
        ));
    }

    // Body chapters and parts
    for (i, section) in body_sections.iter().enumerate() {
        if i > 0 || !front_matter.is_empty() {
            chapter_html.push_str(r#"<div class="page-break"></div>"#);
        }

        let content = process_footnotes(&process_text_messages(&section.content));
        if section.chapter_type == "part" {
            chapter_html.push_str(&format!(
                r#"<div class="part-page">
<h1 class="part-title">{}</h1>
{}
</div>"#,
                escape_html(&section.title),
                &content,
            ));
        } else {
            chapter_html.push_str(&format!(
                r#"<div class="chapter">
<h2 class="chapter-title">{}</h2>
<div class="chapter-body">{}</div>
</div>"#,
                escape_html(&section.title),
                &content,
            ));
        }
    }

    // Back matter
    for section in &back_matter {
        let content = process_footnotes(&process_text_messages(&section.content));
        chapter_html.push_str(&format!(
            r#"<div class="page-break"></div>
<div class="back-matter">
<h2 class="back-title">{}</h2>
{}
</div>"#,
            escape_html(&section.title),
            &content,
        ));
    }

    let scene_break_css = match scene_break {
        "flourish" => "hr.scene-break { border: none; text-align: center; margin: 1.5em 0; } hr.scene-break::after { content: '\\2767\\0020\\2767\\0020\\2767'; font-size: 1.2em; color: #888; }",
        "line" => "hr.scene-break { border: none; border-top: 1px solid #ccc; margin: 1.5em 4em; }",
        "blank" => "hr.scene-break { border: none; margin: 1.5em 0; visibility: hidden; }",
        "dots" => "hr.scene-break { border: none; text-align: center; margin: 1.5em 0; } hr.scene-break::after { content: '\\2022\\0020\\2022\\0020\\2022'; color: #888; }",
        _ => "hr.scene-break { border: none; text-align: center; margin: 1.5em 0; } hr.scene-break::after { content: '* * *'; color: #888; }",
    };

    let drop_cap_css = if drop_cap {
        format!(
            r#"
.chapter-body p:first-of-type::first-letter {{
  float: left;
  font-size: {size}em;
  line-height: 0.8;
  padding-right: 0.08em;
  font-weight: bold;
  color: #1a1a1a;
}}"#,
            size = drop_cap_lines
        )
    } else {
        String::new()
    };

    let lead_in_css = match lead_in_style {
        "small-caps" => ".lead-in { font-variant: small-caps; font-size: 1.05em; }",
        "bold" => ".lead-in { font-weight: bold; }",
        "italic" => ".lead-in { font-style: italic; }",
        _ => "",
    };

    let html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
@page {{
  size: {width}in {height}in;
  margin: {margin_top}in {margin_outer}in {margin_bottom}in {margin_inner}in;
}}

body {{
  font-family: "{body_font}", Georgia, serif;
  font-size: {body_size}pt;
  line-height: {line_h};
  color: #1a1a1a;
  margin: 0;
  padding: 0;
  text-align: {text_align};
}}

/* Title page */
.title-page {{
  text-align: center;
  padding-top: 35%;
  page-break-after: always;
}}
.title-page h1 {{
  font-family: "{heading_font}", sans-serif;
  font-size: 28pt;
  font-weight: normal;
  margin-bottom: 0.5em;
  letter-spacing: 0.05em;
}}
.title-page .author {{
  font-size: 14pt;
  color: #555;
  font-style: italic;
}}

/* Front matter */
.front-matter {{
  text-align: center;
  page-break-after: always;
}}
.front-title {{
  font-family: "{heading_font}", sans-serif;
  font-size: {heading_size}pt;
  text-align: center;
  margin-top: 30%;
  margin-bottom: 1em;
}}
.front-matter p {{ text-indent: 0; text-align: center; }}

/* Part pages */
.part-page {{
  text-align: center;
  page-break-before: always;
  page-break-after: always;
}}
.part-title {{
  font-family: "{heading_font}", sans-serif;
  font-size: 24pt;
  font-weight: 600;
  margin-top: 40%;
  letter-spacing: 0.05em;
}}

/* Chapters */
.chapter {{
  page-break-before: always;
}}
.chapter:first-of-type {{
  page-break-before: auto;
}}
.chapter-title {{
  font-family: "{heading_font}", sans-serif;
  font-size: {heading_size}pt;
  font-weight: 600;
  text-align: center;
  margin: 2em 0 1.5em 0;
  letter-spacing: 0.02em;
}}

/* Back matter */
.back-matter {{
  page-break-before: always;
}}
.back-title {{
  font-family: "{heading_font}", sans-serif;
  font-size: {heading_size}pt;
  text-align: center;
  margin: 2em 0 1em 0;
}}
.back-matter p {{ text-indent: 0; }}

p {{
  margin: {para_spacing}em 0 0.5em 0;
  text-indent: {indent}em;
}}
p:first-of-type {{
  text-indent: 0;
}}

blockquote {{
  border-left: 2pt solid #ccc;
  padding-left: 1em;
  margin: 1em 0;
  font-style: italic;
  color: #555;
}}

h2, h3 {{ font-family: "{heading_font}", sans-serif; }}

.page-break {{
  page-break-after: always;
  height: 0;
}}

{scene_break_css}
{drop_cap_css}
{lead_in_css}

@media print {{
  body {{ margin: 0; }}
}}
</style>
</head>
<body>

<div class="title-page">
  <h1>{title}</h1>
  <div class="author">{author}</div>
</div>

{chapters}

</body>
</html>"#,
        title = escape_html(&metadata.title),
        author = escape_html(&metadata.author),
        width = width,
        height = height,
        body_font = body_font,
        heading_font = heading_font,
        body_size = body_size,
        heading_size = heading_size,
        line_h = line_h,
        para_spacing = para_spacing,
        indent = indent,
        margin_top = margin_top,
        margin_bottom = margin_bottom,
        margin_inner = margin_inner,
        margin_outer = margin_outer,
        text_align = text_align,
        scene_break_css = scene_break_css,
        drop_cap_css = drop_cap_css,
        lead_in_css = lead_in_css,
        chapters = chapter_html,
    );

    std::fs::write(output_path, html)?;
    Ok(())
}

/// Convert text-message divs into clean HTML for print.
fn process_text_messages(content: &str) -> String {
    let mut result = content.to_string();
    let mut search_pos = 0;

    while let Some(start) = result[search_pos..].find("<div data-text-message") {
        let abs_start = search_pos + start;
        let mut depth = 0;
        let mut pos = abs_start;
        let mut end_pos = None;
        while pos < result.len() {
            if result[pos..].starts_with("<div") {
                depth += 1;
                pos += 4;
            } else if result[pos..].starts_with("</div>") {
                depth -= 1;
                if depth == 0 {
                    end_pos = Some(pos + 6);
                    break;
                }
                pos += 6;
            } else {
                pos += 1;
            }
        }

        if let Some(abs_end) = end_pos {
            let block = &result[abs_start..abs_end];
            let sender = extract_attr(block, "data-sender")
                .or_else(|| {
                    if let Some(s) = block.find("text-message-sender") {
                        if let Some(gt) = block[s..].find('>') {
                            let after = &block[s + gt + 1..];
                            if let Some(lt) = after.find('<') {
                                return Some(after[..lt].to_string());
                            }
                        }
                    }
                    None
                })
                .unwrap_or_default();
            let text_content = extract_attr(block, "data-text")
                .or_else(|| {
                    if let Some(s) = block.find("text-message-bubble") {
                        if let Some(gt) = block[s..].find('>') {
                            let after = &block[s + gt + 1..];
                            if let Some(lt) = after.find('<') {
                                return Some(after[..lt].to_string());
                            }
                        }
                    }
                    None
                })
                .unwrap_or_default();
            let side = extract_attr(block, "data-side").unwrap_or_else(|| "left".to_string());
            let is_right = side == "right";
            let align = if is_right { "right" } else { "left" };

            let replacement = format!(
                r#"<div style="text-align: {align}; margin: 0.5em 0;"><div style="font-size: 0.75em; color: #888;">{sender}</div><div style="display: inline-block; background: {bg}; color: {fg}; padding: 0.5em 1em; border-radius: 1em; max-width: 75%; text-align: left;">{text}</div></div>"#,
                align = align,
                sender = escape_html(&sender),
                bg = if is_right { "#4a6249" } else { "#e8e0d4" },
                fg = if is_right { "#ffffff" } else { "#333333" },
                text = escape_html(&text_content),
            );
            result = format!("{}{}{}", &result[..abs_start], replacement, &result[abs_end..]);
            search_pos = abs_start + replacement.len();
        } else {
            search_pos = abs_start + 1;
        }
    }

    result
}

/// Process TipTap footnote spans into numbered references + endnotes section.
fn process_footnotes(content: &str) -> String {
    let mut result = content.to_string();
    let mut footnotes: Vec<(String, String)> = Vec::new();
    let mut search_pos = 0;

    while let Some(start) = result[search_pos..].find("<span data-footnote") {
        let abs_start = search_pos + start;
        if let Some(end) = result[abs_start..].find("</span>") {
            let abs_end = abs_start + end + 7;
            let span = &result[abs_start..abs_end];

            let text = extract_attr(span, "data-text").or_else(|| extract_attr(span, "title")).unwrap_or_default();
            let num = extract_attr(span, "data-number").unwrap_or_else(|| (footnotes.len() + 1).to_string());

            footnotes.push((num.clone(), text));

            let replacement = format!(r#"<sup style="font-size:0.75em;color:#4a6249">{}</sup>"#, escape_html(&num));
            result = format!("{}{}{}", &result[..abs_start], replacement, &result[abs_end..]);
            search_pos = abs_start + replacement.len();
        } else {
            search_pos = abs_start + 1;
        }
    }

    if !footnotes.is_empty() {
        result.push_str(r#"<div style="border-top:1px solid #ccc;margin-top:2em;padding-top:0.8em"><ol style="padding-left:1.5em">"#);
        for (num, text) in &footnotes {
            result.push_str(&format!(
                r#"<li value="{}" style="font-size:0.85em;color:#555;margin-bottom:0.4em;text-indent:0">{}</li>"#,
                escape_html(num),
                escape_html(text)
            ));
        }
        result.push_str("</ol></div>");
    }

    result
}

fn extract_attr(html: &str, attr: &str) -> Option<String> {
    let search = format!("{}=\"", attr);
    if let Some(idx) = html.find(&search) {
        let start = idx + search.len();
        if let Some(end) = html[start..].find('"') {
            return Some(html[start..start + end].to_string());
        }
    }
    None
}

fn is_front_matter(chapter_type: &str) -> bool {
    matches!(chapter_type, "title_page" | "copyright" | "dedication" | "epigraph" | "toc" | "foreword" | "preface")
}

fn is_back_matter(chapter_type: &str) -> bool {
    matches!(chapter_type, "about_author" | "also_by" | "acknowledgments" | "appendix" | "glossary")
}

fn parse_trim_size(size: &str) -> (f32, f32) {
    match size {
        "5x8" => (5.0, 8.0),
        "5.25x8" => (5.25, 8.0),
        "5.5x8.5" => (5.5, 8.5),
        "6x9" => (6.0, 9.0),
        "8.5x11" => (8.5, 11.0),
        _ => (5.5, 8.5),
    }
}

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}
