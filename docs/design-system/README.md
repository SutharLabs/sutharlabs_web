# Sovereign Engine Design System & UI Guidelines

Welcome to the **SutharLabs Design System** documentation.

---

## Directory Contents

| Document | Description |
|---|---|
| **[UI Styling, Icon Alignment & Modals Specification](file:///d:/Code/SutharLabs/website/docs/design-system/ui_styling_and_icons.md)** | Mandatory guidelines: Zero native browser dialogs (`<ConfirmModal />`), container icon badges, `shrink-0` rules, light/dark theme contrast matrices, and code highlight block standards. |

---

## Core Tenets
1. **Zero Native Browser Dialogs**: Never call `window.alert()`, `window.confirm()`, or `window.prompt()`. Always use `<ConfirmModal />`.
2. **Never Naked Icons in Headers**: Top-level titles and section cards must always nest icons inside styled container badges (`w-10 h-10 rounded-xl` or `w-8 h-8 rounded-lg`).
3. **Always `shrink-0` on Icons**: Prevents flexbox distortion when text wraps or viewports narrow.
4. **Theme Parity**: Every component must adapt seamlessly between dark (`#131315`, `#00dbe7`) and light (`bg-white`, `border-slate-300`, `text-slate-800`).

