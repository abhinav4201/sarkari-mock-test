"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import DynamicAdvancedAnalysis from "@/components/results/DynamicAdvancedAnalysis";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import Explanation from "@/components/results/Explanation";
import { Check, X } from "lucide-react";

// --- CORRECTED DATA FETCHING LOGIC ---
async function getDynamicResultData(resultId, userId) {
  // 1. Fetch the result document
  const resultRef = doc(db, "mockTestResults", resultId);
  const resultSnap = await getDoc(resultRef);

  if (!resultSnap.exists() || resultSnap.data().userId !== userId) {
    return null;
  }
  const resultData = { id: resultSnap.id, ...resultSnap.data() };

  // 2. Check for the instanceId and fetch the question snapshot
  if (!resultData.instanceId) {
    throw new Error("Result is not linked to a valid test instance.");
  }
  const instanceRef = doc(db, "dynamicTestInstances", resultData.instanceId);
  const instanceSnap = await getDoc(instanceRef);

  if (!instanceSnap.exists()) {
    throw new Error("Could not find the question snapshot for this result.");
  }

  // 3. Combine the data and return it
  const finalData = {
    result: resultData,
    questions: instanceSnap.data().questions,
  };
  return finalData;
}

export default function DynamicResultPage() {
  const params = useParams();
  const { resultId } = params;
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;
    getDynamicResultData(resultId, user.uid)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [resultId, user, authLoading]);

  if (loading || authLoading)
    return <div className='text-center p-12'>Loading Results...</div>;
  // This now correctly checks for the error state from the data fetching
  if (error)
    return <div className='text-center p-12 text-red-600'>{error}</div>;
  if (!data) return notFound();

  const { result, questions } = data;
  const { score, totalQuestions, answers } = result;
  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className='bg-slate-100 min-h-screen py-12 md:py-20'>
      <div className='container mx-auto p-4'>
        <div className='max-w-4xl mx-auto bg-white p-6 sm:p-8 md:p-12 rounded-2xl shadow-2xl border border-slate-200'>
          <h1 className='text-3xl md:text-4xl font-extrabold text-center text-slate-900'>
            Test Result
          </h1>
          <div className='text-center my-10 p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg'>
            <p className='text-lg opacity-80'>You Scored</p>
            <p className='text-6xl font-extrabold my-2'>
              {score}{" "}
              <span className='opacity-80 text-4xl'>/ {totalQuestions}</span>
            </p>
            <p className='text-2xl font-semibold bg-white/20 px-4 py-1 inline-block rounded-full'>
              {percentage}%
            </p>
          </div>

          {/* It passes the fetched data to the analysis component */}
          <DynamicAdvancedAnalysis resultData={result} questions={questions} />

          <div className='mt-12'>
            <h2 className='text-2xl font-bold mb-6 text-slate-900'>
              Detailed Review
            </h2>
            <div className='space-y-8'>
              {questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer?.answer === question.correctAnswer;
                return (
                  <div
                    key={question.id}
                    className={`p-6 border-l-4 rounded-r-lg ${
                      isCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                    }`}
                  >
                    <h3 className='font-bold text-lg text-slate-900'>
                      Question {index + 1}
                    </h3>
                    <SvgDisplayer
                      svgCode={question.questionSvgCode}
                      className='w-full h-auto min-h-[10rem] border-2 border-slate-200 rounded-lg p-4 bg-white my-4 flex items-center'
                    />
                    <p className='mt-4 text-sm text-slate-700'>
                      Your answer:{" "}
                      <span
                        className={`font-bold ${
                          isCorrect ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {userAnswer?.answer || "Not Answered"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className='mt-1 text-sm text-green-800'>
                        Correct answer:{" "}
                        <span className='font-bold'>
                          {question.correctAnswer}
                        </span>
                      </p>
                    )}
                    <Explanation text={question.explanation} />
                  </div>
                );
              })}
            </div>
          </div>
          <div className='text-center mt-12 flex justify-center space-x-4'>
            <BackButton />
            <Link
              href='/mock-tests'
              className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg'
            >
              Take Another Test
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
