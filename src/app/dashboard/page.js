import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import DailyDose from "@/components/dashboard/DailyDose";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import TestHistory from "@/components/dashboard/TestHistory";

// Server-side function to get the latest vocabulary
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

// Server-side function to get the latest GK
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

export default async function DashboardPage() {
  // Fetch data on the server
  const vocabulary = await getDailyVocabulary();
  const gk = await getDailyGk();

  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
        <WelcomeHeader />
        <div className='mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          {/* Main Column */}
          <div className='lg:col-span-2 space-y-8'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
              <h2 className='text-2xl font-bold text-slate-900 mb-6'>
                Your Test History
              </h2>
              <TestHistory />
            </div>
          </div>

          {/* Side Column */}
          <div className='lg:col-span-1'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
              <DailyDose vocabulary={vocabulary} gk={gk} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
