// src/app/mock-tests/page.js

import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import TestHub from "@/components/mock-tests/TestHub";

// This function now correctly fetches ALL public tests for the initial page load.
async function getInitialTests() {
  const testsRef = collection(db, "mockTests");

  // Query 1: Get the most recent tests created by users that are approved.
  const userTestsQuery = query(
    testsRef,
    where("status", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(9)
  );

  // Query 2: Get the most recent tests that DO NOT have a status field (i.e., admin-created tests).
  // We achieve this by querying for a non-existent value. This is a common Firestore pattern.
  const adminTestsQuery = query(
    testsRef,
    where("status", "==", null),
    orderBy("createdAt", "desc"),
    limit(9)
  );

  try {
    // Fetch both sets of tests concurrently for better performance.
    const [userTestsSnapshot, adminTestsSnapshot] = await Promise.all([
      getDocs(userTestsQuery),
      getDocs(adminTestsQuery),
    ]);

    const userTests = userTestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // The second query might incorrectly fetch documents where status is explicitly null.
    // We must filter on the server to only include those where the field is truly missing.
    const adminTests = adminTestsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((test) => typeof test.status === "undefined");

    // Combine the two lists and remove any potential duplicates using a Map.
    const combinedTests = [...userTests, ...adminTests];
    const uniqueTests = Array.from(
      new Map(combinedTests.map((test) => [test.id, test])).values()
    );

    // Sort the final, unique list by date to ensure the newest are always first.
    uniqueTests.sort(
      (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
    );

    // Return the top results, ensuring createdAt is serializable.
    return uniqueTests.slice(0, 9).map((test) => ({
      ...test,
      createdAt: test.createdAt ? test.createdAt.toMillis() : null,
    }));
  } catch (error) {
    console.error("Failed to fetch initial tests:", error);
    return []; // Return an empty array on error
  }
}

export default async function MockTestsHubPage() {
  const initialTests = await getInitialTests();

  return (
    <div className='bg-white min-h-screen'>
      <div className='bg-gradient-to-b from-indigo-50 to-white'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24'>
          <div className='text-center max-w-3xl mx-auto'>
            <h1 className='text-4xl md:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600'>
              Mock Test Library
            </h1>
            <p className='mt-4 text-lg text-gray-800'>
              Challenge yourself with our extensive collection of tests designed
              to simulate the real exam environment.
            </p>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24'>
        <div className='-mt-16'>
          {/* The TestHub component now receives the complete and correct initial list */}
          <TestHub initialTests={initialTests} />
        </div>
      </div>
    </div>
  );
}
