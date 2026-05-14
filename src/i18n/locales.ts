export const locales = {
  zh: {
    // ActivityBar
    tabFiles: '文件树',
    tabSearch: '搜索',
    tabRecent: '最近目录',
    settings: '设置',
    expandPanel: '展开面板',

    // PanelHeader
    panelFiles: '文件',
    panelSearch: '搜索',
    panelRecent: '最近目录',
    collapsePanel: '收起面板',

    // DirectoryPicker
    openDirectory: '📂 打开目录',

    // SearchBox
    searchPlaceholder: '按文件名过滤...',

    // FileTree
    emptyNoMd: '当前目录下没有 .md 文件',
    emptyNoDir: '打开一个目录以浏览 Markdown 文件',
    emptyNoMatch: '没有匹配的文件',

    // RecentDirList
    noRecentDirs: '暂无最近目录',
    removeFromList: '从列表移除',

    // ViewerToolbar
    navigateBack: '后退 (Alt+←)',
    navigateForward: '前进 (Alt+→)',
    refreshDir: '刷新目录',
    refreshFile: '刷新文件',
    toc: '目录',
    sourceView: '查看源码',
    splitOpen: '分屏对比',
    splitClose: '关闭分屏',
    themeDark: '切换暗色主题',
    themeLight: '切换亮色主题',

    // MarkdownViewer
    splitClickHint: '点击此处，再选择文件',
    splitLabelLeft: '左',
    splitLabelRight: '右',
    fileReadError: '文件读取失败',
  },

  en: {
    // ActivityBar
    tabFiles: 'Explorer',
    tabSearch: 'Search',
    tabRecent: 'Recent',
    settings: 'Settings',
    expandPanel: 'Expand Panel',

    // PanelHeader
    panelFiles: 'Files',
    panelSearch: 'Search',
    panelRecent: 'Recent',
    collapsePanel: 'Collapse Panel',

    // DirectoryPicker
    openDirectory: '📂 Open Folder',

    // SearchBox
    searchPlaceholder: 'Filter by filename...',

    // FileTree
    emptyNoMd: 'No .md files in this folder',
    emptyNoDir: 'Open a folder to browse Markdown files',
    emptyNoMatch: 'No matching files',

    // RecentDirList
    noRecentDirs: 'No recent folders',
    removeFromList: 'Remove from list',

    // ViewerToolbar
    navigateBack: 'Back (Alt+←)',
    navigateForward: 'Forward (Alt+→)',
    refreshDir: 'Refresh Directory',
    refreshFile: 'Refresh File',
    toc: 'Table of Contents',
    sourceView: 'View Source',
    splitOpen: 'Split View',
    splitClose: 'Close Split',
    themeDark: 'Switch to Dark',
    themeLight: 'Switch to Light',

    // MarkdownViewer
    splitClickHint: 'Click here, then select a file',
    splitLabelLeft: 'Left',
    splitLabelRight: 'Right',
    fileReadError: 'Failed to read file',
  },
} as const

export type Locale = keyof typeof locales
export type Messages = typeof locales.zh
export type MessageKey = keyof Messages
