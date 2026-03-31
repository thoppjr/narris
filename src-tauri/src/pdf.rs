/// Generates a print-ready HTML file styled for PDF printing.
/// Users can open this in a browser and use Print > Save as PDF,
/// or we can invoke a system PDF tool if available.

pub struct PdfChapter {
    pub title: String,
    pub content: String,
}

pub struct PdfMetadata {
    pub title: String,
    pub author: String,
    pub trim_size: String, // e.g., "5x8", "6x9"
}

pub fn generate_print_html(
    metadata: &PdfMetadata,
    chapters: &[PdfChapter],
    output_path: &std::path::Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let (width, height) = parse_trim_size(&metadata.trim_size);

    let mut chapter_html = String::new();
    for (i, chapter) in chapters.iter().enumerate() {
        if i > 0 {
            chapter_html.push_str(r#"<div class="page-break"></div>"#);
        }
        chapter_html.push_str(&format!(
            r#"<div class="chapter">
<h2 class="chapter-title">{}</h2>
{}
</div>"#,
            escape_html(&chapter.title),
            &chapter.content,
        ));
    }

    let html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
@page {{
  size: {width}in {height}in;
  margin: 0.75in 0.875in;
}}

body {{
  font-family: Georgia, "Times New Roman", serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #1a1a1a;
  margin: 0;
  padding: 0;
}}

/* Title page */
.title-page {{
  text-align: center;
  padding-top: 35%;
  page-break-after: always;
}}
.title-page h1 {{
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

/* Chapters */
.chapter {{
  page-break-before: always;
}}
.chapter:first-of-type {{
  page-break-before: auto;
}}
.chapter-title {{
  font-family: sans-serif;
  font-size: 18pt;
  font-weight: 600;
  text-align: center;
  margin: 2em 0 1.5em 0;
  letter-spacing: 0.02em;
}}

p {{
  margin: 0 0 0.5em 0;
  text-indent: 1.5em;
  text-align: justify;
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

h2, h3 {{ font-family: sans-serif; }}

.page-break {{
  page-break-after: always;
  height: 0;
}}

/* Headers/footers via CSS (browser print) */
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
        chapters = chapter_html,
    );

    std::fs::write(output_path, html)?;
    Ok(())
}

fn parse_trim_size(size: &str) -> (f32, f32) {
    match size {
        "5x8" => (5.0, 8.0),
        "5.25x8" => (5.25, 8.0),
        "5.5x8.5" => (5.5, 8.5),
        "6x9" => (6.0, 9.0),
        "8.5x11" => (8.5, 11.0),
        _ => (5.5, 8.5), // default
    }
}

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}
