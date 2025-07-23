import { adminDb } from "@/lib/firebase-admin";
import TestHub from "@/components/mock-tests/TestHub";

async function getInitialTests() {
  const testsRef = adminDb.collection("mockTests");
  try {
    // This query correctly fetches only public tests for the initial page load.
    const publicTestsSnapshot = await testsRef
      .where("isHidden", "==", false)
      .orderBy("createdAt", "desc")
      .limit(9)
      .get();

    const tests = publicTestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? doc.data().createdAt.toMillis() : null,
    }));
    return tests;
  } catch (error) {
    console.error(
      "Server-side fetch failed. This is likely a missing Firestore index.",
      error.message
    );
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
          <TestHub initialTests={initialTests} />
        </div>
      </div>
    </div>
  );
}
