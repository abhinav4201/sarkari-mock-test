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
    <div className='bg-gray-50 min-h-screen'>
      <div className='container mx-auto px-4 py-8'>
        <WelcomeHeader />
        <div className='mt-8'>
          <DailyDose vocabulary={vocabulary} gk={gk} />
        </div>
        <div className='mt-8 bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-2xl font-bold mb-4'>Your Recent Activity</h2>
          <TestHistory />
        </div>
      </div>
    </div>
  );
}
