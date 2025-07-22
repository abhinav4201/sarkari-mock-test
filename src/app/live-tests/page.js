"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";
import LiveTestCard from "@/components/LiveTestCard"; // <-- NEW COMPONENT

export default function LiveTestsPage() {
  const [liveTests, setLiveTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveTests = async () => {
      try {
        const q = query(
          collection(db, "liveTests"),
          orderBy("startTime", "desc")
        );
        const snapshot = await getDocs(q);
        const tests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLiveTests(tests);
      } catch (error) {
        toast.error("Could not load live tests.");
      } finally {
        setLoading(false);
      }
    };
    fetchLiveTests();
  }, []);

  if (loading) {
    return <div className='text-center p-12'>Loading Live Tests...</div>;
  }

  return (
    <div className='bg-slate-50 min-h-screen py-16'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-extrabold text-slate-900'>
            Live Prize Pool Tests
          </h1>
          <p className='mt-4 text-lg text-slate-600 max-w-2xl mx-auto'>
            Compete with other top students for a chance to win real cash
            prizes. The prize pool grows with every participant!
          </p>
        </div>

        {liveTests.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {liveTests.map((test) => (
              <LiveTestCard key={test.id} test={test} />
            ))}
          </div>
        ) : (
          <p className='text-center text-slate-500'>
            No live tests scheduled at the moment. Please check back later.
          </p>
        )}
      </div>
    </div>
  );
}
