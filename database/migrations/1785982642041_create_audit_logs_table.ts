import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      /**
       * Nullable so the trail survives the actor being deleted, and so system
       * or console-originated events can be recorded without a user.
       */
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      /** created | updated | deleted | login | logout | ... */
      table.string('event', 40).notNullable()

      /** Model name and primary key of the affected record, e.g. "User" / 12. */
      table.string('auditable_type', 80).nullable()
      table.integer('auditable_id').unsigned().nullable()

      /** Human-readable summary, so lists render without rehydrating models. */
      table.string('summary', 255).nullable()

      table.json('old_values').nullable()
      table.json('new_values').nullable()

      table.string('ip_address', 45).nullable()
      table.string('user_agent', 255).nullable()

      table.timestamp('created_at').notNullable()

      table.index(['auditable_type', 'auditable_id'])
      table.index(['user_id'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
