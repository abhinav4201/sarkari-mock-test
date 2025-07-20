import { adminDb } from "@/lib/firebase-admin"; // NEW: Import adminDb for server-side operations


import TestHub from "@/components/mock-tests/TestHub"; // Keep this import as it's the main component rendered

async function getInitialTests() {
  const testsRef = adminDb.collection("mockTests"); // Use adminDb collection reference


  const userTestsSnapshot = await testsRef
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .limit(9)
    .get();

  const adminTestsSnapshot = await testsRef
    .where("status", "==", null) // Queries for explicit null status
    .orderBy("createdAt", "desc")
    .limit(9)
    .get();

  try {
    const userTests = userTestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toMillis() : null, // Ensure serializable
    }));

    // Filter explicitly for tests where status is truly undefined or null
    const adminTests = adminTestsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (test) => typeof test.status === "undefined" || test.status === null
      );

    const combinedTests = [...userTests, ...adminTests];
    const uniqueTests = Array.from(
      new Map(combinedTests.map((test) => [test.id, test])).values()
    );

    uniqueTests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return uniqueTests.slice(0, 9);
  } catch (error) {
    console.error("Failed to fetch initial tests in Server Component:", error); // Specific error message for clarity
    return [];
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
          {/* The TestHub component receives the initial data from the server, fetched using Admin SDK */}
          <TestHub initialTests={initialTests} />
        </div>
      </div>
    </div>
  );
}
