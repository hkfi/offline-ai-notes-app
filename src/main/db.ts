import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../db/schema'
import fs from 'fs'
import { app } from 'electron'
import path from 'path'
import { findSqliteVssVector0Path, findSqliteVssVss0Path } from './helpers'
// import { load } from 'sqlite-vss'

export const dbPath = import.meta.env.DEV
  ? 'sqlite.db'
  : path.join(app.getPath('userData'), 'data.db')

console.log(app.getPath('userData'))

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const sqlite = new Database(dbPath)
// load(sqlite)
const vector0Path = findSqliteVssVector0Path()
const vss0Path = findSqliteVssVss0Path()
if (vector0Path && vss0Path) {
  sqlite.loadExtension(vector0Path)
  sqlite.loadExtension(vss0Path)
}

const version = sqlite.prepare('select vss_version()').pluck().get()
console.log(`vss_version: ${version}`)

export const db = drizzle(sqlite, { schema })

export const runMigrate = async (): Promise<void> => {
  migrate(db, {
    migrationsFolder: path.join(__dirname, '../../drizzle')
  })
}
