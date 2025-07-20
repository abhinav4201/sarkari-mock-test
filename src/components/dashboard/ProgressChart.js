// src/components/dashboard/ProgressChart.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ProgressChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const resultsQuery = query(
          collection(db, "mockTestResults"),
          where("userId", "==", user.uid),
          orderBy("completedAt", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(resultsQuery);
        const data = snapshot.docs
          .map((doc) => {
            const d = doc.data();
            return {
              name: new Date(d.completedAt.seconds * 1000).toLocaleDateString(),
              score: Math.round((d.score / d.totalQuestions) * 100),
            };
          })
          .reverse();
        setChartData(data);
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  if (loading) {
    return <div className='text-center p-8'>Loading chart...</div>;
  }

  if (chartData.length === 0) {
    return (
      <div className='text-center p-8'>
        Take more tests to see your progress.
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
      <h3 className='text-2xl font-bold text-slate-900 mb-6'>
        Your Progress Over Time
      </h3>
      <ResponsiveContainer width='100%' height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' />
          <YAxis />
          <Tooltip />
          <Line
            type='monotone'
            dataKey='score'
            stroke='#4f46e5'
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
