import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('slug', 80).notNullable().unique()
      table.string('name', 120).notNullable()
      table.string('description', 255).nullable()

      /**
       * System roles are seeded by the application and must not be deleted or
       * renamed through the UI, because policies reference them by slug.
       */
      table.boolean('is_system').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
