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
import Link from "next/link";
import { BarChart2 } from "lucide-react";

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
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className='bg-white p-6 rounded-2xl shadow-lg border h-[372px] animate-pulse'></div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
      <h3 className='text-2xl font-bold text-slate-900 mb-6'>
        Your Progress Over Time
      </h3>
      {chartData.length > 0 ? (
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
      ) : (
        <div className='text-center py-16'>
          <BarChart2 className='mx-auto h-12 w-12 text-slate-400' />
          <h4 className='mt-2 font-semibold text-slate-800'>
            No Progress to Show Yet
          </h4>
          <p className='mt-1 text-sm text-slate-500'>
            Complete a few tests to see your progress chart here.
          </p>
          <Link
            href='/mock-tests'
            className='mt-4 inline-block px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700'
          >
            Explore Tests
          </Link>
        </div>
      )}
    </div>
  );
}
