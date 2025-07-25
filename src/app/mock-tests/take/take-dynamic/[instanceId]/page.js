// src/app/mock-tests/take/take-dynamic/[instanceId]/page.js

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
} from "firebase/firestore";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import InactivityWarningModal from "@/components/ui/InactivityWarningModal"; // Import the inactivity modal

async function getTestInstance(instanceId, userId) {
  const instanceRef = doc(db, "dynamicTestInstances", instanceId);
  const fetchDoc = async () => {
    const instanceSnap = await getDoc(instanceRef);
    if (instanceSnap.exists() && instanceSnap.data().userId === userId) {
      return instanceSnap.data();
    }
    return null;
  };
  let data = await fetchDoc();
  if (!data) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    data = await fetchDoc();
  }
  return data;
}

// Helper function to check if two dates are on the same calendar day
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Helper function to check if two dates are on consecutive calendar days
const areConsecutiveTestDays = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1.toDate().setHours(0, 0, 0, 0));
  const d2 = new Date(date2.setHours(0, 0, 0, 0));
  const diffTime = d2 - d1;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

export default function TakeDynamicTestPage() {
  const [instanceData, setInstanceData] = useState(null);
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
  const [isInactivityModalOpen, setIsInactivityModalOpen] = useState(false); // State for inactivity modal
  const inactivityTimerRef = useRef(null); // Ref for the inactivity timer

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
      if (testState === "submitting" || !user || !instanceData) return;
      setTestState("submitting");

      const resultDocRef = doc(collection(db, "mockTestResults"));

      let xpGained = 0;

      const yearMonth = `${new Date().getFullYear()}-${
        new Date().getMonth() + 1
      }`;

      try {
        await runTransaction(db, async (transaction) => {
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
          const totalTimeTaken = Object.values(finalTimePerQuestion).reduce(
            (acc, time) => acc + time,
            0
          );

          const estimatedTimeInSeconds = instanceData.estimatedTime * 60;
          const suspiciousTimeThreshold = estimatedTimeInSeconds * 0.15;
          const resultData = {
            userId: user.uid,
            testId: instanceData.originalTestId,
            instanceId: instanceId, // This correctly records it as a re-take of the instance
            answers: finalAnswers,
            score,
            totalQuestions,
            incorrectAnswers,
            submissionReason: reason, // Reason can now be 'inactivity'
            isDynamic: true,
            completedAt: new Date(),
            reviewFlag:
              totalTimeTaken < suspiciousTimeThreshold
                ? "low_completion_time"
                : null,
            totalTimeTaken: totalTimeTaken,
          };

          if (isLibraryUser && userProfile?.libraryId) {
            resultData.libraryId = userProfile.libraryId;
            resultData.ownerId = userProfile.ownerId;
          }

          const userRef = doc(db, "users", user.uid);
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) {
            throw "User document not found!";
          }
          const userData = userSnap.data();
          const updates = {};
          const newBadges = [];

          const lastStreakDate = userData.lastStreakDay;
          const today = new Date();

          if (!isSameDay(lastStreakDate?.toDate(), today)) {
            if (areConsecutiveTestDays(lastStreakDate, today)) {
              updates.currentStreak = (userData.currentStreak || 0) + 1;
            } else {
              updates.currentStreak = 1;
            }
            updates.lastStreakDay = today;

            const newStreak = updates.currentStreak || userData.currentStreak;
            if (
              newStreak === 7 &&
              !userData.earnedBadges?.includes("iron_will")
            )
              newBadges.push("iron_will");
            if (
              newStreak === 15 &&
              !userData.earnedBadges?.includes("silver_resolve")
            )
              newBadges.push("silver_resolve");
            if (
              newStreak === 30 &&
              !userData.earnedBadges?.includes("master_learner")
            ) {
              newBadges.push("master_learner");
              updates.premiumCredits = increment(1);
            }
          }

          if (
            score === totalQuestions &&
            !userData.earnedBadges?.includes("perfectionist")
          ) {
            newBadges.push("perfectionist");
          }
          const timeUsedPercentage =
            totalTimeTaken / (instanceData.estimatedTime * 60);
          if (
            timeUsedPercentage < 0.5 &&
            !userData.earnedBadges?.includes("speed_demon")
          ) {
            newBadges.push("speed_demon");
          }

          if (newBadges.length > 0) {
            updates.earnedBadges = arrayUnion(...newBadges);
          }

          xpGained = 50;
          xpGained += score * 2;

          if (score / totalQuestions >= 0.8) {
            xpGained += 25;
          }

          const newXp = (userData.xp || 0) + xpGained;
          let newLevel = userData.level || 1;
          let xpForNextLevel = newLevel * 100;

          if (newXp >= xpForNextLevel) {
            newLevel++;
          }

          transaction.update(userRef, {
            xp: newXp,
            level: newLevel,
            ...updates,
          });

          transaction.set(resultDocRef, resultData);

          const analyticsRef = doc(
            db,
            "testAnalytics",
            instanceData.originalTestId
          );
          transaction.update(analyticsRef, {
            takenCount: increment(1),
            uniqueTakers: arrayUnion(user.uid),
          });
          const mockTestRef = doc(db, "mockTests", instanceData.originalTestId);
          transaction.update(mockTestRef, {
            takenCount: increment(1),
          });

          if (isLibraryUser && userProfile?.libraryId) {
            const libraryRef = doc(db, "libraries", userProfile?.libraryId);
            transaction.update(libraryRef, {
              testCompletions: arrayUnion({
                takerId: user.uid,
                testId: instanceData.originalTestId,
                completedAt: new Date(),
              }),
            });

            const monthlyCountRef = doc(
              db,
              `users/${user.uid}/monthlyTestCounts/${yearMonth}`
            );
            transaction.set(
              monthlyCountRef,
              { count: increment(1) },
              { merge: true }
            );
          }
        });

        toast.success("Test submitted successfully!");
        router.push(
          `/mock-tests/results/results-dynamic/${resultDocRef.id}?xpGained=${xpGained}`
        );
      } catch (error) {
        console.error("Error writing test results:", error);
        toast.error("Failed to submit test.");
        setTestState("in-progress");
      }
    },
    [
      instanceData,
      selectedOptions,
      timePerQuestion,
      questions,
      currentQuestionIndex,
      questionStartTime,
      router,
      user,
      instanceId,
      testState,
      isLibraryUser,
      userProfile,
    ]
  );

  // --- START: INACTIVITY TIMER LOGIC ---
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setIsInactivityModalOpen(true);
    }, 5 * 60 * 1000); // 5 minutes
  }, []);

  useEffect(() => {
    if (testState === "in-progress") {
      resetInactivityTimer();
      window.addEventListener("mousemove", resetInactivityTimer);
      window.addEventListener("keydown", resetInactivityTimer);
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
    };
  }, [testState, resetInactivityTimer]);
  // --- END: INACTIVITY TIMER LOGIC ---

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
      forceSubmit("user_submitted");
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
    if (firstIndex !== -1) navigateToQuestion(firstIndex);
    setIsWarningModalOpen(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("You must be logged in to start a test.");
      router.push(`/mock-tests/${instanceId}`);
      return;
    }

    const loadInstanceAndCheckPermissions = async () => {
      setTestState("loading");
      try {
        const data = await getTestInstance(instanceId, user.uid);
        if (!data || !data.questions || data.questions.length === 0) {
          toast.error(
            "This test instance could not be loaded or has no questions."
          );
          setTestState("access_denied");
          return;
        }

        const originalTestRef = doc(db, "mockTests", data.originalTestId);
        const originalTestSnap = await getDoc(originalTestRef);
        if (!originalTestSnap.exists()) {
          throw new Error("Could not find the original test template.");
        }
        const isTestPremium = originalTestSnap.data().isPremium;

        if (isTestPremium && !isPremium) {
          toast.error("This is a premium test. Please upgrade to access.");
          setTestState("access_denied");
          return;
        }

        setInstanceData(data);
        setQuestions(data.questions);
        setTimeLeft(data.estimatedTime * 60);
        setTestState("in-progress");
        setQuestionStartTime(Date.now());
      } catch (error) {
        setTestState("error");
        toast.error(error.message);
        router.push("/mock-tests");
      }
    };

    loadInstanceAndCheckPermissions();
  }, [instanceId, user, authLoading, router, isPremium]);

  useEffect(() => {
    if (testState !== "in-progress" || timeLeft <= 0) {
      if (timeLeft <= 0 && testState === "in-progress") {
        forceSubmit("time_up");
      }
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
        forceSubmit("tab_switched");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [testState, forceSubmit]);

  const navigateToQuestion = (newIndex) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const currentQuestionId = questions[currentQuestionIndex].id;
    setTimePerQuestion((prev) => ({
      ...prev,
      [currentQuestionId]: (prev[currentQuestionId] || 0) + timeSpent,
    }));
    if (newIndex === questions.length - 1 && !lastQuestionWarningShown) {
      toast.success(
        "This is the last question. Review your answers before submitting."
      );
      setLastQuestionWarningShown(true);
    }
    setCurrentQuestionIndex(newIndex);
    setQuestionStartTime(Date.now());
  };

  const handleAnswerSelect = (questionId, option) => {
    setSelectedOptions((prev) => {
      const newSelected = { ...prev };
      if (newSelected[questionId] === option) {
        delete newSelected[questionId];
      } else {
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
          <p className='text-xl font-bold text-red-600'>
            An Error Occurred While Loading the Test
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
      <InactivityWarningModal
        isOpen={isInactivityModalOpen}
        onConfirm={() => {
          setIsInactivityModalOpen(false);
          resetInactivityTimer();
        }}
        onIdleSubmit={() => forceSubmit("inactivity")}
      />
      <FinalWarningModal
        isOpen={isWarningModalOpen}
        onClose={() => setIsWarningModalOpen(false)}
        onConfirmSubmit={() => forceSubmit("user_submitted")}
        onGoToQuestion={goToFirstRelevantQuestion}
        warningType={warningInfo.type}
        count={warningInfo.count}
        isSubmitting={testState === "submitting"}
      />
      <div className='bg-slate-100 min-h-screen p-4'>
        <div className='container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8'>
          <div className='lg:col-span-8'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-xl'>
              {currentQuestion && (
                <div>
                  <div className='flex justify-between items-start mb-4'>
                    <h2 className='text-lg font-semibold text-slate-900'>
                      Question {currentQuestionIndex + 1} of {questions.length}
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
