import { adminDb } from "@/lib/firebase-admin";
import TestHub from "@/components/mock-tests/TestHub";
import { BookOpen, Clock } from "lucide-react"; // Import icons for the background

// New background component with decorative elements
const TestBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    {/* Text elements */}
    <span className='absolute top-10 left-5 font-bold text-4xl text-blue-500/10 transform -rotate-12'>
      NEET
    </span>
    <span className='absolute top-1/4 right-5 font-bold text-5xl text-red-500/10 transform rotate-12'>
      IIT JEE
    </span>
    <span className='absolute bottom-1/2 left-1/4 font-bold text-3xl text-purple-500/10'>
      UPSC
    </span>
    <span className='absolute bottom-10 right-1/3 font-bold text-4xl text-green-500/10 transform rotate-6'>
      SSC CGL
    </span>
    <span className='absolute bottom-1/4 left-5 font-bold text-3xl text-orange-500/10 transform -rotate-6'>
      BANKING
    </span>
    <span className='absolute top-1/2 right-1/4 font-bold text-2xl text-indigo-500/10'>
      PCS
    </span>

    {/* Icon elements */}
    <BookOpen className='absolute top-1/3 left-1/2 h-24 w-24 text-gray-500/5' />
    <Clock className='absolute bottom-10 right-10 h-32 w-32 text-gray-500/5' />
    <BookOpen className='absolute bottom-20 left-10 h-20 w-20 text-gray-500/5' />
  </div>
);

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
    <div className='relative min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-100'>
      <TestBackground />
      <div className='relative z-10'>
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
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24'>
          <div className='-mt-16'>
            <TestHub initialTests={initialTests} />
          </div>
        </div>
      </div>
    </div>
  );
}
