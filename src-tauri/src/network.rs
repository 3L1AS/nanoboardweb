use std::sync::Mutex;
use tauri::State;

#[derive(Clone, serde::Serialize)]
pub struct NetworkStats {
    pub upload_speed: u64,
    pub download_speed: u64,
    pub total_upload: u64,
    pub total_download: u64,
}

// 平台特定的网络统计获取
#[cfg(target_os = "linux")]
fn get_network_stats_impl() -> (u64, u64) {
    use std::fs;
    // 读取 /proc/net/dev 获取网络统计
    if let Ok(content) = fs::read_to_string("/proc/net/dev") {
        let mut total_received = 0u64;
        let mut total_transmitted = 0u64;

        for line in content.lines().skip(2) {
            // 跳过标题行
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 10 {
                // 排除回环接口 (lo)
                if !parts[0].starts_with("lo:") {
                    if let Ok(rx) = parts[1].parse::<u64>() {
                        total_received += rx;
                    }
                    if let Ok(tx) = parts[9].parse::<u64>() {
                        total_transmitted += tx;
                    }
                }
            }
        }
        (total_received, total_transmitted)
    } else {
        (0, 0)
    }
}

#[cfg(target_os = "macos")]
fn get_network_stats_impl() -> (u64, u64) {
    use std::process::Command;
    // 使用 netstat 命令获取网络统计
    // 尝试常见的网络接口：en0, en1
    let interfaces = ["en0", "en1"];

    for iface in interfaces {
        if let Ok(output) = Command::new("netstat")
            .args(["-b", "-I", iface])
            .output()
        {
            let content = String::from_utf8_lossy(&output.stdout);
            let lines: Vec<&str> = content.lines().collect();
            // 跳过标题行（第一行），读取数据行（第二行）
            if lines.len() > 1 {
                if let Some(line) = lines.get(1) {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    // Ibytes 在索引 6，Obytes 在索引 9
                    if parts.len() >= 10 {
                        let rx: u64 = parts.get(6).and_then(|s| s.parse().ok()).unwrap_or(0);
                        let tx: u64 = parts.get(9).and_then(|s| s.parse().ok()).unwrap_or(0);
                        return (rx, tx);
                    }
                }
            }
        }
    }
    (0, 0)
}

#[cfg(target_os = "windows")]
fn get_network_stats_impl() -> (u64, u64) {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    // Windows 使用 Get-NetAdapterStatistics 获取网络适配器统计
    // 获取主要网络接口的接收和发送字节数
    if let Ok(output) = Command::new("powershell")
        .args(&[
            "-WindowStyle",
            "Hidden",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "Get-NetAdapterStatistics | Select-Object -First 1 -Property ReceivedBytes,SentBytes | ConvertTo-Json",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    {
        let content = String::from_utf8_lossy(&output.stdout);
        // PowerShell 输出 JSON 格式
        if let Ok(json) = content.trim().parse::<serde_json::Value>() {
            if let Some(obj) = json.as_object() {
                let received = obj.get("ReceivedBytes").and_then(|v| v.as_u64()).unwrap_or(0);
                let sent = obj.get("SentBytes").and_then(|v| v.as_u64()).unwrap_or(0);
                return (received, sent);
            }
        }
    }
    // 失败时返回 (0, 0)，避免错误传播
    (0, 0)
}

pub struct NetworkMonitor {
    last_received: u64,
    last_transmitted: u64,
}

impl NetworkMonitor {
    pub fn new() -> Self {
        let (total_received, total_transmitted) = get_network_stats_impl();

        Self {
            last_received: total_received,
            last_transmitted: total_transmitted,
        }
    }

    pub fn get_stats(&mut self) -> NetworkStats {
        let (total_received, total_transmitted) = get_network_stats_impl();

        // 计算差值得到速度（字节/秒）
        let download_speed = total_received.saturating_sub(self.last_received);
        let upload_speed = total_transmitted.saturating_sub(self.last_transmitted);

        // 更新上次值
        self.last_received = total_received;
        self.last_transmitted = total_transmitted;

        NetworkStats {
            upload_speed,
            download_speed,
            total_upload: total_transmitted,
            total_download: total_received,
        }
    }
}

// Tauri 命令：初始化网络监控器
#[tauri::command]
pub fn init_network_monitor(_state: State<Mutex<NetworkMonitor>>) {
    // 监控器已在 main.rs 中初始化，这里无需额外操作
}

// Tauri 命令：获取网络统计数据
#[tauri::command]
pub fn get_network_stats(state: State<Mutex<NetworkMonitor>>) -> NetworkStats {
    let mut monitor = state.lock().unwrap();
    monitor.get_stats()
}
