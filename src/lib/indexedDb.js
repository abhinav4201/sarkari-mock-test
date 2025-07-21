// src/lib/indexedDb.js

import { openDB } from "idb";

const DB_NAME = "SarkariMockTestDB";
const DB_VERSION = 1;
const SVG_STORE = "svgs";
const TEST_STORE = "cachedTests";
const RESULTS_STORE = "offlineResults";

export async function getDb() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SVG_STORE)) {
        db.createObjectStore(SVG_STORE, { keyPath: "id", autoIncrement: true });
      }
      // NEW: Create object store for cached tests
      if (!db.objectStoreNames.contains(TEST_STORE)) {
        db.createObjectStore(TEST_STORE, { keyPath: "id" });
      }
      // NEW: Create object store for offline results
      if (!db.objectStoreNames.contains(RESULTS_STORE)) {
        db.createObjectStore(RESULTS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
}

// --- SVG Functions (Unchanged) ---
export async function saveSvg({ name, svg }) {
  const db = await getDb();
  await db.add(SVG_STORE, { name, svg, createdAt: new Date() });
}
export async function getAllSvgs() {
  const db = await getDb();
  return await db.getAll(SVG_STORE);
}
export async function clearAllSvgs() {
  const db = await getDb();
  await db.clear(SVG_STORE);
}

// --- NEW: Offline Test Caching Functions ---

/**
 * Caches an array of test data objects into IndexedDB.
 * @param {Array<object>} tests - An array of test objects to cache.
 */
export async function cacheTests(tests) {
  const db = await getDb();
  const tx = db.transaction(TEST_STORE, "readwrite");
  await Promise.all(tests.map((test) => tx.store.put(test)));
  await tx.done;
}

/**
 * Retrieves a single cached test by its ID.
 * @param {string} testId - The ID of the test to retrieve.
 * @returns {Promise<object|undefined>} The cached test object or undefined if not found.
 */
export async function getCachedTest(testId) {
  const db = await getDb();
  return await db.get(TEST_STORE, testId);
}

/**
 * Saves a test result to the offline queue for later syncing.
 * @param {object} resultData - The result data to be saved.
 */
export async function saveOfflineResult(resultData) {
  const db = await getDb();
  await db.add(RESULTS_STORE, resultData);
}

/**
 * Retrieves all pending offline results.
 * @returns {Promise<Array<object>>} An array of all offline results.
 */
export async function getOfflineResults() {
  const db = await getDb();
  return await db.getAll(RESULTS_STORE);
}

/**
 * Clears all pending offline results after a successful sync.
 */
export async function clearOfflineResults() {
  const db = await getDb();
  await db.clear(RESULTS_STORE);
}
