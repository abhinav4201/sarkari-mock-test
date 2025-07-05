"use client"; // This converts the page to a Client Component

import { useState, useEffect, useCallback } from "react";
import MockTestManager from "@/components/admin/MockTestManager";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";

// Helper function to fetch tests. It can remain outside the component.
// We've added timestamp serialization to prevent hydration errors.
async function getTests() {
  const testsRef = collection(db, "mockTests");
  const q = query(testsRef, orderBy("createdAt", "desc"), limit(20)); // You can add pagination here later
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toMillis() : null,
    };
  });
}

export default function MockTestsAdminPage() {
  // State to hold the list of tests and the loading status
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to load tests, wrapped in useCallback for performance
  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedTests = await getTests();
      setTests(fetchedTests);
    } catch (error) {
      console.error("Failed to load tests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch the data on the client side when the component first loads
  useEffect(() => {
    loadTests();
  }, [loadTests]);

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>
        Mock Test Management
      </h1>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
        {/* Form Section remains the same */}
        <div className='lg:col-span-1 bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold mb-6 text-slate-900'>
            Create New Test
          </h2>
          <MockTestManager />
        </div>

        {/* List Section now handles a loading state */}
        <div className='lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold mb-6 text-slate-900'>
            Existing Tests
          </h2>
          <div className='space-y-4'>
            {loading ? (
              <p className='text-center text-slate-700 p-8'>Loading tests...</p>
            ) : tests.length > 0 ? (
              tests.map((test) => (
                <div
                  key={test.id}
                  className='p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50'
                >
                  <div>
                    <p className='font-bold text-slate-900'>{test.title}</p>
                    <p className='text-sm text-slate-700'>
                      {test.examName} - {test.questionCount || 0} Questions
                    </p>
                  </div>
                  <Link
                    href={`/admin/mock-tests/${test.id}`}
                    className='px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 text-center flex-shrink-0'
                  >
                    Manage Questions
                  </Link>
                </div>
              ))
            ) : (
              <p className='text-center text-slate-700 p-8'>
                No tests created yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
