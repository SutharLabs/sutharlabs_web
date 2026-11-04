# SutharLabs UI & Design System Guidelines

This document outlines the core frontend design specifications, icon alignment standards, and button theming rules across the SutharLabs sovereign application.

---

## 1. Icon Anatomy & Optical Alignment

1. **Dedicated Container Badges**:
   * Header icons must never float uncontained beside text inside `<h1>`, `<h2>`, or `<h3>`.
   * **Page Header**: `w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm`.
   * **Card / Section Header**: `w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0`.
   * **Table / Data Badges**: `w-5 h-5` or `w-6 h-6 rounded-md` with `shrink-0`.

2. **Flexbox Immunity (`shrink-0`)**:
   * Always apply `shrink-0` to every icon component (`<Icon className="w-4 h-4 shrink-0" />`). This prevents flex parents from compressing the icon width when screen sizes resize.

3. **Baseline Alignment**:
   * Text-icon pairs must use `flex items-center gap-1.5` or `gap-2`.
   * Button labels and icons must use `flex items-center justify-center gap-1.5 leading-none` so the icon's center line matches font cap-height.

---

## 2. Button Hierarchy & Theme Adaptation

Every button in the workspace must support both **Light Theme** and **Dark Theme** using `isLight` conditionals or theme tokens:

```tsx
const isLight = theme === 'light';
```

### Sizing Standards
* **Toolbar / Header Action**: `h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider`
* **Sub-action / Copy Button**: `h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider`
* **Modal / Hero Action**: `h-10 px-4 rounded-xl text-sm font-semibold`

### Theme Class Reference

| Element | Light Theme (`isLight`) | Dark Theme (`!isLight`) |
| :--- | :--- | :--- |
| **Secondary Button** | `bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-400 shadow-sm` | `bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7] hover:border-[#00dbe7]/50 shadow-sm` |
| **Primary Button** | `bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sm hover:shadow font-bold` | `bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 hover:border-[#00dbe7] shadow-[#00dbe7]/10 font-bold` |
| **Destructive Button** | `bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 shadow-sm font-bold` | `bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 hover:border-rose-500/50 shadow-sm font-bold` |

### Preventing Toolbar Wrap
Header toolbars must wrap button groups with:
```tsx
<div className="flex items-center gap-2 shrink-0 flex-nowrap">
  {/* Buttons */}
</div>
```
This guarantees that secondary and primary buttons do not break across lines or leave dangling elements.

---

## 3. Brand Colors & Semantics

* **Primary Cyan (`#00dbe7` / `#74f5ff`)**: Real-time telemetry, active databases, WebSockets, primary UI highlights.
* **Secondary Purple (`#ce5dff` / `#c084fc`)**: Replication engines, database administrative tasks, modal banners.
* **Success Emerald (`#00e476` / `#34d399`)**: High-performance nodes, 100% matched parity, online health.
* **Warning Amber (`#f59e0b` / `#fbbf24`)**: Diffs detected, pending sync operations, telemetry alerts.
* **Danger Rose (`#ffb4ab` / `#dc2626`)**: Offline services, failed replication jobs, destructive operations.

---

## 4. Modal, Dialog & Popup Standards (Zero Native Browser Dialogs)

### Zero Browser-Native Dialogs Policy
* **Prohibition**: Never invoke `window.alert()`, `window.confirm()`, or `window.prompt()`.
* **Standard**: Always use `<ConfirmModal />` from `src/components/ConfirmModal.tsx` or module-specific custom modal components.

### Specifications
1. **Backdrop**:
   * Fixed overlay with dark frosted backdrop: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150`.
   * Dismissable via ESC key or backdrop click (unless `isLoading` is active).
2. **Card Container**:
   * Sizing: `relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150`.
   * Light Theme: `bg-white border-slate-200 text-slate-800`
   * Dark Theme: `bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]`
3. **Accent Bar**:
   * Top bar: `h-1 w-full`
   * Single-color solid accents (Zero multicolored rainbow bars):
     * Database / Replication / Primary: `bg-[#00dbe7]`
     * Danger / Irreversible: `bg-rose-500`
     * Success / Ready: `bg-emerald-500`
     * Warning: `bg-amber-400`
4. **Icon Container**:
   * Sizing: `w-11 h-11 rounded-xl border flex items-center justify-center shrink-0`
   * Themed badge with corresponding status color.
5. **Action Buttons**:
   * Cancel button: Standard secondary button token (`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider`).
   * Confirm button: Variant-matched primary action token (`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider`).
   * Placed in `flex items-center justify-end gap-2.5 shrink-0 flex-nowrap`.

---

## 5. Code Highlight Blocks, Commands & Inline Code Guidelines

### High-Contrast Theme Adaptation
Never hardcode translucent dark backgrounds (`bg-black/40`, `bg-black/50`, `bg-[#201f21]`) on command or code highlight blocks without an explicit `isLight` alternative. On light mode, translucent black creates a muddy, unreadable gray rectangle that ruins visual harmony.

### Specifications
1. **Command / Code Highlight Box**:
   * **Light Theme (`isLight === true`)**: `bg-slate-100 border-slate-300 text-slate-800` (HTTP verbs in `text-sky-600 font-bold`, shell commands in `text-emerald-800 font-semibold`).
   * **Dark Theme (`isLight === false`)**: `bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]` (HTTP verbs in `text-[#00dbe7] font-bold`, shell commands in `text-emerald-300`).
   * **Structure**: `p-2.5 sm:p-3 rounded-lg sm:rounded-xl border font-mono text-[10px] sm:text-xs select-all shadow-xs transition-colors`.

2. **Inline Code (`<code>` elements)**:
   * **Light Theme**: `px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border bg-slate-100 text-slate-800 border-slate-300 font-medium`.
   * **Dark Theme**: `px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border bg-white/5 text-on-surface border-white/10`.
   * For primary accented keywords (e.g. `DATABASE_URL`, `vercel.json`):
     * Light: `text-sky-700 border-slate-300 font-bold`
     * Dark: `text-[#00dbe7] border-white/10 font-bold`



