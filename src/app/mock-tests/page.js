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

async function getInitialTests() {
  const testsRef = collection(db, "mockTests");

  // This query fetches tests that are explicitly approved.
  // We will handle admin tests without a status on the client-side.
  const q = query(
    testsRef,
    where("status", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(9)
  );

  const snapshot = await getDocs(q);

  const tests = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toMillis() : null,
    };
  });

  // In a real-world scenario with many admin tests, you might run a second
  // query here for tests where 'status' does not exist and merge the results.
  // For now, the client-side filter is sufficient.
  return tests;
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
          <TestHub initialTests={initialTests} />
        </div>
      </div>
    </div>
  );
}
