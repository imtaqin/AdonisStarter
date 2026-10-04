import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /*
       * One JSON blob rather than nine columns: these are display preferences
       * that are read together, never queried individually, and the set grows
       * whenever the theme adds an option. Every key is validated against
       * config/themes.ts on read, so a stale or hand-edited value degrades to
       * the default instead of reaching the markup.
       */
      table.text('theme_options').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('theme_options')
    })
  }
}
