import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /*
       * Nullable on purpose: null means "whatever the app default is", so
       * changing DEFAULT_THEME in config/themes.ts moves every user who never
       * picked one. A column default would freeze today's default into old rows.
       *
       * The value is validated against the config/themes.ts allowlist on write
       * and again on read, so a stale key here degrades instead of breaking.
       */
      table.string('theme', 64).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('theme')
    })
  }
}
