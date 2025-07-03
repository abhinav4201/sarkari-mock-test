import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { BarChart, FileText, MessageSquare, Users } from "lucide-react";

// Helper function to get counts
async function getCollectionCount(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.size;
}

// Helper function to get submissions from today
async function getTodaySubmissionsCount() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTimestamp = Timestamp.fromDate(startOfDay);

  const q = query(
    collection(db, "contacts"),
    where("submittedAt", ">=", startOfDayTimestamp)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

const StatCard = ({ title, value, icon }) => (
  <div className='bg-white p-6 rounded-lg shadow-md flex items-center justify-between'>
    <div>
      <p className='text-sm font-medium text-gray-500'>{title}</p>
      <p className='text-3xl font-bold text-gray-900'>{value}</p>
    </div>
    <div className='bg-blue-100 text-blue-600 p-3 rounded-full'>{icon}</div>
  </div>
);

export default async function AdminDashboardPage() {
  // Fetch all stats in parallel for efficiency
  const [postCount, testCount, contactCount, todaySubmissions] =
    await Promise.all([
      getCollectionCount("posts"),
      getCollectionCount("mockTests"),
      getCollectionCount("contacts"),
      getTodaySubmissionsCount(),
    ]);

    return (
      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Admin Dashboard
        </h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <StatCard
            title='Total Mock Tests'
            value={testCount}
            icon={<BarChart />}
          />
          <StatCard
            title='Total Blog Posts'
            value={postCount}
            icon={<FileText />}
          />
          <StatCard
            title='Total Contacts'
            value={contactCount}
            icon={<Users />}
          />
          <StatCard
            title='Submissions Today'
            value={todaySubmissions}
            icon={<MessageSquare />}
          />
        </div>
        <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold text-slate-900'>
            Quick Actions
          </h2>
          <p className='mt-2 text-slate-700'>
            Use the sidebar navigation on the left to manage all website
            content. Each section is now fully responsive for management on any
            device.
          </p>
        </div>
      </div>
    );

}
