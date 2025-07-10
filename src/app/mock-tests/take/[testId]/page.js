"use client";

import QuestionPalette from "@/components/mock-tests/QuestionPalette";
import FinalWarningModal from "@/components/ui/FinalWarningModal";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

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
  const testDetails = { id: testSnap.id, ...testSnap.data() };
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
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningInfo, setWarningInfo] = useState({ type: null, count: 0 });
  const [lastQuestionWarningShown, setLastQuestionWarningShown] =
    useState(false); // NEW: State to track the warning

  const { user, loading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { testId } = params;

  const forceSubmit = useCallback(
    async (reason = "user_submitted") => {
      if (testState === "submitting" || !user) return;
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
      for (const q of questions) {
        if (!finalAnswers[q.id]) {
          finalAnswers[q.id] = {
            answer: null,
            timeTaken: finalTimePerQuestion[q.id] || 0,
          };
        }
      }

      let score = 0;
      const correctAnswersMap = new Map(
        questions.map((q) => [q.id, q.correctAnswer])
      );
      for (const qId in selectedOptions) {
        if (selectedOptions[qId] === correctAnswersMap.get(qId)) {
          score++;
        }
      }
      const totalQuestions = questions.length;
      const incorrectAnswers = totalQuestions - score;

      try {
        const resultRef = await addDoc(collection(db, "mockTestResults"), {
          userId: user.uid,
          testId,
          answers: finalAnswers, // Saving the correctly formatted object
          score,
          totalQuestions,
          incorrectAnswers,
          submissionReason: reason,
          isDynamic: false,
          completedAt: serverTimestamp(),
        });
        toast.success("Test submitted successfully!");
        router.push(`/mock-tests/results/${resultRef.id}`);
      } catch (error) {
        console.error(error);
        toast.error("Failed to submit your test. Please try again.");
        setTestState("in-progress");
      }
    },
    [
      selectedOptions,
      timePerQuestion,
      questions,
      currentQuestionIndex,
      questionStartTime,
      router,
      testId,
      user,
      testState,
    ]
  );

  const handleFinalSubmit = () => {
    const unanswered = questions.filter((q) => !selectedOptions[q.id]);
    const marked = [...markedForReview];

    if (unanswered.length > 0) {
      setWarningInfo({ type: "unanswered", count: unanswered.length });
      setIsWarningModalOpen(true);
    } else if (marked.length > 0) {
      setWarningInfo({ type: "review", count: marked.length });
      setIsWarningModalOpen(true);
    } else {
      forceSubmit();
    }
  };

  const goToFirstRelevantQuestion = () => {
    let firstIndex = -1;
    if (warningInfo.type === "unanswered") {
      firstIndex = questions.findIndex((q) => !selectedOptions[q.id]);
    } else if (warningInfo.type === "review") {
      const firstMarkedId = [...markedForReview][0];
      firstIndex = questions.findIndex((q) => q.id === firstMarkedId);
    }

    if (firstIndex !== -1) {
      navigateToQuestion(firstIndex);
    }
    setIsWarningModalOpen(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("You must be logged in to start a test.");
      router.push(`/mock-tests/${testId}`);
      return;
    }

    const loadTestAndCheckPermissions = async () => {
      setTestState("loading");
      try {
        const data = await getTestData(testId);
        if (!data || !data.questions || data.questions.length === 0) {
          toast.error("This test could not be loaded or has no questions.");
          setTestState("access_denied"); // Use the access denied screen
          return;
        }

        if (data.testDetails.isPremium && !isPremium) {
          toast.error("This is a premium test. Please upgrade to access.");
          setTestState("access_denied");
          return;
        }

        setTestDetails(data.testDetails);
        setQuestions(data.questions);
        setTimeLeft(data.testDetails.estimatedTime * 60);
        setTestState("in-progress");
        setQuestionStartTime(Date.now());
      } catch (error) {
        setTestState("error");
        toast.error(error.message);
        router.push("/mock-tests");
      }
    };

    if (testId && user) {
      loadTestAndCheckPermissions();
    }
  }, [testId, user, authLoading, router, isPremium]);

  useEffect(() => {
    if (testState !== "in-progress" || timeLeft <= 0) {
      if (timeLeft <= 0 && testState === "in-progress") forceSubmit();
      return;
    }
    const timerId = setInterval(
      () => setTimeLeft((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearInterval(timerId);
  }, [timeLeft, testState, forceSubmit]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testState === "in-progress") {
        toast.error(
          "You switched tabs. The test will be submitted automatically.",
          { duration: 5000 }
        );
        forceSubmit();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [testState, forceSubmit]);

  const navigateToQuestion = (newIndex) => {
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const currentQuestionId = questions[currentQuestionIndex].id;
    setTimePerQuestion((prev) => ({
      ...prev,
      [currentQuestionId]: (prev[currentQuestionId] || 0) + timeSpent,
    }));

    // NEW: Logic to show a warning on the last question
    if (newIndex === questions.length - 1 && !lastQuestionWarningShown) {
      toast.success(
        "This is the last question. Review your answers before submitting."
      );
      setLastQuestionWarningShown(true);
    }

    setCurrentQuestionIndex(newIndex);
    setQuestionStartTime(Date.now());
  };

  // FIX: This function now allows deselecting an answer.
  const handleAnswerSelect = (questionId, option) => {
    setSelectedOptions((prev) => {
      const newSelected = { ...prev };
      // If the user clicks the same option again, deselect it.
      if (newSelected[questionId] === option) {
        delete newSelected[questionId];
      } else {
        // Otherwise, select the new option.
        newSelected[questionId] = option;
      }
      return newSelected;
    });
  };

  const handleMarkForReview = () => {
    const currentQuestionId = questions[currentQuestionIndex]?.id;
    if (!currentQuestionId) return;

    const newMarkedSet = new Set(markedForReview);
    if (newMarkedSet.has(currentQuestionId)) {
      newMarkedSet.delete(currentQuestionId);
    } else {
      newMarkedSet.add(currentQuestionId);
    }
    setMarkedForReview(newMarkedSet);
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
  if (testState === "access_denied") {
    return (
      <div className='flex flex-col justify-center items-center h-screen bg-slate-100 text-center p-4'>
        <div className='mx-auto w-16 h-16 flex items-center justify-center bg-amber-100 rounded-full'>
          <Lock className='h-8 w-8 text-amber-600' />
        </div>
        <h1 className='mt-6 text-2xl font-bold text-slate-900'>
          Premium Test Locked
        </h1>
        <p className='mt-2 text-slate-700'>
          You need a premium subscription to access this test.
        </p>
        <Link
          href='/dashboard'
          className='mt-6 inline-block px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700'
        >
          Upgrade to Premium
        </Link>
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
  const isCurrentMarked = markedForReview.has(currentQuestion?.id);

  return (
    <>
      <FinalWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirmSubmit={forceSubmit}
        onGoToQuestion={goToFirstRelevantQuestion}
        warningType={warningInfo.type}
        count={warningInfo.count}
      />
      <div className='bg-slate-100 min-h-screen p-4'>
        <div className='container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8'>
          <div className='lg:col-span-8'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-xl'>
              {currentQuestion ? (
                <div>
                  <div className='flex justify-between items-start mb-4'>
                    <h2 className='text-lg font-semibold text-slate-900'>
                      Question {currentQuestionIndex + 1}{" "}
                      <span className='font-medium text-slate-600'>
                        of {questions.length}
                      </span>
                    </h2>
                    <div
                      className={`text-xl font-bold px-4 py-1 rounded-full ${
                        timeLeft < 60
                          ? "text-red-600 bg-red-100"
                          : "text-slate-800"
                      }`}
                    >
                      {`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`}
                    </div>
                  </div>
                  <SvgDisplayer
                    svgCode={currentQuestion.questionSvgCode}
                    className='w-full h-auto min-h-[12rem] border-2 border-slate-200 rounded-lg p-4 bg-slate-50 mb-6 flex items-center'
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
              <div className='flex flex-col sm:flex-row justify-between items-center mt-10 pt-6 border-t border-slate-200 gap-4'>
                <button
                  onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  className='w-full sm:w-auto px-8 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg disabled:opacity-50 hover:bg-slate-300'
                >
                  Previous
                </button>
                <button
                  onClick={handleMarkForReview}
                  className={`w-full sm:w-auto px-8 py-3 font-semibold rounded-lg transition-colors ${
                    isCurrentMarked
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                  }`}
                >
                  {isCurrentMarked ? "Unmark Review" : "Mark for Review"}
                </button>
                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleFinalSubmit}
                    disabled={testState === "submitting"}
                    className='w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-semibold rounded-lg'
                  >
                    {testState === "submitting"
                      ? "Submitting..."
                      : "Submit Test"}
                  </button>
                ) : (
                  <button
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className='w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-indigo-700'
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className='lg:col-span-4'>
            <div className='sticky top-4'>
              <QuestionPalette
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                selectedOptions={selectedOptions}
                markedForReview={markedForReview}
                onQuestionSelect={navigateToQuestion}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
