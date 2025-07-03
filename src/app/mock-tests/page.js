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
    <div className='bg-gray-50 min-h-screen'>
      <div className='container mx-auto px-4 py-12'>
        <h1 className='text-4xl font-extrabold text-center mb-10 text-gray-900'>
          Find Your Perfect Mock Test
        </h1>
        <TestList tests={tests} />
      </div>
    </div>
  );
}
