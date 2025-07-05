"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc,
  runTransaction,
} from "firebase/firestore";
import toast from "react-hot-toast";

// Helper function to fetch both test details and questions
async function getTestData(testId) {
  const testRef = doc(db, "mockTests", testId);
  const questionsQuery = query(
    collection(db, "mockTestQuestions"),
    where("testId", "==", testId)
  );

  const [testSnap, questionsSnap] = await Promise.all([
    getDoc(testRef),
    getDocs(questionsQuery),
  ]);

  if (!testSnap.exists()) return null;

  const testDetails = testSnap.data();
  const questions = questionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { testDetails, questions };
}

export default function TestTakingPage() {
  const [testDetails, setTestDetails] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testState, setTestState] = useState("loading");
  const [timePerQuestion, setTimePerQuestion] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [loading,setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { testId } = params;

  const submitTest = useCallback(async () => {
    setTestState("submitting");
    const lastQuestionId = questions[currentQuestionIndex]?.id;
    let finalTimePerQuestion = { ...timePerQuestion };
    if (lastQuestionId) {
      const timeSpent = (Date.now() - questionStartTime) / 1000;
      finalTimePerQuestion[lastQuestionId] =
        (finalTimePerQuestion[lastQuestionId] || 0) + timeSpent;
    }

    const finalAnswers = {};
    for (const qId in selectedOptions) {
      finalAnswers[qId] = {
        answer: selectedOptions[qId],
        timeTaken: finalTimePerQuestion[qId] || 0,
      };
    }
    for (const qId in finalTimePerQuestion) {
      if (!finalAnswers[qId]) {
        finalAnswers[qId] = {
          answer: null,
          timeTaken: finalTimePerQuestion[qId],
        };
      }
    }

    try {
      // Write the result directly to Firestore from the client
      const resultRef = await addDoc(collection(db, "mockTestResults"), {
        userId: user.uid,
        testId,
        answers: finalAnswers,
        score: Object.values(finalAnswers).filter(
          (a) =>
            questions.find(
              (q) =>
                q.id ===
                Object.keys(finalAnswers).find((k) => finalAnswers[k] === a)
            )?.correctAnswer === a.answer
        ).length,
        totalQuestions: questions.length,
        completedAt: serverTimestamp(),
      });
      router.push(`/mock-tests/results/${resultRef.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit your test. Please try again.");
      setTestState("in-progress");
    }
  }, [
    selectedOptions,
    timePerQuestion,
    questions,
    currentQuestionIndex,
    questionStartTime,
    router,
    testId,
    user,
  ]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("You must be logged in to start a test.");
      router.push(`/mock-tests/${testId}`);
      return;
    }

    const loadTest = async () => {
      setLoading(true);
      const data = await getTestData(testId);
      if (!data) {
        setTestState("error");
        toast.error("Test not found.");
        router.push("/mock-tests");
        return;
      }
      setTestDetails(data.testDetails);
      setQuestions(data.questions);
      setTimeLeft(data.testDetails.estimatedTime * 60);
      setTestState("in-progress");
      setQuestionStartTime(Date.now());
      setLoading(false);
    };

    if (testId && user) {
      loadTest();
    }
  }, [testId, user, authLoading, router]);

  useEffect(() => {
    if (testState !== "in-progress" || timeLeft <= 0) {
      if (timeLeft <= 0 && testState === "in-progress") submitTest();
      return;
    }
    const timerId = setInterval(
      () => setTimeLeft((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(timerId);
  }, [timeLeft, testState, submitTest]);

  const navigateToQuestion = (newIndex) => {
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const currentQuestionId = questions[currentQuestionIndex].id;
    setTimePerQuestion((prev) => ({
      ...prev,
      [currentQuestionId]: (prev[currentQuestionId] || 0) + timeSpent,
    }));
    setCurrentQuestionIndex(newIndex);
    setQuestionStartTime(Date.now());
  };

  const handleAnswerSelect = (questionId, option) => {
    setSelectedOptions({ ...selectedOptions, [questionId]: option });
  };

  if (testState === "loading" || authLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p className='text-lg font-medium text-slate-800'>
          Preparing Your Test...
        </p>
      </div>
    );
  }
  if (testState === "error") {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100 text-center p-4'>
        <div>
          <p className='text-xl font-bold text-red-600'>Failed to Load Test</p>
          <p className='text-slate-700 mt-2'>
            This test may not exist or has no questions.
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className='bg-slate-100 min-h-screen flex flex-col items-center justify-center p-4'>
      <div className='w-full max-w-4xl'>
        <div className='bg-white p-4 rounded-t-2xl shadow-xl border-b border-slate-200 flex justify-between items-center sticky top-4 z-10'>
          <h1 className='text-lg md:text-xl font-bold text-slate-900 truncate'>
            {testDetails?.title || "Mock Test"}
          </h1>
          <div className='text-2xl font-bold text-red-600 bg-red-100 px-4 py-1 rounded-full'>{`${minutes}:${
            seconds < 10 ? "0" : ""
          }${seconds}`}</div>
        </div>
        <div className='bg-white p-6 sm:p-8 rounded-b-2xl shadow-xl'>
          {currentQuestion ? (
            <div>
              <h2 className='text-lg font-semibold mb-4 text-slate-900'>
                Question {currentQuestionIndex + 1}{" "}
                <span className='font-medium text-slate-600'>
                  of {questions.length}
                </span>
              </h2>
              <div
                className='w-full h-auto border-2 border-slate-200 rounded-lg p-4 bg-slate-50 mb-6'
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.questionSvgCode,
                }}
              />
              <div className='space-y-4'>
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleAnswerSelect(currentQuestion.id, option)
                    }
                    className={`block w-full text-left p-4 border-2 rounded-lg transition-all duration-200 text-base md:text-lg font-medium ${
                      selectedOptions[currentQuestion.id] === option
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-slate-900 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className='text-center p-8'>
              <p className='text-slate-800'>Loading questions...</p>
            </div>
          )}
          <div className='flex justify-between mt-10 pt-6 border-t border-slate-200'>
            <button
              onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className='px-8 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg disabled:opacity-50 hover:bg-slate-300 transition-colors'
            >
              Previous
            </button>
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={submitTest}
                disabled={testState === "submitting"}
                className='px-8 py-3 bg-green-600 text-white font-semibold rounded-lg disabled:bg-green-400 hover:bg-green-700 transition-colors'
              >
                {testState === "submitting" ? "Submitting..." : "Submit Test"}
              </button>
            ) : (
              <button
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === questions.length - 1}
                className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors'
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
