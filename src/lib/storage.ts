import type { Project } from "./types";

const DB = "atelier";
const STORE = "projects";
const INDEX_KEY = "atelier:project-index";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(project, project.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const index = listProjectMeta().filter((p) => p.id !== project.id);
  index.unshift({ id: project.id, name: project.name, updatedAt: project.updatedAt });
  localStorage.setItem(INDEX_KEY, JSON.stringify(index.slice(0, 50)));
}

export async function loadProject(id: string): Promise<Project | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Project) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const index = listProjectMeta().filter((p) => p.id !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function listProjectMeta(): { id: string; name: string; updatedAt: number }[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || "[]");
  } catch {
    return [];
  }
}
