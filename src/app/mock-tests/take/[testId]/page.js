"use client";

import QuestionPalette from "@/components/mock-tests/QuestionPalette";
import FinalWarningModal from "@/components/ui/FinalWarningModal";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { getCachedTest, saveOfflineResult } from "@/lib/indexedDb";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { Lock, Timer, WifiOff } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

// Specifically gets data from Firestore when online
async function getOnlineTestData(testId) {
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

// Gamification Helpers
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const areConsecutiveTestDays = (date1, date2) => {
  if (!date1 || !date2) return false;
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(Math.abs((date1 - date2) / oneDay));
  return diffDays === 1;
};

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
  const { testId } = params;

  const forceSubmit = useCallback(
    async (reason = "user_submitted") => {
      if (testState === "submitting" || !user) return;
      setTestState("submitting");

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
        if (finalAnswers[q.id]) {
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
        testId,
        testTitle: testDetails.title,
        score,
        correctAnswers,
        incorrectAnswers,
        skippedAnswers,
        answers: finalAnswers,
        timePerQuestion: finalTimePerQuestion,
        totalTimeTaken: testDetails.estimatedTime * 60 - timeLeft,
        submittedAt: serverTimestamp(),
        reasonForSubmission: reason,
      };

      if (!navigator.onLine) {
        toast.loading("You are offline. Saving result locally...");
        try {
          await saveOfflineResult(resultData);
          toast.success("Result saved! It will sync when you're back online.", {
            duration: 5000,
          });
          router.push("/dashboard");
        } catch (error) {
          toast.error("Could not save result locally. Please try again.");
          setTestState("in-progress");
        }
        return;
      }

      const resultDocRef = doc(collection(db, "mockTestResults"));
      const userDocRef = doc(db, "users", user.uid);
      const testDocRef = doc(db, "mockTests", testId);
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
            testsTaken: arrayUnion(testId),
            xp: increment(xpGained),
            lastTestTaken: serverTimestamp(),
            testStreak: newStreak,
          });
          transaction.update(testDocRef, { takenCount: increment(1) });
        });
        toast.success("Test submitted successfully!");
        router.push(
          `/mock-tests/results/${resultDocRef.id}?xpGained=${xpGained}`
        );
      } catch (error) {
        console.error("Full Test Submission Transaction Error:", error);
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
      user,
      testId,
      testState,
      testDetails,
      isLibraryUser,
      userProfile,
      timeLeft,
    ]
  );

  const handleFinalSubmit = () => {
    const unanswered = questions.filter((q) => !selectedOptions[q.id]).length;
    if (unanswered > 0) {
      setWarningInfo({ type: "unanswered", count: unanswered });
      setIsWarningModalOpen(true);
    } else {
      forceSubmit();
    }
  };

  const goToFirstRelevantQuestion = () => {
    const firstUnanswered = questions.findIndex((q) => !selectedOptions[q.id]);
    if (firstUnanswered !== -1) {
      setCurrentQuestionIndex(firstUnanswered);
      return;
    }
    const firstMarked = questions.findIndex((q) => markedForReview.has(q.id));
    if (firstMarked !== -1) {
      setCurrentQuestionIndex(firstMarked);
      return;
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
    if (authLoading) return;
    if (!user) {
      toast.error("You must be logged in to start a test.");
      router.push(`/mock-tests/${testId}`);
      return;
    }

    const loadTestAndCheckPermissions = async () => {
      setTestState("loading");
      try {
        let data;
        if (navigator.onLine) {
          data = await getOnlineTestData(testId);
        } else {
          toast.info("You are offline. Loading test from your device.", {
            icon: <WifiOff />,
          });
          data = await getCachedTest(testId);
        }

        if (!data || !data.questions || data.questions.length === 0) {
          toast.error("This test could not be loaded or has no questions.");
          setTestState("access_denied");
          return;
        }

        const details = data.testDetails || data;
        if (details.isPremium && !isPremium) {
          toast.error("This is a premium test. Please upgrade to access.");
          setTestState("access_denied");
          return;
        }

        setTestDetails(details);
        setQuestions(data.questions);
        setTimeLeft(details.estimatedTime * 60);
        setTestState("in-progress");
        setQuestionStartTime(Date.now());
      } catch (error) {
        console.error("Error loading test:", error);
        setTestState("error");
        toast.error(
          error.message ||
            "An unexpected error occurred while loading the test."
        );
        router.push("/mock-tests");
      }
    };

    if (testId && user) {
      loadTestAndCheckPermissions();
    }
  }, [testId, user, authLoading, router, isPremium]);

  useEffect(() => {
    if (testState !== "in-progress") return;
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
  }, [testState, forceSubmit]);

  useEffect(() => {
    if (
      currentQuestionIndex === questions.length - 1 &&
      !lastQuestionWarningShown
    ) {
      toast("You are on the last question.", { icon: "🔔" });
      setLastQuestionWarningShown(true);
    }
  }, [currentQuestionIndex, questions.length, lastQuestionWarningShown]);

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

  if (testState === "loading" || authLoading) {
    return <div className='text-center py-20'>Loading Test...</div>;
  }
  if (testState === "access_denied") {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-4'>
        <Lock className='w-16 h-16 text-red-500 mb-4' />
        <h1 className='text-2xl font-bold'>Access Denied</h1>
        <p className='text-slate-600 mt-2'>
          You do not have permission to take this test.
        </p>
        <Link href='/mock-tests' legacyBehavior>
          <a className='mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700'>
            Back to Test Hub
          </a>
        </Link>
      </div>
    );
  }
  if (testState === "error" || !currentQuestion) {
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
              {testDetails.title}
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
              disabled={testState === "submitting"}
              className='w-full px-6 py-3 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 disabled:bg-green-400'
            >
              {testState === "submitting" ? "Submitting..." : "Submit Test"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
