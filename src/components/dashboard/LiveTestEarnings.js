"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { IndianRupee, Trophy } from "lucide-react";

const StatCard = ({ title, value, icon, isLoading }) => (
  <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between'>
    {isLoading ? (
      <div className='w-full animate-pulse'>
        <div className='h-5 bg-slate-200 rounded w-3/4 mb-3'></div>
        <div className='h-9 bg-slate-200 rounded w-1/2'></div>
      </div>
    ) : (
      <>
        <div>
          <p className='text-sm font-medium text-slate-700'>{title}</p>
          <p className='text-3xl font-bold text-slate-900'>{value}</p>
        </div>
        <div className='bg-indigo-100 text-indigo-600 p-3 rounded-full'>
          {icon}
        </div>
      </>
    )}
  </div>
);

export default function LiveTestEarnings() {
  const { user } = useAuth();
  const [winnings, setWinnings] = useState([]);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchWinnings = async () => {
      try {
        const winningsQuery = query(
          collection(db, `users/${user.uid}/liveTestWinnings`),
          orderBy("wonAt", "desc")
        );
        const snapshot = await getDocs(winningsQuery);

        const fetchedWinnings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWinnings(fetchedWinnings);

        const total = fetchedWinnings.reduce(
          (acc, win) => acc + win.prizeAmount,
          0
        );
        setTotalWinnings(total);
      } catch (error) {
        console.error("Failed to fetch live test winnings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWinnings();
  }, [user]);

  // --- THIS IS THE FIX ---
  // Instead of returning null, we show a message if loading is done and there are no winnings.
  const renderContent = () => {
    if (loading) {
      return (
        <div className='h-24 bg-slate-200 rounded-2xl animate-pulse'></div>
      );
    }

    if (winnings.length === 0) {
      return (
        <div className='bg-white p-6 rounded-2xl shadow-lg border text-center'>
          <Trophy className='mx-auto h-10 w-10 text-slate-400' />
          <h3 className='mt-2 font-semibold text-slate-800'>No Winnings Yet</h3>
          <p className='text-sm text-slate-500'>
            Your prize money from live tests will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
        <h3 className='text-2xl font-bold text-slate-900 flex items-center gap-3 mb-4'>
          <Trophy className='text-amber-500' />
          Live Test Winnings
        </h3>
        <div className='mb-4'>
          <StatCard
            title='Total Prize Money Won'
            value={`₹${totalWinnings.toLocaleString()}`}
            icon={<IndianRupee />}
            isLoading={loading}
          />
        </div>
        <div className='space-y-2'>
          <h4 className='font-semibold text-slate-700'>Recent Wins:</h4>
          {winnings.slice(0, 3).map((win) => (
            <div
              key={win.id}
              className='p-3 bg-slate-50 rounded-lg flex justify-between items-center'
            >
              <div>
                <p className='font-semibold text-slate-800'>{win.testTitle}</p>
                <p className='text-xs text-slate-500'>Rank: {win.rank}</p>
              </div>
              <p className='font-bold text-green-600'>
                + ₹{win.prizeAmount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return renderContent();
}
