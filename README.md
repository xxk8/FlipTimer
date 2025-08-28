# FlipTimer - 优雅的翻页倒计时器

> 一个功能丰富的翻页倒计时器应用，支持桌面应用和网页版本，提供美观的翻转卡片倒计时效果

<div align="center" style="margin: 24px 0;">
  <img src="./public/show.png" alt="FlipTimer 展示" width="350"/>
  <img src="./public/demonstration.gif" width="350" controls style="border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12);"></img>
  <div style="color: #888; font-size: 14px; margin-top: 8px;">功能演示视频</div>
</div>

## ✨ 特性

- 🎯 **翻页动画效果** - 使用 @pqina/flip 库实现流畅的翻页动画
- 🖥️ **多平台支持** - 支持桌面应用（Electron）和网页版本
- 🎨 **高度可自定义** - 支持自定义颜色、字体、背景图片等
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🔧 **设置面板** - 可拖拽的设置面板，支持实时预览
- 💾 **本地存储** - 设置自动保存到本地存储
- 🌐 **多语言支持** - 支持中英文显示
- ⚡ **全屏模式** - 支持全屏显示，专注倒计时体验
- 🔄 **实时缩放** - 支持 Ctrl+滚轮实时缩放倒计时器

## 🚀 快速开始

### 网页版本

直接用浏览器打开 `index.html` 文件即可使用。

### 桌面应用

```bash
# 安装依赖
npm install

# 启动开发模式
npm start

# 构建 Windows 版本
npm run build-win

# 构建 macOS 版本
npm run build-mac
```

## 📦 项目结构

```
flip-counter-module/
├── package.json                    # 项目配置文件
├── electron-main.js                # Electron 主进程入口
├── index.html                      # 应用主界面
├── main.js                         # 核心逻辑文件
├── app-icon.png                    # 应用图标
├── README.md                       # 项目说明文档
├── dist/                           # 构建输出目录
├── public/                         # 静态资源目录
│   ├── douyuFont-2.otf            # 斗鱼字体
│   ├── impact.ttf                 # Impact 字体
│   ├── TyfoonSans W00 ExtraLight.ttf # 台风字体
│   ├── right-button.png           # 按钮图片
│   └── topLogo.png                # Logo 图片
└── vendor/                         # 第三方库目录
    ├── flip.min.css               # 翻转动画样式
    └── flip.min.js                # 翻转动画脚本
```

## 🎮 使用说明

### 基本操作

- **双击空格键** - 打开/关闭设置面板
- **F11** - 切换全屏模式
- **ESC** - 退出全屏模式
- **Ctrl + 滚轮** - 缩放倒计时器

### 设置面板功能

- **位置调整** - 拖拽设置倒计时器位置
- **大小调整** - 调整倒计时器大小
- **颜色自定义** - 设置边框、背景、数字颜色
- **字体设置** - 选择字体粗细
- **背景图片** - 上传自定义背景图片
- **面板缩放** - Ctrl+滚轮缩放设置面板

## 📋 构建脚本

```bash
# 开发模式
npm start

# 通用构建
npm run build

# Windows 平台构建
npm run build-win
npm run build-win7

# macOS 平台构建
npm run build-mac
npm run build-mac-universal
```

## 🎯 功能特性详解

### 倒计时器

- 支持天、时、分、秒显示
- 流畅的翻页动画效果
- 响应式设计，适配不同屏幕
- 支持自定义颜色和字体

### 设置面板

- 可拖拽移动
- 实时预览效果
- 支持面板缩放
- 点击外部或 ESC 键关闭

### 全屏模式

- 应用启动时自动全屏
- 支持快捷键切换
- 沉浸式倒计时体验

### 本地存储

- 设置自动保存
- 页面刷新后保持设置
- 支持重置默认设置

## 🔧 开发环境

### 系统要求

- Node.js 14+
- npm 6+
- macOS (用于构建 macOS 版本)
- Windows (用于构建 Windows 版本)

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/xxk8/FlipTimer
cd flip-counter-module

# 安装依赖
npm install

# 启动开发模式
npm start
```

## 📱 平台支持

- ✅ Windows (x64)
- ✅ macOS (Intel + Apple Silicon)
- ✅ Web 浏览器 (Chrome, Firefox, Safari, Edge)

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

⭐ 如果这个项目对您有帮助，请给它一个星标！
