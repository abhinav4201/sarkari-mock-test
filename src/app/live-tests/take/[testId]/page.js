"use client";

import QuestionPalette from "@/components/mock-tests/QuestionPalette";
import FinalWarningModal from "@/components/ui/FinalWarningModal";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  increment,
  arrayUnion, // <-- Import arrayUnion
  where,
} from "firebase/firestore";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

// Fetches the test data based on the source test ID
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

// --- Helper functions for gamification (add these) ---
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const areConsecutiveTestDays = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1.toDate().setHours(0, 0, 0, 0));
    const d2 = new Date(date2.setHours(0, 0, 0, 0));
    const diffTime = d2 - d1;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
};

export default function TakeLiveTestPage() {
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

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { testId } = params; // This is the sourceTestId for the live event

  const forceSubmit = useCallback(
    async (reason = "user_submitted") => {
      if (testState === "submitting" || !user) return;
      setTestState("submitting");

      // --- KEY DIFFERENCE #1: Save to a different collection ---
      const resultDocRef = doc(collection(db, "liveTestResults"));
      let xpGained = 0; 

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
          questions.forEach((q) => {
            finalAnswers[q.id] = {
              answer: selectedOptions[q.id] || null,
              timeTaken: finalTimePerQuestion[q.id] || 0,
            };
          });

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
          const totalTimeTaken = Object.values(finalTimePerQuestion).reduce(
            (acc, time) => acc + time,
            0
          );

          const resultData = {
            userId: user.uid,
            userName: user.displayName, // Store name for leaderboard
            testId: testId, // The source test ID
            liveTestId: "live_test_id_placeholder", // In a full implementation, you'd pass the actual live test ID here
            answers: finalAnswers,
            score,
            totalQuestions,
            submissionReason: reason,
            completedAt: serverTimestamp(),
            totalTimeTaken: totalTimeTaken,
          };

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
            totalTimeTaken / (testDetails.estimatedTime * 60);
          if (
            timeUsedPercentage < 0.5 &&
            !userData.earnedBadges?.includes("speed_demon")
          ) {
            newBadges.push("speed_demon");
          }

          if (newBadges.length > 0) {
            updates.earnedBadges = arrayUnion(...newBadges);
          }

          xpGained = 50; // Base XP
          xpGained += score * 2; // XP for correct answers
          if (score / totalQuestions >= 0.8) {
            xpGained += 25; // Bonus XP
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
        });

        toast.success("Test submitted successfully! Redirecting to results...");
        // --- KEY DIFFERENCE #2: Redirect to the special results page ---
        router.push(
          `/live-tests/results/${resultDocRef.id}?xpGained=${xpGained}`
        );
      } catch (error) {
        console.error("Error writing live test results:", error);
        toast.error("Failed to submit your test.");
        setTestState("in-progress");
      }
    },
    [
      testState,
      user,
      questions,
      currentQuestionIndex,
      questionStartTime,
      selectedOptions,
      timePerQuestion,
      testId,
      router,
    ]
  );

  // All other functions (handleFinalSubmit, navigateToQuestion, handleAnswerSelect, etc.) are identical
  // to the ones in your regular test-taking page. We include them here for completeness.

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
      toast.error("You must be logged in to take a live test.");
      router.push(`/live-tests`);
      return;
    }

    const loadTest = async () => {
      setTestState("loading");
      try {
        const data = await getTestData(testId);
        if (!data || !data.questions || data.questions.length === 0) {
          toast.error("This test could not be loaded or has no questions.");
          setTestState("error");
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
        router.push("/live-tests");
      }
    };
    loadTest();
  }, [testId, user, authLoading, router]);

  useEffect(() => {
    if (testState !== "in-progress" || timeLeft <= 0) {
      if (timeLeft <= 0 && testState === "in-progress") forceSubmit("time_up");
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
        toast.error("Tab switched. Test submitted automatically.", {
          duration: 5000,
        });
        forceSubmit("tab_switched");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
      if (newSelected[questionId] === option) delete newSelected[questionId];
      else newSelected[questionId] = option;
      return newSelected;
    });
  };

  const handleMarkForReview = () => {
    const currentQuestionId = questions[currentQuestionIndex]?.id;
    if (!currentQuestionId) return;
    const newMarkedSet = new Set(markedForReview);
    if (newMarkedSet.has(currentQuestionId))
      newMarkedSet.delete(currentQuestionId);
    else newMarkedSet.add(currentQuestionId);
    setMarkedForReview(newMarkedSet);
  };

  if (testState === "loading" || authLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p>Loading Live Test...</p>
      </div>
    );
  }
  if (testState === "error") {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p>Error loading test.</p>
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
        onConfirmSubmit={() => forceSubmit("user_submitted")}
        onGoToQuestion={goToFirstRelevantQuestion}
        warningType={warningInfo.type}
        count={warningInfo.count}
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
