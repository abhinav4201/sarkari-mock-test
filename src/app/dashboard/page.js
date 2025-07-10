"use client";

import { useState, useEffect } from "react";
import DailyDose from "@/components/dashboard/DailyDose";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import TestHistory from "@/components/dashboard/TestHistory";
import UserStats from "@/components/dashboard/UserStats";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import PaymentModal from "@/components/dashboard/PaymentModal"; // Import the new modal
import { Crown } from "lucide-react";

async function getDailyVocabulary() {
  const q = query(
    collection(db, "dailyVocabulary"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  const docDate = data.createdAt.toDate();
  const today = new Date();
  if (docDate.toDateString() === today.toDateString()) {
    return data;
  }
  return null;
}

async function getDailyGk() {
  const q = query(
    collection(db, "dailyGk"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  const docDate = data.createdAt.toDate();
  const today = new Date();
  if (docDate.toDateString() === today.toDateString()) {
    return data;
  }
  return null;
}

export default function DashboardPage() {
  const [vocabulary, setVocabulary] = useState(null);
  const [gk, setGk] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- NEW: State to control the payment modal ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
    <>
      {/* --- NEW: Add the modal to the page --- */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      <div className='bg-slate-100 min-h-screen'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
          <WelcomeHeader />

          <div className='mt-8'>
            <UserStats />
          </div>

          {/* --- NEW: The "Go Premium" card --- */}
          <div className='mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-center'>
            <div>
              <h2 className='text-2xl font-bold flex items-center gap-2'>
                <Crown /> Unlock Premium Access
              </h2>
              <p className='mt-1 opacity-80'>
                Get access to all exclusive premium mock tests.
              </p>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className='mt-4 md:mt-0 px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-slate-100 transition-all'
            >
              Go Premium
            </button>
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
                <DailyDose
                  vocabulary={vocabulary}
                  gk={gk}
                  isLoading={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
