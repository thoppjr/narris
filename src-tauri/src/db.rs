use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub title: String,
    pub author: String,
    pub genre: String,
    pub created_at: String,
    pub updated_at: String,
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
    pub created_at: String,
    pub updated_at: String,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'Untitled Project',
                author TEXT NOT NULL DEFAULT '',
                genre TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chapters (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT 'Untitled Chapter',
                content TEXT NOT NULL DEFAULT '',
                sort_order INTEGER NOT NULL DEFAULT 0,
                chapter_type TEXT NOT NULL DEFAULT 'chapter',
                word_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id);
            CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(project_id, sort_order);"
        )?;
        Ok(())
    }

    // --- Projects ---

    pub fn create_project(&self, id: &str, title: &str) -> Result<Project> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO projects (id, title, author, genre, created_at, updated_at)
             VALUES (?1, ?2, '', '', ?3, ?3)",
            params![id, title, now],
        )?;
        Ok(Project {
            id: id.to_string(),
            title: title.to_string(),
            author: String::new(),
            genre: String::new(),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn list_projects(&self) -> Result<Vec<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, author, genre, created_at, updated_at FROM projects ORDER BY updated_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                title: row.get(1)?,
                author: row.get(2)?,
                genre: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
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

    pub fn delete_project(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM chapters WHERE project_id = ?1", params![id])?;
        self.conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- Chapters ---

    pub fn create_chapter(&self, id: &str, project_id: &str, title: &str, sort_order: i32) -> Result<Chapter> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO chapters (id, project_id, title, content, sort_order, chapter_type, word_count, created_at, updated_at)
             VALUES (?1, ?2, ?3, '', ?4, 'chapter', 0, ?5, ?5)",
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
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn list_chapters(&self, project_id: &str) -> Result<Vec<Chapter>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, title, content, sort_order, chapter_type, word_count, created_at, updated_at
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
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
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
        let (project_id, sort_order): (String, i32) = self.conn.query_row(
            "SELECT project_id, sort_order FROM chapters WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        // Bump sort_order for all chapters after this one
        self.conn.execute(
            "UPDATE chapters SET sort_order = sort_order + 1 WHERE project_id = ?1 AND sort_order > ?2",
            params![project_id, sort_order],
        )?;

        // Insert new chapter right after
        let new_sort = sort_order + 1;
        self.conn.execute(
            "INSERT INTO chapters (id, project_id, title, content, sort_order, chapter_type, word_count, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 'chapter', ?6, ?7, ?7)",
            params![new_id, project_id, new_title, new_content, new_sort, new_word_count, now],
        )?;

        Ok(Chapter {
            id: new_id.to_string(),
            project_id,
            title: new_title.to_string(),
            content: new_content.to_string(),
            sort_order: new_sort,
            chapter_type: "chapter".to_string(),
            word_count: new_word_count,
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

    // --- Backup ---

    pub fn export_project(&self, project_id: &str) -> Result<(Project, Vec<Chapter>)> {
        let project: Project = self.conn.query_row(
            "SELECT id, title, author, genre, created_at, updated_at FROM projects WHERE id = ?1",
            params![project_id],
            |row| Ok(Project {
                id: row.get(0)?,
                title: row.get(1)?,
                author: row.get(2)?,
                genre: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            }),
        )?;
        let chapters = self.list_chapters(project_id)?;
        Ok((project, chapters))
    }

    pub fn import_project(&self, project: &Project, chapters: &[Chapter]) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO projects (id, title, author, genre, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![project.id, project.title, project.author, project.genre, now, now],
        )?;
        for ch in chapters {
            self.conn.execute(
                "INSERT INTO chapters (id, project_id, title, content, sort_order, chapter_type, word_count, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)",
                params![uuid::Uuid::new_v4().to_string(), project.id, ch.title, ch.content, ch.sort_order, ch.chapter_type, ch.word_count, now],
            )?;
        }
        Ok(())
    }
}
