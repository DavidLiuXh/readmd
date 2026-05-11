# CLAUDE.md — ReadMD 项目上下文

本文件为 Claude Code 在此仓库工作时提供指导。

---

## 项目概述

**ReadMD** 是一个 Chrome 扩展，让用户在浏览器里美观地阅读本地 Markdown 文件。支持目录树浏览、分屏对比、亮/暗主题、语法高亮、KaTeX 数学公式、Mermaid 流程图、中英文 UI 切换。

- **GitHub**：https://github.com/DavidLiuXh/readmd
- **当前版本**：1.1.0
- **目标平台**：Chrome Web Store（Manifest V3）

---

## 构建与测试

```bash
# 安装依赖
npm install

# 类型检查
npx tsc --noEmit

# 构建（输出到 dist/）
npm run build

# 重新生成图标（编辑 icon-source.svg 后执行）
node -e "
const sharp = require('sharp'), fs = require('fs')
const svg = fs.readFileSync('icon-source.svg')
const sizes = [16, 32, 48, 96, 128]
Promise.all(sizes.map(s => sharp(svg).resize(s,s).png().toFile('public/icons/icon'+s+'.png')))
  .then(() => console.log('done'))
"
```

**在 Chrome 加载扩展**：
1. `npm run build`
2. 打开 `chrome://extensions/` → 开发者模式 → 加载已解压 → 选 `dist/`
3. 修改代码后：`npm run build` → `chrome://extensions/` 点刷新

**打包发布**：
```bash
npm run build && cd dist && zip -r ../readmd-extension.zip . && cd ..
```

---

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6，`base: './'`（Chrome 扩展必须用相对路径） |
| 状态管理 | Zustand，所有 useStore selector **必须单字段**，禁止对象解构 selector |
| Markdown | marked + marked-highlight + marked-katex-extension |
| 代码高亮 | highlight.js |
| 数学公式 | KaTeX |
| 流程图 | Mermaid（渲染后二次扫描 DOM） |
| 持久化 | idb（IndexedDB）存目录 handle；chrome.storage.local 存主题/语言/面板宽度 |
| 样式 | CSS Modules + CSS 变量（`[data-theme]` 切换亮暗） |

---

## 架构

### 目录结构

```
src/
├── main.tsx                    # React 挂载入口
├── App.tsx                     # 三栏布局：ActivityBar + FilePanel + MarkdownViewer
├── App.module.css              # 全局 CSS 变量（亮/暗两套）
├── types.ts                    # 共享类型：TreeNode、FileLeaf、RecentDir 等
├── store/index.ts              # Zustand store（fileSystem + viewer + ui 三个 slice）
├── db/index.ts                 # idb 封装：saveHandle / loadAllHandles / deleteHandle
├── i18n/
│   ├── locales.ts              # zh / en 语言包（~25 条文案）
│   └── index.ts                # useT() hook
├── hooks/
│   ├── useFileSystem.ts        # 目录遍历、权限管理、dirUrl 模式
│   └── useTheme.ts             # 主题 + 语言初始化和切换
├── lib/
│   ├── markdown.ts             # marked 渲染管线（hljs + KaTeX + 代码块语言标签）
│   └── imageResolver.ts        # 相对路径图片 → blob URL
└── components/
    ├── ActivityBar/            # 左侧图标栏
    ├── FilePanel/              # 可折叠文件面板（含 FileTree、SearchBox、RecentDirList）
    └── MarkdownViewer/         # 内容渲染区（含 ViewerToolbar、RenderedContent）
public/
├── manifest.json               # Chrome MV3 配置
├── background.js               # Service worker：打开 reader tab、处理 OPEN_DIR 消息
└── content.js                  # 注入 file:// 目录页，解析 addRow() 提取文件列表
```

### 两种打开文件的方式

**方式 A：File System Access API**
- 用户点「打开目录」→ `showDirectoryPicker()` → 递归遍历构建 `TreeNode[]`
- `FileSystemDirectoryHandle` 存入 IndexedDB，重启后 `queryPermission()` 恢复
- macOS 对系统目录有保护，`~` 根目录和部分系统目录无法打开

**方式 B：file:// 目录页注入（推荐，无权限限制）**
- `content.js` 注入到 `file:///*/` 目录页
- 解析 Chrome 自动生成的 `addRow("文件名", ...)` 调用提取 `.md` 文件列表
- 点击右下角按钮 → `chrome.runtime.sendMessage({ type: 'OPEN_DIR' })` → background 开新 tab
- `App.tsx` 检测 `?dirUrl=` 参数 → `useDirUrlMode()` 通过 `fetch` 加载文件内容

### Zustand Store 结构

```ts
// fileSystem slice
rootHandle: FileSystemDirectoryHandle | null
tree: (TreeNode | FileLeaf)[]
recentDirs: RecentDir[]

// viewer slice
activeFile: FileLeaf | null        // 左侧/单屏当前文件
history: FileLeaf[]                // 导航历史栈
historyIndex: number
splitMode: boolean                 // 分屏模式开关
activeSide: 'left' | 'right'       // 分屏时焦点侧
activeFileRight: FileLeaf | null   // 右侧文件
imageCache: Map<string, string>    // 左侧图片 blob URL 缓存
imageCacheRight: Map<string, string>

// ui slice
theme: 'light' | 'dark'
locale: 'zh' | 'en'
panelVisible: boolean
panelWidth: number                 // 160~400px，持久化到 chrome.storage
activeTab: 'files' | 'search' | 'recent'
searchQuery: string
```

### FileLeaf 类型（两种模式）

```ts
interface FileLeaf {
  kind: 'file'
  name: string
  handle?: FileSystemFileHandle  // 方式 A（File System Access API）
  url?: string                   // 方式 B（file:// URL）
  pathSegments: string[]         // 相对于 root 的路径片段，用于图片解析和高亮比较
}
```

---

## 关键约束与已知坑

### 1. Zustand selector 必须单字段

```ts
// ❌ 错误：对象 selector 每次 render 返回新引用，导致无限循环
const { a, b } = useStore(s => ({ a: s.a, b: s.b }))

// ✅ 正确：每个字段单独 selector
const a = useStore(s => s.a)
const b = useStore(s => s.b)
```

### 2. Vite 构建必须加 `base: './'`

Chrome 扩展页面用 `chrome-extension://` 协议，Vite 默认生成绝对路径 `/assets/...` 会 404。
`vite.config.ts` 里必须有 `base: './'`。

### 3. CSS 变量必须在 `[data-theme]` 存在时才生效

`App.module.css` 的 CSS 变量定义在 `:global([data-theme="light"])` 选择器下。
`reader.html` 的 `<html>` 标签必须预设 `data-theme="light"`，否则首帧渲染白屏。

### 4. content.js 不能直接跳转到扩展页面

`location.href = chrome.runtime.getURL(...)` 在 content script 里会被 CSP 拦截。
必须通过 `chrome.runtime.sendMessage` 发给 background，由 background 调用 `chrome.tabs.create`。

### 5. 活跃文件高亮用路径比较，不用 handle 引用

通过链接跳转时 `getFileHandle()` 返回新对象，`===` 比较失败。
`FileItem` 用 `pathSegments.join('/')` 比较：
```ts
const isActive = activeFile?.pathSegments.join('/') === file.pathSegments.join('/')
```

### 6. 拖拽宽度持久化用 ref 而非 state

`onMouseUp` 闭包里直接读 `panelWidth` state 会捕获旧值。
在 `onMouseMove` 里同步更新 `latestWidth.current = next`，`onMouseUp` 读 ref。

### 7. imageCache 不加入 useEffect deps

`MarkdownViewer` 里 `imageCache.forEach(URL.revokeObjectURL)` 读的是 ref（`imageCacheRef.current`），
不是 state，所以 `imageCache` 不进 deps，避免 `setImageCache` 触发死循环。

### 8. CJK 字体优先，避免混排间距问题

正文字体栈必须把中文字体放在前面：
```css
font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
```
若用 `Georgia` 等纯西文衬线字体，中西文混排时字距不一致，冒号后会出现多余空白。

---

## Chrome 扩展权限说明

```json
"permissions": ["storage", "tabs"],
"host_permissions": ["file:///*"]
```

- `storage`：存主题、语言、面板宽度等 UI 偏好
- `tabs`：background.js 调用 `chrome.tabs.create` 打开 reader 页
- `file:///*`：content script 注入本地目录页 + fetch 读取本地文件内容

---

## 国际化

语言包在 `src/i18n/locales.ts`，新增文案步骤：
1. 在 `locales.ts` 的 `zh` 和 `en` 对象里各加一条
2. 在组件里用 `const t = useT()` 然后 `t('yourKey')`

初始化逻辑（`useTheme.ts`）：
- 有保存的偏好 → 用保存的
- 无偏好 → 读 `navigator.language`，`zh` 开头用中文，其余用英文

---

## 发布清单（Web Store）

- [ ] 注册开发者账号（$5 一次性）
- [ ] 撰写隐私政策页面（说明 file:// 权限仅用于读取用户选择的本地文件）
- [ ] 准备商店截图（1280×800，至少 1 张）
- [ ] 准备宣传图（1280×800 或 440×280）
- [ ] `npm run build && cd dist && zip -r ../readmd.zip .`
- [ ] 上传到 Chrome Developer Dashboard
