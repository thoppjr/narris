use std::io::Write;
use std::path::Path;

pub struct DocxMetadata {
    pub title: String,
    pub author: String,
}

pub struct DocxChapter {
    pub title: String,
    pub content: String,
    pub chapter_type: String,
}

/// Generate a .docx file (Office Open XML) from chapters.
/// A .docx is a ZIP archive containing XML files.
pub fn generate_docx(
    metadata: &DocxMetadata,
    chapters: &[DocxChapter],
    output_path: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = std::fs::File::create(output_path)?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // [Content_Types].xml
    zip.start_file("[Content_Types].xml", options)?;
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>"#)?;

    // _rels/.rels
    zip.start_file("_rels/.rels", options)?;
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>"#)?;

    // word/_rels/document.xml.rels
    zip.start_file("word/_rels/document.xml.rels", options)?;
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"#)?;

    // docProps/core.xml
    zip.start_file("docProps/core.xml", options)?;
    let core = format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
    xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>{}</dc:title>
  <dc:creator>{}</dc:creator>
</cp:coreProperties>"#,
        escape_xml(&metadata.title),
        escape_xml(&metadata.author)
    );
    zip.write_all(core.as_bytes())?;

    // word/styles.xml
    zip.start_file("word/styles.xml", options)?;
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr><w:spacing w:before="480" w:after="240"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/></w:rPr>
  </w:style>
</w:styles>"#)?;

    // word/document.xml
    zip.start_file("word/document.xml", options)?;
    let mut body = String::new();

    // Title page
    body.push_str(&make_heading(&metadata.title, "Heading1"));
    if !metadata.author.is_empty() {
        body.push_str(&make_paragraph(&format!("by {}", metadata.author)));
    }
    body.push_str(&page_break());

    for chapter in chapters {
        // Chapter heading
        body.push_str(&make_heading(&chapter.title, "Heading2"));

        // Convert HTML content to DOCX paragraphs
        let paragraphs = html_to_docx_paragraphs(&chapter.content);
        body.push_str(&paragraphs);

        // Page break between chapters
        if chapter.chapter_type != "part" {
            body.push_str(&page_break());
        }
    }

    let document = format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {}
  </w:body>
</w:document>"#,
        body
    );
    zip.write_all(document.as_bytes())?;

    zip.finish()?;
    Ok(())
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn make_heading(text: &str, style: &str) -> String {
    format!(
        r#"<w:p><w:pPr><w:pStyle w:val="{}"/></w:pPr><w:r><w:t xml:space="preserve">{}</w:t></w:r></w:p>"#,
        style,
        escape_xml(text)
    )
}

fn make_paragraph(text: &str) -> String {
    format!(
        r#"<w:p><w:r><w:t xml:space="preserve">{}</w:t></w:r></w:p>"#,
        escape_xml(text)
    )
}

fn make_run(text: &str, bold: bool, italic: bool, underline: bool) -> String {
    let mut rpr = String::new();
    if bold {
        rpr.push_str("<w:b/>");
    }
    if italic {
        rpr.push_str("<w:i/>");
    }
    if underline {
        rpr.push_str(r#"<w:u w:val="single"/>"#);
    }
    let rpr_tag = if rpr.is_empty() {
        String::new()
    } else {
        format!("<w:rPr>{}</w:rPr>", rpr)
    };
    format!(
        r#"<w:r>{}<w:t xml:space="preserve">{}</w:t></w:r>"#,
        rpr_tag,
        escape_xml(text)
    )
}

fn page_break() -> String {
    r#"<w:p><w:r><w:br w:type="page"/></w:r></w:p>"#.to_string()
}

/// Simple HTML to DOCX paragraph converter.
/// Handles <p>, <h2>, <h3>, <strong>, <em>, <u>, <blockquote>, <ul>, <ol>, <li>, <br>.
fn html_to_docx_paragraphs(html: &str) -> String {
    let mut result = String::new();
    let content = html.trim();
    if content.is_empty() {
        return result;
    }

    // Simple state-machine parser for HTML
    let mut pos = 0;
    let bytes = content.as_bytes();
    let len = bytes.len();

    let mut in_bold = false;
    let mut in_italic = false;
    let mut in_underline = false;
    let mut in_blockquote = false;
    let mut in_list = false;
    let mut _ordered = false;
    let mut current_runs: Vec<String> = Vec::new();

    while pos < len {
        if bytes[pos] == b'<' {
            // Find end of tag
            let tag_end = content[pos..].find('>').map(|i| pos + i + 1).unwrap_or(len);
            let tag_content = &content[pos + 1..tag_end - 1];
            let tag_lower = tag_content.to_lowercase();
            let tag_name = tag_lower.split_whitespace().next().unwrap_or("");

            match tag_name {
                "p" => {}
                "/p" => {
                    // Flush paragraph
                    let ppr = if in_blockquote {
                        r#"<w:pPr><w:ind w:left="720"/></w:pPr>"#
                    } else {
                        ""
                    };
                    result.push_str(&format!("<w:p>{}{}</w:p>", ppr, current_runs.join("")));
                    current_runs.clear();
                }
                "h2" | "h3" => {}
                "/h2" => {
                    result.push_str(&format!(
                        r#"<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr>{}</w:p>"#,
                        current_runs.join("")
                    ));
                    current_runs.clear();
                }
                "/h3" => {
                    result.push_str(&format!(
                        r#"<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr>{}</w:p>"#,
                        current_runs.join("")
                    ));
                    current_runs.clear();
                }
                "strong" | "b" => in_bold = true,
                "/strong" | "/b" => in_bold = false,
                "em" | "i" => in_italic = true,
                "/em" | "/i" => in_italic = false,
                "u" => in_underline = true,
                "/u" => in_underline = false,
                "blockquote" => in_blockquote = true,
                "/blockquote" => in_blockquote = false,
                "ul" => { in_list = true; _ordered = false; }
                "ol" => { in_list = true; _ordered = true; }
                "/ul" | "/ol" => in_list = false,
                "li" => {}
                "/li" => {
                    let bullet = if in_list { "\u{2022} " } else { "" };
                    if !current_runs.is_empty() {
                        let runs_str = current_runs.join("");
                        result.push_str(&format!(
                            r#"<w:p><w:pPr><w:ind w:left="360"/></w:pPr><w:r><w:t xml:space="preserve">{}</w:t></w:r>{}</w:p>"#,
                            escape_xml(bullet),
                            runs_str
                        ));
                        current_runs.clear();
                    }
                }
                "br" | "br/" => {
                    current_runs.push("<w:r><w:br/></w:r>".to_string());
                }
                _ => {} // Ignore unknown tags
            }

            pos = tag_end;
        } else {
            // Text content - find until next tag
            let text_end = content[pos..].find('<').map(|i| pos + i).unwrap_or(len);
            let text = &content[pos..text_end];
            let decoded = decode_html_entities(text);
            if !decoded.trim().is_empty() || !decoded.is_empty() {
                current_runs.push(make_run(&decoded, in_bold, in_italic, in_underline));
            }
            pos = text_end;
        }
    }

    // Flush any remaining runs
    if !current_runs.is_empty() {
        result.push_str(&format!("<w:p>{}</w:p>", current_runs.join("")));
    }

    result
}

fn decode_html_entities(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
        .replace("&mdash;", "\u{2014}")
        .replace("&ndash;", "\u{2013}")
        .replace("&hellip;", "\u{2026}")
        .replace("&copy;", "\u{00A9}")
        .replace("&lsquo;", "\u{2018}")
        .replace("&rsquo;", "\u{2019}")
        .replace("&ldquo;", "\u{201C}")
        .replace("&rdquo;", "\u{201D}")
}

/// Imported chapter from a DOCX file
#[derive(Debug)]
pub struct ImportedChapter {
    pub title: String,
    pub content: String,
}

/// Import a .docx file, splitting on Heading1/Heading2 styles into chapters.
/// Returns a list of chapters with HTML content.
pub fn import_docx(input_path: &Path) -> Result<Vec<ImportedChapter>, Box<dyn std::error::Error>> {
    let file = std::fs::File::open(input_path)?;
    let mut archive = zip::ZipArchive::new(file)?;

    // Read word/document.xml
    let mut doc_xml = String::new();
    {
        let mut doc_file = archive.by_name("word/document.xml")?;
        use std::io::Read;
        doc_file.read_to_string(&mut doc_xml)?;
    }

    // Parse the OOXML into chapters
    let mut chapters: Vec<ImportedChapter> = Vec::new();
    let mut current_title = String::from("Chapter 1");
    let mut current_html = String::new();
    let mut chapter_num = 1;

    // Simple XML state machine to extract paragraphs
    let mut pos = 0;
    let bytes = doc_xml.as_bytes();
    let len = bytes.len();

    while pos < len {
        // Find next <w:p> or <w:p >
        if let Some(p_start) = find_tag_start(&doc_xml, pos, "w:p") {
            if let Some(p_end) = find_closing_tag(&doc_xml, p_start, "w:p") {
                let para_xml = &doc_xml[p_start..p_end];

                // Check paragraph style
                let style = extract_style(para_xml);
                let text = extract_text_runs(para_xml);

                if (style == "Heading1" || style == "Heading2" || style == "heading 1" || style == "heading 2") && !text.trim().is_empty() {
                    // Start a new chapter - save current if it has content
                    if !current_html.trim().is_empty() {
                        chapters.push(ImportedChapter {
                            title: current_title,
                            content: current_html,
                        });
                    }
                    current_title = text.trim().to_string();
                    current_html = String::new();
                    chapter_num += 1;
                } else if !text.trim().is_empty() {
                    // Check for bold/italic runs and build HTML
                    let html_para = runs_to_html(para_xml);
                    current_html.push_str(&format!("<p>{}</p>", html_para));
                }

                pos = p_end;
            } else {
                pos += 1;
            }
        } else {
            break;
        }
    }

    // Don't forget the last chapter
    if !current_html.trim().is_empty() || chapters.is_empty() {
        chapters.push(ImportedChapter {
            title: current_title,
            content: current_html,
        });
    }

    // If we only got one chapter with no meaningful title, use a default
    if chapters.len() == 1 && chapters[0].title == "Chapter 1" && chapter_num == 1 {
        // Keep as-is, single chapter import
    }

    Ok(chapters)
}

fn find_tag_start(xml: &str, from: usize, tag: &str) -> Option<usize> {
    let search1 = format!("<{}>", tag);
    let search2 = format!("<{} ", tag);
    let slice = &xml[from..];
    let pos1 = slice.find(&search1);
    let pos2 = slice.find(&search2);
    match (pos1, pos2) {
        (Some(a), Some(b)) => Some(from + a.min(b)),
        (Some(a), None) => Some(from + a),
        (None, Some(b)) => Some(from + b),
        (None, None) => None,
    }
}

fn find_closing_tag(xml: &str, from: usize, tag: &str) -> Option<usize> {
    let closing = format!("</{}>", tag);
    xml[from..].find(&closing).map(|i| from + i + closing.len())
}

fn extract_style(para_xml: &str) -> String {
    // Look for <w:pStyle w:val="..."/>
    if let Some(idx) = para_xml.find("w:pStyle") {
        if let Some(val_idx) = para_xml[idx..].find("w:val=\"") {
            let start = idx + val_idx + 7;
            if let Some(end) = para_xml[start..].find('"') {
                return para_xml[start..start + end].to_string();
            }
        }
    }
    String::new()
}

fn extract_text_runs(para_xml: &str) -> String {
    let mut text = String::new();
    let mut pos = 0;
    let t_open = "<w:t";
    let t_close = "</w:t>";

    while pos < para_xml.len() {
        if let Some(start) = para_xml[pos..].find(t_open) {
            let abs_start = pos + start;
            // Find the > after <w:t or <w:t ...>
            if let Some(gt) = para_xml[abs_start..].find('>') {
                let text_start = abs_start + gt + 1;
                if let Some(end) = para_xml[text_start..].find(t_close) {
                    text.push_str(&para_xml[text_start..text_start + end]);
                    pos = text_start + end + t_close.len();
                } else {
                    pos = text_start;
                }
            } else {
                break;
            }
        } else {
            break;
        }
    }
    text
}

fn runs_to_html(para_xml: &str) -> String {
    let mut html = String::new();
    let mut pos = 0;
    let r_open1 = "<w:r>";
    let r_open2 = "<w:r ";
    let r_close = "</w:r>";

    while pos < para_xml.len() {
        // Find next <w:r> or <w:r ...>
        let found1 = para_xml[pos..].find(r_open1).map(|i| pos + i);
        let found2 = para_xml[pos..].find(r_open2).map(|i| pos + i);
        let run_start = match (found1, found2) {
            (Some(a), Some(b)) => a.min(b),
            (Some(a), None) => a,
            (None, Some(b)) => b,
            (None, None) => break,
        };

        if let Some(end_offset) = para_xml[run_start..].find(r_close) {
            let run_xml = &para_xml[run_start..run_start + end_offset + r_close.len()];
            let text = extract_text_runs(run_xml);
            if !text.is_empty() {
                let bold = run_xml.contains("<w:b/>") || run_xml.contains("<w:b ");
                let italic = run_xml.contains("<w:i/>") || run_xml.contains("<w:i ");
                let underline = run_xml.contains("<w:u ");

                let mut result = text;
                if bold { result = format!("<strong>{}</strong>", result); }
                if italic { result = format!("<em>{}</em>", result); }
                if underline { result = format!("<u>{}</u>", result); }
                html.push_str(&result);
            }
            pos = run_start + end_offset + r_close.len();
        } else {
            break;
        }
    }
    html
}
