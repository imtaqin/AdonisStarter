import AuditLog, { type AuditEvent } from '#models/audit_log'
import type { HttpContext } from '@adonisjs/core/http'
import type { BaseModel } from '@adonisjs/lucid/orm'

type Auditable = InstanceType<typeof BaseModel> & { id?: number }

type LogOptions = {
  event: AuditEvent
  /** The record the event is about. Omit for events with no subject. */
  subject?: Auditable | null
  /** Overrides the model name derived from `subject`. */
  subjectType?: string
  subjectId?: number | null
  summary?: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}

/**
 * Fields that must never be written to the audit trail.
 */
const REDACTED = new Set([
  'password',
  'passwordConfirmation',
  'rememberMeToken',
  'remember_me_token',
])

/**
 * Writes the append-only audit trail.
 *
 * Always go through this service rather than creating AuditLog rows directly:
 * it captures the actor, IP and user agent consistently and strips secrets.
 */
export default class AuditLogger {
  static async log(ctx: HttpContext | null, options: LogOptions) {
    const subjectType = options.subjectType ?? options.subject?.constructor?.name ?? null
    const subjectId = options.subjectId ?? (options.subject?.id as number | undefined) ?? null

    return AuditLog.create({
      userId: ctx?.auth?.user?.id ?? null,
      event: options.event,
      auditableType: subjectType,
      auditableId: subjectId,
      summary: options.summary ?? null,
      oldValues: AuditLogger.#redact(options.oldValues),
      newValues: AuditLogger.#redact(options.newValues),
      ipAddress: ctx?.request?.ip() ?? null,
      userAgent: ctx?.request?.header('user-agent')?.slice(0, 255) ?? null,
    })
  }

  /**
   * Returns only the fields that actually changed, so the trail stays readable
   * on models with many columns.
   */
  static diff(before: Record<string, unknown>, after: Record<string, unknown>) {
    const oldValues: Record<string, unknown> = {}
    const newValues: Record<string, unknown> = {}

    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (String(before[key]) === String(after[key])) continue
      oldValues[key] = before[key]
      newValues[key] = after[key]
    }

    return { oldValues, newValues }
  }

  static #redact(values: Record<string, unknown> | null | undefined) {
    if (!values) return null

    const safe: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(values)) {
      safe[key] = REDACTED.has(key) ? '[redacted]' : value
    }
    return safe
  }
}
