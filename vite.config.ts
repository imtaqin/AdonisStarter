import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entrypoints of your application. Each entrypoint will
       * result in a separate bundle.
       */
      entrypoints: [
        'resources/css/app.css',
        'resources/js/app.js',
        /**
         * Dashboard pages load these instead of app.css/app.js, so project
         * styles sit on top of the Imtaqin theme without its global reset.
         */
        'resources/css/dashboard.css',
        'resources/js/dashboard.js',
      ],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],
    }),
  ],

  server: {
    watch: {
      /**
       * `fontawesome-pro-*` is the unpacked icon bundle. It holds roughly 200k
       * SVG files, and watching them exhausts the inotify limit and kills the
       * dev server. It should live outside the project, but ignore it here too
       * in case someone unpacks it in place.
       */
      ignored: ['**/storage/**', '**/tmp/**', '**/fontawesome-pro-*/**', '**/template/**'],
    },
  },
})
