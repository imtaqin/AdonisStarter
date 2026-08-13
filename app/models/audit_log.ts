import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { AuditLogSchema } from '#database/schema'
import User from '#models/user'

/** Event names recorded by AuditLogger. */
export const AuditEvent = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
} as const

export type AuditEvent = (typeof AuditEvent)[keyof typeof AuditEvent]

/**
 * Append-only trail of mutations. Rows are never updated or deleted by the
 * application; write them through `AuditLogger` rather than directly, so the
 * actor, IP and user agent are captured consistently.
 */
export default class AuditLog extends AuditLogSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /** Bootstrap contextual colour for rendering the event as a badge. */
  get variant() {
    switch (this.event) {
      case AuditEvent.CREATED:
        return 'success'
      case AuditEvent.UPDATED:
        return 'warning'
      case AuditEvent.DELETED:
      case AuditEvent.LOGIN_FAILED:
        return 'danger'
      default:
        return 'info'
    }
  }
}
