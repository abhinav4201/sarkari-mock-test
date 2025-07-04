"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TestTakingPage() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testState, setTestState] = useState("loading"); // loading, in-progress, submitting, completed
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { testId } = params;

  // Function to handle test submission
  const submitTest = useCallback(async () => {
    setTestState("submitting");
    try {
      const res = await fetch("/api/mock-tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, testId, answers }),
      });
      if (!res.ok) throw new Error("Failed to submit test.");
      const result = await res.json();
      router.push(`/mock-tests/results/${result.resultId}`);
    } catch (error) {
      console.error(error);
      setTestState("in-progress"); // Revert state on failure
    }
  }, [answers, router, testId, user]);

  // Fetch test details and questions
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const testDetailsRes = await fetch(`/api/mock-tests/${testId}`);
        if (!testDetailsRes.ok)
          throw new Error("Could not fetch test details.");
        const testDetails = await testDetailsRes.json();
        setTimeLeft(testDetails.estimatedTime * 60);

        const questionsRes = await fetch(`/api/mock-tests/${testId}/questions`);
        if (!questionsRes.ok) throw new Error("Could not fetch questions.");
        const questionsData = await questionsRes.json();

        setQuestions(questionsData);
        setTestState("in-progress");
      } catch (error) {
        console.error("Failed to load test:", error);
        setTestState("error");
      }
    };
    if (testId) {
      fetchTest();
    }
  }, [testId]);

  // Countdown Timer Logic
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

  const handleAnswerSelect = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  if (testState === "loading") {
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
            Please try again later or contact support.
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
        {/* Header */}
        <div className='bg-white p-4 rounded-t-2xl shadow-xl border-b border-slate-200 flex justify-between items-center sticky top-4 z-10'>
          <h1 className='text-lg md:text-xl font-bold text-slate-900 truncate'>
            Mock Test in Progress
          </h1>
          <div className='text-2xl font-bold text-red-600 bg-red-100 px-4 py-1 rounded-full'>{`${minutes}:${
            seconds < 10 ? "0" : ""
          }${seconds}`}</div>
        </div>

        <div className='bg-white p-6 sm:p-8 rounded-b-2xl shadow-xl'>
          {/* Question Area */}
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
                      answers[currentQuestion.id] === option
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

          {/* Navigation */}
          <div className='flex justify-between mt-10 pt-6 border-t border-slate-200'>
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
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
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
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
