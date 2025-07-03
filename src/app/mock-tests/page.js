import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import TestList from "@/components/mock-tests/TestList";

async function getTests() {
  const testsRef = collection(db, "mockTests");
  const q = query(testsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export default async function MockTestsHubPage() {
  const tests = await getTests();
  return (
    <div className="bg-white min-h-screen">
        {/* Top section with a subtle gradient background */}
        <div className="bg-gradient-to-b from-indigo-50 to-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        Mock Test Library
                    </h1>
                    <p className="mt-4 text-lg text-gray-800">
                        Challenge yourself with our extensive collection of tests designed to simulate the real exam environment.
                    </p>
                </div>
            </div>
        </div>

        {/* Main content area */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
            <div className="-mt-16">
                <TestList tests={tests} />
            </div>
        </div>
    </div>
  );
}
