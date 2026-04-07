use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub title: String,
    pub author: String,
    pub genre: String,
    pub isbn: String,
    pub copyright_year: String,
    pub publisher: String,
    pub bleed_enabled: bool,
    pub bleed_size_in: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChapterSnapshot {
    pub id: String,
    pub chapter_id: String,
    pub project_id: String,
    pub name: String,
    pub content: String,
    pub word_count: i32,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chapter {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub content: String,
    pub sort_order: i32,
    pub chapter_type: String,
    pub word_count: i32,
    pub parent_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FormattingSettings {
    pub id: String,
    pub project_id: String,
    pub template_name: String,
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
    pub scene_break_custom: String,
    pub justify_text: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WritingGoal {
    pub id: String,
    pub project_id: String,
    pub target_word_count: i32,
    pub deadline: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DailyLog {
    pub id: String,
    pub project_id: String,
    pub date: String,
    pub word_count: i32,
    pub words_written: i32,
    pub minutes_active: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomTheme {
    pub id: String,
    pub name: String,
    pub description: String,
    pub settings_json: String, // JSON of FormattingSettings fields
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MasterPage {
    pub id: String,
    pub name: String,
    pub page_type: String,
    pub content: String,
    pub settings_json: String, // JSON of styling overrides
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectImage {
    pub id: String,
    pub project_id: String,
    pub filename: String,
    pub data_base64: String,
    pub mime_type: String,
    pub width: i32,
    pub height: i32,
    pub caption: String,
    pub layout: String, // "inline", "full-page", "full-bleed"
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorComment {
    pub id: String,
    pub chapter_id: String,
    pub project_id: String,
    pub content: String,
    pub author: String,
    pub color: String,
    pub position_from: i32,
    pub position_to: i32,
    pub resolved: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommentReply {
    pub id: String,
    pub comment_id: String,
    pub content: String,
    pub author: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotPoint {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub description: String,
    pub color: String,
    pub pos_x: f64,
    pub pos_y: f64,
    pub completed: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotConnection {
    pub id: String,
    pub project_id: String,
    pub source_id: String,
    pub target_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Character {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub fields: String, // JSON string of key-value pairs
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.init_tables()?;
        db.migrate()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'Untitled Project',
                author TEXT NOT NULL DEFAULT '',
                genre TEXT NOT NULL DEFAULT '',
                isbn TEXT NOT NULL DEFAULT '',
                copyright_year TEXT NOT NULL DEFAULT '',
                publisher TEXT NOT NULL DEFAULT '',
                bleed_enabled INTEGER NOT NULL DEFAULT 0,
                bleed_size_in REAL NOT NULL DEFAULT 0.125,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chapter_snapshots (
                id TEXT PRIMARY KEY,
                chapter_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                word_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_snapshots_chapter ON chapter_snapshots(chapter_id);

            CREATE TABLE IF NOT EXISTS chapters (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT 'Untitled Chapter',
                content TEXT NOT NULL DEFAULT '',
                sort_order INTEGER NOT NULL DEFAULT 0,
                chapter_type TEXT NOT NULL DEFAULT 'chapter',
                word_count INTEGER NOT NULL DEFAULT 0,
                parent_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id);
            CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(project_id, sort_order);

            CREATE TABLE IF NOT EXISTS formatting_settings (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL UNIQUE,
                template_name TEXT NOT NULL DEFAULT 'default',
                body_font TEXT NOT NULL DEFAULT 'Georgia',
                heading_font TEXT NOT NULL DEFAULT 'sans-serif',
                body_size_pt REAL NOT NULL DEFAULT 11.0,
                heading_size_pt REAL NOT NULL DEFAULT 18.0,
                line_height REAL NOT NULL DEFAULT 1.6,
                paragraph_spacing_em REAL NOT NULL DEFAULT 0.0,
                paragraph_indent_em REAL NOT NULL DEFAULT 1.5,
                margin_top_in REAL NOT NULL DEFAULT 0.75,
                margin_bottom_in REAL NOT NULL DEFAULT 0.75,
                margin_inner_in REAL NOT NULL DEFAULT 0.875,
                margin_outer_in REAL NOT NULL DEFAULT 0.625,
                drop_cap_enabled INTEGER NOT NULL DEFAULT 0,
                drop_cap_lines INTEGER NOT NULL DEFAULT 3,
                lead_in_style TEXT NOT NULL DEFAULT 'none',
                lead_in_words INTEGER NOT NULL DEFAULT 3,
                scene_break_style TEXT NOT NULL DEFAULT 'asterisks',
                scene_break_custom TEXT NOT NULL DEFAULT '',
                justify_text INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS plot_points (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                color TEXT NOT NULL DEFAULT '#7d967d',
                pos_x REAL NOT NULL DEFAULT 0,
                pos_y REAL NOT NULL DEFAULT 0,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS plot_connections (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (source_id) REFERENCES plot_points(id) ON DELETE CASCADE,
                FOREIGN KEY (target_id) REFERENCES plot_points(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS characters (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL DEFAULT '',
                fields TEXT NOT NULL DEFAULT '{}',
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS writing_goals (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL UNIQUE,
                target_word_count INTEGER NOT NULL DEFAULT 80000,
                deadline TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS daily_logs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                date TEXT NOT NULL,
                word_count INTEGER NOT NULL DEFAULT 0,
                words_written INTEGER NOT NULL DEFAULT 0,
                minutes_active INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(project_id, date);
            CREATE INDEX IF NOT EXISTS idx_plot_points_project ON plot_points(project_id);
            CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);

            CREATE TABLE IF NOT EXISTS custom_themes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                settings_json TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS master_pages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                page_type TEXT NOT NULL DEFAULT 'custom',
                content TEXT NOT NULL DEFAULT '',
                settings_json TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS project_images (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                filename TEXT NOT NULL DEFAULT '',
                data_base64 TEXT NOT NULL DEFAULT '',
                mime_type TEXT NOT NULL DEFAULT 'image/png',
                width INTEGER NOT NULL DEFAULT 0,
                height INTEGER NOT NULL DEFAULT 0,
                caption TEXT NOT NULL DEFAULT '',
                layout TEXT NOT NULL DEFAULT 'inline',
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_project_images ON project_images(project_id);

            CREATE TABLE IF NOT EXISTS editor_comments (
                id TEXT PRIMARY KEY,
                chapter_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                author TEXT NOT NULL DEFAULT 'Author',
                color TEXT NOT NULL DEFAULT '#f59e0b',
                position_from INTEGER NOT NULL DEFAULT 0,
                position_to INTEGER NOT NULL DEFAULT 0,
                resolved INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_editor_comments_chapter ON editor_comments(chapter_id);

            CREATE TABLE IF NOT EXISTS comment_replies (
                id TEXT PRIMARY KEY,
                comment_id TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                author TEXT NOT NULL DEFAULT 'Author',
                created_at TEXT NOT NULL,
                FOREIGN KEY (comment_id) REFERENCES editor_comments(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_comment_replies ON comment_replies(comment_id);"
        )?;
        Ok(())
    }

    fn migrate(&self) -> Result<()> {
        // Add parent_id column if missing (for existing databases)
        if self.conn.prepare("SELECT parent_id FROM chapters LIMIT 0").is_err() {
            self.conn.execute_batch("ALTER TABLE chapters ADD COLUMN parent_id TEXT")?;
        }
        // Add completed column to plot_points
        if self.conn.prepare("SELECT completed FROM plot_points LIMIT 0").is_err() {
            self.conn.execute_batch("ALTER TABLE plot_points ADD COLUMN completed INTEGER NOT NULL DEFAULT 0")?;
        }
        // Add project metadata columns
        if self.conn.prepare("SELECT isbn FROM projects LIMIT 0").is_err() {
            self.conn.execute_batch(
                "ALTER TABLE projects ADD COLUMN isbn TEXT NOT NULL DEFAULT '';
                 ALTER TABLE projects ADD COLUMN copyright_year TEXT NOT NULL DEFAULT '';
                 ALTER TABLE projects ADD COLUMN publisher TEXT NOT NULL DEFAULT '';
                 ALTER TABLE projects ADD COLUMN bleed_enabled INTEGER NOT NULL DEFAULT 0;
                 ALTER TABLE projects ADD COLUMN bleed_size_in REAL NOT NULL DEFAULT 0.125;"
            )?;
        }
        Ok(())
    }

    // --- Projects ---

    pub fn create_project(&self, id: &str, title: &str) -> Result<Project> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO projects (id, title, author, genre, isbn, copyright_year, publisher, bleed_enabled, bleed_size_in, created_at, updated_at)
             VALUES (?1, ?2, '', '', '', '', '', 0, 0.125, ?3, ?3)",
            params![id, title, now],
        )?;
        Ok(Project {
            id: id.to_string(),
            title: title.to_string(),
            author: String::new(),
            genre: String::new(),
            isbn: String::new(),
            copyright_year: String::new(),
            publisher: String::new(),
            bleed_enabled: false,
            bleed_size_in: 0.125,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn list_projects(&self) -> Result<Vec<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, author, genre, isbn, copyright_year, publisher, bleed_enabled, bleed_size_in, created_at, updated_at FROM projects ORDER BY updated_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                title: row.get(1)?,
                author: row.get(2)?,
                genre: row.get(3)?,
                isbn: row.get(4)?,
                copyright_year: row.get(5)?,
                publisher: row.get(6)?,
                bleed_enabled: row.get::<_, i32>(7)? != 0,
                bleed_size_in: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        rows.collect()
    }

    pub fn update_project(&self, id: &str, title: &str, author: &str, genre: &str) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE projects SET title = ?1, author = ?2, genre = ?3, updated_at = ?4 WHERE id = ?5",
            params![title, author, genre, now, id],
        )?;
        Ok(())
    }

    pub fn update_project_metadata(&self, id: &str, isbn: &str, copyright_year: &str, publisher: &str, bleed_enabled: bool, bleed_size_in: f64) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE projects SET isbn = ?1, copyright_year = ?2, publisher = ?3, bleed_enabled = ?4, bleed_size_in = ?5, updated_at = ?6 WHERE id = ?7",
            params![isbn, copyright_year, publisher, bleed_enabled as i32, bleed_size_in, now, id],
        )?;
        Ok(())
    }

    pub fn delete_project(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM chapters WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM formatting_settings WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM writing_goals WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM daily_logs WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM plot_points WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM plot_connections WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM characters WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM project_images WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM comment_replies WHERE comment_id IN (SELECT id FROM editor_comments WHERE project_id = ?1)", params![id])?;
        self.conn.execute("DELETE FROM editor_comments WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Chapters ---

    pub fn create_chapter(&self, id: &str, project_id: &str, title: &str, sort_order: i32) -> Result<Chapter> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO chapters (id, project_id, title, content, sort_order, chapter_type, word_count, parent_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, '', ?4, 'chapter', 0, NULL, ?5, ?5)",
            params![id, project_id, title, sort_order, now],
        )?;
        Ok(Chapter {
            id: id.to_string(),
            project_id: project_id.to_string(),
            title: title.to_string(),
            content: String::new(),
            sort_order,
            chapter_type: "chapter".to_string(),
            word_count: 0,
            parent_id: None,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn create_section(&self, id: &str, project_id: &str, title: &str, content: &str, sort_order: i32, section_type: &str, parent_id: Option<&str>) -> Result<Chapter> {
        let now = chrono::Utc::now().to_rfc3339();
        let word_count = content.split_whitespace().count() as i32;
        self.conn.execute(
            "INSERT INTO chapters (id, project_id, title, content, sort_order, chapter_type, word_count, parent_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)",
            params![id, project_id, title, content, sort_order, section_type, word_count, parent_id, now],
        )?;
        Ok(Chapter {
            id: id.to_string(),
            project_id: project_id.to_string(),
            title: title.to_string(),
            content: content.to_string(),
            sort_order,
            chapter_type: section_type.to_string(),
            word_count,
            parent_id: parent_id.map(|s| s.to_string()),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update_section_type(&self, id: &str, section_type: &str) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE chapters SET chapter_type = ?1, updated_at = ?2 WHERE id = ?3",
            params![section_type, now, id],
        )?;
        Ok(())
    }

    pub fn update_chapter_parent(&self, id: &str, parent_id: Option<&str>) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE chapters SET parent_id = ?1, updated_at = ?2 WHERE id = ?3",
            params![parent_id, now, id],
        )?;
        Ok(())
    }

    pub fn list_chapters(&self, project_id: &str) -> Result<Vec<Chapter>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, title, content, sort_order, chapter_type, word_count, parent_id, created_at, updated_at
             FROM chapters WHERE project_id = ?1 ORDER BY sort_order ASC"
        )?;
        let rows = stmt.query_map(params![project_id], |row| {
            Ok(Chapter {
                id: row.get(0)?,
                project_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                sort_order: row.get(4)?,
                chapter_type: row.get(5)?,
                word_count: row.get(6)?,
                parent_id: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;
        rows.collect()
    }

    pub fn update_chapter_content(&self, id: &str, content: &str, word_count: i32) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE chapters SET content = ?1, word_count = ?2, updated_at = ?3 WHERE id = ?4",
            params![content, word_count, now, id],
        )?;
        // Also update project's updated_at
        self.conn.execute(
            "UPDATE projects SET updated_at = ?1 WHERE id = (SELECT project_id FROM chapters WHERE id = ?2)",
            params![now, id],
        )?;
        Ok(())
    }

    pub fn update_chapter_title(&self, id: &str, title: &str) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE chapters SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, id],
        )?;
        Ok(())
    }

    pub fn reorder_chapters(&self, chapter_ids: &[String]) -> Result<()> {
        for (i, id) in chapter_ids.iter().enumerate() {
            self.conn.execute(
                "UPDATE chapters SET sort_order = ?1 WHERE id = ?2",
                params![i as i32, id],
            )?;
        }
        Ok(())
    }

    pub fn delete_chapter(&self, id: &str) -> Result<()> {
        // Also unparent any children
        self.conn.execute("UPDATE chapters SET parent_id = NULL WHERE parent_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM chapters WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn split_chapter(&self, id: &str, new_id: &str, new_title: &str, original_content: &str, original_word_count: i32, new_content: &str, new_word_count: i32) -> Result<Chapter> {
        let now = chrono::Utc::now().to_rfc3339();

        // Update the original chapter with truncated content
        self.conn.execute(
            "UPDATE chapters SET content = ?1, word_count = ?2, updated_at = ?3 WHERE id = ?4",
            params![original_content, original_word_count, now, id],
        )?;

        // Get original chapter info for project_id and sort_order
        let (project_id, sort_order, parent_id): (String, i32, Option<String>) = self.conn.query_row(
            "SELECT project_id, sort_order, parent_id FROM chapters WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )?;

        // Bump sort_order for all chapters after this one
        self.conn.execute(
            "UPDATE chapters SET sort_order = sort_order + 1 WHERE project_id = ?1 AND sort_order > ?2",
            params![project_id, sort_order],
        )?;

        // Insert new chapter right after
        let new_sort = sort_order + 1;
        self.conn.execute(
            "INSERT INTO chapters (id, project_id, title, content, sort_order, chapter_type, word_count, parent_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 'chapter', ?6, ?7, ?8, ?8)",
            params![new_id, project_id, new_title, new_content, new_sort, new_word_count, parent_id, now],
        )?;

        Ok(Chapter {
            id: new_id.to_string(),
            project_id,
            title: new_title.to_string(),
            content: new_content.to_string(),
            sort_order: new_sort,
            chapter_type: "chapter".to_string(),
            word_count: new_word_count,
            parent_id,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn merge_chapters(&self, keep_id: &str, remove_id: &str, merged_content: &str, merged_word_count: i32) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();

        // Update the kept chapter with merged content
        self.conn.execute(
            "UPDATE chapters SET content = ?1, word_count = ?2, updated_at = ?3 WHERE id = ?4",
            params![merged_content, merged_word_count, now, keep_id],
        )?;

        // Get the removed chapter's sort_order and project_id
        let (project_id, removed_order): (String, i32) = self.conn.query_row(
            "SELECT project_id, sort_order FROM chapters WHERE id = ?1",
            params![remove_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        // Delete the removed chapter
        self.conn.execute("DELETE FROM chapters WHERE id = ?1", params![remove_id])?;

        // Re-compact sort orders
        self.conn.execute(
            "UPDATE chapters SET sort_order = sort_order - 1 WHERE project_id = ?1 AND sort_order > ?2",
            params![project_id, removed_order],
        )?;

        Ok(())
    }

    // --- Formatting Settings ---

    pub fn get_formatting_settings(&self, project_id: &str) -> Result<Option<FormattingSettings>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, template_name, body_font, heading_font, body_size_pt, heading_size_pt,
                    line_height, paragraph_spacing_em, paragraph_indent_em,
                    margin_top_in, margin_bottom_in, margin_inner_in, margin_outer_in,
                    drop_cap_enabled, drop_cap_lines, lead_in_style, lead_in_words,
                    scene_break_style, scene_break_custom, justify_text
             FROM formatting_settings WHERE project_id = ?1"
        )?;
        let mut rows = stmt.query_map(params![project_id], |row| {
            Ok(FormattingSettings {
                id: row.get(0)?,
                project_id: row.get(1)?,
                template_name: row.get(2)?,
                body_font: row.get(3)?,
                heading_font: row.get(4)?,
                body_size_pt: row.get(5)?,
                heading_size_pt: row.get(6)?,
                line_height: row.get(7)?,
                paragraph_spacing_em: row.get(8)?,
                paragraph_indent_em: row.get(9)?,
                margin_top_in: row.get(10)?,
                margin_bottom_in: row.get(11)?,
                margin_inner_in: row.get(12)?,
                margin_outer_in: row.get(13)?,
                drop_cap_enabled: row.get::<_, i32>(14)? != 0,
                drop_cap_lines: row.get(15)?,
                lead_in_style: row.get(16)?,
                lead_in_words: row.get(17)?,
                scene_break_style: row.get(18)?,
                scene_break_custom: row.get(19)?,
                justify_text: row.get::<_, i32>(20)? != 0,
            })
        })?;
        match rows.next() {
            Some(Ok(settings)) => Ok(Some(settings)),
            Some(Err(e)) => Err(e),
            None => Ok(None),
        }
    }

    pub fn save_formatting_settings(&self, settings: &FormattingSettings) -> Result<()> {
        self.conn.execute(
            "INSERT INTO formatting_settings (id, project_id, template_name, body_font, heading_font,
                body_size_pt, heading_size_pt, line_height, paragraph_spacing_em, paragraph_indent_em,
                margin_top_in, margin_bottom_in, margin_inner_in, margin_outer_in,
                drop_cap_enabled, drop_cap_lines, lead_in_style, lead_in_words,
                scene_break_style, scene_break_custom, justify_text)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)
             ON CONFLICT(project_id) DO UPDATE SET
                template_name = excluded.template_name,
                body_font = excluded.body_font,
                heading_font = excluded.heading_font,
                body_size_pt = excluded.body_size_pt,
                heading_size_pt = excluded.heading_size_pt,
                line_height = excluded.line_height,
                paragraph_spacing_em = excluded.paragraph_spacing_em,
                paragraph_indent_em = excluded.paragraph_indent_em,
                margin_top_in = excluded.margin_top_in,
                margin_bottom_in = excluded.margin_bottom_in,
                margin_inner_in = excluded.margin_inner_in,
                margin_outer_in = excluded.margin_outer_in,
                drop_cap_enabled = excluded.drop_cap_enabled,
                drop_cap_lines = excluded.drop_cap_lines,
                lead_in_style = excluded.lead_in_style,
                lead_in_words = excluded.lead_in_words,
                scene_break_style = excluded.scene_break_style,
                scene_break_custom = excluded.scene_break_custom,
                justify_text = excluded.justify_text",
            params![
                settings.id, settings.project_id, settings.template_name,
                settings.body_font, settings.heading_font,
                settings.body_size_pt, settings.heading_size_pt,
                settings.line_height, settings.paragraph_spacing_em, settings.paragraph_indent_em,
                settings.margin_top_in, settings.margin_bottom_in, settings.margin_inner_in, settings.margin_outer_in,
                settings.drop_cap_enabled as i32, settings.drop_cap_lines,
                settings.lead_in_style, settings.lead_in_words,
                settings.scene_break_style, settings.scene_break_custom,
                settings.justify_text as i32,
            ],
        )?;
        Ok(())
    }

    // --- Writing Goals ---

    pub fn get_writing_goal(&self, project_id: &str) -> Result<Option<WritingGoal>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, target_word_count, deadline, created_at FROM writing_goals WHERE project_id = ?1"
        )?;
        let mut rows = stmt.query_map(params![project_id], |row| {
            Ok(WritingGoal {
                id: row.get(0)?,
                project_id: row.get(1)?,
                target_word_count: row.get(2)?,
                deadline: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;
        match rows.next() {
            Some(Ok(goal)) => Ok(Some(goal)),
            Some(Err(e)) => Err(e),
            None => Ok(None),
        }
    }

    pub fn save_writing_goal(&self, goal: &WritingGoal) -> Result<()> {
        self.conn.execute(
            "INSERT INTO writing_goals (id, project_id, target_word_count, deadline, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(project_id) DO UPDATE SET
                target_word_count = excluded.target_word_count,
                deadline = excluded.deadline",
            params![goal.id, goal.project_id, goal.target_word_count, goal.deadline, goal.created_at],
        )?;
        Ok(())
    }

    pub fn delete_writing_goal(&self, project_id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM writing_goals WHERE project_id = ?1", params![project_id])?;
        Ok(())
    }

    // --- Daily Logs ---

    pub fn log_daily_words(&self, id: &str, project_id: &str, date: &str, word_count: i32, words_written: i32, minutes_active: i32) -> Result<DailyLog> {
        self.conn.execute(
            "INSERT INTO daily_logs (id, project_id, date, word_count, words_written, minutes_active)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(project_id, date) DO UPDATE SET
                word_count = excluded.word_count,
                words_written = excluded.words_written,
                minutes_active = excluded.minutes_active",
            params![id, project_id, date, word_count, words_written, minutes_active],
        )?;
        Ok(DailyLog {
            id: id.to_string(),
            project_id: project_id.to_string(),
            date: date.to_string(),
            word_count,
            words_written,
            minutes_active,
        })
    }

    pub fn list_daily_logs(&self, project_id: &str) -> Result<Vec<DailyLog>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, date, word_count, words_written, minutes_active
             FROM daily_logs WHERE project_id = ?1 ORDER BY date ASC"
        )?;
        let rows = stmt.query_map(params![project_id], |row| {
            Ok(DailyLog {
                id: row.get(0)?,
                project_id: row.get(1)?,
                date: row.get(2)?,
                word_count: row.get(3)?,
                words_written: row.get(4)?,
                minutes_active: row.get(5)?,
            })
        })?;
        rows.collect()
    }

    pub fn get_daily_log(&self, project_id: &str, date: &str) -> Result<Option<DailyLog>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, date, word_count, words_written, minutes_active
             FROM daily_logs WHERE project_id = ?1 AND date = ?2"
        )?;
        let mut rows = stmt.query_map(params![project_id, date], |row| {
            Ok(DailyLog {
                id: row.get(0)?,
                project_id: row.get(1)?,
                date: row.get(2)?,
                word_count: row.get(3)?,
                words_written: row.get(4)?,
                minutes_active: row.get(5)?,
            })
        })?;
        match rows.next() {
            Some(Ok(log)) => Ok(Some(log)),
            Some(Err(e)) => Err(e),
            None => Ok(None),
        }
    }

    // --- Backup ---

    pub fn export_project(&self, project_id: &str) -> Result<(Project, Vec<Chapter>)> {
        let project: Project = self.conn.query_row(
            "SELECT id, title, author, genre, isbn, copyright_year, publisher, bleed_enabled, bleed_size_in, created_at, updated_at FROM projects WHERE id = ?1",
            params![project_id],
            |row| Ok(Project {
                id: row.get(0)?,
                title: row.get(1)?,
                author: row.get(2)?,
                genre: row.get(3)?,
                isbn: row.get(4)?,
                copyright_year: row.get(5)?,
                publisher: row.get(6)?,
                bleed_enabled: row.get::<_, i32>(7)? != 0,
                bleed_size_in: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            }),
        )?;
        let chapters = self.list_chapters(project_id)?;
        Ok((project, chapters))
    }

    // --- Chapter Snapshots ---

    pub fn create_snapshot(&self, id: &str, chapter_id: &str, project_id: &str, name: &str, content: &str, word_count: i32) -> Result<ChapterSnapshot> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO chapter_snapshots (id, chapter_id, project_id, name, content, word_count, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, chapter_id, project_id, name, content, word_count, now],
        )?;
        Ok(ChapterSnapshot {
            id: id.to_string(), chapter_id: chapter_id.to_string(), project_id: project_id.to_string(),
            name: name.to_string(), content: content.to_string(), word_count, created_at: now,
        })
    }

    pub fn list_snapshots(&self, chapter_id: &str) -> Result<Vec<ChapterSnapshot>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, chapter_id, project_id, name, content, word_count, created_at
             FROM chapter_snapshots WHERE chapter_id = ?1 ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map(params![chapter_id], |row| {
            Ok(ChapterSnapshot {
                id: row.get(0)?, chapter_id: row.get(1)?, project_id: row.get(2)?,
                name: row.get(3)?, content: row.get(4)?, word_count: row.get(5)?, created_at: row.get(6)?,
            })
        })?;
        rows.collect()
    }

    pub fn delete_snapshot(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM chapter_snapshots WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Plot Points ---

    pub fn create_plot_point(&self, id: &str, project_id: &str, title: &str, pos_x: f64, pos_y: f64) -> Result<PlotPoint> {
        self.conn.execute(
            "INSERT INTO plot_points (id, project_id, title, description, color, pos_x, pos_y, completed) VALUES (?1, ?2, ?3, '', '#7d967d', ?4, ?5, 0)",
            params![id, project_id, title, pos_x, pos_y],
        )?;
        Ok(PlotPoint { id: id.to_string(), project_id: project_id.to_string(), title: title.to_string(), description: String::new(), color: "#7d967d".to_string(), pos_x, pos_y, completed: false })
    }

    pub fn list_plot_points(&self, project_id: &str) -> Result<Vec<PlotPoint>> {
        let mut stmt = self.conn.prepare("SELECT id, project_id, title, description, color, pos_x, pos_y, completed FROM plot_points WHERE project_id = ?1")?;
        let rows = stmt.query_map(params![project_id], |row| {
            Ok(PlotPoint { id: row.get(0)?, project_id: row.get(1)?, title: row.get(2)?, description: row.get(3)?, color: row.get(4)?, pos_x: row.get(5)?, pos_y: row.get(6)?, completed: row.get::<_, i32>(7)? != 0 })
        })?;
        rows.collect()
    }

    pub fn update_plot_point(&self, id: &str, title: &str, description: &str, color: &str, pos_x: f64, pos_y: f64) -> Result<()> {
        self.conn.execute(
            "UPDATE plot_points SET title = ?1, description = ?2, color = ?3, pos_x = ?4, pos_y = ?5 WHERE id = ?6",
            params![title, description, color, pos_x, pos_y, id],
        )?;
        Ok(())
    }

    pub fn toggle_plot_point_completed(&self, id: &str, completed: bool) -> Result<()> {
        self.conn.execute(
            "UPDATE plot_points SET completed = ?1 WHERE id = ?2",
            params![completed as i32, id],
        )?;
        Ok(())
    }

    pub fn delete_plot_point(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM plot_connections WHERE source_id = ?1 OR target_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM plot_points WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Plot Connections ---

    pub fn create_plot_connection(&self, id: &str, project_id: &str, source_id: &str, target_id: &str) -> Result<PlotConnection> {
        self.conn.execute(
            "INSERT INTO plot_connections (id, project_id, source_id, target_id) VALUES (?1, ?2, ?3, ?4)",
            params![id, project_id, source_id, target_id],
        )?;
        Ok(PlotConnection { id: id.to_string(), project_id: project_id.to_string(), source_id: source_id.to_string(), target_id: target_id.to_string() })
    }

    pub fn list_plot_connections(&self, project_id: &str) -> Result<Vec<PlotConnection>> {
        let mut stmt = self.conn.prepare("SELECT id, project_id, source_id, target_id FROM plot_connections WHERE project_id = ?1")?;
        let rows = stmt.query_map(params![project_id], |row| {
            Ok(PlotConnection { id: row.get(0)?, project_id: row.get(1)?, source_id: row.get(2)?, target_id: row.get(3)? })
        })?;
        rows.collect()
    }

    pub fn delete_plot_connection(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM plot_connections WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Characters ---

    pub fn create_character(&self, id: &str, project_id: &str, name: &str) -> Result<Character> {
        let default_fields = serde_json::json!({
            "Appearance": "",
            "Personality": "",
            "Motivations": "",
            "Backstory": "",
            "Relationships": ""
        }).to_string();
        self.conn.execute(
            "INSERT INTO characters (id, project_id, name, fields) VALUES (?1, ?2, ?3, ?4)",
            params![id, project_id, name, default_fields],
        )?;
        Ok(Character { id: id.to_string(), project_id: project_id.to_string(), name: name.to_string(), fields: default_fields })
    }

    pub fn list_characters(&self, project_id: &str) -> Result<Vec<Character>> {
        let mut stmt = self.conn.prepare("SELECT id, project_id, name, fields FROM characters WHERE project_id = ?1 ORDER BY name ASC")?;
        let rows = stmt.query_map(params![project_id], |row| {
            Ok(Character { id: row.get(0)?, project_id: row.get(1)?, name: row.get(2)?, fields: row.get(3)? })
        })?;
        rows.collect()
    }

    pub fn update_character(&self, id: &str, name: &str, fields: &str) -> Result<()> {
        self.conn.execute("UPDATE characters SET name = ?1, fields = ?2 WHERE id = ?3", params![name, fields, id])?;
        Ok(())
    }

    pub fn delete_character(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM characters WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Custom Themes ---

    pub fn create_custom_theme(&self, id: &str, name: &str, description: &str, settings_json: &str) -> Result<CustomTheme> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO custom_themes (id, name, description, settings_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, description, settings_json, now],
        )?;
        Ok(CustomTheme { id: id.to_string(), name: name.to_string(), description: description.to_string(), settings_json: settings_json.to_string(), created_at: now })
    }

    pub fn list_custom_themes(&self) -> Result<Vec<CustomTheme>> {
        let mut stmt = self.conn.prepare("SELECT id, name, description, settings_json, created_at FROM custom_themes ORDER BY created_at DESC")?;
        let rows = stmt.query_map([], |row| {
            Ok(CustomTheme { id: row.get(0)?, name: row.get(1)?, description: row.get(2)?, settings_json: row.get(3)?, created_at: row.get(4)? })
        })?;
        rows.collect()
    }

    pub fn update_custom_theme(&self, id: &str, name: &str, description: &str, settings_json: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE custom_themes SET name = ?1, description = ?2, settings_json = ?3 WHERE id = ?4",
            params![name, description, settings_json, id],
        )?;
        Ok(())
    }

    pub fn delete_custom_theme(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM custom_themes WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Master Pages ---

    pub fn create_master_page(&self, id: &str, name: &str, page_type: &str, content: &str, settings_json: &str) -> Result<MasterPage> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO master_pages (id, name, page_type, content, settings_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, name, page_type, content, settings_json, now],
        )?;
        Ok(MasterPage { id: id.to_string(), name: name.to_string(), page_type: page_type.to_string(), content: content.to_string(), settings_json: settings_json.to_string(), created_at: now })
    }

    pub fn list_master_pages(&self) -> Result<Vec<MasterPage>> {
        let mut stmt = self.conn.prepare("SELECT id, name, page_type, content, settings_json, created_at FROM master_pages ORDER BY name ASC")?;
        let rows = stmt.query_map([], |row| {
            Ok(MasterPage { id: row.get(0)?, name: row.get(1)?, page_type: row.get(2)?, content: row.get(3)?, settings_json: row.get(4)?, created_at: row.get(5)? })
        })?;
        rows.collect()
    }

    pub fn update_master_page(&self, id: &str, name: &str, content: &str, settings_json: &str) -> Result<()> {
        self.conn.execute(
            "UPDATE master_pages SET name = ?1, content = ?2, settings_json = ?3 WHERE id = ?4",
            params![name, content, settings_json, id],
        )?;
        Ok(())
    }

    pub fn delete_master_page(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM master_pages WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Project Images ---

    pub fn save_project_image(&self, img: &ProjectImage) -> Result<()> {
        self.conn.execute(
            "INSERT INTO project_images (id, project_id, filename, data_base64, mime_type, width, height, caption, layout, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
             ON CONFLICT(id) DO UPDATE SET
                filename = excluded.filename, data_base64 = excluded.data_base64,
                mime_type = excluded.mime_type, width = excluded.width, height = excluded.height,
                caption = excluded.caption, layout = excluded.layout",
            params![img.id, img.project_id, img.filename, img.data_base64, img.mime_type, img.width, img.height, img.caption, img.layout, img.created_at],
        )?;
        Ok(())
    }

    pub fn list_project_images(&self, project_id: &str) -> Result<Vec<ProjectImage>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, filename, data_base64, mime_type, width, height, caption, layout, created_at
             FROM project_images WHERE project_id = ?1 ORDER BY created_at ASC"
        )?;
        let rows = stmt.query_map(params![project_id], |row| {
            Ok(ProjectImage {
                id: row.get(0)?, project_id: row.get(1)?, filename: row.get(2)?,
                data_base64: row.get(3)?, mime_type: row.get(4)?, width: row.get(5)?,
                height: row.get(6)?, caption: row.get(7)?, layout: row.get(8)?, created_at: row.get(9)?,
            })
        })?;
        rows.collect()
    }

    pub fn delete_project_image(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM project_images WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Editor Comments ---

    pub fn create_editor_comment(&self, id: &str, chapter_id: &str, project_id: &str, content: &str, author: &str, color: &str, position_from: i32, position_to: i32) -> Result<EditorComment> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO editor_comments (id, chapter_id, project_id, content, author, color, position_from, position_to, resolved, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, ?9)",
            params![id, chapter_id, project_id, content, author, color, position_from, position_to, now],
        )?;
        Ok(EditorComment { id: id.to_string(), chapter_id: chapter_id.to_string(), project_id: project_id.to_string(), content: content.to_string(), author: author.to_string(), color: color.to_string(), position_from, position_to, resolved: false, created_at: now })
    }

    pub fn list_editor_comments(&self, chapter_id: &str) -> Result<Vec<EditorComment>> {
        let mut stmt = self.conn.prepare("SELECT id, chapter_id, project_id, content, author, color, position_from, position_to, resolved, created_at FROM editor_comments WHERE chapter_id = ?1 ORDER BY position_from ASC")?;
        let rows = stmt.query_map(params![chapter_id], |row| {
            Ok(EditorComment { id: row.get(0)?, chapter_id: row.get(1)?, project_id: row.get(2)?, content: row.get(3)?, author: row.get(4)?, color: row.get(5)?, position_from: row.get(6)?, position_to: row.get(7)?, resolved: row.get::<_, i32>(8)? != 0, created_at: row.get(9)? })
        })?;
        rows.collect()
    }

    pub fn list_project_comments(&self, project_id: &str) -> Result<Vec<EditorComment>> {
        let mut stmt = self.conn.prepare("SELECT id, chapter_id, project_id, content, author, color, position_from, position_to, resolved, created_at FROM editor_comments WHERE project_id = ?1 ORDER BY created_at ASC")?;
        let rows = stmt.query_map(params![project_id], |row| {
            Ok(EditorComment { id: row.get(0)?, chapter_id: row.get(1)?, project_id: row.get(2)?, content: row.get(3)?, author: row.get(4)?, color: row.get(5)?, position_from: row.get(6)?, position_to: row.get(7)?, resolved: row.get::<_, i32>(8)? != 0, created_at: row.get(9)? })
        })?;
        rows.collect()
    }

    pub fn resolve_editor_comment(&self, id: &str, resolved: bool) -> Result<()> {
        self.conn.execute("UPDATE editor_comments SET resolved = ?1 WHERE id = ?2", params![resolved as i32, id])?;
        Ok(())
    }

    pub fn delete_editor_comment(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM comment_replies WHERE comment_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM editor_comments WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn create_comment_reply(&self, id: &str, comment_id: &str, content: &str, author: &str) -> Result<CommentReply> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO comment_replies (id, comment_id, content, author, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, comment_id, content, author, now],
        )?;
        Ok(CommentReply { id: id.to_string(), comment_id: comment_id.to_string(), content: content.to_string(), author: author.to_string(), created_at: now })
    }

    pub fn list_comment_replies(&self, comment_id: &str) -> Result<Vec<CommentReply>> {
        let mut stmt = self.conn.prepare("SELECT id, comment_id, content, author, created_at FROM comment_replies WHERE comment_id = ?1 ORDER BY created_at ASC")?;
        let rows = stmt.query_map(params![comment_id], |row| {
            Ok(CommentReply { id: row.get(0)?, comment_id: row.get(1)?, content: row.get(2)?, author: row.get(3)?, created_at: row.get(4)? })
        })?;
        rows.collect()
    }

    // --- Full Project Export ---

    pub fn export_project_file(&self, project_id: &str) -> Result<String> {
        let project = self.conn.query_row(
            "SELECT id, title, author, genre, isbn, copyright_year, publisher, bleed_enabled, bleed_size_in, created_at, updated_at FROM projects WHERE id = ?1",
            params![project_id],
            |row| Ok(Project { id: row.get(0)?, title: row.get(1)?, author: row.get(2)?, genre: row.get(3)?, isbn: row.get(4)?, copyright_year: row.get(5)?, publisher: row.get(6)?, bleed_enabled: row.get::<_, i32>(7)? != 0, bleed_size_in: row.get(8)?, created_at: row.get(9)?, updated_at: row.get(10)? }),
        )?;
        let chapters = self.list_chapters(project_id)?;
        let plot_points = self.list_plot_points(project_id)?;
        let plot_connections = self.list_plot_connections(project_id)?;
        let characters = self.list_characters(project_id)?;
        let formatting = self.get_formatting_settings(project_id)?;
        let comments = self.list_project_comments(project_id)?;

        // Gather replies for all comments
        let mut all_replies: Vec<CommentReply> = Vec::new();
        for c in &comments {
            all_replies.extend(self.list_comment_replies(&c.id)?);
        }

        let data = serde_json::json!({
            "narras_version": "1.0",
            "project": project,
            "chapters": chapters,
            "plot_points": plot_points,
            "plot_connections": plot_connections,
            "characters": characters,
            "formatting": formatting,
            "comments": comments,
            "comment_replies": all_replies,
        });

        Ok(serde_json::to_string_pretty(&data).unwrap_or_default())
    }

    pub fn import_project_file(&self, json_str: &str) -> Result<String> {
        let data: serde_json::Value = serde_json::from_str(json_str)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Invalid narras file: {}", e)))?;

        let project: Project = serde_json::from_value(data["project"].clone())
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Bad project data: {}", e)))?;

        // Generate new ID so imports don't conflict
        let new_project_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        self.conn.execute(
            "INSERT INTO projects (id, title, author, genre, isbn, copyright_year, publisher, bleed_enabled, bleed_size_in, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)",
            params![new_project_id, project.title, project.author, project.genre, project.isbn, project.copyright_year, project.publisher, project.bleed_enabled as i32, project.bleed_size_in, now],
        )?;

        // Import chapters with new IDs (map old -> new for comments)
        let mut chapter_id_map = std::collections::HashMap::new();
        if let Some(chapters) = data["chapters"].as_array() {
            for ch in chapters {
                let old_id = ch["id"].as_str().unwrap_or("");
                let new_id = uuid::Uuid::new_v4().to_string();
                chapter_id_map.insert(old_id.to_string(), new_id.clone());
                self.conn.execute(
                    "INSERT INTO chapters (id, project_id, title, content, sort_order, chapter_type, word_count, parent_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)",
                    params![new_id, new_project_id, ch["title"].as_str().unwrap_or(""), ch["content"].as_str().unwrap_or(""), ch["sort_order"].as_i64().unwrap_or(0), ch["chapter_type"].as_str().unwrap_or("chapter"), ch["word_count"].as_i64().unwrap_or(0), ch["parent_id"].as_str(), now],
                )?;
            }
        }

        // Import plot points with new IDs
        let mut pp_id_map = std::collections::HashMap::new();
        if let Some(points) = data["plot_points"].as_array() {
            for pp in points {
                let old_id = pp["id"].as_str().unwrap_or("");
                let new_id = uuid::Uuid::new_v4().to_string();
                pp_id_map.insert(old_id.to_string(), new_id.clone());
                self.conn.execute(
                    "INSERT INTO plot_points (id, project_id, title, description, color, pos_x, pos_y, completed) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    params![new_id, new_project_id, pp["title"].as_str().unwrap_or(""), pp["description"].as_str().unwrap_or(""), pp["color"].as_str().unwrap_or("#7d967d"), pp["pos_x"].as_f64().unwrap_or(0.0), pp["pos_y"].as_f64().unwrap_or(0.0), pp["completed"].as_bool().unwrap_or(false) as i32],
                )?;
            }
        }

        // Import plot connections
        if let Some(conns) = data["plot_connections"].as_array() {
            for conn_val in conns {
                let src = conn_val["source_id"].as_str().unwrap_or("");
                let tgt = conn_val["target_id"].as_str().unwrap_or("");
                if let (Some(new_src), Some(new_tgt)) = (pp_id_map.get(src), pp_id_map.get(tgt)) {
                    self.conn.execute(
                        "INSERT INTO plot_connections (id, project_id, source_id, target_id) VALUES (?1, ?2, ?3, ?4)",
                        params![uuid::Uuid::new_v4().to_string(), new_project_id, new_src, new_tgt],
                    )?;
                }
            }
        }

        // Import characters
        if let Some(chars) = data["characters"].as_array() {
            for ch in chars {
                self.conn.execute(
                    "INSERT INTO characters (id, project_id, name, fields) VALUES (?1, ?2, ?3, ?4)",
                    params![uuid::Uuid::new_v4().to_string(), new_project_id, ch["name"].as_str().unwrap_or(""), ch["fields"].as_str().unwrap_or("{}")],
                )?;
            }
        }

        // Import formatting
        if let Some(fmt) = data.get("formatting") {
            if !fmt.is_null() {
                self.conn.execute(
                    "INSERT INTO formatting_settings (id, project_id, template_name, body_font, heading_font, body_size_pt, heading_size_pt, line_height, paragraph_spacing_em, paragraph_indent_em, margin_top_in, margin_bottom_in, margin_inner_in, margin_outer_in, drop_cap_enabled, drop_cap_lines, lead_in_style, lead_in_words, scene_break_style, scene_break_custom, justify_text) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
                    params![
                        uuid::Uuid::new_v4().to_string(), new_project_id,
                        fmt["template_name"].as_str().unwrap_or("custom"),
                        fmt["body_font"].as_str().unwrap_or("Georgia"),
                        fmt["heading_font"].as_str().unwrap_or("sans-serif"),
                        fmt["body_size_pt"].as_f64().unwrap_or(11.0),
                        fmt["heading_size_pt"].as_f64().unwrap_or(18.0),
                        fmt["line_height"].as_f64().unwrap_or(1.6),
                        fmt["paragraph_spacing_em"].as_f64().unwrap_or(0.0),
                        fmt["paragraph_indent_em"].as_f64().unwrap_or(1.5),
                        fmt["margin_top_in"].as_f64().unwrap_or(0.75),
                        fmt["margin_bottom_in"].as_f64().unwrap_or(0.75),
                        fmt["margin_inner_in"].as_f64().unwrap_or(0.875),
                        fmt["margin_outer_in"].as_f64().unwrap_or(0.625),
                        fmt["drop_cap_enabled"].as_bool().unwrap_or(false) as i32,
                        fmt["drop_cap_lines"].as_i64().unwrap_or(3),
                        fmt["lead_in_style"].as_str().unwrap_or("none"),
                        fmt["lead_in_words"].as_i64().unwrap_or(3),
                        fmt["scene_break_style"].as_str().unwrap_or("asterisks"),
                        fmt["scene_break_custom"].as_str().unwrap_or(""),
                        fmt["justify_text"].as_bool().unwrap_or(true) as i32
                    ],
                )?;
            }
        }

        // Import comments
        let mut comment_id_map = std::collections::HashMap::new();
        if let Some(comments) = data["comments"].as_array() {
            for c in comments {
                let old_id = c["id"].as_str().unwrap_or("");
                let new_id = uuid::Uuid::new_v4().to_string();
                comment_id_map.insert(old_id.to_string(), new_id.clone());
                let old_ch_id = c["chapter_id"].as_str().unwrap_or("");
                let new_ch_id = chapter_id_map.get(old_ch_id).cloned().unwrap_or_default();
                if !new_ch_id.is_empty() {
                    let now_c = chrono::Utc::now().to_rfc3339();
                    self.conn.execute(
                        "INSERT INTO editor_comments (id, chapter_id, project_id, content, author, color, position_from, position_to, resolved, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                        params![new_id, new_ch_id, new_project_id, c["content"].as_str().unwrap_or(""), c["author"].as_str().unwrap_or("Author"), c["color"].as_str().unwrap_or("#f59e0b"), c["position_from"].as_i64().unwrap_or(0), c["position_to"].as_i64().unwrap_or(0), c["resolved"].as_bool().unwrap_or(false) as i32, now_c],
                    )?;
                }
            }
        }

        // Import comment replies
        if let Some(replies) = data["comment_replies"].as_array() {
            for r in replies {
                let old_cid = r["comment_id"].as_str().unwrap_or("");
                if let Some(new_cid) = comment_id_map.get(old_cid) {
                    let now_r = chrono::Utc::now().to_rfc3339();
                    self.conn.execute(
                        "INSERT INTO comment_replies (id, comment_id, content, author, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                        params![uuid::Uuid::new_v4().to_string(), new_cid, r["content"].as_str().unwrap_or(""), r["author"].as_str().unwrap_or("Author"), now_r],
                    )?;
                }
            }
        }

        Ok(new_project_id)
    }

    // --- Backup ---

    pub fn import_project(&self, project: &Project, chapters: &[Chapter]) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO projects (id, title, author, genre, isbn, copyright_year, publisher, bleed_enabled, bleed_size_in, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)",
            params![project.id, project.title, project.author, project.genre, project.isbn, project.copyright_year, project.publisher, project.bleed_enabled as i32, project.bleed_size_in, now],
        )?;
        for ch in chapters {
            self.conn.execute(
                "INSERT INTO chapters (id, project_id, title, content, sort_order, chapter_type, word_count, parent_id, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)",
                params![uuid::Uuid::new_v4().to_string(), project.id, ch.title, ch.content, ch.sort_order, ch.chapter_type, ch.word_count, ch.parent_id, now],
            )?;
        }
        Ok(())
    }
}
