"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Hourglass, Trophy } from "lucide-react";
import Link from "next/link";

export default function LiveTestResultPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const { resultId } = params;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchResult = async () => {
      const resultRef = doc(db, "liveTestResults", resultId);
      const resultSnap = await getDoc(resultRef);
      if (resultSnap.exists() && resultSnap.data().userId === user.uid) {
        setResult(resultSnap.data());
      }
      setLoading(false);
    };
    fetchResult();
  }, [resultId, user, authLoading]);

  if (loading || authLoading) {
    return <div className='text-center p-12'>Loading Your Score...</div>;
  }

  if (!result) {
    return <div className='text-center p-12'>Result not found.</div>;
  }

  const percentage = Math.round((result.score / result.totalQuestions) * 100);

  return (
    <div className='bg-slate-100 min-h-screen flex items-center justify-center p-4'>
      <div className='max-w-xl w-full bg-white p-8 md:p-12 rounded-2xl shadow-2xl text-center'>
        <Trophy className='mx-auto h-16 w-16 text-amber-500' />
        <h1 className='text-3xl font-extrabold text-slate-900 mt-4'>
          Test Submitted!
        </h1>
        <p className='mt-2 text-slate-600'>Your score has been recorded.</p>

        <div className='my-8 p-6 bg-indigo-50 rounded-xl'>
          <p className='text-lg font-medium text-indigo-800'>Your Score</p>
          <p className='text-5xl font-bold text-indigo-600'>
            {result.score} / {result.totalQuestions} ({percentage}%)
          </p>
        </div>

        <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3'>
          <Hourglass className='h-8 w-8 text-amber-600 flex-shrink-0' />
          <div>
            <h3 className='font-bold text-amber-800 text-left'>
              Rankings are Being Calculated
            </h3>
            <p className='text-sm text-amber-700 mt-1 text-left'>
              Final results and prize distribution will be announced after the
              event ends. Check back on the Live Tests page later.
            </p>
          </div>
        </div>

        <div className='mt-8'>
          <Link
            href='/live-tests'
            className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700'
          >
            Back to Live Tests
          </Link>
        </div>
      </div>
    </div>
  );
}
