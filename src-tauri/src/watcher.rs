use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, Serialize)]
struct FileEvent {
    event: String,
    path: String,
}

pub struct WatcherState {
    watcher: Mutex<Option<RecommendedWatcher>>,
}

pub fn create_watcher_state() -> WatcherState {
    WatcherState {
        watcher: Mutex::new(None),
    }
}

#[tauri::command]
pub fn start_watching(app: AppHandle, path: String) -> Result<(), String> {
    let state = app.state::<WatcherState>();

    let mut watcher_guard = state.watcher.lock().unwrap();
    if let Some(ref mut w) = *watcher_guard {
        let _ = w.unwatch(Path::new("."));
    }

    let app_clone = app.clone();
    let watch_path = PathBuf::from(&path);

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                let event_type = match event.kind {
                    EventKind::Create(_) => "file:add",
                    EventKind::Modify(_) => "file:change",
                    EventKind::Remove(_) => "file:unlink",
                    _ => return,
                };
                for path in &event.paths {
                    let _ = app_clone.emit(
                        "vault:event",
                        FileEvent {
                            event: event_type.to_string(),
                            path: path.to_string_lossy().to_string(),
                        },
                    );
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| e.to_string())?;

    watcher
        .watch(&watch_path, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    *watcher_guard = Some(watcher);
    Ok(())
}
