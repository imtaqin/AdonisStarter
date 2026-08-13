import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      /**
       * Dotted slug such as "users.view". The prefix before the dot is the
       * group used to lay the permission matrix out in the UI.
       */
      table.string('slug', 100).notNullable().unique()
      table.string('name', 120).notNullable()
      table.string('group', 60).notNullable()
      table.string('description', 255).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
