/*
|--------------------------------------------------------------------------
| Sidebar navigation
|--------------------------------------------------------------------------
|
| The single source of truth for the sidebar. Adding a page to the nav means
| adding one node here -- never editing markup. MenuService resolves `route`
| into a URL, filters nodes by `permission`, and marks the active trail.
|
| Node shapes:
|   { type: 'category', label }            a non-clickable section divider
|   { label, icon, url | route, params }   a link
|   { label, icon, children: [...] }       a collapsible group
|
| `icon` is a Font Awesome class such as 'fa-solid fa-users'. Browse them at
| /icons, or ask the `search_icons` MCP tool. Icons are only rendered for
| top-level nodes, matching the template's design.
|
| Nodes carrying `permission` are hidden from users lacking that permission.
| Groups whose children are all hidden collapse away automatically.
|
*/

export type MenuCategory = {
  type: 'category'
  label: string
}

export type MenuLink = {
  label: string
  icon?: string
  /** Literal path, e.g. '/showcase/alerts'. Mutually exclusive with `route`. */
  url?: string
  /** Named route, e.g. 'users.index'. Preferred for real application pages. */
  route?: string
  params?: Record<string, string | number>
  /** Permission slug required to see this node, e.g. 'users.view'. */
  permission?: string
  badge?: { label: string; variant?: string }
  children?: MenuNode[]
}

export type MenuNode = MenuCategory | MenuLink

const menu: MenuNode[] = [
  { type: 'category', label: 'Main' },
  { label: 'Dashboard', icon: 'fa-solid fa-gauge-high', route: 'dashboard' },
  { label: 'Icons', icon: 'fa-solid fa-icons', route: 'icons.index' },

  { type: 'category', label: 'Administration' },
  {
    label: 'Users',
    icon: 'fa-solid fa-users',
    route: 'users.index',
    permission: 'users.view',
  },
  {
    label: 'Roles & Permissions',
    icon: 'fa-solid fa-shield-keyhole',
    route: 'roles.index',
    permission: 'roles.view',
  },
  {
    label: 'Audit Log',
    icon: 'fa-solid fa-clock-rotate-left',
    route: 'audit_logs.index',
    permission: 'audit.view',
  },

  { type: 'category', label: 'Template Reference' },
  {
    label: 'Dashboards',
    icon: 'fa-solid fa-desktop',
    children: [
      { label: 'Dashboard2', url: '/showcase/dashboard-2' },
      { label: 'Dashboard3', url: '/showcase/dashboard-3' },
      { label: 'Dashboard4', url: '/showcase/dashboard-4' },
      { label: 'Dashboard5', url: '/showcase/dashboard-5' },
    ],
  },
  { type: 'category', label: 'General' },
  {
    label: 'Ui Elements',
    icon: 'fa-solid fa-shapes',
    children: [
      { label: 'Alerts', url: '/showcase/alerts' },
      { label: 'Badge', url: '/showcase/badge' },
      { label: 'Breadcrumb', url: '/showcase/breadcrumb' },
      { label: 'Buttons', url: '/showcase/buttons' },
      { label: 'Button Group', url: '/showcase/buttongroup' },
      { label: 'Cards', url: '/showcase/cards' },
      { label: 'Dropdowns', url: '/showcase/dropdowns' },
      { label: 'Images & Figures', url: '/showcase/images-figures' },
      { label: 'List Group', url: '/showcase/listgroup' },
      { label: 'Navs & Tabs', url: '/showcase/navs-tabs' },
      { label: 'Object Fit', url: '/showcase/object-fit' },
      { label: 'Pagination', url: '/showcase/pagination' },
      { label: 'Popovers', url: '/showcase/popovers' },
      { label: 'Progress', url: '/showcase/progress' },
      { label: 'Spinners', url: '/showcase/spinners' },
      { label: 'Toasts', url: '/showcase/toasts' },
      { label: 'Tooltips', url: '/showcase/tooltips' },
      { label: 'Typography', url: '/showcase/typography' },
    ],
  },
  {
    label: 'Advanced Ui',
    icon: 'fa-solid fa-layer-group',
    children: [
      { label: 'Accordions & Collapse', url: '/showcase/accordions-collpase' },
      { label: 'Carousel', url: '/showcase/carousel' },
      { label: 'Draggable Cards', url: '/showcase/draggable-cards' },
      { label: 'Modals & Closes', url: '/showcase/modals-closes' },
      { label: 'Navbar', url: '/showcase/navbar' },
      { label: 'Offcanvas', url: '/showcase/offcanvas' },
      { label: 'Placeholders', url: '/showcase/placeholders' },
      { label: 'Ratings', url: '/showcase/ratings' },
      { label: 'Scrollspy', url: '/showcase/scrollspy' },
      { label: 'Swiper JS', url: '/showcase/swiperjs' },
    ],
  },
  {
    label: 'Utilities',
    icon: 'fa-solid fa-screwdriver-wrench',
    children: [
      { label: 'Avatars', url: '/showcase/avatars' },
      { label: 'Borders', url: '/showcase/borders' },
      { label: 'Breakpoints', url: '/showcase/breakpoints' },
      { label: 'Colors', url: '/showcase/colors' },
      { label: 'Columns', url: '/showcase/columns' },
      { label: 'Flex', url: '/showcase/flex' },
      { label: 'Gutters', url: '/showcase/gutters' },
      { label: 'Helpers', url: '/showcase/helpers' },
      { label: 'Position', url: '/showcase/position' },
      { label: 'Additional Content', url: '/showcase/more' },
    ],
  },
  { type: 'category', label: 'Pages and Forms' },
  {
    label: 'Pages',
    icon: 'fa-solid fa-clipboard-list',
    children: [
      {
        label: 'Blog',
        children: [
          { label: 'Blog', url: '/showcase/blog' },
          { label: 'Blog Details', url: '/showcase/blog-details' },
          { label: 'Create Blog', url: '/showcase/blog-create' },
        ],
      },
      {
        label: 'Ecommerce',
        children: [
          { label: 'Add Products', url: '/showcase/add-products' },
          { label: 'Cart', url: '/showcase/cart' },
          { label: 'Checkout', url: '/showcase/checkout' },
          { label: 'Edit Products', url: '/showcase/edit-products' },
          { label: 'Products', url: '/showcase/products' },
          { label: 'Product Details', url: '/showcase/product-details' },
          { label: 'Wishlist', url: '/showcase/wishlist' },
        ],
      },
      {
        label: 'Email',
        children: [
          { label: 'Mail App', url: '/showcase/mail' },
          { label: 'Mail Read', url: '/showcase/mail-read' },
        ],
      },
      {
        label: 'File Manager',
        children: [{ label: 'File Manager', url: '/showcase/file-manager' }],
      },
      { label: 'Invoice', url: '/showcase/invoice' },
      { label: 'Chat', url: '/showcase/chat' },
      { label: 'Contacts', url: '/showcase/contacts' },
      { label: 'Empty', url: '/showcase/empty' },
      { label: "FAQ's", url: '/showcase/faqs' },
      { label: 'Notifications', url: '/showcase/notifications' },
      { label: 'Pricing', url: '/showcase/pricing' },
      { label: 'Settings', url: '/showcase/settings' },
      { label: 'Profile', url: '/showcase/profile' },
      { label: 'Terms & Conditions', url: '/showcase/terms-conditions' },
      { label: 'Timeline', url: '/showcase/timeline' },
      { label: 'To Do List', url: '/showcase/to-do-list' },
      { label: 'Search', url: '/showcase/search' },
      { label: 'Widgets', url: '/showcase/widgets' },
    ],
  },
  {
    label: 'Forms',
    icon: 'fa-solid fa-file-lines',
    children: [
      {
        label: 'Form Elements',
        children: [
          { label: 'Inputs', url: '/showcase/form-inputs' },
          { label: 'Checks & Radios', url: '/showcase/form-check-radios' },
          { label: 'Input Group', url: '/showcase/form-input-group' },
          { label: 'Form Select', url: '/showcase/form-select' },
          { label: 'Range Slider', url: '/showcase/form-range' },
          { label: 'Input Masks', url: '/showcase/form-input-masks' },
          { label: 'File Uploads', url: '/showcase/form-file-uploads' },
          { label: 'Date,Time Picker', url: '/showcase/form-datetime-pickers' },
          { label: 'Color Pickers', url: '/showcase/form-color-pickers' },
        ],
      },
      { label: 'Floating Labels', url: '/showcase/floating-labels' },
      { label: 'Form Layouts', url: '/showcase/form-layout' },
      {
        label: 'Form Editors',
        children: [{ label: 'Quill Editor', url: '/showcase/quill-editor' }],
      },
      { label: 'Validation', url: '/showcase/form-validation' },
      { label: 'Select2', url: '/showcase/form-select2' },
      { label: 'Tree-view', url: '/showcase/tree-view' },
    ],
  },
  { type: 'category', label: 'Web Apps' },
  {
    label: 'Apps',
    icon: 'fa-solid fa-grid-2',
    children: [
      { label: 'Full Calendar', url: '/showcase/full-calendar' },
      { label: 'Gallery', url: '/showcase/gallery' },
      { label: 'Sweet Alerts', url: '/showcase/sweet-alerts' },
    ],
  },
  {
    label: 'Authentication',
    icon: 'fa-solid fa-triangle-exclamation',
    children: [
      { label: 'Under Construction', url: '/showcase/under-construction' },
      { label: 'Create Password', url: '/showcase/create-password' },
      { label: 'Lock Screen', url: '/showcase/lock-screen' },
      { label: '404 - Error', url: '/showcase/404' },
      { label: '500 - Error', url: '/showcase/500' },
    ],
  },
  { type: 'category', label: 'Tables & Charts' },
  {
    label: 'Tables',
    icon: 'fa-solid fa-table',
    children: [
      { label: 'Tables', url: '/showcase/tables' },
      { label: 'Grid JS Tables', url: '/showcase/grid-tables' },
      { label: 'Data Tables', url: '/showcase/data-tables' },
    ],
  },
  {
    label: 'Charts',
    icon: 'fa-solid fa-chart-pie',
    children: [
      { label: 'Apex Charts', url: '/showcase/apex-charts' },
      { label: 'Chartjs Charts', url: '/showcase/chartjs-charts' },
      { label: 'Echart Charts', url: '/showcase/echarts' },
    ],
  },
  { type: 'category', label: 'Maps & Icons' },
  {
    label: 'Maps',
    icon: 'fa-solid fa-map-location-dot',
    children: [
      { label: 'Google Maps', url: '/showcase/google-maps' },
      { label: 'Leaflet Maps', url: '/showcase/leaflet-maps' },
      { label: 'Vector Maps', url: '/showcase/vector-maps' },
    ],
  },
  { label: 'Icons', icon: 'fa-solid fa-icons', url: '/showcase/icons' },
]

export default menu
