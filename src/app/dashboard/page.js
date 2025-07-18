"use client";

import DailyDose from "@/components/dashboard/DailyDose";
import PaymentModal from "@/components/dashboard/PaymentModal";
import SubscriptionStatusCard from "@/components/dashboard/SubscriptionStatusCard";
import TestHistory from "@/components/dashboard/TestHistory";
import TestRecommendations from "@/components/dashboard/TestRecommendations";
import UserStats from "@/components/dashboard/UserStats";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { ArrowRight, PenSquare, TrendingUp, X } from "lucide-react";
import Link from "next/link"; // Import Link
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTrendingModalOpen, setIsTrendingModalOpen] = useState(false);

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
        toast.error("Failed to load dashboard data:", error);
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
      {isTrendingModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4'>
          {/* --- REMOVED animation classes that caused the blank screen --- */}
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative'>
            <button
              onClick={() => setIsTrendingModalOpen(false)}
              className='absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors p-2 rounded-full hover:bg-slate-100'
              aria-label='Close modal'
            >
              <X size={24} />
            </button>
            <TestRecommendations />
          </div>
        </div>
      )}

      <div className='bg-slate-100 min-h-screen'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
          <WelcomeHeader />

          <div className='mt-8'>
            <UserStats />
          </div>

          {/* --- NEW: The "Go Premium" card --- */}
          <SubscriptionStatusCard
            onUpgradeClick={() => setIsPaymentModalOpen(true)}
          />

          <div className='mt-8'>
            <button
              onClick={() => setIsTrendingModalOpen(true)}
              className='w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center group'
            >
              <div>
                <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
                  <TrendingUp className='text-indigo-500' />
                  Trending
                </h2>
                <p className='text-slate-600 mt-1'>
                  See what tests are popular right now.
                </p>
              </div>
              <ArrowRight className='h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1' />
            </button>
          </div>

          <div className='mt-8'>
            <Link href='/dashboard/monetization' className='block group'>
              <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center'>
                <div>
                  <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
                    <PenSquare className='text-indigo-500' />
                    Content & Monetization
                  </h2>
                  <p className='text-slate-600 mt-1'>
                    Create tests, track performance, and manage your earnings.
                  </p>
                </div>
                <ArrowRight className='h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1' />
              </div>
            </Link>
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
