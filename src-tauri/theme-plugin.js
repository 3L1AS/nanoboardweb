// Tauri 插件：动态设置 HTML 标签的 class 属性以支持暗色模式
// 此插件在应用启动时运行，确保 Tailwind CSS 的 darkMode: 'class' 配置能正确工作

(() => {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      const theme = localStorage.getItem('nanoboard_theme');
      if (theme === 'dark') {
        document.documentElement.setAttribute('class', 'dark');
      } else {
        document.documentElement.removeAttribute('class');
      }
    })();

    // 监听主题变化
    window.addEventListener('storage', (e) => {
      if (e.key === 'nanoboard_theme') {
        const newTheme = e.newValue;
        if (newTheme === 'dark') {
          document.documentElement.setAttribute('class', 'dark');
        } else {
          document.documentElement.removeAttribute('class');
        }
      }
    });
  `;
  script.onload = () => {
    document.head.prepend(script);
    // 脚本执行后移除自己
    script.remove();
  };

  // 在 DOM 加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      script.onload();
    });
  } else {
    script.onload();
  }
})();
