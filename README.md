# Flip Counter Module

这是一个独立的翻页倒计时器模块，可以直接在浏览器中运行，无需任何构建步骤。

## 项目结构

```
/
├── vendor/
│   ├── flip.min.css
│   └── flip.min.js
├── public/
│   ├── TyfoonSans W00 ExtraLight.ttf
│   └── background.png
├── index.html
└── main.js
```

- `index.html`: 项目的主入口文件。
- `main.js`: 控制倒计时器逻辑和设置面板的 JavaScript 文件。
- `vendor/`: 存放本地化的第三方库文件 (`@pqina/flip`)。
- `public/`: 存放字体和背景图片等静态资源。

## 如何运行

直接用你的网络浏览器（如 Chrome, Firefox, Safari）打开 `index.html` 文件即可。

## 功能

- 一个可自定义的翻页倒计时器。
- 双击空格键可以打开设置面板。
- 设置面板允许你调整：
  - 倒计时器的大小和位置
  - 边框、背景和数字的颜色
  - 数字的字体粗细
  - 背景图片
- 设置会被保存在浏览器的 `localStorage` 中，刷新页面后依然生效。
- 设置面板可以拖动。
