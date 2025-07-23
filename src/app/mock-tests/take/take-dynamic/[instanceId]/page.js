"use client";

import QuestionPalette from "@/components/mock-tests/QuestionPalette";
import FinalWarningModal from "@/components/ui/FinalWarningModal";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { Lock, Timer, WifiOff } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

async function getTestInstance(instanceId, userId) {
  const instanceRef = doc(db, "testInstances", instanceId);
  const instanceSnap = await getDoc(instanceRef);

  if (!instanceSnap.exists() || instanceSnap.data().userId !== userId) {
    throw new Error("Invalid or expired test session.");
  }
  return instanceSnap.data();
}

export default function TakeDynamicTestPage() {
  const [instance, setInstance] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningInfo, setWarningInfo] = useState({ type: null, count: 0 });
  const [lastQuestionWarningShown, setLastQuestionWarningShown] =
    useState(false);

  const {
    user,
    loading: authLoading,
    isPremium,
    isLibraryUser,
    userProfile,
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { instanceId } = params;

  const forceSubmit = useCallback(
    async (reason = "user_submitted") => {
      if (submitting) return;
      setSubmitting(true);

      const finalAnswers = { ...selectedOptions };
      const finalTimePerQuestion = { ...timePerQuestion };
      const elapsedTime = Date.now() - questionStartTime;
      finalTimePerQuestion[questions[currentQuestionIndex].id] =
        (finalTimePerQuestion[questions[currentQuestionIndex].id] || 0) +
        elapsedTime;

      let score = 0;
      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let skippedAnswers = 0;

      questions.forEach((q) => {
        if (finalAnswers[q.id] != null) {
          if (finalAnswers[q.id] === q.correctOption) {
            score += 4;
            correctAnswers++;
          } else {
            score -= 1;
            incorrectAnswers++;
          }
        } else {
          skippedAnswers++;
        }
      });

      const resultData = {
        userId: user.uid,
        testId: instance.sourceTestId,
        testTitle: instance.testTitle,
        score,
        correctAnswers,
        incorrectAnswers,
        skippedAnswers,
        answers: finalAnswers,
        timePerQuestion: finalTimePerQuestion,
        totalTimeTaken: instance.estimatedTime * 60 - timeLeft,
        submittedAt: serverTimestamp(),
        reasonForSubmission: reason,
        isDynamic: true,
      };

      const resultDocRef = doc(collection(db, "mockTestResults"));
      const userDocRef = doc(db, "users", user.uid);
      const testDocRef = doc(db, "mockTests", instance.sourceTestId);
      const instanceDocRef = doc(db, "testInstances", instanceId);
      let xpGained = 0;

      try {
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userDocRef);
          if (!userDoc.exists()) throw "User document does not exist!";
          const userData = userDoc.data();

          const baseXP = 50;
          const performanceBonus = Math.max(0, correctAnswers * 10);
          xpGained = baseXP + performanceBonus;

          const lastTestDate = userData.lastTestTaken?.toDate();
          const now = new Date();
          let newStreak = userData.testStreak || 0;
          if (lastTestDate && isSameDay(lastTestDate, now)) {
            newStreak = newStreak;
          } else if (
            lastTestDate &&
            areConsecutiveTestDays(lastTestDate, now)
          ) {
            newStreak++;
          } else {
            newStreak = 1;
          }

          transaction.set(resultDocRef, { ...resultData, id: resultDocRef.id });
          transaction.update(userDocRef, {
            testsTaken: arrayUnion(instance.sourceTestId),
            xp: increment(xpGained),
            lastTestTaken: serverTimestamp(),
            testStreak: newStreak,
          });
          transaction.update(testDocRef, { takenCount: increment(1) });
          transaction.update(instanceDocRef, { status: "completed" });
        });
        toast.success("Test submitted successfully!");
        router.push(
          `/mock-tests/results/${resultDocRef.id}?xpGained=${xpGained}`
        );
      } catch (error) {
        console.error("Full Test Submission Transaction Error:", error);
        toast.error("Failed to submit your test. Please try again.");
        setSubmitting(false);
      }
    },
    [
      selectedOptions,
      timePerQuestion,
      questions,
      currentQuestionIndex,
      questionStartTime,
      router,
      user,
      instance,
      instanceId,
      submitting,
      isLibraryUser,
      userProfile,
      timeLeft,
    ]
  );

  const handleFinalSubmit = () => {
    const unanswered = questions.filter(
      (q) => selectedOptions[q.id] == null
    ).length;
    if (unanswered > 0) {
      setWarningInfo({ type: "unanswered", count: unanswered });
      setIsWarningModalOpen(true);
    } else {
      forceSubmit();
    }
  };

  const handleNavigation = (newIndex) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
    const elapsedTime = Date.now() - questionStartTime;
    const qId = questions[currentQuestionIndex].id;
    setTimePerQuestion((prev) => ({
      ...prev,
      [qId]: (prev[qId] || 0) + elapsedTime,
    }));
    setCurrentQuestionIndex(newIndex);
    setQuestionStartTime(Date.now());
  };

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
      setLoading(false);
      return;
    }

    if (authLoading) return;
    if (!user) {
      toast.error("You must be logged in to start a test.");
      router.push(`/mock-tests`);
      return;
    }

    const loadInstanceAndCheckPermissions = async () => {
      try {
        const testInstance = await getTestInstance(instanceId, user.uid);
        if (testInstance.status !== "active") {
          throw new Error("This test session has already been completed.");
        }
        setInstance(testInstance);
        setQuestions(testInstance.questions);
        setTimeLeft(testInstance.estimatedTime * 60);
      } catch (error) {
        toast.error(error.message);
        router.push("/mock-tests");
      } finally {
        setLoading(false);
      }
    };

    loadInstanceAndCheckPermissions();
  }, [instanceId, user, authLoading, router]);

  useEffect(() => {
    if (loading || submitting || isOffline) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          forceSubmit("time_up");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting, forceSubmit, isOffline]);

  const currentQuestion = questions[currentQuestionIndex];
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleOptionSelect = (qId, optionIndex) => {
    setSelectedOptions((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  const handleMarkForReview = () => {
    const qId = currentQuestion.id;
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(qId)) newSet.delete(qId);
      else newSet.add(qId);
      return newSet;
    });
  };

  const clearSelection = () => {
    const qId = currentQuestion.id;
    setSelectedOptions((prev) => {
      const newOptions = { ...prev };
      delete newOptions[qId];
      return newOptions;
    });
  };

  if (loading || authLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p className='text-lg font-medium text-slate-800'>
          Preparing Your Dynamic Test...
        </p>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className='flex flex-col justify-center items-center h-screen bg-slate-100 text-center p-4'>
        <WifiOff className='h-16 w-16 text-red-500 mb-4' />
        <h1 className='text-2xl font-bold'>Offline Mode</h1>
        <p className='mt-2 text-slate-700'>
          Dynamic tests require an internet connection and cannot be taken
          offline.
        </p>
        <div className='mt-6'>
          <Link
            href='/dashboard'
            className='px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700'
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!instance || !currentQuestion) {
    return (
      <div className='text-center py-20'>
        An error occurred. Please go back and try again.
      </div>
    );
  }

  return (
    <>
      <FinalWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirm={() => {
          setIsWarningModalOpen(false);
          forceSubmit();
        }}
        warningInfo={warningInfo}
      />
      <div className='flex flex-col lg:flex-row h-screen bg-slate-100 font-sans'>
        <div className='flex-1 p-4 lg:p-8 flex flex-col'>
          <header className='mb-4'>
            <h1 className='text-xl lg:text-2xl font-bold text-slate-800'>
              {instance.testTitle}
            </h1>
            <div className='flex items-center justify-between text-sm text-slate-600 mt-2'>
              <p>
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <div
                className={`flex items-center gap-2 font-bold ${
                  timeLeft < 300 ? "text-red-500" : "text-slate-800"
                }`}
              >
                <Timer size={20} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </header>
          <div className='bg-white p-6 rounded-lg shadow-md flex-1 overflow-y-auto'>
            <h2 className='text-lg font-semibold mb-4 text-slate-900'>
              {currentQuestion.text}
            </h2>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt='Question visual'
                className='my-4 rounded-lg max-w-full'
              />
            )}
            {currentQuestion.svg && (
              <SvgDisplayer svgXML={currentQuestion.svg} />
            )}
            <div className='space-y-3'>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(currentQuestion.id, index)}
                  className={`flex items-center w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                                        ${
                                          selectedOptions[
                                            currentQuestion.id
                                          ] === index
                                            ? "bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300"
                                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                                        }`}
                >
                  <span
                    className={`font-bold mr-4 ${
                      selectedOptions[currentQuestion.id] === index
                        ? "text-indigo-600"
                        : "text-slate-500"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span
                    className={`${
                      selectedOptions[currentQuestion.id] === index
                        ? "text-slate-900"
                        : "text-slate-800"
                    }`}
                  >
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <footer className='mt-4 flex flex-wrap gap-2 justify-between'>
            <button
              onClick={() => handleNavigation(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className='px-6 py-2 bg-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-slate-400 disabled:opacity-50'
            >
              Previous
            </button>
            <div className='flex gap-2'>
              <button
                onClick={handleMarkForReview}
                className={`px-4 py-2 font-semibold rounded-lg ${
                  markedForReview.has(currentQuestion.id)
                    ? "bg-yellow-400 text-yellow-900"
                    : "bg-slate-300 text-slate-800"
                }`}
              >
                {markedForReview.has(currentQuestion.id)
                  ? "Unmark Review"
                  : "Mark for Review"}
              </button>
              <button
                onClick={clearSelection}
                className='px-4 py-2 bg-slate-300 text-slate-800 font-semibold rounded-lg'
              >
                Clear
              </button>
            </div>
            <button
              onClick={() => handleNavigation(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === questions.length - 1}
              className='px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50'
            >
              Next
            </button>
          </footer>
        </div>
        <div className='w-full lg:w-80 bg-white p-4 lg:p-6 border-t lg:border-l border-slate-200 flex flex-col'>
          <QuestionPalette
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            selectedOptions={selectedOptions}
            markedForReview={markedForReview}
            onQuestionSelect={handleNavigation}
          />
          <div className='mt-auto pt-4'>
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className='w-full px-6 py-3 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 disabled:bg-green-400'
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
