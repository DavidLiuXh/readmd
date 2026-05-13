# TOC Panel Design Spec

## Overview

在 ViewerToolbar 加"目录"按钮，点击后在内容区右侧弹出浮层 TOC 面板，支持点击跳转和滚动自动高亮当前标题。

---

## 功能描述

- ViewerToolbar 工具栏新增"目录（≡）"按钮，点击展开/收起 TOC 浮层
- TOC 浮层显示当前文件的 h1–h3 标题层级，覆盖在内容区右侧，不改变布局宽度
- 点击 TOC 条目，内容区平滑滚动到对应标题
- 滚动内容时，TOC 自动高亮当前视口内最靠前的标题条目
- 分屏模式下，TOC 按钮跟随焦点侧（activeSide），左右各自独立
- 文件切换时 TOC 浮层自动关闭（避免旧文件目录残留）

---

## 架构

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/lib/toc.ts` | 从 HTML 字符串解析标题，注入 id，返回 TocItem[] |
| `src/components/MarkdownViewer/TocPanel/TocPanel.tsx` | 浮层 UI 组件 |
| `src/components/MarkdownViewer/TocPanel/TocPanel.module.css` | 浮层样式 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/i18n/locales.ts` | 新增 `toc` key |
| `src/components/MarkdownViewer/MarkdownViewer.tsx` | 持有 tocOpen / activeId state；将 html 注入标题 id；传 onActiveTocId 给 RenderedContent |
| `src/components/MarkdownViewer/RenderedContent.tsx` | 接收 `onActiveTocId` prop，用 IntersectionObserver 监听标题进入视口 |
| `src/components/MarkdownViewer/ViewerToolbar.tsx` | 接收 `tocOpen`、`onToggleToc` prop，加目录按钮 |

---

## 详细设计

### 1. `src/lib/toc.ts`

```ts
export interface TocItem {
  id: string      // "toc-0", "toc-1", ...
  text: string    // 标题纯文本
  level: number   // 1 | 2 | 3
}

// 从 HTML 字符串中提取 h1–h3，注入 id，返回处理后的 HTML 和 TocItem[]
export function extractToc(html: string): { html: string; items: TocItem[] }
```

实现：用 `DOMParser` 解析 HTML，遍历 `querySelectorAll('h1,h2,h3')`，为每个元素设置 `id="toc-{index}"`，返回修改后的 `innerHTML` 和 items 数组。

### 2. `TocPanel.tsx`

Props：
```ts
interface TocPanelProps {
  items: TocItem[]
  activeId: string
  onClose: () => void
}
```

- 固定定位在父容器右侧（`position: absolute; right: 0; top: 0; bottom: 0`）
- 宽度 220px
- 每个条目按 level 缩进（level 1: 0px, level 2: 12px, level 3: 24px）
- activeId 对应条目高亮（accent 颜色）
- 顶部有关闭按钮（× 或 ‹）
- 条目点击：`document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })`

### 3. `RenderedContent.tsx` 修改

新增 prop：
```ts
onActiveTocId?: (id: string) => void
```

在 `useEffect` 中，当 html 变化后（Mermaid 渲染完成后）：
- 用 `IntersectionObserver` 监听容器内所有 `[id^="toc-"]` 元素
- threshold: 0，rootMargin: `"-10% 0px -80% 0px"`（标题进入视口顶部 10%~20% 区域时触发）
- 多个同时可见时取 id 序号最小的（最靠前的标题）
- 调用 `onActiveTocId(id)` 向上通知

### 4. `MarkdownViewer.tsx` 修改

- 用 `extractToc(rawHtml)` 处理渲染后的 HTML，得到注入了 id 的 html 和 tocItems
- 本地 state：
  - `tocOpen: boolean`（默认 false）
  - `activeId: string`（默认 ''）
- `activeFile` 变化时重置 `tocOpen = false`、`activeId = ''`
- 分屏：左右各自独立的 tocOpen/activeId/tocItems state
- 将 `tocOpen`、`onToggleToc` 传给 `ViewerToolbar`
- 将 `onActiveTocId` 传给 `RenderedContent`
- 在内容区容器上加 `position: relative`，TOC 浮层相对于它定位

### 5. `ViewerToolbar.tsx` 修改

新增 props：
```ts
tocOpen: boolean
onToggleToc: () => void
canToc: boolean   // 有文件且 tocItems 非空时为 true
```

在刷新按钮之后、文件名之前加目录按钮：
```tsx
<button
  className={`${styles.navBtn} ${tocOpen ? styles.navBtnActive : ''}`}
  onClick={onToggleToc}
  disabled={!canToc}
  title={t('toc')}
>
  ≡
</button>
```

---

## 样式

`TocPanel.module.css` 关键样式：
- `position: absolute; right: 0; top: 0; bottom: 0; width: 220px; z-index: 10`
- `background: var(--color-bg-panel); border-left: 1px solid var(--color-border)`
- 条目 hover 背景：`var(--color-bg-hover)`
- 激活条目：`color: var(--color-accent); background: var(--color-bg-active)`
- 支持亮/暗主题（使用已有 CSS 变量，无需额外适配）

---

## i18n

`locales.ts` 新增：
- zh: `toc: '目录'`
- en: `toc: 'Table of Contents'`

---

## 不在本次范围内

- h4–h6 标题（TOC 只显示 h1–h3）
- TOC 宽度可拖拽调整
- TOC 展开/折叠子节点
