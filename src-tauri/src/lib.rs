mod db;
mod docx;
mod epub;
mod pdf;

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
fn create_section(
    state: State<AppState>,
    project_id: String,
    title: String,
    content: String,
    sort_order: i32,
    section_type: String,
    parent_id: Option<String>,
) -> Result<db::Chapter, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_section(&id, &project_id, &title, &content, sort_order, &section_type, parent_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_section_type(state: State<AppState>, id: String, section_type: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_section_type(&id, &section_type).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_chapter_parent(state: State<AppState>, id: String, parent_id: Option<String>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_chapter_parent(&id, parent_id.as_deref()).map_err(|e| e.to_string())
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

// --- Formatting Settings Commands ---

#[tauri::command]
fn get_formatting_settings(state: State<AppState>, project_id: String) -> Result<Option<db::FormattingSettings>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_formatting_settings(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_formatting_settings(state: State<AppState>, settings: db::FormattingSettings) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_formatting_settings(&settings).map_err(|e| e.to_string())
}

// --- Plot Point Commands ---

#[tauri::command]
fn create_plot_point(state: State<AppState>, project_id: String, title: String, pos_x: f64, pos_y: f64) -> Result<db::PlotPoint, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_plot_point(&id, &project_id, &title, pos_x, pos_y).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_plot_points(state: State<AppState>, project_id: String) -> Result<Vec<db::PlotPoint>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_plot_points(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_plot_point(state: State<AppState>, id: String, title: String, description: String, color: String, pos_x: f64, pos_y: f64) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_plot_point(&id, &title, &description, &color, pos_x, pos_y).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_plot_point(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_plot_point(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_plot_connection(state: State<AppState>, project_id: String, source_id: String, target_id: String) -> Result<db::PlotConnection, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_plot_connection(&id, &project_id, &source_id, &target_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_plot_connections(state: State<AppState>, project_id: String) -> Result<Vec<db::PlotConnection>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_plot_connections(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_plot_connection(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_plot_connection(&id).map_err(|e| e.to_string())
}

// --- Character Commands ---

#[tauri::command]
fn create_character(state: State<AppState>, project_id: String, name: String) -> Result<db::Character, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_character(&id, &project_id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_characters(state: State<AppState>, project_id: String) -> Result<Vec<db::Character>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_characters(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_character(state: State<AppState>, id: String, name: String, fields: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_character(&id, &name, &fields).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_character(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_character(&id).map_err(|e| e.to_string())
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

// --- Writing Goals Commands ---

#[tauri::command]
fn get_writing_goal(state: State<AppState>, project_id: String) -> Result<Option<db::WritingGoal>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_writing_goal(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_writing_goal(state: State<AppState>, goal: db::WritingGoal) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_writing_goal(&goal).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_writing_goal(state: State<AppState>, project_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_writing_goal(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn log_daily_words(
    state: State<AppState>,
    project_id: String,
    date: String,
    word_count: i32,
    words_written: i32,
    minutes_active: i32,
) -> Result<db::DailyLog, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.log_daily_words(&id, &project_id, &date, word_count, words_written, minutes_active)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn list_daily_logs(state: State<AppState>, project_id: String) -> Result<Vec<db::DailyLog>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_daily_logs(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_daily_log(state: State<AppState>, project_id: String, date: String) -> Result<Option<db::DailyLog>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_daily_log(&project_id, &date).map_err(|e| e.to_string())
}

// --- Custom Theme Commands ---

#[tauri::command]
fn create_custom_theme(state: State<AppState>, name: String, description: String, settings_json: String) -> Result<db::CustomTheme, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_custom_theme(&id, &name, &description, &settings_json).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_custom_themes(state: State<AppState>) -> Result<Vec<db::CustomTheme>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_custom_themes().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_custom_theme(state: State<AppState>, id: String, name: String, description: String, settings_json: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_custom_theme(&id, &name, &description, &settings_json).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_custom_theme(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_custom_theme(&id).map_err(|e| e.to_string())
}

// --- Master Page Commands ---

#[tauri::command]
fn create_master_page(state: State<AppState>, name: String, page_type: String, content: String, settings_json: String) -> Result<db::MasterPage, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_master_page(&id, &name, &page_type, &content, &settings_json).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_master_pages(state: State<AppState>) -> Result<Vec<db::MasterPage>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_master_pages().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_master_page(state: State<AppState>, id: String, name: String, content: String, settings_json: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_master_page(&id, &name, &content, &settings_json).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_master_page(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_master_page(&id).map_err(|e| e.to_string())
}

// --- Project Image Commands ---

#[tauri::command]
fn save_project_image(state: State<AppState>, image: db::ProjectImage) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_project_image(&image).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_project_images(state: State<AppState>, project_id: String) -> Result<Vec<db::ProjectImage>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_project_images(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_project_image(state: State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_project_image(&id).map_err(|e| e.to_string())
}

// --- Export Commands ---

#[tauri::command]
fn export_epub(state: State<AppState>, project_id: String, output_path: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let (project, chapters) = db.export_project(&project_id).map_err(|e| e.to_string())?;
    let formatting = db.get_formatting_settings(&project_id).map_err(|e| e.to_string())?;

    let metadata = epub::EpubMetadata {
        title: project.title,
        author: project.author,
        language: "en".to_string(),
        identifier: format!("urn:uuid:{}", project.id),
    };

    let epub_chapters: Vec<epub::EpubChapter> = chapters
        .iter()
        .map(|ch| epub::EpubChapter {
            title: ch.title.clone(),
            content: ch.content.clone(),
            chapter_type: ch.chapter_type.clone(),
        })
        .collect();

    let epub_formatting = formatting.map(|f| epub::EpubFormatting {
        body_font: f.body_font,
        heading_font: f.heading_font,
        body_size_pt: f.body_size_pt,
        line_height: f.line_height,
        paragraph_indent_em: f.paragraph_indent_em,
        drop_cap_enabled: f.drop_cap_enabled,
        drop_cap_lines: f.drop_cap_lines,
        lead_in_style: f.lead_in_style,
        lead_in_words: f.lead_in_words,
        scene_break_style: f.scene_break_style,
        justify_text: f.justify_text,
    });

    epub::generate_epub(&metadata, &epub_chapters, epub_formatting.as_ref(), std::path::Path::new(&output_path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn export_pdf(state: State<AppState>, project_id: String, output_path: String, trim_size: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let (project, chapters) = db.export_project(&project_id).map_err(|e| e.to_string())?;
    let formatting = db.get_formatting_settings(&project_id).map_err(|e| e.to_string())?;

    let metadata = pdf::PdfMetadata {
        title: project.title,
        author: project.author,
        trim_size,
    };

    let pdf_chapters: Vec<pdf::PdfChapter> = chapters
        .iter()
        .map(|ch| pdf::PdfChapter {
            title: ch.title.clone(),
            content: ch.content.clone(),
            chapter_type: ch.chapter_type.clone(),
        })
        .collect();

    let pdf_formatting = formatting.map(|f| pdf::PdfFormatting {
        body_font: f.body_font,
        heading_font: f.heading_font,
        body_size_pt: f.body_size_pt,
        heading_size_pt: f.heading_size_pt,
        line_height: f.line_height,
        paragraph_spacing_em: f.paragraph_spacing_em,
        paragraph_indent_em: f.paragraph_indent_em,
        margin_top_in: f.margin_top_in,
        margin_bottom_in: f.margin_bottom_in,
        margin_inner_in: f.margin_inner_in,
        margin_outer_in: f.margin_outer_in,
        drop_cap_enabled: f.drop_cap_enabled,
        drop_cap_lines: f.drop_cap_lines,
        lead_in_style: f.lead_in_style,
        lead_in_words: f.lead_in_words,
        scene_break_style: f.scene_break_style,
        justify_text: f.justify_text,
    });

    pdf::generate_print_html(&metadata, &pdf_chapters, pdf_formatting.as_ref(), std::path::Path::new(&output_path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn export_docx(state: State<AppState>, project_id: String, output_path: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let (project, chapters) = db.export_project(&project_id).map_err(|e| e.to_string())?;

    let metadata = docx::DocxMetadata {
        title: project.title,
        author: project.author,
    };

    let docx_chapters: Vec<docx::DocxChapter> = chapters
        .iter()
        .map(|ch| docx::DocxChapter {
            title: ch.title.clone(),
            content: ch.content.clone(),
            chapter_type: ch.chapter_type.clone(),
        })
        .collect();

    docx::generate_docx(&metadata, &docx_chapters, std::path::Path::new(&output_path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn export_pdf_large_print(state: State<AppState>, project_id: String, output_path: String, trim_size: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let (project, chapters) = db.export_project(&project_id).map_err(|e| e.to_string())?;

    let metadata = pdf::PdfMetadata {
        title: project.title,
        author: project.author,
        trim_size,
    };

    let pdf_chapters: Vec<pdf::PdfChapter> = chapters
        .iter()
        .map(|ch| pdf::PdfChapter {
            title: ch.title.clone(),
            content: ch.content.clone(),
            chapter_type: ch.chapter_type.clone(),
        })
        .collect();

    // Large print overrides: 16pt body, 1.8 line height, sans-serif
    let large_print = pdf::PdfFormatting {
        body_font: "Arial".to_string(),
        heading_font: "Arial".to_string(),
        body_size_pt: 16.0,
        heading_size_pt: 24.0,
        line_height: 1.8,
        paragraph_spacing_em: 0.5,
        paragraph_indent_em: 1.5,
        margin_top_in: 1.0,
        margin_bottom_in: 1.0,
        margin_inner_in: 1.0,
        margin_outer_in: 0.75,
        drop_cap_enabled: false,
        drop_cap_lines: 3,
        lead_in_style: "none".to_string(),
        lead_in_words: 0,
        scene_break_style: "asterisks".to_string(),
        justify_text: false,
    };

    pdf::generate_print_html(&metadata, &pdf_chapters, Some(&large_print), std::path::Path::new(&output_path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn export_box_set_epub(state: State<AppState>, project_ids: Vec<String>, title: String, author: String, output_path: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut all_chapters: Vec<epub::EpubChapter> = Vec::new();

    for (i, pid) in project_ids.iter().enumerate() {
        let (project, chapters) = db.export_project(pid).map_err(|e| e.to_string())?;

        // Add a part title for each book
        all_chapters.push(epub::EpubChapter {
            title: project.title.clone(),
            content: format!("<h1>{}</h1><p>by {}</p>", project.title, project.author),
            chapter_type: "part".to_string(),
        });

        for ch in &chapters {
            all_chapters.push(epub::EpubChapter {
                title: if i > 0 { format!("{} - {}", project.title, ch.title) } else { ch.title.clone() },
                content: ch.content.clone(),
                chapter_type: ch.chapter_type.clone(),
            });
        }
    }

    let metadata = epub::EpubMetadata {
        title,
        author,
        language: "en".to_string(),
        identifier: format!("urn:uuid:{}", uuid::Uuid::new_v4()),
    };

    epub::generate_epub(&metadata, &all_chapters, None, std::path::Path::new(&output_path))
        .map_err(|e| e.to_string())
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
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            db: Mutex::new(database),
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            list_projects,
            update_project,
            delete_project,
            create_chapter,
            create_section,
            update_section_type,
            update_chapter_parent,
            list_chapters,
            update_chapter_content,
            update_chapter_title,
            reorder_chapters,
            delete_chapter,
            split_chapter,
            merge_chapters,
            export_project,
            import_project,
            get_formatting_settings,
            save_formatting_settings,
            get_writing_goal,
            save_writing_goal,
            delete_writing_goal,
            log_daily_words,
            list_daily_logs,
            get_daily_log,
            create_plot_point,
            list_plot_points,
            update_plot_point,
            delete_plot_point,
            create_plot_connection,
            list_plot_connections,
            delete_plot_connection,
            create_character,
            list_characters,
            update_character,
            delete_character,
            export_epub,
            export_pdf,
            export_docx,
            export_pdf_large_print,
            export_box_set_epub,
            create_custom_theme,
            list_custom_themes,
            update_custom_theme,
            delete_custom_theme,
            create_master_page,
            list_master_pages,
            update_master_page,
            delete_master_page,
            save_project_image,
            list_project_images,
            delete_project_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
