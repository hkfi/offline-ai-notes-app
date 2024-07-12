import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { db, runMigrate } from './db'
import { spawn } from 'child_process'
import path from 'path'
import winston from 'winston'
import * as schema from '../db/schema'
import { desc, eq, lte, sql } from 'drizzle-orm'
import axios from 'axios'
import { findPythonPath } from './helpers'

const PYTHON_SERVER_URL = 'http://127.0.0.1:5001' as const

// Create a log file path
const logPath = path.join(app.getPath('userData'), 'app.log')

// Configure winston to log to the file
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: logPath })]
})

async function updateVssNote(rowId: number) {
  await db.delete(schema.vssNotes).where(eq(schema.vssNotes.rowid, rowId))
  const res = await insertIntoVssNote(rowId)

  console.log(`A vss_notes row ${res.lastInsertRowid} has been updated`)

  return res
}

async function insertIntoVssNote(rowId: number) {
  const note = db.$with('note').as(
    db
      .select({
        rowid: sql`"notes"."rowid"`.as('rowid'),
        contentEmbedding: sql`"notes"."contentEmbedding"`.as('contentEmbedding')
      })
      .from(schema.notes)
      .where(eq(schema.notes.id, rowId))
  )
  const res = await db
    .with(note)
    .insert(schema.vssNotes)
    .values([
      {
        rowid: sql`(select "rowid" from ${note})`,
        contentEmbedding: sql`(select "contentEmbedding" from ${note})`
      }
    ])

  console.log(`A vss_notes row has been inserted with rowid ${res.lastInsertRowid}`)

  return res
}

async function updateNote({
  id,
  content,
  embedding,
  updatedAt
}: {
  id: number
  content: string
  embedding: string
  updatedAt: Date
}) {
  const res = await db.transaction(async (tx) => {
    const updateNoteRes = await tx
      .update(schema.notes)
      .set({
        content,
        contentEmbedding: sql`vector_to_blob(vector_from_json(${embedding}))`,
        updatedAt
      })
      .where(eq(schema.notes.id, id))
      .returning()

    const updatedNote = updateNoteRes[0]

    if (!updatedNote) return

    updateVssNote(updatedNote.id)

    return updatedNote
  })

  return res
}

async function insertNote({ content, embedding }: { content: string; embedding: string }) {
  const res = await db.transaction(async (tx) => {
    const insertNoteRes = await tx
      .insert(schema.notes)
      .values({
        content,
        contentEmbedding: sql`vector_to_blob(vector_from_json(${embedding}))`
      })
      .returning()

    const createdNote = insertNoteRes.at(0)

    if (!createdNote) return

    insertIntoVssNote(createdNote.id)

    return createdNote
  })

  return res
}

async function deleteNote({ id }: { id: number }) {
  await db.transaction(async (tx) => {
    await tx.delete(schema.notes).where(eq(schema.notes.id, id))

    await tx.delete(schema.vssNotes).where(eq(schema.vssNotes.rowid, id))
  })
  return true
}

function findResourcesPath() {
  return import.meta.env.DEV ? path.join(__dirname, '..', '..') : path.join(process.resourcesPath)
}

let mainWindow

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
let pythonProcess

app.on('before-quit', () => {
  // Kill the Python process when quitting the app
  pythonProcess.kill()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Start Python Embedding Server
  const pythonPath = findPythonPath()
  const resourcesPath = findResourcesPath()
  if (!pythonPath || !resourcesPath) {
    app.quit()
    return
  }
  logger.info(`Python path: ${pythonPath}`)
  logger.info(`Resources path: ${resourcesPath}`)

  pythonProcess = spawn(pythonPath, [`${resourcesPath}/python_server/server.py`])
  logger.info(`pythonProcess: ${pythonProcess}`)
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`)
  })

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python error: ${data}`)
  })

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`)
  })

  // Function to check if the server is ready
  const checkServerReady = async () => {
    console.log('checking if server ready')
    try {
      await axios.get(PYTHON_SERVER_URL)
      mainWindow.webContents.send('server-ready')
    } catch (error) {
      logger.warn(`checkServerReady error: ${error}`)
      setTimeout(checkServerReady, 1000)
    }
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('findSimilarNotes', async (_, noteId) => {
    const matches = db.$with('matches').as(
      db
        .select({
          rowid: sql`"vss_notes"."rowid"`.as('rowid'),
          distance: sql`"vss_notes"."distance"`.as('distance')
        })
        .from(schema.vssNotes)
        .where(
          sql`vss_search(
            "vss_notes"."contentEmbedding",
            (select contentEmbedding from notes where rowid=${noteId})
          )`
        )
        .limit(20)
    )
    const res = await db
      .with(matches)
      .select({
        id: schema.notes.id,
        content: schema.notes.content,
        updatedAt: schema.notes.updatedAt
      })
      .from(matches)
      .where(lte(matches.distance, 1.5))
      .leftJoin(schema.notes, eq(schema.notes.id, matches.rowid))

    console.log(
      'sql query: ',
      db
        .with(matches)
        .select({
          id: schema.notes.id,
          content: schema.notes.content,
          updatedAt: schema.notes.updatedAt
        })
        .from(matches)
        .where(lte(matches.distance, 1.5))
        .leftJoin(schema.notes, eq(schema.notes.id, matches.rowid))
        .toSQL()
    )
    console.log('res: ', res)

    return res
  })
  ipcMain.handle('searchNotes', async (_, query) => {
    const embedding = await getEmbedding([query])

    const matches = db.$with('matches').as(
      db
        .select({
          rowid: sql`"vss_notes"."rowid"`.as('rowid'),
          distance: sql`"vss_notes"."distance"`.as('distance')
        })
        .from(schema.vssNotes)
        .where(
          sql`vss_search(
            "vss_notes"."contentEmbedding",
            ${JSON.stringify(embedding)}
          )`
        )
        .limit(20)
    )
    const res = await db
      .with(matches)
      .select({
        id: schema.notes.id,
        content: schema.notes.content,
        updatedAt: schema.notes.updatedAt
      })
      .from(matches)
      .where(lte(matches.distance, 1.5))
      .leftJoin(schema.notes, eq(schema.notes.id, matches.rowid))

    return res
  })
  ipcMain.handle('getNote', async (_, id) => {
    const res = await db.query.notes.findFirst({
      where: eq(schema.notes.id, id)
    })

    return res
  })
  ipcMain.handle('getNotes', async (_, { offset }) => {
    const res = await db.query.notes.findMany({
      offset: offset ?? 0,
      limit: 50,
      orderBy: desc(schema.notes.updatedAt)
    })

    return res
  })
  ipcMain.on('updateNote', async (event, { id, content }) => {
    const embedding = await getEmbedding([content])
    updateNote({
      id,
      content,
      embedding: JSON.stringify(embedding),
      updatedAt: new Date()
    })
      .then((res) => {
        event.sender.send('updateNote-success', res)
      })
      .catch((err) => {
        console.error('Error inserting note: ', err)
        event.sender.send('updateNote-failed', err.message)
      })
  })
  ipcMain.on('createNote', async (event, content) => {
    const embedding = await getEmbedding([content])
    console.log('embedding:', embedding)
    console.log('JSON stringified embedding:', JSON.stringify)

    insertNote({
      content,
      embedding: JSON.stringify(embedding)
    })
      .then((res) => {
        event.sender.send('createNote-success', res)
        event.sender.send('createNote-success-sidebar', res)
      })
      .catch((err) => {
        console.error('Error inserting note: ', err)
        event.sender.send('createNote-failed', err.message)
      })
  })
  ipcMain.on('deleteNote', async (event, id: number) => {
    deleteNote({ id })
      .then((res) => {
        event.sender.send('deleteNote-success', res)
        event.sender.send('deleteNote-success-sidebar', res)
      })
      .catch((err) => {
        console.error('Error inserting note: ', err)
        event.sender.send('deleteNote-failed', err.message)
      })
  })

  ipcMain.on('check-server-status', async () => {
    try {
      await axios.get(PYTHON_SERVER_URL)
      // event.sender.send('server-ready')
      mainWindow.webContents.send('server-ready')
    } catch (error) {
      // Server not ready, do nothing
    }
  })

  await runMigrate()
  createWindow()
  checkServerReady()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

async function getEmbedding(sentences: string[]) {
  try {
    const response = await axios.post(`${PYTHON_SERVER_URL}/encode`, { sentences })
    return response.data
  } catch (error) {
    console.error('Error fetching embedding:', error)
  }
}

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
