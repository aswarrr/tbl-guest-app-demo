# TBL Prototype Branding Reference

This file summarizes the typography and button colors currently used in `tbl-prototype`.

Source of truth used for this document:

- `src/styles.css`
- `src/features/floorplan/legacy/style.css`

## Font Family on All Text Used

### 1. Default app text

Used for most body copy and any text that does not explicitly override font family.

| Text type | Selector examples | Font stack |
| --- | --- | --- |
| Global/default text | `:root`, inherited body copy, general UI text | `"Trebuchet MS", "Gill Sans MT", sans-serif` |
| Shell route kicker/title label | `.page-title` | `"Trebuchet MS", "Gill Sans MT", sans-serif` |
| Topbar eyebrow | `.topbar-eyebrow` | Inherits default app text |
| Footer description/meta | `.app-footer-description`, `.app-footer-meta` | Inherits default app text |

### 2. Editorial / brand serif text

Used where the UI leans into the brand's more elegant, hospitality-led tone.

| Text type | Selector examples | Font stack |
| --- | --- | --- |
| Topbar greeting title | `.topbar-title` | `Georgia, "Times New Roman", serif` |
| Topbar first name | `.topbar-title-name` | Same serif stack as `.topbar-title`, plus `font-style: italic` |
| Main section/page headings | `.admin-page-title` | `Georgia, "Times New Roman", serif` |
| Footer hero heading | `.app-footer-heading` | `Georgia, "Times New Roman", serif` |

### 3. Admin / operations UI text

Used heavily in the older admin/table/branch-management surfaces.

| Text type | Selector examples | Font stack |
| --- | --- | --- |
| Entity/table UI | `.pill-search`, `.admin-table`, `.table-action-btn`, `.admin-table-page-btn` | `"Gill Sans", "Gill Sans MT", Calibri, sans-serif` |
| Drawer and form utility text | `.right-drawer-header h2`, `.drawer-avatar`, `.drawer-upload-link` | `"Gill Sans", "Gill Sans MT", Calibri, sans-serif` |
| Branch management workspace | `.branch-manage-toolbar`, `.branch-manage-pill-btn`, `.branch-manage-tab-btn`, `.branch-manage-section-copy` | `"Gill Sans", "Gill Sans MT", Calibri, sans-serif` |
| Table links / helper controls | `.table-action-btn-link` and similar legacy action text | `"Gill Sans", "Gill Sans MT", Calibri, sans-serif` |

### 4. Legacy floorplan editor text

This is separate from the main app shell and still uses its own font system.

| Text type | Selector examples | Font stack |
| --- | --- | --- |
| Floorplan legacy app | `src/features/floorplan/legacy/style.css` `html, body` | `'Inter', system-ui, sans-serif` |

### Quick summary

- Main prototype body/system text: `"Trebuchet MS", "Gill Sans MT", sans-serif`
- Brand-led titles/headlines: `Georgia, "Times New Roman", serif`
- Older admin/workspace UI blocks: `"Gill Sans", "Gill Sans MT", Calibri, sans-serif`
- Legacy floorplan editor: `'Inter', system-ui, sans-serif`

## Colors Used on Buttons

### Core color tokens behind the current branded buttons

| Token | Value |
| --- | --- |
| `--tbl-navy` | `#112349` |
| `--tbl-navy-deep` | `#09142d` |
| `--tbl-royal` | `#1d376f` |
| `--tbl-paper` | `#f7f2e8` |
| `--tbl-paper-strong` | `#fffaf1` |
| `--red` | `#e53935` |
| `--positive` | `#60bd68` |
| `--warning` | `#f89406` |
| `--info` | `#2f96b4` |

### Primary and branded buttons

| Button type | Selector | Default colors | Hover colors |
| --- | --- | --- | --- |
| Primary app button | `.button` | Background: gradient `#112349 -> #1d376f`, Text: `#ffffff` | Gradient reversed `#1d376f -> #112349`, Text: `#ffffff` |
| Secondary app button | `.button-secondary` | Background: `rgba(255, 250, 241, 0.92)`, Text: `#112349` | Background: `#ffffff`, Text: `#112349` |
| Branded CTA button | `.primary-dark-btn` | Background: gradient `#112349 -> #1d376f`, Text: `#ffffff` | Gradient reversed `#1d376f -> #112349`, Text: `#ffffff` |
| Topbar logout button | `.topbar-logout-btn` | Background: gradient `#fffaf1 -> #f7f2e8`, Text: `#112349` | Background: `#ffffff`, Text: `#112349` |
| Topbar icon button | `.topbar-icon-button` | Background: `rgba(255,255,255,0.78)`, Icon/text: `#112349` | Background: `#ffffff`, Icon/text: `#112349` |
| Footer pill links | `.app-footer-link` | Background: `rgba(255,255,255,0.08)`, Text: `#ffffff`, Border: `rgba(255,255,255,0.12)` | Background: `rgba(255,255,255,0.14)`, Text: `#ffffff` |

### Table and utility buttons

| Button type | Selector | Default colors | Hover colors |
| --- | --- | --- | --- |
| Table action pill | `.table-action-btn` | Background: `rgba(255,255,255,0.76)`, Text: `#112349`, Border: `rgba(17,35,73,0.12)` | Background: `#112349`, Text: `#ffffff` |
| Table pagination button | `.admin-table-page-btn` | Background: `rgba(231,237,248,0.9)`, Text: `#112349` | No custom hover color defined |
| Photo add text button | `.photo-add-link` | Background: transparent, Text: `#f97316` | Same text color, underline on hover |
| Photo remove round button | `.photo-remove-button` | Background: `rgba(255,255,255,0.95)`, Text: `#6b7280` | Text: `#111827` |
| Drawer upload text action | `.drawer-upload-link` | Background: transparent, Text: `#111827` | Same color, underline on hover |

### Legacy / older branch-management buttons

These are still present and currently use a black/white system rather than the newer TBL navy gradient system.

| Button type | Selector | Default colors | Hover / active colors |
| --- | --- | --- | --- |
| Branch management pill | `.branch-manage-pill-btn` | Background: `#000000`, Text: `#ffffff`, Border: `#000000` | Background: `#ffffff`, Text: `#000000` |
| Branch management outline pill | `.branch-manage-pill-btn-outline` | Background: `#ffffff`, Text: `#000000` | Background: `#000000`, Text: `#ffffff` |
| Branch management tab | `.branch-manage-tab-btn` | Background: `#ffffff`, Text: `#000000`, Border: `#000000` | Hover: Background `#000000`, Text `#ffffff` |
| Branch management active tab | `.branch-manage-tab-btn-active` | Background: `#000000`, Text: `#ffffff` | Active state stays black/white |

### Toast buttons and notification colors

| Button/type | Selector | Color |
| --- | --- | --- |
| Toast close button | `.toast-close-button` | Text: `#ffffff`, hover/focus: `#000000` |
| Success toast | `.toast-success` | Background: `#60bd68` |
| Error toast | `.toast-error` | Background: `#e53935` |
| Warning toast | `.toast-warning` | Background: `#f89406` |
| Info toast | `.toast-info` | Background: `#2f96b4` |

## Notes

- The prototype currently has two visual systems at once:
  - newer branded shell/buttons using TBL navy and paper tones
  - older branch-management/table controls that still use black/white
- If you want, the next cleanup pass can standardize the older black/white buttons onto the new TBL brand palette too.
