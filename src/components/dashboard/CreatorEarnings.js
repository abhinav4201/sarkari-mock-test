"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";

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

export default function CreatorEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({
    netEarnings: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchEarnings = async () => {
      const earningsRef = doc(db, "earnings", user.uid);
      const earningsSnap = await getDoc(earningsRef);
      if (earningsSnap.exists()) {
        const data = earningsSnap.data();
        setEarnings({
          netEarnings: data.netEarnings || 0,
          pendingAmount: data.pendingAmount || 0,
        });
      }
      setLoading(false);
    };
    fetchEarnings();
  }, [user]);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-8'>
      <StatCard
        title='Lifetime Creator Earnings'
        value={`₹${earnings.netEarnings.toLocaleString()}`}
        icon={<IndianRupee />}
        isLoading={loading}
      />
      <StatCard
        title='Pending Payout'
        value={`₹${earnings.pendingAmount.toLocaleString()}`}
        icon={<IndianRupee />}
        isLoading={loading}
      />
    </div>
  );
}
