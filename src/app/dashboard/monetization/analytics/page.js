// src/app/dashboard/monetization/analytics/page.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
// import BackButton from "@/components/BackButton";
import AnalyticsStatCard from "@/components/dashboard/AnalyticsStatCard";
import UserEligibilityCard from "@/components/dashboard/UserEligibilityCard";
import { BarChart2, Eye, FileText, Users } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [myTests, setMyTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [earnings, setEarnings] = useState({});

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      }

      const analyticsQuery = query(
        collection(db, "testAnalytics"),
        where("createdBy", "==", user.uid)
      );
      const analyticsSnapshot = await getDocs(analyticsQuery);
      if (analyticsSnapshot.empty) {
        setMyTests([]);
        setLoading(false);
        return;
      }

      const analyticsData = analyticsSnapshot.docs.map((doc) => doc.data());
      const testIds = analyticsData.map((data) => data.testId);

      if (testIds.length === 0) {
        setMyTests([]);
        setLoading(false);
        return;
      }

      const testsQuery = query(
        collection(db, "mockTests"),
        where("__name__", "in", testIds)
      );
      const testsSnapshot = await getDocs(testsQuery);
      const testsMap = new Map(
        testsSnapshot.docs.map((doc) => [doc.id, doc.data()])
      );

      const combinedData = analyticsData.map((analytic) => ({
        ...analytic,
        title: testsMap.get(analytic.testId)?.title || "Unknown Test",
        monetizationStatus:
          testsMap.get(analytic.testId)?.monetizationStatus || "pending_review",
        createdAt: testsMap.get(analytic.testId)?.createdAt || null,
      }));

      combinedData.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });

      setMyTests(combinedData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load your data.");
    } finally {
      setLoading(false);
    }

    if (userProfile?.monetizationStatus === "approved") {
      const earningsRef = doc(db, "earnings", user.uid);
      const earningsSnap = await getDoc(earningsRef);
      if (earningsSnap.exists()) {
        setEarnings(earningsSnap.data());
      }
    }
  }, [user, userProfile?.monetizationStatus]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  const aggregatedStats = {
    testsCreated: myTests.length,
    totalImpressions: myTests.reduce(
      (acc, test) => acc + (test.impressionCount || 0),
      0
    ),
    totalCompletions: myTests.reduce(
      (acc, test) => acc + (test.takenCount || 0),
      0
    ),
    totalUniqueTakers: myTests.reduce(
      (acc, test) => acc + (test.uniqueTakers?.length || 0),
      0
    ),
    monetizationStatus: userProfile?.monetizationStatus || "none",
  };

  if (loading || authLoading) {
    return <div className='text-center p-12'>Loading Your Analytics...</div>;
  }

  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
        {/* <div className='mb-8'>
          <BackButton />
        </div> */}
        <div className='text-center mb-10'>
          <h1 className='text-4xl font-extrabold text-slate-900'>
            My Content Analytics
          </h1>
          <p className='mt-2 text-lg text-slate-600'>
            Track the performance of the mock tests you've created.
          </p>
        </div>

        <div className='max-w-5xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <AnalyticsStatCard
              title='Tests Created'
              value={aggregatedStats.testsCreated}
              icon={<FileText />}
            />
            <AnalyticsStatCard
              title='Total Impressions'
              value={aggregatedStats.totalImpressions.toLocaleString()}
              icon={<Eye />}
            />
            <AnalyticsStatCard
              title='Total Completions'
              value={aggregatedStats.totalCompletions.toLocaleString()}
              icon={<BarChart2 />}
            />
            <AnalyticsStatCard
              title='Total Unique Takers'
              value={aggregatedStats.totalUniqueTakers.toLocaleString()}
              icon={<Users />}
            />
          </div>
          <div className='mb-8'>
            <UserEligibilityCard
              userStats={aggregatedStats}
              onApply={fetchData}
            />
          </div>

          <div className='bg-white p-6 rounded-2xl shadow-lg border'>
            <h2 className='text-xl font-bold text-slate-900 mb-4'>My Tests</h2>
            {myTests.length > 0 ? (
              <div className='space-y-4'>
                {myTests.map((test) => (
                  <div
                    key={test.testId}
                    className='p-4 border rounded-lg hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4'
                  >
                    <div>
                      <h3 className='font-bold text-lg text-slate-900'>
                        {test.title}
                      </h3>
                      {/* --- THIS IS THE CORRECTED SECTION --- */}
                      <div className='mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600'>
                        <div
                          className='flex items-center gap-2 text-sm'
                          title='Impressions'
                        >
                          <Eye className='h-4 w-4 text-sky-500' />
                          <span className='font-semibold'>
                            {test.impressionCount || 0}
                          </span>
                          <span>Impressions</span>
                        </div>
                        <div
                          className='flex items-center gap-2 text-sm'
                          title='Completions'
                        >
                          <BarChart2 className='h-4 w-4 text-amber-500' />
                          <span className='font-semibold'>
                            {test.takenCount || 0}
                          </span>
                          <span>Completions</span>
                        </div>
                        <div
                          className='flex items-center gap-2 text-sm'
                          title='Unique Takers'
                        >
                          <Users className='h-4 w-4 text-green-500' />
                          <span className='font-semibold'>
                            {test.uniqueTakers?.length || 0}
                          </span>
                          <span>Unique Takers</span>
                        </div>
                      </div>
                      {/* --- END OF CORRECTION --- */}
                      <div className='mt-3 text-xs'>
                        <span
                          className={`px-2 py-1 rounded-full font-medium ${
                            test.monetizationStatus === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          Monetization:{" "}
                          {test.monetizationStatus === "approved"
                            ? "Approved"
                            : "Pending Review"}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/monetization/${test.testId}`}
                      className='flex-shrink-0 px-4 py-2 text-sm bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
                    >
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <h3 className='text-lg font-semibold text-slate-900'>
                  You haven't created any tests yet.
                </h3>
                <p className='mt-1 text-sm text-slate-500'>
                  Create a test from the Monetization Hub to see its analytics
                  here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
