import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull().default(''),
  contentEmbedding: blob('contentEmbedding'),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`)
})

export type Note = typeof notes.$inferSelect

// VIRTUAL TABLES
export const vssNotes = sqliteTable('vss_notes', {
  rowid: integer('rowid'),
  contentEmbedding: blob('contentEmbedding')
})
