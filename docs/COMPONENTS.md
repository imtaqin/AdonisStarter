# Edge component reference

Every file in `resources/views/components/` becomes a tag. Path segments are
camelCased and joined with `.` — `components/ui/card.edge` → `@ui.card`.

Two call forms:

```edge
@!ui.badge({ text: 'Active' })
{{-- self-closing, no children --}}
@ui.card({ title: 'Users' })
  {{-- with children --}}
  content
@end
```

Unknown props pass through as HTML attributes on the root element, so
`class`, `id`, `data-*` and ARIA attributes work on every component.

---

## Layouts

| Tag                  | Use                                                     |
| -------------------- | ------------------------------------------------------- |
| `@layouts.dashboard` | The app shell: sidebar, header, breadcrumb, footer      |
| `@layouts.auth`      | Centred card for sign in / sign up                      |
| `@layouts.blank`     | No chrome, no request-scoped data — used by error pages |

```edge
@layouts.dashboard({ title: 'Users', subtitle: 'Administration' })
  page content
  @slot('pageActions')
    @!link({ route: 'users.create', text: 'New user', variant: 'primary' })
  @end
  @slot('scripts')
    <script src="/theme/libs/apexcharts/apexcharts.min.js"></script>
  @end
@end
```

| Prop          | Type    | Notes                                      |
| ------------- | ------- | ------------------------------------------ |
| `title`       | string  | `<title>` and the page heading             |
| `subtitle`    | string  | breadcrumb parent                          |
| `breadcrumbs` | array   | `[{ label, href? }]`, overrides `subtitle` |
| `pageHeader`  | boolean | `false` hides the title bar                |

Slots: `main`, `styles`, `scripts`, `pageActions`.

`@layouts.blank` takes no request-scoped data on purpose — error pages can
render before the middleware that provides `menu`, `auth` and `can`.

---

## Forms

Field components share context through `@field.root`, which supplies the name,
id, flashed old value and validation errors to its children.

```edge
@form({ route: 'users.store', method: 'POST' })
  @field.root({ name: 'email' })
    @!field.label({ text: 'Email', required: true })
    @!input.control({ type: 'email', required: true })
    @!field.help({ text: 'We never share this.' })
    @!field.error()
  @end
  @!button({ type: 'submit', text: 'Save' })
@end
```

| Tag                                     | Notes                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `@form`                                 | Injects the CSRF token automatically. Props: `route`, `routeParams`, `action`, `method` |
| `@field.root`                           | Props: `name`, `id`, `wrapper`, `unstyled`                                              |
| `@field.label`                          | Props: `text`, `required`                                                               |
| `@field.error`                          | Renders errors for the surrounding field                                                |
| `@field.help`                           | Muted helper text                                                                       |
| `@input.control`                        | Any text-like input. Props: `type`, `value`, `keepChecked`                              |
| `@textarea.control`                     | Props: `value`, `rows`                                                                  |
| `@select.control`                       | Props: `options: [{ value, name? }]`, `placeholder`, `selected`                         |
| `@checkbox.group` + `@checkbox.control` | Group sets the shared `name[]`                                                          |
| `@radio.group` + `@radio.control`       | Same shape as checkboxes                                                                |
| `@ui.switch`                            | Toggle. Emits a hidden `0` first so "off" actually submits                              |

All controls re-populate from flashed old input after a failed submit and add
`is-invalid` when the field has errors.

---

## Data display

### `@ui.datatable`

Server-driven: search, sortable headers and pagination through plain GET query
parameters, so it works without JavaScript. Rows come from a **scoped slot**
called once per record.

```edge
@ui.datatable({
  paginator: users,
  searchValue: filters.search,
  columns: [
    { key: 'user', label: 'User' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '', class: 'text-end', width: '160px' },
  ],
})
  @slot('toolbar')
    {{-- extra filters --}}
  @end
  @slot('actions')
    {{-- buttons, e.g. "New user" --}}
  @end
  @slot('row', scope)
    <tr>
      <td>{{ scope.row.email }}</td>
      <td>
        @!ui.badge({ text: 'Active', variant: 'success', soft: true })
      </td>
      <td class="text-end">
        @!ui.confirm({ route: 'users.destroy', routeParams: [scope.row.id] })
      </td>
    </tr>
  @end
@end
```

The controller must call `paginator.baseUrl(request.url())` and
`paginator.queryString(request.qs())` or the page links lose the filters.

**Sorting:** the component only emits the links. Allowlist the incoming `sort`
key in the controller before it reaches `orderBy` — never pass user input
straight to the query builder.

| Tag              | Purpose                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `@ui.table`      | Plain table chrome; always wrapped in `.table-responsive`                                |
| `@ui.pagination` | Standalone pager for a Lucid paginator                                                   |
| `@ui.card`       | Card with `title`, `subtitle`, `bodyClass`, `flush`; slots `header`, `actions`, `footer` |
| `@ui.stat`       | Metric tile: `label`, `value`, `icon`, `variant`, `trend`, `caption`, `href`             |
| `@ui.badge`      | `text`, `variant`, `soft`, `pill`, `icon`                                                |
| `@ui.progress`   | `value` (0–100), `label`, `variant`, `size`, `striped`                                   |
| `@ui.timeline`   | `items: [{ title, description, time, icon, variant }]`                                   |
| `@ui.empty`      | Empty state: `title`, `description`, `icon`, `actionLabel`, `actionHref`                 |
| `@avatar`        | `src` or `initials`, plus `size`, `variant`                                              |

---

## Feedback and navigation

| Tag                                                   | Purpose                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `@alert.root` + `@alert.title` + `@alert.description` | `variant`, `dismissible`, `autoDismiss`, `icon`                           |
| `@ui.modal`                                           | Bootstrap modal. Requires `id`; props `title`, `size`, `static`           |
| `@ui.confirm`                                         | Destructive action as a CSRF-protected POST form with a confirm prompt    |
| `@ui.dropdown`                                        | `label`, `icon`, `variant`, `align`; slot takes `<li>` items              |
| `@ui.tabs`                                            | `id`, `items: [{ key, label, icon?, active? }]`; scoped `panel` slot      |
| `@ui.breadcrumb`                                      | `items`, `current`                                                        |
| `@ui.spinner`                                         | `variant`, `size`, `grow`                                                 |
| `@button`                                             | `text`, `variant`, `outline`, `size`, `icon`, `block`, `loading`          |
| `@link`                                               | `text`, `href` or `route`/`routeParams`; `variant` renders it as a button |

`@ui.confirm` exists because this app is GET/POST only — a delete must never be
a link. The browser prompt is convenience; authorization is enforced by the
route's permission middleware.

---

## Icons

Font Awesome Pro 7 is loaded by every layout. Any component taking an `icon`
prop takes a full class string:

```edge
@!ui.stat({ label: 'Total users', value: 42, icon: 'fa-solid fa-users' })
@!button({ text: 'New user', icon: 'fa-solid fa-plus' })
<i class="fa-duotone fa-chart-line fa-lg"></i>
```

| Family  | Class                 | Notes                                               |
| ------- | --------------------- | --------------------------------------------------- |
| Solid   | `fa-solid fa-user`    | The default; use it unless you have a reason not to |
| Regular | `fa-regular fa-user`  | Outlined                                            |
| Light   | `fa-light fa-user`    | Thinner outline                                     |
| Duotone | `fa-duotone fa-user`  | Two-tone; set `--fa-secondary-opacity` to tune      |
| Brands  | `fa-brands fa-github` | Logos only                                          |

Sizing: `fa-xs fa-sm fa-lg fa-xl fa-2x … fa-10x`, plus `fa-fw` for fixed width
(use it in lists so labels line up).

**Never guess an icon name.** Font Awesome renders an unknown class as empty
space with no error. Use the `search_icons` MCP tool, which returns the exact
string. `thin` and `sharp-*` are not vendored — see AGENTS.md §1 rule 4b.

`config/menu.ts` and the showcase pages still use Tabler (`ti ti-*`) and the
other theme icon sets. Both work; prefer Font Awesome for new code.

---

## Globals available in every template

| Name                                                         | From                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `menu`, `abilities`, `can(permission)`, `currentPath`        | `share_view_data_middleware.ts`                                    |
| `appName`, `brandLogos`                                      | `config/dashboard.ts` via `start/view.ts`                          |
| `formatDate(value, format?)`                                 | `start/view.ts`                                                    |
| `boolVariant(bool)`                                          | `start/view.ts` — `'success'` / `'secondary'`                      |
| `toJson(value)`                                              | `start/view.ts` — escapes `<` for inline `<script>`; use `{{{ }}}` |
| `auth`, `request`, `flashMessages`, `route()`, `csrfField()` | AdonisJS                                                           |

---

## Writing a new component

Match the existing style: build a `classes` array, then let unknown props
through.

```edge
{{--
  Props
  variant  string  colour
--}}
@let(classes = ['thing', `thing-${$props.get('variant', 'primary')}`])

<div {{ $props.except(['variant']).merge({ class: classes }).toAttrs() }}>
  {{{ await $slots.main() }}}
</div>
```

Avoid underscores in component filenames — see AGENTS.md §1 for why.
