"use client";

import { useState, useEffect } from "react";
import DailyDose from "@/components/dashboard/DailyDose";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import TestHistory from "@/components/dashboard/TestHistory";
import UserStats from "@/components/dashboard/UserStats"; // NEW: Import UserStats
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

async function getDailyVocabulary() {
  const q = query(
    collection(db, "dailyVocabulary"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

async function getDailyGk() {
  const q = query(
    collection(db, "dailyGk"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

export default function DashboardPage() {
  const [vocabulary, setVocabulary] = useState(null);
  const [gk, setGk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [vocabData, gkData] = await Promise.all([
          getDailyVocabulary(),
          getDailyGk(),
        ]);
        setVocabulary(vocabData);
        setGk(gkData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
        <WelcomeHeader />

        {/* NEW: Added the UserStats component */}
        <div className='mt-8'>
          <UserStats />
        </div>

        <div className='mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          <div className='lg:col-span-2 space-y-8'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
              <h2 className='text-2xl font-bold text-slate-900 mb-6'>
                Your Test History
              </h2>
              <TestHistory />
            </div>
          </div>

          <div className='lg:col-span-1'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
              <DailyDose vocabulary={vocabulary} gk={gk} isLoading={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
