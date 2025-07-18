// src/app/library-dashboard/page.js

"use client";

import { useState, useEffect } from "react";
import DailyDose from "@/components/dashboard/DailyDose";
import TestHistory from "@/components/dashboard/TestHistory";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import SubscriptionStatusCard from "@/components/dashboard/SubscriptionStatusCard";
import PaymentModal from "@/components/dashboard/PaymentModal";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import toast from "react-hot-toast";
import LibraryUserStatsCard from "@/components/dashboard/LibraryUserStatsCard";

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

export default function LibraryDashboardPage() {
  const [vocabulary, setVocabulary] = useState(null);
  const [gk, setGk] = useState(null);
  const [loading, setLoading] = useState(true);
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
        toast.error("Failed to load daily content.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
        <WelcomeHeader />

        <div className='mt-8'>
          <LibraryUserStatsCard />
        </div>

        <div className='mt-8'>
          <SubscriptionStatusCard
            onUpgradeClick={() => setIsPaymentModalOpen(true)}
          />
        </div>

        <div className='mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          <div className='lg:col-span-2'>
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
    </>
  );
}
