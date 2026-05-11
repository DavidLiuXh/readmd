import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'md-reader'
const DB_VERSION = 1
const STORE_HANDLES = 'directory-handles'

export interface HandleRecord {
  id: string
  name: string
  handle: FileSystemDirectoryHandle
  savedAt: number
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE_HANDLES, { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await getDB()
  const record: HandleRecord = {
    id: handle.name,
    name: handle.name,
    handle,
    savedAt: Date.now(),
  }
  await db.put(STORE_HANDLES, record)
}

export async function loadAllHandles(): Promise<HandleRecord[]> {
  const db = await getDB()
  const all = await db.getAll(STORE_HANDLES)
  return all.sort((a, b) => b.savedAt - a.savedAt)
}

export async function deleteHandle(name: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_HANDLES, name)
}
