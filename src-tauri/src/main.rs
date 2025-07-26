use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, State, Manager, RunEvent};   // ← add RunEvent here

#[derive(Default)]
struct Staging(std::sync::Mutex<Vec<PathBuf>>);

#[tauri::command]
fn stage_files(
    app: AppHandle,
    paths: Vec<String>,
    staging: State<Staging>,
) -> Vec<String> {
    let mut list = staging.0.lock().unwrap();

    let cache_dir = app
        .path()                // now resolves
        .cache_dir()
        .expect("cache dir")
        .join("shelfsend_tmp");

    fs::create_dir_all(&cache_dir).ok();

    for p in paths {
        let src = PathBuf::from(&p);
        if let Some(name) = src.file_name() {
            let dest = cache_dir.join(name);
            fs::copy(&src, &dest).ok();
            list.push(dest.clone());
        }
    }
    list.iter().map(|p| p.display().to_string()).collect()
}

#[tauri::command]
fn clear_staging(staging: State<Staging>) {
    let mut g = staging.0.lock().unwrap();
    for p in g.iter() { let _=fs::remove_file(p);}  
    g.clear();
}

#[tauri::command]
fn get_file_size(path: String) -> Result<u64, String> {
    match fs::metadata(&path) {
        Ok(metadata) => Ok(metadata.len()),
        Err(e) => Err(format!("Failed to get file size: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .manage(Staging::default())
        .invoke_handler(tauri::generate_handler![stage_files, clear_staging, get_file_size])
        .build(tauri::generate_context!())
        .expect("error building tauri application")
        .run(|app, event| match event {
            RunEvent::ExitRequested { .. } => {
                // Clean up staged files on exit
                let staging = app.state::<Staging>();
                let mut g = staging.0.lock().unwrap();
                for p in g.iter() { let _=fs::remove_file(p);}  
                g.clear();
            }
            _ => {}
        });
}