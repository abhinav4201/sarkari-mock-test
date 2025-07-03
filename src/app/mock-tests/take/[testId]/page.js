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
        const testDetailsRes = await fetch(`/api/mock-tests/${testId}`); // A new simple API to get test time
        const testDetails = await testDetailsRes.json();
        setTimeLeft(testDetails.estimatedTime * 60);

        const questionsRes = await fetch(`/api/mock-tests/${testId}/questions`);
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
    const timerId = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, testState, submitTest]);

  const handleAnswerSelect = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  if (testState === "loading")
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Loading Test...</p>
      </div>
    );
  if (testState === "error")
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Failed to load the test. Please try again.</p>
      </div>
    );

  const currentQuestion = questions[currentQuestionIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className='container mx-auto p-4 md:p-8'>
      <div className='bg-white p-6 rounded-lg shadow-lg'>
        {/* Header */}
        <div className='flex justify-between items-center border-b pb-4 mb-6'>
          <h1 className='text-xl md:text-2xl font-bold'>
            Mock Test in Progress
          </h1>
          <div className='text-2xl font-bold text-red-500'>{`${minutes}:${
            seconds < 10 ? "0" : ""
          }${seconds}`}</div>
        </div>

        {/* Question Area */}
        {currentQuestion && (
          <div>
            <h2 className='text-lg font-semibold mb-4'>
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <img
              src={currentQuestion.questionSvgUrl}
              alt={`Question ${currentQuestionIndex + 1}`}
              className='w-full h-auto border rounded-lg p-4 bg-gray-50 mb-6'
            />
            <div className='space-y-3'>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                  className={`block w-full text-left p-4 border rounded-lg transition-colors ${
                    answers[currentQuestion.id] === option
                      ? "bg-blue-500 text-white border-blue-500"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className='flex justify-between mt-8'>
          <button
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0}
            className='px-6 py-2 bg-gray-300 rounded disabled:opacity-50'
          >
            Previous
          </button>
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={submitTest}
              disabled={testState === "submitting"}
              className='px-6 py-2 bg-green-600 text-white rounded disabled:bg-green-400'
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
              className='px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50'
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
