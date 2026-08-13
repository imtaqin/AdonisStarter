import router from '@adonisjs/core/services/router'
import menu, { type MenuNode } from '#config/menu'
import type { UserAbilities } from '#services/permissions_service'

export type ResolvedCategory = {
  type: 'category'
  label: string
}

export type ResolvedLink = {
  type: 'link'
  label: string
  icon?: string
  /** Resolved URL, or undefined when the named route does not exist (yet). */
  href?: string
  badge?: { label: string; variant?: string }
  /** True when this node's href matches the current request path. */
  active: boolean
  /** True when this node, or anything below it, is active. */
  open: boolean
  children: ResolvedNode[]
}

export type ResolvedNode = ResolvedCategory | ResolvedLink

/**
 * Turns `config/menu.ts` into a render-ready tree: resolves named routes to
 * URLs, drops nodes the user may not see, and marks the active trail so the
 * sidebar can open the right branch on load.
 */
export default class MenuService {
  static build(currentPath: string, abilities: UserAbilities): ResolvedNode[] {
    const path = MenuService.#normalise(currentPath)
    return MenuService.#walk(menu, path, abilities)
  }

  static #normalise(url: string) {
    const withoutQuery = url.split('?')[0].split('#')[0]
    if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
      return withoutQuery.slice(0, -1)
    }
    return withoutQuery
  }

  /**
   * Named routes are resolved lazily and defensively: a menu entry pointing at
   * a route that has not been registered renders as plain text instead of
   * crashing every page that includes the sidebar.
   */
  static #hrefFor(node: Exclude<MenuNode, ResolvedCategory>) {
    if (node.url) return node.url
    if (!node.route) return undefined

    try {
      return router.makeUrl(node.route, node.params ?? {})
    } catch {
      return undefined
    }
  }

  static #walk(nodes: MenuNode[], path: string, abilities: UserAbilities): ResolvedNode[] {
    const resolved: ResolvedNode[] = []

    for (const node of nodes) {
      if ('type' in node && node.type === 'category') {
        resolved.push({ type: 'category', label: node.label })
        continue
      }

      const link = node as Exclude<MenuNode, ResolvedCategory>
      if (link.permission && abilities.cannot(link.permission)) continue

      const children = link.children ? MenuService.#walk(link.children, path, abilities) : []

      // A group that has been emptied by permission filtering is meaningless.
      if (link.children?.length && !children.some((child) => child.type === 'link')) continue

      const href = MenuService.#hrefFor(link)
      const active = Boolean(href) && MenuService.#normalise(href!) === path
      const open = active || children.some((child) => child.type === 'link' && child.open)

      resolved.push({
        type: 'link',
        label: link.label,
        icon: link.icon,
        href,
        badge: link.badge,
        active,
        open,
        children,
      })
    }

    // Drop a trailing/duplicated category divider left behind by filtering.
    return resolved.filter((node, index) => {
      if (node.type !== 'category') return true
      const next = resolved[index + 1]
      return Boolean(next) && next.type === 'link'
    })
  }
}
