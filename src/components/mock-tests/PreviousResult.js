// components/mock-tests/PreviousResult.js
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
// Import 'orderBy' from Firestore
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Check, X } from "lucide-react";

export default function PreviousResult({ testId }) {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const resultsRef = collection(db, "mockTestResults");

        // --- UPDATED QUERY ---
        // This query now orders the results by completion date in descending order (newest first)
        // and limits the result to only the top one.
        const q = query(
          resultsRef,
          where("userId", "==", user.uid),
          where("testId", "==", testId),
          orderBy("completedAt", "desc"), // Order by newest
          limit(1) // Get only the most recent one
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const resultDoc = querySnapshot.docs[0];
          const resultData = resultDoc.data();
          setResult(resultData);
        } else {
          console.log("No previous result found for this test.");
        }
      } catch (error) {
        console.error("Error fetching previous result:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [user, testId]);

  if (loading) {
    return (
      <div className='text-center p-4 bg-slate-50 rounded-lg my-8'>
        <p className='text-slate-600'>Loading previous result...</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const correct = result.score || 0;
  const total = result.totalQuestions || 0;
  const incorrect = total - correct;
  const scorePercentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className='my-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl'>
      <h2 className='text-xl font-bold text-slate-800 flex items-center mb-4'>
        <BarChart className='h-6 w-6 mr-3 text-blue-600' />
        Your Previous Result
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-center'>
        <div className='p-4 bg-white rounded-lg shadow-sm'>
          <p className='text-sm text-slate-500'>Score</p>
          <p className='text-2xl font-bold text-blue-600'>{scorePercentage}%</p>
        </div>
        <div className='p-4 bg-white rounded-lg shadow-sm'>
          <p className='text-sm text-slate-500'>Correct</p>
          <p className='text-2xl font-bold text-green-600 flex items-center justify-center gap-2'>
            <Check size={24} /> {correct}
          </p>
        </div>
        <div className='p-4 bg-white rounded-lg shadow-sm'>
          <p className='text-sm text-slate-500'>Incorrect</p>
          <p className='text-2xl font-bold text-red-600 flex items-center justify-center gap-2'>
            <X size={24} /> {incorrect}
          </p>
        </div>
      </div>
    </div>
  );
}
