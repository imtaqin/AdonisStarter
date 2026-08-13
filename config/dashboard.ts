/*
|--------------------------------------------------------------------------
| Dashboard branding
|--------------------------------------------------------------------------
|
| Everything user-visible about the shell that is not navigation. Values here
| are exposed to every Edge template as globals by start/view.ts.
|
| Swapping the logos: drop replacements into public/theme/images/brand-logos and
| point the paths below at them. The theme shows a different file per
| sidebar/theme combination, which is why there are six.
|
*/

const dashboardConfig = {
  /** Shown in <title>, the footer, and the sidebar logo alt text. */
  appName: 'AdonisStarter',

  /** Number of rows per page in every paginated index screen. */
  perPage: 15,

  logos: {
    desktop: '/theme/images/brand-logos/desktop-logo.png',
    toggle: '/theme/images/brand-logos/toggle-logo.png',
    desktopDark: '/theme/images/brand-logos/desktop-dark.png',
    toggleDark: '/theme/images/brand-logos/toggle-dark.png',
    desktopWhite: '/theme/images/brand-logos/desktop-white.png',
    toggleWhite: '/theme/images/brand-logos/toggle-white.png',
  },
}

export default dashboardConfig
