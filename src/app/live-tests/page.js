"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";
import LiveTestCard from "@/components/LiveTestCard";
import { IndianRupee, Star, Trophy } from "lucide-react";

// Fun, decorative SVG component for the background
const PrizeConfetti = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    <Trophy className='absolute -top-8 -left-8 h-32 w-32 text-yellow-400/20 transform rotate-12' />
    <Star className='absolute top-16 right-0 h-24 w-24 text-pink-400/20 transform -rotate-12' />
    <IndianRupee className='absolute bottom-0 -right-4 h-48 w-48 text-green-400/10 transform rotate-45' />
    <Trophy className='absolute bottom-1/3 -left-12 h-24 w-24 text-blue-400/10 transform -rotate-45' />
    <Star className='absolute bottom-8 left-1/4 h-16 w-16 text-red-400/15 transform rotate-12' />
  </div>
);

export default function LiveTestsPage() {
  const [liveTests, setLiveTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
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

        const now = new Date();
        const upcoming = tests.filter((t) => t.endTime.toDate() >= now);
        const completed = tests
          .filter((t) => t.endTime.toDate() < now)
          .slice(0, 5); // Get last 5 completed

        setLiveTests(upcoming);
        setCompletedTests(completed);
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
    <div className='relative bg-gray-900 min-h-screen py-16 overflow-hidden'>
      <PrizeConfetti />
      <div className='relative z-10 container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-extrabold text-white'>
            Live Prize Pool Tests
          </h1>
          <p className='mt-4 text-lg text-slate-300 max-w-2xl mx-auto'>
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
          !loading &&
          completedTests.length === 0 && (
            <div className='text-center py-16 px-6 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-white'>
              <Trophy className='mx-auto h-16 w-16 text-yellow-300' />
              <h3 className='mt-4 text-2xl font-bold'>
                No Upcoming Live Tests
              </h3>
              <p className='mt-2 text-slate-300'>
                There are no live or scheduled tests at the moment. Please check
                back later for new events!
              </p>
            </div>
          )
        )}

        {completedTests.length > 0 && (
          <div className='mt-20'>
            <h2 className='text-3xl font-bold text-center text-white mb-8'>
              Recently Completed Events
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {completedTests.map((test) => (
                <LiveTestCard key={test.id} test={test} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
