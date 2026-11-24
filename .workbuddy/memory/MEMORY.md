# 项目长期记忆：DNTA TOOL 工具箱

## 项目性质
Vite + React 19 + TypeScript + Tailwind v4 + Radix/Shadcn 风格 UI 的多工具箱 Web 应用（"工具站"）。所有处理前端本地完成。

## 新增工具的固定 3 步接入点（列表/搜索/侧边栏分类均自动读 tools.json，无需改）
1. `src/tools/<id>/index.tsx`：默认导出的工具页面组件（参考 `json-to-ts` / `image-to-base64`）。
2. `src/config/tools.json`：加一条元数据（id/title/description/category/tags/icon/path/featured）。
3. `src/config/toolComponents.ts`：在 `toolComponentMap` 加一条 `'/tools/<id>': lazy(() => import('@/tools/<id>'))`。
   - ⚠️ 2026-11-24 起 App.tsx 已无 `<Routes>/<Route>`：页面改由 `src/components/layout/TabWorkspace.tsx` 驱动（多标签 keep-alive 工作区）。**不要再往 App.tsx 加 Route**。
4. 如需自定义主题样式：在 `src/styles/tailwind.css` 末尾追加（类如 `json-viewer` 用 `--jv-*` 变量绑定项目主题变量，随 `.dark` class 自动亮暗切换）。

## 多标签工作区架构（2026-11-24 起）
- `useTabsStore.ts`（zustand）管理 tabs/activeKey；`TabBar.tsx` 标签栏；`TabWorkspace.tsx` 全量挂载 + visibility 显隐实现 keep-alive。
- 隐藏面板用 `visibility:hidden` 而非 `display:none`（保住容器尺寸，CodeMirror/PDF 才不会量到 0）。
- 新增分类除 categories.json 外，需同步 `MainLayout.tsx` 的 `ICON_MAP` 和 `ToolsListPage.tsx` 的 `CATEGORY_ICON/TITLE/DESC`。

### 现有分类（categories.json）
all / images（图片工具）/ text（文本工具）/ qr（QR 工具）。新增分类需同步 `MainLayout.tsx` 的 `iconMap`。

## 关键约定
- 路径别名 `@/` → `src`（vite.config.ts + tsconfig 均已配）。
- 主题：亮/暗靠 `<html>` 的 `dark`/`light` class；语义色变量 `--background/--foreground/--border/--muted-foreground/--accent/--radius` 在 `tailwind.css` 定义。
- 图标统一用 `i-lucide-*`（来自 `@iconify-json/lucide` + `tailwindcss-icons`）。
- UI 组件见 `src/components/ui/*`；`Button` 支持 variant（default/destructive/outline/secondary/ghost/link）、size（default/sm/lg/icon）。
- 错误提示用 `sonner` 的 `toast`。
- tsconfig：`strict` + `jsx: react-jsx` + `verbatimModuleSyntax` + `noUncheckedSideEffectImports`；自定义元素需手写 TS 声明（扩充 `React.JSX.IntrinsicElements` 并 `declare module '<pkg>'`）。

## 坑
- 项目预存 tsc 错误在 `json-to-ts`（prismjs 类型缺失、convert.ts groupItems）；构建命令是 `vite build`。

## 依赖安装（真实环境约定，2026-07-10 用户确认）
- 在真实环境直接于项目目录安装依赖即可，**不要再用 /tmp 拷贝法**（那是沙箱里 pnpm/npm 受限时的临时 workaround）。
- 安装前注意 **fnm 的 node 版本**：先用 `fnm use`/确认当前 node 版本正确，再 `pnpm install` / `pnpm add <pkg>`，避免版本错配。
- 本沙箱里 pnpm 走 corepack 缺 pnpm.js、npm 在 pnpm 风格 node_modules 上报错，仅属沙箱限制；真实环境不存在此问题。
