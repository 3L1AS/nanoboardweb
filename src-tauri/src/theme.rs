// 主题管理模块
// 支持获取和设置应用主题（亮色/暗色模式）

use std::sync::Mutex;
use tauri::State;

/// 应用主题状态
pub struct ThemeState {
    current_theme: Mutex<String>,
}

impl ThemeState {
    pub fn new() -> Self {
        Self {
            current_theme: Mutex::new("light".to_string()),
        }
    }
}

/// 获取当前主题
#[tauri::command]
pub async fn get_theme(state: State<'_, ThemeState>) -> Result<String, String> {
    Ok(state.current_theme.lock().unwrap().clone())
}

/// 设置主题
#[tauri::command]
pub async fn set_theme(theme: String, state: State<'_, ThemeState>) -> Result<String, String> {
    // 验证主题值
    if theme != "light" && theme != "dark" {
        return Err("Invalid theme value. Must be 'light' or 'dark'".to_string());
    }

    // 保存到状态
    let mut current = state.current_theme.lock().unwrap();
    *current = theme.clone();

    Ok(theme)
}

/// 切换主题
#[tauri::command]
pub async fn toggle_theme(state: State<'_, ThemeState>) -> Result<String, String> {
    let mut current = state.current_theme.lock().unwrap();

    let new_theme = if current.as_str() == "dark" {
        "light".to_string()
    } else {
        "dark".to_string()
    };

    *current = new_theme.clone();
    Ok(new_theme)
}
