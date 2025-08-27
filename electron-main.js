const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// 禁用GPU硬件加速以提高Windows 7兼容性
app.disableHardwareAcceleration();

function createWindow() {
  // 创建浏览器窗口
  let mainWindow = new BrowserWindow({
    width: 1469,
    height: 702,
    minWidth: 1469,
    minHeight: 702,
    fullscreen: true, // 启动时直接全屏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'app-icon.png'), // 应用图标
    title: '翻页倒计时器',
    titleBarStyle: 'default',
    show: false // 先不显示，等加载完成后再显示
  });

  // 加载应用的index.html文件
  mainWindow.loadFile('index.html');

  // 当页面加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // 确保启动时处于全屏状态
    if (!mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(true);
    }

    // 可选：开发时自动打开开发者工具
    // mainWindow.webContents.openDevTools();
  });

  // 监听键盘事件，支持F11和ESC切换全屏
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F11键切换全屏
    if (input.key === 'F11' && input.type === 'keyDown') {
      const isFullScreen = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFullScreen);
      console.log(isFullScreen ? '退出全屏模式' : '进入全屏模式');
    }

    // ESC键退出全屏（只在全屏时生效）
    if (input.key === 'Escape' && input.type === 'keyDown' && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
      console.log('ESC键退出全屏模式');
    }
  });

  // 隐藏菜单栏 - 移除文件、视图、帮助等菜单选项
  Menu.setApplicationMenu(null);

  // 处理窗口关闭前事件
  mainWindow.on('close', (event) => {
    // 在这里可以添加关闭前的清理逻辑
    console.log('应用即将关闭，进行清理...');

    // 给页面一点时间保存设置
    // 这里不阻止关闭，让自然关闭流程继续
  });

  // 处理窗口关闭事件
  mainWindow.on('closed', () => {
    // 取消引用，清理资源
    mainWindow = null;
    console.log('主窗口已关闭');
  });
}

// 当Electron完成初始化时调用此方法
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // 在macOS上，点击dock图标时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，保持应用活跃直到用户显式退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 安全设置：阻止新窗口创建
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    // 阻止打开新窗口
    event.preventDefault();
  });
});
