use anyhow::{Context, Result};
use dirs::home_dir;
use serde_json::json;
use std::fs;
use std::path::PathBuf;

/// 获取workspace路径
fn get_workspace_path() -> Result<PathBuf> {
    let home = home_dir().context("无法找到用户主目录")?;
    let workspace_path = home.join(".nanobot").join("workspace");
    Ok(workspace_path)
}

/// 列出所有会话
#[tauri::command]
pub async fn list_sessions() -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    if !workspace_path.exists() {
        return Ok(json!({
            "sessions": [],
            "message": "workspace目录不存在"
        }));
    }

    let memory_path = workspace_path.join("memory");
    if !memory_path.exists() {
        return Ok(json!({
            "sessions": [],
            "message": "memory目录不存在"
        }));
    }

    let mut sessions = Vec::new();

    // 读取memory目录中的所有会话文件
    if let Ok(entries) = fs::read_dir(&memory_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    if file_name.ends_with(".md") || file_name.ends_with(".json") {
                        // 读取文件元数据
                        if let Ok(metadata) = fs::metadata(&path) {
                            if let Ok(modified) = metadata.modified() {
                                sessions.push(json!({
                                    "id": file_name,
                                    "name": file_name.trim_end_matches(".md").trim_end_matches(".json"),
                                    "path": path.to_string_lossy(),
                                    "modified": modified.duration_since(std::time::UNIX_EPOCH)
                                        .map(|d| d.as_secs()).unwrap_or(0),
                                    "size": metadata.len()
                                }));
                            }
                        }
                    }
                }
            }
        }
    }

    // 按修改时间排序
    sessions.sort_by(|a, b| {
        let a_time = a.get("modified").and_then(|v| v.as_u64()).unwrap_or(0);
        let b_time = b.get("modified").and_then(|v| v.as_u64()).unwrap_or(0);
        b_time.cmp(&a_time)
    });

    Ok(json!({
        "sessions": sessions,
        "total": sessions.len()
    }))
}

/// 获取会话记忆内容
#[tauri::command]
pub async fn get_session_memory(session_id: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;
    let memory_path = workspace_path.join("memory").join(&session_id);

    if !memory_path.exists() {
        return Ok(json!({
            "error": "not_found",
            "message": format!("会话 {} 不存在", session_id)
        }));
    }

    let content = fs::read_to_string(&memory_path)
        .map_err(|e| format!("读取会话内容失败: {}", e))?;

    Ok(json!({
        "id": session_id,
        "content": content,
        "size": content.len()
    }))
}

/// 获取workspace文件列表
#[tauri::command]
pub async fn get_workspace_files() -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    if !workspace_path.exists() {
        return Ok(json!({
            "files": [],
            "message": "workspace目录不存在"
        }));
    }

    let mut files = Vec::new();

    // 读取workspace目录中的所有文件
    if let Ok(entries) = fs::read_dir(&workspace_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    // 读取文件内容
                    let content = fs::read_to_string(&path).unwrap_or_default();

                    if let Ok(metadata) = fs::metadata(&path) {
                        if let Ok(modified) = metadata.modified() {
                            files.push(json!({
                                "name": file_name,
                                "path": path.to_string_lossy(),
                                "content": content,
                                "size": metadata.len(),
                                "modified": modified.duration_since(std::time::UNIX_EPOCH)
                                    .map(|d| d.as_secs()).unwrap_or(0)
                            }));
                        }
                    }
                }
            }
        }
    }

    // 排序文件
    files.sort_by(|a, b| {
        let a_name = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let b_name = b.get("name").and_then(|v| v.as_str()).unwrap_or("");
        a_name.cmp(b_name)
    });

    Ok(json!({
        "files": files,
        "total": files.len()
    }))
}

/// 删除会话
#[tauri::command]
pub async fn delete_session(session_id: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;
    let memory_path = workspace_path.join("memory").join(&session_id);

    if !memory_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("会话 {} 不存在", session_id)
        }));
    }

    fs::remove_file(&memory_path)
        .map_err(|e| format!("删除会话失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("会话 {} 已删除", session_id)
    }))
}

/// 重命名会话
#[tauri::command]
pub async fn rename_session(session_id: String, new_name: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;
    let memory_path = workspace_path.join("memory");
    let old_path = memory_path.join(&session_id);

    if !old_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("会话 {} 不存在", session_id)
        }));
    }

    // 获取文件扩展名
    let extension = old_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("md");

    // 构建新文件名
    let new_filename = format!("{}.{}", new_name.trim(), extension);
    let new_path = memory_path.join(&new_filename);

    // 检查新文件名是否已存在
    if new_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("会话名称 {} 已存在", new_name)
        }));
    }

    // 重命名文件
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("重命名会话失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("会话已重命名为 {}", new_name),
        "old_id": session_id,
        "new_id": new_filename
    }))
}

/// 保存会话记忆内容
#[tauri::command]
pub async fn save_session_memory(session_id: String, content: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;
    let memory_path = workspace_path.join("memory");

    // 确保目录存在
    fs::create_dir_all(&memory_path)
        .map_err(|e| format!("创建memory目录失败: {}", e))?;

    let file_path = memory_path.join(&session_id);

    // 写入文件
    fs::write(&file_path, content)
        .map_err(|e| format!("保存会话内容失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("会话 {} 已保存", session_id)
    }))
}

/// 保存工作区文件
#[tauri::command]
pub async fn save_workspace_file(file_name: String, content: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    // 确保目录存在
    fs::create_dir_all(&workspace_path)
        .map_err(|e| format!("创建workspace目录失败: {}", e))?;

    let file_path = workspace_path.join(&file_name);

    // 写入文件
    fs::write(&file_path, content)
        .map_err(|e| format!("保存工作区文件失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("文件 {} 已保存", file_name)
    }))
}

/// 获取skills路径
fn get_skills_path() -> Result<PathBuf> {
    let workspace_path = get_workspace_path()?;
    let skills_path = workspace_path.join("skills");
    Ok(skills_path)
}

/// 列出所有Skill
#[tauri::command]
pub async fn list_skills() -> Result<serde_json::Value, String> {
    let skills_path = get_skills_path().map_err(|e| e.to_string())?;

    if !skills_path.exists() {
        return Ok(json!({
            "skills": [],
            "message": "skills目录不存在"
        }));
    }

    let mut skills = Vec::new();

    // 读取skills目录中的所有.md文件
    if let Ok(entries) = fs::read_dir(&skills_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    if file_name.ends_with(".md") {
                        // 读取文件元数据
                        if let Ok(metadata) = fs::metadata(&path) {
                            if let Ok(modified) = metadata.modified() {
                                // 读取文件内容的第一行作为标题
                                let title = if let Ok(content) = fs::read_to_string(&path) {
                                    content
                                        .lines()
                                        .find(|line| !line.is_empty() && line.starts_with("#"))
                                        .unwrap_or("")
                                        .trim_start_matches("#")
                                        .trim()
                                        .to_string()
                                } else {
                                    file_name.trim_end_matches(".md").to_string()
                                };

                                skills.push(json!({
                                    "id": file_name,
                                    "name": file_name.trim_end_matches(".md"),
                                    "title": title,
                                    "path": path.to_string_lossy(),
                                    "modified": modified.duration_since(std::time::UNIX_EPOCH)
                                        .unwrap_or_default()
                                        .as_secs()
                                }));
                            }
                        }
                    }
                }
            }
        }
    }

    // 按修改时间倒序排列
    skills.sort_by(|a, b| {
        let a_time = a["modified"].as_u64().unwrap_or(0);
        let b_time = b["modified"].as_u64().unwrap_or(0);
        b_time.cmp(&a_time)
    });

    Ok(json!({
        "skills": skills
    }))
}

/// 获取Skill内容
#[tauri::command]
pub async fn get_skill_content(skill_id: String) -> Result<serde_json::Value, String> {
    let skills_path = get_skills_path().map_err(|e| e.to_string())?;
    let skill_path = skills_path.join(&skill_id);

    if !skill_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("Skill {} 不存在", skill_id)
        }));
    }

    let content = fs::read_to_string(&skill_path)
        .map_err(|e| format!("读取Skill失败: {}", e))?;

    Ok(json!({
        "success": true,
        "content": content,
        "name": skill_id.trim_end_matches(".md")
    }))
}

/// 删除Skill
#[tauri::command]
pub async fn delete_skill(skill_id: String) -> Result<serde_json::Value, String> {
    let skills_path = get_skills_path().map_err(|e| e.to_string())?;
    let skill_path = skills_path.join(&skill_id);

    if !skill_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("Skill {} 不存在", skill_id)
        }));
    }

    fs::remove_file(&skill_path)
        .map_err(|e| format!("删除Skill失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("Skill {} 已删除", skill_id)
    }))
}

/// 获取目录树
#[tauri::command]
pub async fn get_directory_tree(relative_path: Option<String>) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    if !workspace_path.exists() {
        fs::create_dir_all(&workspace_path)
            .map_err(|e| format!("创建workspace目录失败: {}", e))?;
    }

    // 解析相对路径
    let target_path = if let Some(rel_path) = &relative_path {
        if rel_path.is_empty() || rel_path == "/" {
            workspace_path.clone()
        } else {
            // 清理路径，移除开头的 /
            let clean_path = rel_path.trim_start_matches('/');
            workspace_path.join(clean_path)
        }
    } else {
        workspace_path.clone()
    };

    // 检查路径是否存在
    if !target_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("路径 {} 不存在", relative_path.unwrap_or_default())
        }));
    }

    // 检查路径是否在 workspace 内（安全检查）
    let canonical_workspace = fs::canonicalize(&workspace_path)
        .map_err(|e| format!("获取workspace路径失败: {}", e))?;
    let canonical_target = fs::canonicalize(&target_path)
        .map_err(|e| format!("获取目标路径失败: {}", e))?;

    if !canonical_target.starts_with(&canonical_workspace) {
        return Ok(json!({
            "success": false,
            "message": "访问被拒绝：路径超出workspace范围"
        }));
    }

    // 如果是目录，读取其内容
    let mut items = Vec::new();

    if target_path.is_dir() {
        if let Ok(entries) = fs::read_dir(&target_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                let file_name = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();

                // 跳过隐藏文件
                if file_name.starts_with('.') {
                    continue;
                }

                let item_type = if path.is_dir() { "directory" } else { "file" };
                let metadata = fs::metadata(&path)
                    .map_err(|e| format!("读取元数据失败: {}", e))?;

                let modified = metadata.modified()
                    .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs())
                    .unwrap_or(0);

                // 计算相对路径
                let relative = if let Some(rel) = &relative_path {
                    if rel.is_empty() || rel == "/" {
                        file_name.clone()
                    } else {
                        format!("{}/{}", rel.trim_end_matches('/'), &file_name)
                    }
                } else {
                    file_name.clone()
                };

                items.push(json!({
                    "name": file_name,
                    "path": path.to_string_lossy(),
                    "relative_path": relative,
                    "type": item_type,
                    "size": metadata.len(),
                    "modified": modified,
                }));
            }
        }

        // 排序：目录优先，然后按名称排序
        items.sort_by(|a, b| {
            let a_type = a.get("type").and_then(|v| v.as_str()).unwrap_or("");
            let b_type = b.get("type").and_then(|v| v.as_str()).unwrap_or("");
            let a_name = a.get("name").and_then(|v| v.as_str()).unwrap_or("");
            let b_name = b.get("name").and_then(|v| v.as_str()).unwrap_or("");

            match (a_type, b_type) {
                ("directory", "directory") | ("file", "file") => a_name.cmp(b_name),
                ("directory", "file") => std::cmp::Ordering::Less,
                ("file", "directory") => std::cmp::Ordering::Greater,
                _ => a_name.cmp(b_name),
            }
        });
    }

    Ok(json!({
        "success": true,
        "path": relative_path.clone().unwrap_or("/".to_string()),
        "items": items,
        "parent": if relative_path.as_ref().is_none_or(|p| p == "/" || p.is_empty()) {
            None
        } else {
            relative_path
        }
    }))
}

/// 获取文件内容
#[tauri::command]
pub async fn get_file_content(relative_path: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    let clean_path = relative_path.trim_start_matches('/');
    let file_path = workspace_path.join(clean_path);

    // 安全检查
    let canonical_workspace = fs::canonicalize(&workspace_path)
        .map_err(|e| format!("获取workspace路径失败: {}", e))?;
    let canonical_file = fs::canonicalize(&file_path)
        .map_err(|e| format!("获取文件路径失败: {}", e))?;

    if !canonical_file.starts_with(&canonical_workspace) {
        return Ok(json!({
            "success": false,
            "message": "访问被拒绝：路径超出workspace范围"
        }));
    }

    if !file_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("文件 {} 不存在", relative_path)
        }));
    }

    if !file_path.is_file() {
        return Ok(json!({
            "success": false,
            "message": format!("{} 不是文件", relative_path)
        }));
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    let metadata = fs::metadata(&file_path)
        .map_err(|e| format!("读取文件元数据失败: {}", e))?;

    let file_name = file_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    Ok(json!({
        "success": true,
        "content": content,
        "path": relative_path,
        "name": file_name,
        "size": metadata.len(),
    }))
}

/// 创建文件夹
#[tauri::command]
pub async fn create_folder(relative_path: String, folder_name: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    let clean_path = relative_path.trim_start_matches('/');
    let parent_path = if clean_path.is_empty() || clean_path == "/" {
        workspace_path.clone()
    } else {
        workspace_path.join(clean_path)
    };

    let new_folder_path = parent_path.join(&folder_name);

    // 安全检查
    let canonical_workspace = fs::canonicalize(&workspace_path)
        .map_err(|e| format!("获取workspace路径失败: {}", e))?;
    let canonical_parent = fs::canonicalize(&parent_path)
        .map_err(|e| format!("获取父目录路径失败: {}", e))?;

    if !canonical_parent.starts_with(&canonical_workspace) {
        return Ok(json!({
            "success": false,
            "message": "访问被拒绝：路径超出workspace范围"
        }));
    }

    if new_folder_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("文件夹 {} 已存在", folder_name)
        }));
    }

    fs::create_dir_all(&new_folder_path)
        .map_err(|e| format!("创建文件夹失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("文件夹 {} 已创建", folder_name),
        "path": if relative_path.is_empty() || relative_path == "/" {
            folder_name
        } else {
            format!("{}/{}", relative_path.trim_end_matches('/'), folder_name)
        }
    }))
}

/// 删除文件夹
#[tauri::command]
pub async fn delete_folder(relative_path: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    let clean_path = relative_path.trim_start_matches('/');
    let folder_path = workspace_path.join(clean_path);

    // 获取文件夹名称
    let folder_name = folder_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    // 检查是否为受保护的文件夹
    let protected_folders = ["memory", "skills"];
    if protected_folders.contains(&folder_name) {
        return Ok(json!({
            "success": false,
            "message": format!("'{}' 是系统文件夹，不能删除", folder_name)
        }));
    }

    // 安全检查
    let canonical_workspace = fs::canonicalize(&workspace_path)
        .map_err(|e| format!("获取workspace路径失败: {}", e))?;

    if !folder_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("文件夹 {} 不存在", relative_path)
        }));
    }

    let canonical_folder = fs::canonicalize(&folder_path)
        .map_err(|e| format!("获取文件夹路径失败: {}", e))?;

    if !canonical_folder.starts_with(&canonical_workspace) {
        return Ok(json!({
            "success": false,
            "message": "访问被拒绝：路径超出workspace范围"
        }));
    }

    if !folder_path.is_dir() {
        return Ok(json!({
            "success": false,
            "message": format!("{} 不是文件夹", relative_path)
        }));
    }

    // 递归删除
    fs::remove_dir_all(&folder_path)
        .map_err(|e| format!("删除文件夹失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("文件夹 {} 已删除", relative_path)
    }))
}

/// 重命名文件夹或文件
#[tauri::command]
pub async fn rename_item(relative_path: String, new_name: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    let clean_path = relative_path.trim_start_matches('/');
    let item_path = workspace_path.join(clean_path);

    // 获取项目名称
    let item_name = item_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    // 检查是否为受保护的文件或文件夹
    let protected_folders = ["memory", "skills"];
    let protected_files = ["AGENTS.md", "SOUL.md", "USER.md"];

    if protected_folders.contains(&item_name) || protected_files.contains(&item_name) {
        return Ok(json!({
            "success": false,
            "message": format!("'{}' 是系统文件，不能重命名", item_name)
        }));
    }

    // 安全检查
    let canonical_workspace = fs::canonicalize(&workspace_path)
        .map_err(|e| format!("获取workspace路径失败: {}", e))?;

    if !item_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("{} 不存在", relative_path)
        }));
    }

    let canonical_item = fs::canonicalize(&item_path)
        .map_err(|e| format!("获取路径失败: {}", e))?;

    if !canonical_item.starts_with(&canonical_workspace) {
        return Ok(json!({
            "success": false,
            "message": "访问被拒绝：路径超出workspace范围"
        }));
    }

    // 获取父目录
    let parent = item_path.parent()
        .ok_or_else(|| "无法获取父目录".to_string())?;

    let new_path = parent.join(&new_name);

    // 检查新名称是否已存在
    if new_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("{} 已存在", new_name)
        }));
    }

    // 重命名
    fs::rename(&item_path, &new_path)
        .map_err(|e| format!("重命名失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("已重命名为 {}", new_name),
        "new_path": new_path.to_string_lossy().to_string()
    }))
}

/// 删除文件
#[tauri::command]
pub async fn delete_file(relative_path: String) -> Result<serde_json::Value, String> {
    let workspace_path = get_workspace_path().map_err(|e| e.to_string())?;

    let clean_path = relative_path.trim_start_matches('/');
    let file_path = workspace_path.join(clean_path);

    // 获取文件名
    let file_name = file_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    // 检查是否为受保护的文件
    let protected_files = ["AGENTS.md", "SOUL.md", "USER.md"];
    if protected_files.contains(&file_name) {
        return Ok(json!({
            "success": false,
            "message": format!("'{}' 是系统文件，不能删除", file_name)
        }));
    }

    // 安全检查
    let canonical_workspace = fs::canonicalize(&workspace_path)
        .unwrap_or_else(|_| workspace_path.clone());

    if !file_path.exists() {
        return Ok(json!({
            "success": false,
            "message": format!("文件 {} 不存在", relative_path)
        }));
    }

    if let Ok(canonical_file) = fs::canonicalize(&file_path) {
        if !canonical_file.starts_with(&canonical_workspace) {
            return Ok(json!({
                "success": false,
                "message": "访问被拒绝：路径超出workspace范围"
            }));
        }
    }

    if !file_path.is_file() {
        return Ok(json!({
            "success": false,
            "message": format!("{} 不是文件", relative_path)
        }));
    }

    fs::remove_file(&file_path)
        .map_err(|e| format!("删除文件失败: {}", e))?;

    Ok(json!({
        "success": true,
        "message": format!("文件 {} 已删除", relative_path)
    }))
}
