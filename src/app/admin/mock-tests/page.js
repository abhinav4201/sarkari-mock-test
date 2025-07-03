import MockTestManager from "@/components/admin/MockTestManager";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";

async function getTests() {
  const testsRef = collection(db, "mockTests");
  const q = query(testsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export default async function MockTestsAdminPage() {
  const tests = await getTests();
  return (
    <div>
      <h1 className='text-3xl font-bold mb-6'>Mock Test Management</h1>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-1'>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Create New Test</h2>
            <MockTestManager />
          </div>
        </div>
        <div className='lg:col-span-2'>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-xl font-semibold mb-4'>Existing Tests</h2>
            <div className='space-y-3'>
              {tests.map((test) => (
                <div
                  key={test.id}
                  className='p-3 border rounded flex justify-between items-center'
                >
                  <p className='font-semibold'>{test.title}</p>
                  <Link
                    href={`/admin/mock-tests/${test.id}`}
                    className='text-sm bg-blue-500 text-white px-3 py-1 rounded'
                  >
                    Manage Questions
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
