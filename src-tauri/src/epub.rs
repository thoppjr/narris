use std::io::Write;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

pub struct EpubChapter {
    pub title: String,
    pub content: String, // HTML content
}

pub struct EpubMetadata {
    pub title: String,
    pub author: String,
    pub language: String,
    pub identifier: String,
}

pub fn generate_epub(
    metadata: &EpubMetadata,
    chapters: &[EpubChapter],
    output_path: &std::path::Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = std::fs::File::create(output_path)?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let stored = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);

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

    // Stylesheet
    zip.start_file("OEBPS/style.css", options)?;
    zip.write_all(br#"
body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.8;
  margin: 1em;
  color: #2c2c2c;
}
h1, h2, h3 { font-family: sans-serif; margin-top: 1.5em; }
h1 { font-size: 1.8em; text-align: center; margin-bottom: 1em; }
h2 { font-size: 1.4em; }
h3 { font-size: 1.2em; }
p { margin: 0 0 0.75em 0; text-indent: 1.5em; }
p:first-of-type { text-indent: 0; }
blockquote { border-left: 3px solid #ccc; padding-left: 1em; font-style: italic; color: #555; }
"#)?;

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

    // Chapter files
    for (i, chapter) in chapters.iter().enumerate() {
        let filename = format!("OEBPS/chapter{}.xhtml", i + 1);
        zip.start_file(&filename, options)?;
        zip.write_all(
            format!(
                r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>{title}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<h2>{title}</h2>
{content}
</body>
</html>"#,
                title = escape_xml(&chapter.title),
                content = &chapter.content,
            )
            .as_bytes(),
        )?;
    }

    // Table of Contents (NCX for EPUB 2 compat + nav for EPUB 3)
    zip.start_file("OEBPS/toc.ncx", options)?;
    let mut ncx_items = String::new();
    ncx_items.push_str(&format!(
        r#"<navPoint id="title" playOrder="1"><navLabel><text>Title Page</text></navLabel><content src="title.xhtml"/></navPoint>
"#
    ));
    for (i, chapter) in chapters.iter().enumerate() {
        ncx_items.push_str(&format!(
            r#"<navPoint id="ch{idx}" playOrder="{order}"><navLabel><text>{title}</text></navLabel><content src="chapter{idx}.xhtml"/></navPoint>
"#,
            idx = i + 1,
            order = i + 2,
            title = escape_xml(&chapter.title),
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
    for (i, chapter) in chapters.iter().enumerate() {
        nav_items.push_str(&format!(
            r#"<li><a href="chapter{}.xhtml">{}</a></li>
"#,
            i + 1,
            escape_xml(&chapter.title)
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

    // content.opf (Package Document)
    let mut manifest_items = String::from(
        r#"<item id="style" href="style.css" media-type="text/css"/>
<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
"#,
    );
    let mut spine_items = String::from(r#"<itemref idref="title"/>
"#);

    for (i, _) in chapters.iter().enumerate() {
        manifest_items.push_str(&format!(
            r#"<item id="ch{idx}" href="chapter{idx}.xhtml" media-type="application/xhtml+xml"/>
"#,
            idx = i + 1,
        ));
        spine_items.push_str(&format!(
            r#"<itemref idref="ch{idx}"/>
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

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
