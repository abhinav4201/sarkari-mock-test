"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ClipboardCheck, Target, Award } from "lucide-react";

// Reusable StatCard component, localized for this file
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

export default function UserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    testsTaken: 0,
    questionsAttempted: 0,
    averageScore: "0%",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserStats = async () => {
      try {
        const resultsQuery = query(
          collection(db, "mockTestResults"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(resultsQuery);

        if (snapshot.empty) {
          setStats({
            testsTaken: 0,
            questionsAttempted: 0,
            averageScore: "0%",
          });
          setLoading(false);
          return;
        }

        let totalScore = 0;
        let totalPossibleScore = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          totalScore += data.score;
          totalPossibleScore += data.totalQuestions;
        });

        const average =
          totalPossibleScore > 0
            ? Math.round((totalScore / totalPossibleScore) * 100)
            : 0;

        setStats({
          testsTaken: snapshot.size,
          questionsAttempted: totalPossibleScore,
          averageScore: `${average}%`,
        });
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <StatCard
        title='Tests Taken'
        value={stats.testsTaken}
        icon={<ClipboardCheck />}
        isLoading={loading}
      />
      <StatCard
        title='Questions Attempted'
        value={stats.questionsAttempted}
        icon={<Target />}
        isLoading={loading}
      />
      <StatCard
        title='Average Score'
        value={stats.averageScore}
        icon={<Award />}
        isLoading={loading}
      />
    </div>
  );
}
