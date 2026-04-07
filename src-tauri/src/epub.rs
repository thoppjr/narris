use std::io::Write;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

pub struct EpubChapter {
    pub title: String,
    pub content: String,
    pub chapter_type: String,
}

pub struct EpubMetadata {
    pub title: String,
    pub author: String,
    pub language: String,
    pub identifier: String,
}

pub struct EpubFormatting {
    pub body_font: String,
    pub heading_font: String,
    pub body_size_pt: f64,
    pub line_height: f64,
    pub paragraph_indent_em: f64,
    pub drop_cap_enabled: bool,
    pub drop_cap_lines: i32,
    pub lead_in_style: String,
    pub lead_in_words: i32,
    pub scene_break_style: String,
    pub justify_text: bool,
}

pub fn generate_epub(
    metadata: &EpubMetadata,
    chapters: &[EpubChapter],
    formatting: Option<&EpubFormatting>,
    output_path: &std::path::Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = std::fs::File::create(output_path)?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let stored = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);

    // Default formatting values
    let body_font = formatting.map(|f| f.body_font.as_str()).unwrap_or("Georgia");
    let heading_font = formatting.map(|f| f.heading_font.as_str()).unwrap_or("sans-serif");
    let body_size = formatting.map(|f| f.body_size_pt).unwrap_or(11.0);
    let line_h = formatting.map(|f| f.line_height).unwrap_or(1.8);
    let indent = formatting.map(|f| f.paragraph_indent_em).unwrap_or(1.5);
    let justify = formatting.map(|f| f.justify_text).unwrap_or(true);
    let drop_cap = formatting.map(|f| f.drop_cap_enabled).unwrap_or(false);
    let drop_cap_lines = formatting.map(|f| f.drop_cap_lines).unwrap_or(3);
    let lead_in_style = formatting.map(|f| f.lead_in_style.as_str()).unwrap_or("none");
    let lead_in_words = formatting.map(|f| f.lead_in_words).unwrap_or(3);
    let scene_break = formatting.map(|f| f.scene_break_style.as_str()).unwrap_or("asterisks");
    let text_align = if justify { "justify" } else { "left" };

    // mimetype must be first and uncompressed
    zip.start_file("mimetype", stored)?;
    zip.write_all(b"application/epub+zip")?;

    // META-INF/container.xml
    zip.start_file("META-INF/container.xml", options)?;
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"#)?;

    // Stylesheet with formatting settings
    zip.start_file("OEBPS/style.css", options)?;
    let scene_break_css = match scene_break {
        "flourish" => "hr.scene-break { border: none; text-align: center; margin: 2em 0; } hr.scene-break::after { content: '\\2767\\2009\\2767\\2009\\2767'; font-size: 1.2em; color: #888; }",
        "line" => "hr.scene-break { border: none; border-top: 1px solid #ccc; margin: 2em 3em; }",
        "blank" => "hr.scene-break { border: none; margin: 2em 0; visibility: hidden; }",
        "dots" => "hr.scene-break { border: none; text-align: center; margin: 2em 0; } hr.scene-break::after { content: '\\2022\\2009\\2022\\2009\\2022'; color: #888; }",
        _ => "hr.scene-break { border: none; text-align: center; margin: 2em 0; } hr.scene-break::after { content: '* * *'; color: #888; }",
    };

    let drop_cap_css = if drop_cap {
        format!(
            r#"
.chapter-body p:first-of-type::first-letter {{
  float: left;
  font-size: {}em;
  line-height: 0.8;
  padding-right: 0.1em;
  font-weight: bold;
  color: #333;
}}"#,
            drop_cap_lines
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

    zip.write_all(
        format!(
            r#"
body {{
  font-family: {body_font}, serif;
  line-height: {line_h};
  margin: 1em;
  color: #2c2c2c;
  font-size: {body_size}pt;
  text-align: {text_align};
}}
h1, h2, h3 {{ font-family: {heading_font}, sans-serif; margin-top: 1.5em; }}
h1 {{ font-size: 1.8em; text-align: center; margin-bottom: 1em; }}
h2 {{ font-size: 1.4em; }}
h3 {{ font-size: 1.2em; }}
p {{ margin: 0 0 0.75em 0; text-indent: {indent}em; }}
p:first-of-type {{ text-indent: 0; }}
blockquote {{ border-left: 3px solid #ccc; padding-left: 1em; font-style: italic; color: #555; }}
.front-matter, .back-matter {{ text-align: center; }}
.front-matter h1 {{ margin-top: 30%; }}
.front-matter p, .back-matter p {{ text-indent: 0; text-align: center; }}
.part-title {{ text-align: center; margin-top: 40%; }}
.part-title h1 {{ font-size: 2em; margin-bottom: 0.5em; }}
{scene_break_css}
{drop_cap_css}
{lead_in_css}
/* Footnotes */
.footnotes {{ border-top: 1px solid #ccc; margin-top: 3em; padding-top: 1em; }}
.footnotes ol {{ padding-left: 1.5em; }}
.footnotes li {{ font-size: 0.85em; color: #555; margin-bottom: 0.5em; text-indent: 0; }}
sup.fn-ref {{ font-size: 0.75em; color: #4a6249; }}
"#,
        )
        .as_bytes(),
    )?;

    // Separate front matter, chapters/parts, and back matter
    let front_matter: Vec<&EpubChapter> = chapters.iter().filter(|c| is_front_matter(&c.chapter_type)).collect();
    let body_sections: Vec<&EpubChapter> = chapters.iter().filter(|c| !is_front_matter(&c.chapter_type) && !is_back_matter(&c.chapter_type)).collect();
    let back_matter: Vec<&EpubChapter> = chapters.iter().filter(|c| is_back_matter(&c.chapter_type)).collect();

    let all_sections: Vec<&EpubChapter> = front_matter.iter().chain(body_sections.iter()).chain(back_matter.iter()).copied().collect();

    // Title page
    zip.start_file("OEBPS/title.xhtml", options)?;
    zip.write_all(
        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>{title}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<h1 style="margin-top: 40%; text-align: center;">{title}</h1>
<p style="text-align: center; text-indent: 0;">{author}</p>
</body>
</html>"#,
            title = escape_xml(&metadata.title),
            author = escape_xml(&metadata.author),
        )
        .as_bytes(),
    )?;

    // Section files
    for (i, section) in all_sections.iter().enumerate() {
        let filename = format!("OEBPS/section{}.xhtml", i + 1);
        zip.start_file(&filename, options)?;

        let body_class = if is_front_matter(&section.chapter_type) {
            "front-matter"
        } else if is_back_matter(&section.chapter_type) {
            "back-matter"
        } else if section.chapter_type == "part" {
            "part-title"
        } else {
            "chapter-body"
        };

        let heading_tag = if section.chapter_type == "part" { "h1" } else { "h2" };

        let cleaned_content = process_text_messages(&section.content);
        let processed_content = process_footnotes(&cleaned_content);
        zip.write_all(
            format!(
                r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>{title}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body class="{body_class}">
<{heading_tag}>{title}</{heading_tag}>
{content}
</body>
</html>"#,
                title = escape_xml(&section.title),
                content = &processed_content,
                body_class = body_class,
                heading_tag = heading_tag,
            )
            .as_bytes(),
        )?;
    }

    // Table of Contents (NCX)
    zip.start_file("OEBPS/toc.ncx", options)?;
    let mut ncx_items = String::new();
    ncx_items.push_str(
        r#"<navPoint id="title" playOrder="1"><navLabel><text>Title Page</text></navLabel><content src="title.xhtml"/></navPoint>
"#,
    );
    for (i, section) in all_sections.iter().enumerate() {
        ncx_items.push_str(&format!(
            r#"<navPoint id="sec{idx}" playOrder="{order}"><navLabel><text>{title}</text></navLabel><content src="section{idx}.xhtml"/></navPoint>
"#,
            idx = i + 1,
            order = i + 2,
            title = escape_xml(&section.title),
        ));
    }
    zip.write_all(
        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head><meta name="dtb:uid" content="{id}"/></head>
<docTitle><text>{title}</text></docTitle>
<navMap>
{items}</navMap>
</ncx>"#,
            id = escape_xml(&metadata.identifier),
            title = escape_xml(&metadata.title),
            items = ncx_items,
        )
        .as_bytes(),
    )?;

    // EPUB 3 Nav document
    zip.start_file("OEBPS/nav.xhtml", options)?;
    let mut nav_items = format!(
        r#"<li><a href="title.xhtml">Title Page</a></li>
"#
    );
    for (i, section) in all_sections.iter().enumerate() {
        nav_items.push_str(&format!(
            r#"<li><a href="section{}.xhtml">{}</a></li>
"#,
            i + 1,
            escape_xml(&section.title)
        ));
    }
    zip.write_all(
        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
<nav epub:type="toc"><h1>Table of Contents</h1><ol>
{items}</ol></nav>
</body>
</html>"#,
            items = nav_items,
        )
        .as_bytes(),
    )?;

    // content.opf
    let mut manifest_items = String::from(
        r#"<item id="style" href="style.css" media-type="text/css"/>
<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
"#,
    );
    let mut spine_items = String::from(r#"<itemref idref="title"/>
"#);

    for (i, _) in all_sections.iter().enumerate() {
        manifest_items.push_str(&format!(
            r#"<item id="sec{idx}" href="section{idx}.xhtml" media-type="application/xhtml+xml"/>
"#,
            idx = i + 1,
        ));
        spine_items.push_str(&format!(
            r#"<itemref idref="sec{idx}"/>
"#,
            idx = i + 1,
        ));
    }

    zip.start_file("OEBPS/content.opf", options)?;
    zip.write_all(
        format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:identifier id="bookid">{id}</dc:identifier>
  <dc:title>{title}</dc:title>
  <dc:creator>{author}</dc:creator>
  <dc:language>{lang}</dc:language>
  <meta property="dcterms:modified">{modified}</meta>
</metadata>
<manifest>
{manifest}</manifest>
<spine toc="ncx">
{spine}</spine>
</package>"#,
            id = escape_xml(&metadata.identifier),
            title = escape_xml(&metadata.title),
            author = escape_xml(&metadata.author),
            lang = escape_xml(&metadata.language),
            modified = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ"),
            manifest = manifest_items,
            spine = spine_items,
        )
        .as_bytes(),
    )?;

    zip.finish()?;
    Ok(())
}

/// Convert text-message divs from TipTap into clean XHTML-compatible markup.
fn process_text_messages(content: &str) -> String {
    let mut result = content.to_string();
    let mut search_pos = 0;

    while let Some(start) = result[search_pos..].find("<div data-text-message") {
        let abs_start = search_pos + start;
        // Find the closing </div> - text messages have nested divs so we need to count
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
                    // Extract from nested sender div
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
                    // Extract from nested bubble div
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
                sender = escape_xml(&sender),
                bg = if is_right { "#4a6249" } else { "#e8e0d4" },
                fg = if is_right { "#ffffff" } else { "#333333" },
                text = escape_xml(&text_content),
            );
            result = format!("{}{}{}", &result[..abs_start], replacement, &result[abs_end..]);
            search_pos = abs_start + replacement.len();
        } else {
            search_pos = abs_start + 1;
        }
    }

    result
}

/// Extract footnotes from TipTap HTML and convert to endnotes at chapter bottom.
/// TipTap footnotes look like: <span data-footnote="" data-text="..." data-number="N"><sup>N</sup></span>
fn process_footnotes(content: &str) -> String {
    let mut result = content.to_string();
    let mut footnotes: Vec<(String, String)> = Vec::new(); // (number, text)
    let mut search_pos = 0;

    // Find all footnote spans
    while let Some(start) = result[search_pos..].find("<span data-footnote") {
        let abs_start = search_pos + start;
        if let Some(end) = result[abs_start..].find("</span>") {
            let abs_end = abs_start + end + 7;
            let span = &result[abs_start..abs_end];

            // Extract data-text and data-number
            let text = extract_attr(span, "data-text").or_else(|| extract_attr(span, "title")).unwrap_or_default();
            let num = extract_attr(span, "data-number").unwrap_or_else(|| (footnotes.len() + 1).to_string());

            footnotes.push((num.clone(), text));

            // Replace the span with a superscript reference
            let replacement = format!(r#"<sup class="fn-ref">{}</sup>"#, escape_xml(&num));
            result = format!("{}{}{}", &result[..abs_start], replacement, &result[abs_end..]);
            search_pos = abs_start + replacement.len();
        } else {
            search_pos = abs_start + 1;
        }
    }

    // Append footnotes section if any found
    if !footnotes.is_empty() {
        result.push_str(r#"<div class="footnotes"><ol>"#);
        for (num, text) in &footnotes {
            result.push_str(&format!(
                r#"<li value="{}">{}</li>"#,
                escape_xml(num),
                escape_xml(text)
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

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
