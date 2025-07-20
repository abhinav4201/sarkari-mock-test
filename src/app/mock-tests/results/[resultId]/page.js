"use client"; // This converts the page to a Client Component

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import BackButton from "@/components/BackButton";
import AdvancedAnalysis from "@/components/results/AdvancedAnalysis";
import SvgDisplayer from "@/components/ui/SvgDisplayer"; 
import Explanation from "@/components/results/Explanation"; 
import ComparativeAnalysis from "@/components/results/ComparativeAnalysis";
import ActionableInsights from "@/components/results/ActionableInsights";

// Helper function to fetch all necessary data
async function getResultData(resultId, userId) {
  const resultRef = doc(db, "mockTestResults", resultId);
  const resultSnap = await getDoc(resultRef);

  if (!resultSnap.exists() || resultSnap.data().userId !== userId) {
    // Return null if result doesn't exist or doesn't belong to the user
    return null;
  }

  const resultData = resultSnap.data();

  // Fetch all questions for this test to show a detailed review
  const q = query(
    collection(db, "mockTestQuestions"),
    where("testId", "==", resultData.testId)
  );
  const questionsSnapshot = await getDocs(q);
  const questions = {};
  questionsSnapshot.forEach((doc) => {
    questions[doc.id] = doc.data();
  });

  return { ...resultData, questions };
}

export default function ResultPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const resultId = params.resultId;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until Firebase has confirmed the user's auth status
    if (authLoading) {
      return;
    }
    // If there's no user, they can't view this page
    if (!user) {
      toast.error("You must be logged in to view results.");
      router.push("/mock-tests");
      return;
    }

    const loadResult = async () => {
      setLoading(true);
      const resultData = await getResultData(resultId, user.uid);

      if (!resultData) {
        // This handles cases where the result doesn't exist or the user doesn't own it
        toast.error("Could not find or access this test result.");
        router.push("/dashboard");
        return;
      }
      setResult(resultData);
      setLoading(false);
    };

    if (resultId && user) {
      loadResult();
    }
  }, [resultId, user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className='text-center p-12 text-lg font-medium'>
        Loading Your Results...
      </div>
    );
  }

  if (!result) {
    // This state is reached if the result was not found or access was denied.
    return (
      <div className='text-center p-12 text-lg font-medium'>
        Could not display results.
      </div>
    );
  }

  const { score, totalQuestions, answers, questions } = result;
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
          {/* The AdvancedAnalysis component will need to be a client component that fetches its own data */}
          <div className='mt-12'>
            <ComparativeAnalysis resultId={resultId} />
            <AdvancedAnalysis resultId={resultId} />
            {result && (
              <ActionableInsights topicPerformance={result.topicPerformance} />
            )}
          </div>

          <div className='mt-12'>
            <h2 className='text-2xl font-bold mb-6 text-slate-900'>
              Detailed Review
            </h2>
            <div className='space-y-8'>
              {Object.keys(questions).map((questionId, index) => {
                const question = questions[questionId];
                const userAnswer = answers[questionId];
                const isCorrect = userAnswer?.answer === question.correctAnswer;

                return (
                  <div
                    key={questionId}
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
