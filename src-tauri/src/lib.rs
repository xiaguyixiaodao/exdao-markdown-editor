use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::State;
use walkdir::WalkDir;

mod watcher;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
}

struct AppState {
    vault_path: Mutex<Option<PathBuf>>,
}

#[tauri::command]
fn open_vault(path: String, state: State<AppState>) -> Result<FileNode, String> {
    let vault = PathBuf::from(&path);
    if !vault.is_dir() {
        return Err("Path is not a directory".into());
    }
    *state.vault_path.lock().unwrap() = Some(vault.clone());
    build_file_tree(&vault, &vault)
}

#[tauri::command]
fn open_directory(path: String) -> Result<FileNode, String> {
    let dir = PathBuf::from(&path);
    if !dir.is_dir() {
        return Err("Path is not a directory".into());
    }
    build_file_tree_all(&dir, &dir)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_file(path: String, content: Option<String>) -> Result<(), String> {
    let p = Path::new(&path);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(p, content.unwrap_or_default()).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| e.to_string())
    } else {
        fs::remove_file(p).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn rename_file(from: String, to: String) -> Result<(), String> {
    fs::rename(&from, &to).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn write_binary_file(path: String, data: Vec<u8>) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, &data).map_err(|e| e.to_string())
}

#[tauri::command]
fn resolve_wikilink(vault_path: String, link_target: String) -> Result<Option<String>, String> {
    let vault = PathBuf::from(&vault_path);
    for entry in WalkDir::new(&vault)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let file_name = entry.file_name().to_string_lossy();
        let stem = Path::new(file_name.as_ref())
            .file_stem()
            .map(|s| s.to_string_lossy().to_string());
        if stem.as_deref() == Some(&link_target) {
            return Ok(Some(entry.path().to_string_lossy().to_string()));
        }
    }
    Ok(None)
}

fn build_file_tree(root: &Path, dir: &Path) -> Result<FileNode, String> {
    build_file_tree_filtered(root, dir, true)
}

fn build_file_tree_all(root: &Path, dir: &Path) -> Result<FileNode, String> {
    let name = dir.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    if dir.is_file() {
        return Ok(FileNode {
            name,
            path: dir.to_string_lossy().to_string(),
            is_dir: false,
            children: None,
        });
    }

    let mut children: Vec<FileNode> = Vec::new();
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        let file_name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        if file_name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            children.push(build_file_tree_all(root, &path)?);
        } else if file_name.ends_with(".md") || file_name.ends_with(".markdown") {
            children.push(FileNode {
                name: file_name,
                path: path.to_string_lossy().to_string(),
                is_dir: false,
                children: None,
            });
        }
    }

    children.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.cmp(&b.name)
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(FileNode {
        name,
        path: dir.to_string_lossy().to_string(),
        is_dir: true,
        children: Some(children),
    })
}

fn build_file_tree_filtered(root: &Path, dir: &Path, md_only: bool) -> Result<FileNode, String> {
    let name = if dir == root {
        root.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "Vault".into())
    } else {
        dir.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default()
    };

    if dir.is_file() {
        return Ok(FileNode {
            name,
            path: dir.to_string_lossy().to_string(),
            is_dir: false,
            children: None,
        });
    }

    let mut children: Vec<FileNode> = Vec::new();
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        let file_name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        if file_name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            children.push(build_file_tree_filtered(root, &path, md_only)?);
        } else if !md_only || file_name.ends_with(".md") || file_name.ends_with(".markdown") {
            children.push(FileNode {
                name: file_name,
                path: path.to_string_lossy().to_string(),
                is_dir: false,
                children: None,
            });
        }
    }

    children.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.cmp(&b.name)
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(FileNode {
        name,
        path: dir.to_string_lossy().to_string(),
        is_dir: true,
        children: Some(children),
    })
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            vault_path: Mutex::new(None),
        })
        .manage(watcher::create_watcher_state())
        .invoke_handler(tauri::generate_handler![
            open_vault,
            open_directory,
            read_file,
            write_file,
            write_binary_file,
            create_file,
            delete_file,
            rename_file,
            get_home_dir,
            resolve_wikilink,
            watcher::start_watching,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
