import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import TestList from "@/components/mock-tests/TestList";

// This function fetches the FIRST page of tests on the server.
// It was previously missing or named incorrectly.
async function getInitialTests() {
  const testsRef = collection(db, "mockTests");
  const q = query(testsRef, orderBy("createdAt", "desc"), limit(9));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Safeguard against missing timestamp to prevent hydration errors.
      createdAt: data.createdAt ? data.createdAt.toMillis() : null,
    };
  });
}

export default async function MockTestsHubPage() {
  // The function call is now correct.
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
          <TestList initialTests={initialTests} />
        </div>
      </div>
    </div>
  );
}
