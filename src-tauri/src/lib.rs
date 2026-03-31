mod db;

use db::Database;
use std::sync::Mutex;
use tauri::State;

struct AppState {
    db: Mutex<Database>,
}

// --- Project Commands ---

#[tauri::command]
fn create_project(state: State<AppState>, title: String) -> Result<db::Project, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_project(&id, &title).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_projects(state: State<AppState>) -> Result<Vec<db::Project>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_projects().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_project(state: State<AppState>, id: String, title: String, author: String, genre: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_project(&id, &title, &author, &genre).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_project(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_project(&id).map_err(|e| e.to_string())
}

// --- Chapter Commands ---

#[tauri::command]
fn create_chapter(state: State<AppState>, project_id: String, title: String, sort_order: i32) -> Result<db::Chapter, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_chapter(&id, &project_id, &title, sort_order).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_chapters(state: State<AppState>, project_id: String) -> Result<Vec<db::Chapter>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_chapters(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_chapter_content(state: State<AppState>, id: String, content: String, word_count: i32) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_chapter_content(&id, &content, word_count).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_chapter_title(state: State<AppState>, id: String, title: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_chapter_title(&id, &title).map_err(|e| e.to_string())
}

#[tauri::command]
fn reorder_chapters(state: State<AppState>, chapter_ids: Vec<String>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.reorder_chapters(&chapter_ids).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_chapter(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_chapter(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn split_chapter(
    state: State<AppState>,
    id: String,
    new_title: String,
    original_content: String,
    original_word_count: i32,
    new_content: String,
    new_word_count: i32,
) -> Result<db::Chapter, String> {
    let new_id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.split_chapter(&id, &new_id, &new_title, &original_content, original_word_count, &new_content, new_word_count)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn merge_chapters(
    state: State<AppState>,
    keep_id: String,
    remove_id: String,
    merged_content: String,
    merged_word_count: i32,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.merge_chapters(&keep_id, &remove_id, &merged_content, merged_word_count)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn export_project(state: State<AppState>, project_id: String) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let (project, chapters) = db.export_project(&project_id).map_err(|e| e.to_string())?;
    serde_json::to_value(serde_json::json!({
        "version": "1.0",
        "project": project,
        "chapters": chapters,
    }))
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn import_project(state: State<AppState>, data: serde_json::Value) -> Result<db::Project, String> {
    let project: db::Project = serde_json::from_value(
        data.get("project").ok_or("Missing project field")?.clone(),
    )
    .map_err(|e| e.to_string())?;
    let chapters: Vec<db::Chapter> = serde_json::from_value(
        data.get("chapters").ok_or("Missing chapters field")?.clone(),
    )
    .map_err(|e| e.to_string())?;

    // Generate a new ID so imports don't collide
    let mut imported = project.clone();
    imported.id = uuid::Uuid::new_v4().to_string();

    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.import_project(&imported, &chapters).map_err(|e| e.to_string())?;
    Ok(imported)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_dir = dirs_next::data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("narris");
    std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

    let db_path = app_dir.join("narris.db");
    let database = Database::new(&db_path).expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            db: Mutex::new(database),
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            list_projects,
            update_project,
            delete_project,
            create_chapter,
            list_chapters,
            update_chapter_content,
            update_chapter_title,
            reorder_chapters,
            delete_chapter,
            split_chapter,
            merge_chapters,
            export_project,
            import_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
