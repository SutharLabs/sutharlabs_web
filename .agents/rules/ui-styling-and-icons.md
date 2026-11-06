---
trigger: always_on
description: Mandatory UI styling, icon alignment, color semantics, button consistency, and modal/dialog guidelines for SutharLabs.
---

# SutharLabs UI Styling, Icon Alignment & Design System Guidelines

All AI agents and developers modifying frontend views in this repository MUST strictly follow these rules to maintain visual harmony and consistency across light and dark themes.

---

## 1. Icon Rules & Alignment Standards

### A. Never Place Naked Icons in Headers
* **Rule**: Top-level view titles and section card headers must NEVER place a floating or bare icon inside `<h1>`, `<h2>`, or `<h3>`.
* **Standard**: Always place the icon inside a dedicated, styled container badge alongside the title and subtitle.
  ```tsx
  {/* Correct: Standard View Header with Icon Badge */}
  <div className="flex items-center gap-3.5">
    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 shadow-sm">
      <Database className="w-5 h-5 text-[#00dbe7]" />
    </div>
    <div>
      <h2 className="text-xl font-bold tracking-tight text-on-surface font-sans">
        Database Orchestration
      </h2>
      <p className="text-xs text-on-surface-variant font-mono mt-0.5">
        Subheading description text
      </p>
    </div>
  </div>
  ```

### B. Standard Container Sizing Hierarchy
* **Main Page Header**: `w-10 h-10 rounded-xl` with `w-5 h-5` icon.
* **Section / Card Header**: `w-8 h-8 rounded-lg` with `w-4 h-4` icon.
* **Inline / Table Badges**: `w-5 h-5` or `w-6 h-6 rounded-md` with `w-3 h-3` or `w-3.5 h-3.5` icon.

### C. Prevent Flexbox Icon Distortion (`shrink-0`)
* **Rule**: Always apply `shrink-0` to every icon component (`<Icon className="w-4 h-4 shrink-0" />`).
* Without `shrink-0`, flex parents will crush or squish icons when text wraps or screen widths narrow.

### D. Baseline & Vertical Centering
* Always use `flex items-center gap-1.5` or `gap-2` for text-icon pairings.
* In buttons, use `flex items-center justify-center gap-1.5 leading-none` so the icon optical center matches the font cap-height.

---

## 2. Button Standards & Theme Consistency

Buttons must adapt seamlessly between **Dark Theme** and **Light Theme**. Never hardcode dark colors (e.g. `bg-[#201f21]`) without providing a corresponding `isLight` alternative.

### A. Standard Button Sizing Tokens
* **Standard Toolbar Button**: `h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider`
* **Compact / Sub-button**: `h-7 px-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider`
* **Hero / Modal Action**: `h-10 px-4 rounded-xl text-sm font-semibold`

### B. Button Theme Matrix
Every button group must check `const isLight = theme === 'light'` and style accordingly:

| Button Type | Light Theme (`isLight === true`) | Dark Theme (`isLight === false`) |
| :--- | :--- | :--- |
| **Secondary / Standard** | `bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-sky-600 hover:border-sky-400 shadow-sm` | `bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7] hover:border-[#00dbe7]/50 shadow-sm` |
| **Primary / Action** | `bg-sky-500 hover:bg-sky-600 text-white border-sky-600 shadow-sm hover:shadow font-bold` | `bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] hover:text-white border-[#00dbe7]/50 hover:border-[#00dbe7] shadow-[#00dbe7]/10 font-bold` |
| **Destructive / Danger** | `bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 shadow-sm font-bold` | `bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 hover:border-rose-500/50 shadow-sm font-bold` |
| **Success / Confirm** | `bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm font-bold` | `bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 shadow-sm font-bold` |

### C. Prevent Awkward Button Wrapping
* **Rule**: When placing action buttons in a view header, NEVER use `flex-wrap` that causes primary actions to break across lines.
* **Standard**:
  ```tsx
  {/* Correct: Header Action Button Group */}
  <div className="flex items-center gap-2 shrink-0 flex-nowrap">
    <button className="h-8 px-3 rounded-lg ...">Probe Health</button>
    <button className="h-8 px-3 rounded-lg ...">Export Snapshot</button>
    <button className="h-8 px-3.5 rounded-lg ...">Trigger Sync Now</button>
  </div>
  ```

---

## 3. Color Semantics & Palette

Follow the Sovereign Engine color tokens defined in `src/index.css`:

* **Cyan (`#00dbe7` / `#74f5ff`)**: Primary telemetry, active database routing, live socket feeds, primary active button outline.
* **Purple / Fuchsia (`#ce5dff` / `#c084fc`)**: Database replication, admin workflows, failover runbooks.
* **Emerald (`#00e476` / `#34d399`)**: Healthy status, parity matched, 100% in-sync, production running.
* **Amber (`#f59e0b` / `#fbbf24`)**: Diff detected, sync pending, telemetry warning.
* **Rose / Red (`#ffb4ab` / `#dc2626`)**: Offline host, replication failure, irreversible destructive action.

---

## 4. Modal, Dialog & Popup Standards (Zero Native Browser Dialogs)

### A. Zero Native Browser Dialogs (`window.alert`, `window.confirm`, `window.prompt`)
* **Strict Prohibition**: NEVER use `window.alert()`, `window.confirm()`, or `window.prompt()`. Browser-native dialogs disrupt the application theme, break mobile/tablet UX, and look unstyled.
* **Standard**: Always use the reusable `<ConfirmModal />` component from `src/components/ConfirmModal.tsx` or module-specific custom modal dialogs matching SutharLabs design tokens.

### B. Canonical Modal Anatomy & Architecture
1. **Backdrop**:
   * Fixed overlay with dark frosted backdrop: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150`.
   * Clicking outside or pressing `Escape` safely dismisses the modal (disabled when `isLoading`).
2. **Dialog Card**:
   * Sizing: `relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150`.
   * Light mode (`isLight === true`): `bg-white border-slate-200 text-slate-800`
   * Dark mode (`isLight === false`): `bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]`
3. **Top Accent Bar**:
   * Height: `h-1 w-full`
   * Variants (Strictly clean single-tone sovereign lines — NEVER use multicoloured/rainbow gradients):
     * **Primary / Telemetry / Database Replication**: `bg-[#00dbe7]`
     * **Danger / Destructive / Permanent Delete**: `bg-rose-500`
     * **Success / Parity Matched**: `bg-emerald-500`
     * **Warning / Attention**: `bg-amber-400`
     * **Info**: `bg-sky-500`
4. **Header Icon Badge**:
   * Sizing: `w-11 h-11 rounded-xl border flex items-center justify-center shrink-0`
   * Never naked; always inside its themed container badge.
5. **Action Buttons**:
   * Cancel button: Standard secondary styling (`h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider`).
   * Confirm button: Variant-matched primary action styling (`h-8 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider`).
   * Grouping: `flex items-center justify-end gap-2.5 shrink-0 flex-nowrap`.

### C. Standard Modal Usage Template
```tsx
import ConfirmModal, { ModalVariant } from './ConfirmModal';

// 1. Declare state
const [modalConfig, setModalConfig] = useState<{
  isOpen: boolean;
  title: string;
  message: string;
  subtext?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
  isAlert?: boolean;
  onConfirm: () => void;
} | null>(null);

// 2. Trigger confirmation dialog
const promptAction = () => {
  setModalConfig({
    isOpen: true,
    title: 'Database Replication Confirmation',
    message: 'Initiate live synchronization from Primary (Oracle Cloud VM) to Backup (Neon PostgreSQL)?',
    subtext: 'Standby database records will be synchronized. Primary traffic remains active.',
    confirmLabel: 'Confirm & Replicate',
    cancelLabel: 'Cancel',
    variant: 'warning',
    onConfirm: () => {
      setModalConfig(null);
      executeAction();
    }
  });
};

// 3. Render at root of component
{modalConfig && (
  <ConfirmModal
    isOpen={modalConfig.isOpen}
    onClose={() => setModalConfig(null)}
    onConfirm={modalConfig.onConfirm}
    title={modalConfig.title}
    message={modalConfig.message}
    subtext={modalConfig.subtext}
    confirmLabel={modalConfig.confirmLabel}
    cancelLabel={modalConfig.cancelLabel}
    variant={modalConfig.variant}
    isAlert={modalConfig.isAlert}
    theme={theme}
  />
)}
```

---

## 5. Code Highlight Blocks, Commands & Inline Code Guidelines

All command snippets, terminal copy boxes, and inline `<code>` badges must adapt seamlessly between **Light Theme** and **Dark Theme**. Never hardcode translucent dark backgrounds (like `bg-black/40` or `bg-[#201f21]`) without providing an explicit `isLight` alternative, as they render as washed-out, unreadable dark gray boxes in light mode.

### A. Terminal & Command Snippet Block Standard
Use this standard for copyable commands, API endpoints, webhook URLs, and configuration code:
```tsx
<div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border font-mono text-[10px] sm:text-xs select-all shadow-xs transition-colors ${
  isLight
    ? 'bg-slate-100 border-slate-300 text-slate-800'
    : 'bg-[#121215] border-[#3a494b]/40 text-[#e5e1e4]'
}`}>
  <span className={isLight ? 'text-sky-600 font-bold' : 'text-[#00dbe7] font-bold'}>POST </span>
  <span>https://www.sutharlabs.com/api/cron/database-sync?key=vault-secret</span>
</div>
```

### B. Shell & Crontab Command Box Standard
```tsx
<div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border font-mono text-[10px] sm:text-xs select-all shadow-xs transition-colors ${
  isLight
    ? 'bg-slate-100 border-slate-300 text-emerald-800 font-semibold'
    : 'bg-[#121215] border-[#3a494b]/40 text-emerald-300'
}`}>
  30 20 * * * cd /home/ubuntu/website && npm run db:cron-sync >> /var/log/db-sync.log 2>&1
</div>
```

### C. Inline Code Badge Standard (`<code>` inside text)
Always wrap inline filenames, env vars, or code keywords in a styled badge:
```tsx
<code className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono border ${
  isLight
    ? 'bg-slate-100 text-slate-800 border-slate-300 font-medium'
    : 'bg-white/5 text-on-surface border-white/10'
}`}>
  DATABASE_URL
</code>
```
* For primary accent code words (e.g. key config files):
  * Light: `bg-slate-100 text-sky-700 border-slate-300 font-bold`
  * Dark: `bg-white/5 text-[#00dbe7] border-white/10 font-bold`

---

## 6. Copy-Paste Code Templates

### A. Sub-Tab Switcher
```tsx
<div className={`flex rounded-lg p-0.5 border text-[11px] ${
  isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
}`}>
  <button
    type="button"
    onClick={() => setTab('tab1')}
    className={`px-3 py-1 rounded-md font-mono cursor-pointer transition-all ${
      tab === 'tab1'
        ? isLight
          ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-300'
          : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold border border-[#00dbe7]/30'
        : 'text-on-surface-variant hover:text-on-surface'
    }`}
  >
    Tab 1
  </button>
</div>
```

### B. Quick Copy Webhook / Command Button
```tsx
<button
  type="button"
  onClick={() => copyToClipboard('text', 'key')}
  className={`h-7 px-2.5 rounded text-[10px] font-mono border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none ${
    isLight
      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
      : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border-[#3a494b]/40 hover:text-[#00dbe7]'
  }`}
>
  {copiedKey === 'key' ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
  <span>{copiedKey === 'key' ? 'Copied!' : 'Copy Command'}</span>
</button>
```

---

## 7. Anti-Patterns Checklist

* ❌ **Do NOT** use `window.alert()`, `window.confirm()`, or `window.prompt()`. Use `<ConfirmModal />` instead.
* ❌ **Do NOT** hardcode translucent dark backgrounds (`bg-black/40`, `bg-black/50`, `bg-[#201f21]`) on command or code highlight blocks without an `isLight` alternative.
* ❌ **Do NOT** use uncontained, unstyled inline `<code>` tags that disappear against light-mode card backgrounds.
* ❌ **Do NOT** place raw Lucide icons directly inside `<h1..3>` text strings.
* ❌ **Do NOT** omit `shrink-0` on icon elements.
* ❌ **Do NOT** use dark-only colors (`bg-[#201f21]`, `text-[#e5e1e4]`) without checking `isLight` or using CSS variable utilities (`bg-surface-container`, `text-on-surface`).
* ❌ **Do NOT** use saturated background gradients on buttons in light mode that lack contrast with body typography.
* ❌ **Do NOT** let toolbar buttons wrap onto multiple rows unless on small mobile viewports (`< sm`).
* ❌ **Do NOT** omit `theme?: 'light' | 'dark'` when declaring or rendering child views, modals, or plugin views.
* ❌ **Do NOT** default `theme` to `'dark'` or check `const isLight = theme === 'light'` without a fallback to DOM class detection (`document.documentElement.classList.contains('dark') ? 'dark' : 'light'`).
* ❌ **Do NOT** mix raw Tailwind `dark:...` utility classes inside components that also use `isLight ? ... : ...` ternary logic, as class mismatches lead to unreadable dark-on-dark or light-on-light contrast distortion.

---

## 8. Theme Consistency & Modal / Sub-view Theme Propagation Standards

To eliminate mixed-up UI where light and dark elements collide:

### A. Mandatory Props Declaration & Fallback Resolution
Every modal, drawer, or sub-view component must accept `theme?: 'light' | 'dark'` in its interface and resolve it safely:
```tsx
interface SubViewOrModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export default function SubViewOrModal({ theme, ...props }: SubViewOrModalProps) {
  // Always resolve fallback so undefined never wrongly defaults to dark mode in light theme
  const effectiveTheme: 'light' | 'dark' = theme || (
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const isLight = effectiveTheme === 'light';
  // ...
}
```

### B. Pure Conditional Theme Styling (Single Source of Truth)
Do not mix Tailwind `dark:...` with `isLight` ternaries in the same component. Use explicit `isLight` ternaries for backgrounds, text, and borders:

| UI Element | Light Theme (`isLight === true`) | Dark Theme (`isLight === false`) |
| :--- | :--- | :--- |
| **Card / Modal Container** | `bg-white border-slate-200 text-slate-800` | `bg-[#131315] border-[#3a494b]/50 text-[#e5e1e4]` |
| **Section Card Header** | `bg-slate-50 border-slate-200 text-slate-800` | `bg-[#18181c]/60 border-[#3a494b]/40 text-[#e5e1e4]` |
| **Subheadings & Labels** | `text-slate-600 font-mono` | `text-gray-400 font-mono` |
| **Inputs & Selects** | `bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500` | `bg-[#121215] border-[#3a494b]/50 text-[#e5e1e4] placeholder-gray-500 focus:border-[#00dbe7]` |
| **Tables Header** | `bg-slate-100 border-slate-300 text-slate-700 font-bold` | `bg-[#121215] border-[#3a494b]/40 text-gray-400 font-bold` |
| **Table Rows Divider** | `divide-slate-200 hover:bg-slate-50` | `divide-[#3a494b]/20 hover:bg-white/5` |
| **Accent Text / Totals** | `text-sky-600 font-bold` | `text-[#00dbe7] font-bold` |
| **Status / Success Badge**| `bg-emerald-50 text-emerald-800 border-emerald-300` | `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` |


