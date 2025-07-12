import { openDB } from "idb";

export async function getDb() {
  return await openDB("SVGStore", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("svgs")) {
        db.createObjectStore("svgs", { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export async function saveSvg({ name, svg }) {
  const db = await getDb();
  await db.add("svgs", { name, svg, createdAt: new Date() });
}

export async function getAllSvgs() {
  const db = await getDb();
  return await db.getAll("svgs");
}

export async function clearAllSvgs() {
  const db = await getDb();
  await db.clear("svgs");
}
