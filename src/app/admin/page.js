"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  BarChart,
  FileText,
  Lock,
  MessageSquare,
  UserCheck,
  Users,
  ClipboardCheck,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import UserListModal from "@/components/admin/UserListModal";
import TestListModal from "@/components/admin/TestListModal";
import RestrictedTestsModal from "@/components/admin/RestrictedTestsModal";
import TestAttemptsModal from "@/components/admin/TestAttemptsModal";
import AttemptDetailsModal from "@/components/admin/AttemptDetailsModal";

const getCollectionCount = (collectionName) => {
  return getDocs(collection(db, collectionName)).then((snap) => snap.size);
};

const getTodaySubmissionsCount = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
  const q = query(
    collection(db, "contacts"),
    where("submittedAt", ">=", startOfDayTimestamp)
  );
  return getDocs(q).then((snap) => snap.size);
};

const getRestrictedTestCount = () => {
  const q = query(
    collection(db, "mockTests"),
    where("isRestricted", "==", true)
  );
  return getDocs(q).then((snap) => snap.size);
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    postCount: 0,
    testCount: 0,
    contactCount: 0,
    todaySubmissions: 0,
    userCount: 0,
    restrictedTestCount: 0,
    testAttemptsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRestrictedModalOpen, setIsRestrictedModalOpen] = useState(false);
  const [isAttemptsModalOpen, setIsAttemptsModalOpen] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAttemptDetails, setSelectedAttemptDetails] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          postCount,
          testCount,
          contactCount,
          todaySubmissions,
          userCount,
          restrictedTestCount,
          testAttemptsCount,
        ] = await Promise.all([
          getCollectionCount("posts"),
          getCollectionCount("mockTests"),
          getCollectionCount("contacts"),
          getTodaySubmissionsCount(),
          getCollectionCount("users"),
          getRestrictedTestCount(),
          getCollectionCount("mockTestResults"),
        ]);

        setStats({
          postCount,
          testCount,
          contactCount,
          todaySubmissions,
          userCount,
          restrictedTestCount,
          testAttemptsCount,
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleAttemptRowClick = (details) => {
    setSelectedAttemptDetails(details);
    setIsAttemptsModalOpen(false);
    setIsDetailsModalOpen(true);
  };

  const handleDetailsModalClose = () => {
    setIsDetailsModalOpen(false);
    setSelectedAttemptDetails(null);
    setIsAttemptsModalOpen(true);
  };

  return (
    <>
      <UserListModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />
      <TestListModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
      <RestrictedTestsModal
        isOpen={isRestrictedModalOpen}
        onClose={() => setIsRestrictedModalOpen(false)}
      />

      {/* FIX: The onRowClick prop is now correctly passed to the component. */}
      <TestAttemptsModal
        isOpen={isAttemptsModalOpen}
        onClose={() => setIsAttemptsModalOpen(false)}
        onRowClick={handleAttemptRowClick}
      />
      <AttemptDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleDetailsModalClose}
        details={selectedAttemptDetails}
      />

      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Admin Dashboard
        </h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <StatCard
            title='Total Test Attempts'
            value={stats.testAttemptsCount}
            icon={<ClipboardCheck />}
            isLoading={loading}
            onClick={() => setIsAttemptsModalOpen(true)}
          />
          <StatCard
            title='Total Users'
            value={stats.userCount}
            icon={<UserCheck />}
            isLoading={loading}
            onClick={() => setIsUserModalOpen(true)}
          />
          <StatCard
            title='Total Mock Tests'
            value={stats.testCount}
            icon={<BarChart />}
            isLoading={loading}
            onClick={() => setIsTestModalOpen(true)}
          />
          <StatCard
            title='Restricted Tests'
            value={stats.restrictedTestCount}
            icon={<Lock />}
            isLoading={loading}
            onClick={() => setIsRestrictedModalOpen(true)}
          />
          <StatCard
            title='Total Blog Posts'
            value={stats.postCount}
            icon={<FileText />}
            isLoading={loading}
          />
          <StatCard
            title='Total Contacts'
            value={stats.contactCount}
            icon={<Users />}
            isLoading={loading}
          />
          <StatCard
            title='Submissions Today'
            value={stats.todaySubmissions}
            icon={<MessageSquare />}
            isLoading={loading}
          />
        </div>
        <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold text-slate-900'>
            Welcome, Admin!
          </h2>
          <p className='mt-2 text-slate-700'>
            Use the sidebar navigation on the left to manage all website
            content.
          </p>
        </div>
      </div>
    </>
  );
}
