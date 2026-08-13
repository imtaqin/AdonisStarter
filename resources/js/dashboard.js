/*
|--------------------------------------------------------------------------
| Dashboard entrypoint
|--------------------------------------------------------------------------
|
| Project JavaScript for dashboard pages. The Imtaqin theme's own scripts are
| plain <script> tags loaded from /theme in the layout, so anything here runs
| alongside (and after) them.
|
| Bootstrap, ApexCharts, SimpleBar and friends are already globals by the time
| this executes -- do not re-import them.
|
*/

document.addEventListener('DOMContentLoaded', () => {
  /**
   * Auto-dismiss server-rendered flash alerts.
   */
  for (const alert of document.querySelectorAll('[data-auto-dismiss]')) {
    const delay = Number(alert.dataset.autoDismiss) || 5000
    setTimeout(() => {
      bootstrap.Alert.getOrCreateInstance(alert).close()
    }, delay)
  }

  /**
   * Fullscreen toggle. The theme ships this as an inline `onclick`; binding it
   * here keeps the shell free of inline handlers so CSP can be tightened.
   */
  for (const trigger of document.querySelectorAll('[data-fullscreen-toggle]')) {
    trigger.addEventListener('click', (event) => {
      event.preventDefault()
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.documentElement.requestFullscreen()
      }
    })
  }

  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = Boolean(document.fullscreenElement)
    document.querySelector('.full-screen-open')?.classList.toggle('d-none', isFullscreen)
    document.querySelector('.full-screen-close')?.classList.toggle('d-none', !isFullscreen)
  })

  /**
   * Copy-to-clipboard for `<button data-copy="...">`, used by the icon browser.
   * Bound here rather than inline so the shell stays free of inline handlers.
   */
  for (const trigger of document.querySelectorAll('[data-copy]')) {
    trigger.addEventListener('click', async () => {
      const value = trigger.dataset.copy
      try {
        await navigator.clipboard.writeText(value)
      } catch {
        // Clipboard access needs a secure context; fall back to a selection.
        const field = document.createElement('textarea')
        field.value = value
        document.body.append(field)
        field.select()
        document.execCommand('copy')
        field.remove()
      }

      const previous = trigger.getAttribute('title')
      trigger.setAttribute('title', `Copied: ${value}`)
      trigger.classList.add('border-primary')
      setTimeout(() => {
        trigger.setAttribute('title', previous ?? '')
        trigger.classList.remove('border-primary')
      }, 1200)
    })
  }

  /**
   * Confirmation for destructive POST forms: `<form data-confirm="...">`.
   * Server-side authorization is the real control -- this only prevents
   * accidents.
   */
  for (const form of document.querySelectorAll('form[data-confirm]')) {
    form.addEventListener('submit', (event) => {
      if (!window.confirm(form.dataset.confirm)) {
        event.preventDefault()
      }
    })
  }
})
