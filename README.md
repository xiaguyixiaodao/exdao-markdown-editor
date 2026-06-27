# ExDao Editor

轻量级 Markdown 编辑器 | Lightweight Markdown Editor v0.3.0

基于 Tauri 2 + React 18 + CodeMirror 6 构建，专注于编辑体验的本地 Markdown 编辑器。

Built with Tauri 2 + React 18 + CodeMirror 6, a local-first Markdown editor focused on editing experience.

---

## 功能特性 / Features

### 编辑模式 / Editing Modes
- **源码模式** / Source Mode — CodeMirror 6 驱动，完整的 Markdown 语法高亮，自动换行
- **预览模式** / Preview Mode — TipTap WYSIWYG 所见即所得编辑
- **分屏模式** / Split View — 左侧源码 + 右侧实时预览，支持拖拽调整比例

### 核心功能 / Core Features
- WikiLink `[[target|alias]]` 双向链接导航
- KaTeX 数学公式渲染（行内 `$...$` + 块级 `$$...$$`）
- 代码块语法高亮 + 一键复制
- 文件树浏览 + 搜索过滤
- 大纲导航（按标题跳转）
- 快速切换器（Ctrl+K 模糊搜索文件）
- 查找替换（Ctrl+F / Ctrl+H）
- 标签系统（#标签 语法，状态栏显示）

### 编辑体验 / Editing Experience
- **专注模式** — 聚焦光标所在行 ±N 行（范围可调：3/5/8/10/15），其余行变淡
- **打字机模式** — 光标始终保持在编辑器垂直居中位置
- **全屏模式** — F11 切换全屏
- **字体缩放** — Ctrl+/-/0 调整字体大小，持久化保存
- **内容居中** — 编辑器宽度可调（400-1920px），内容居中显示

### 工具栏 / Toolbar
- 标题 H1-H3、粗体、斜体、删除线、行内代码
- 代码块、引用、有序/无序列表、任务列表
- 链接、图片、数学公式、表格
- 行内数学、脚注、复选框列表
- 代码片段插入（15 种语言模板：React、Python、JS、TS、Rust、Go、Java 等）

### 主题与样式 / Themes & Styles
- 跟随系统 / 深色 / 浅色 主题
- 6 种自定义主题（Nord、Monokai、Solarized Dark、GitHub Dark、Dracula 等）
- 8 种 Markdown 显示样式（默认、优雅、现代、紧凑、衬线、手写、终端等）
- 自定义 CSS 样式注入

### 导出 / Export
- 导出为 HTML（带完整样式，保存对话框选择位置）
- 导出为 PDF（在系统浏览器中打开，用户通过浏览器打印保存）

### 编辑器设置 / Editor Settings
- 自动保存（可配置，2 秒延迟）
- 保存时格式化（清理尾部空格、多余空行）
- 会话恢复（重启后自动恢复打开的文件）
- 自动换行（默认开启）

### 窗口管理 / Window Management
- 无标题栏设计，菜单栏可拖拽
- 自定义窗口控制按钮（最小化、最大化、关闭）
- 菜单栏「退出」按钮关闭应用
- 升级安装时自动保留用户设置

### 其他 / Others
- 拖拽 .md 文件到编辑区打开
- 粘贴剪贴板图片自动保存到仓库
- 状态栏：行列号 / 字数统计 / 阅读时间 / 上次保存时间
- 标签页管理：右键菜单（关闭/关闭其他/关闭全部）、中键关闭、横向滚动
- 文件树右键菜单：复制路径、复制文件名、新建、重命名、删除

---

## 菜单栏 / Menu Bar

| 菜单 / Menu | 内容 / Contents |
|---|---|
| **文件** / File | 新建、打开仓库、保存、另存为、关闭、导出 HTML/PDF、关闭应用 |
| **编辑** / Edit | 撤销、重做、查找、替换、自动换行、保存时格式化 |
| **视图** / View | 编辑模式、工具栏/侧边栏/大纲、字体缩放、全屏、专注模式、打字机模式、专注范围、主题、样式 |
| **设置** / Settings | 自动保存、编辑器设置、主题、样式 |
| **帮助** / Help | 快捷键、关于 |

---

## 快捷键 / Keyboard Shortcuts

| 快捷键 / Shortcut | 功能 / Action |
|---|---|
| `Ctrl+N` | 新建文档 / New Document |
| `Ctrl+O` | 打开仓库 / Open Vault |
| `Ctrl+S` | 保存 / Save |
| `Ctrl+Shift+S` | 另存为 / Save As |
| `Ctrl+W` | 关闭当前文件 / Close Tab |
| `Ctrl+E` | 切换编辑模式 / Toggle Edit Mode |
| `Ctrl+K` | 快速切换文件 / Quick Switcher |
| `Ctrl+F` | 查找 / Find |
| `Ctrl+H` | 替换 / Replace |
| `Ctrl+B` | 切换侧边栏 / Toggle Sidebar |
| `Ctrl+J` | 切换大纲 / Toggle Outline |
| `Ctrl+Z` | 撤销 / Undo |
| `Ctrl+Y` | 重做 / Redo |
| `Ctrl++` | 字体放大 / Zoom In |
| `Ctrl+-` | 字体缩小 / Zoom Out |
| `Ctrl+0` | 重置缩放 / Reset Zoom |
| `Ctrl+\` | 专注模式 / Zen Mode |
| `F11` | 全屏 / Fullscreen |
| `Escape` | 退出源码模式 / Exit Source Mode |

---

## 技术栈 / Tech Stack

| 层级 / Layer | 技术 / Technology |
|---|---|
| 桌面框架 / Desktop | Tauri 2 (Rust) |
| 前端 / Frontend | React 18 + TypeScript |
| 编辑器 / Editor | CodeMirror 6 (源码) + TipTap (WYSIWYG) |
| Markdown 解析 / Parser | markdown-it |
| 数学公式 / Math | KaTeX |
| 状态管理 / State | Zustand |
| 语法高亮 / Highlight | lowlight |

---

## 开发 / Development

### 环境要求 / Prerequisites
- Node.js 18+
- Rust (通过 [rustup](https://rustup.rs/) 安装 / install via rustup)
- Tauri v2 系统依赖 / Tauri v2 system dependencies:
  - Linux: `libwebkit2gtk-4.1-dev libgtk-3-dev libappindicator3-dev librsvg2-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev`

### 安装与运行 / Install & Run
```bash
# 安装依赖 / Install dependencies
npm install

# 开发模式 / Development
npm run tauri dev

# 构建 / Build
npm run tauri build
```

---

## 项目结构 / Project Structure

```
src/
├── App.tsx                 # 主应用组件 / Main app component
├── main.tsx                # 入口文件 / Entry point
├── components/
│   ├── Editor.tsx          # CodeMirror 6 源码编辑器 / Source editor
│   ├── WysiwygEditor.tsx   # TipTap WYSIWYG 编辑器 / WYSIWYG editor
│   ├── Preview.tsx         # Markdown 预览 / Markdown preview
│   ├── FileTree.tsx        # 文件树 + 搜索 / File tree + search
│   ├── TabBar.tsx          # 标签栏 / Tab bar
│   ├── MenuBar.tsx         # 菜单栏 / Menu bar
│   ├── Toolbar.tsx         # 源码工具栏 / Source toolbar
│   ├── WysiwygToolbar.tsx  # WYSIWYG 工具栏 / WYSIWYG toolbar
│   ├── StatusBar.tsx       # 状态栏 / Status bar
│   ├── Outline.tsx         # 大纲面板 / Outline panel
│   ├── QuickSwitcher.tsx   # 快速切换器 / Quick switcher
│   ├── FindAndReplace.tsx  # 查找替换 / Find & replace
│   ├── Settings.tsx        # 设置对话框 / Settings dialog
│   ├── Welcome.tsx         # 欢迎页 / Welcome page
│   ├── ThemeProvider.tsx   # 主题注入 / Theme injection
│   └── MdStyleProvider.tsx # Markdown 样式注入 / MD style injection
├── lib/
│   ├── store.ts            # Zustand 状态管理 / State management
│   ├── markdown.ts         # Markdown 渲染 + 标签提取 / Render + tags
│   ├── mdConvert.ts        # Markdown ↔ HTML 转换 / Conversion layer
│   ├── mdStyles.ts         # 8 种 Markdown 显示样式 / Display styles
│   ├── themes.ts           # 主题定义 / Theme definitions
│   ├── export.ts           # HTML 导出 / Export utilities
│   ├── format.ts           # 保存时格式化 / Format on save
│   ├── snippets.ts         # 15 种代码片段模板 / Code snippets
│   └── vault.ts            # Tauri IPC 调用 / Tauri IPC calls
├── styles/
│   ├── global.css          # 全局样式 + CM6 主题 / Global + CM6 theme
│   ├── layout.css          # 布局样式 / Layout styles
│   └── tiptap.css          # TipTap 编辑器样式 / TipTap editor styles
└── types/
    └── markdown-it-task-lists.d.ts

src-tauri/
├── src/
│   ├── lib.rs              # Rust 后端命令 / Backend commands
│   ├── main.rs             # Tauri 入口 / Tauri entry
│   └── watcher.rs          # 文件监听 / File watcher
├── deb/
│   ├── preinst             # 安装前脚本 / Pre-install script
│   └── postinst            # 安装后脚本 / Post-install script
└── tauri.conf.json         # Tauri 配置 / Tauri config
```

---

## 许可证 / License

MIT
