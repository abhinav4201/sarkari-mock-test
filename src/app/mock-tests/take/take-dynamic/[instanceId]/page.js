"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import QuestionPalette from "@/components/mock-tests/QuestionPalette";
import FinalWarningModal from "@/components/ui/FinalWarningModal";

async function getTestInstance(instanceId, userId) {
  const instanceRef = doc(db, "dynamicTestInstances", instanceId);
  const instanceSnap = await getDoc(instanceRef);
  if (!instanceSnap.exists() || instanceSnap.data().userId !== userId) return null;
  return instanceSnap.data();
}

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
  const [lastQuestionWarningShown, setLastQuestionWarningShown] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { instanceId } = params;

  const forceSubmit = useCallback(
    async (reason = "user_submitted") => {
      if (testState === "submitting" || !user || !instanceData) return;
      setTestState("submitting");

      const lastQuestionId = questions[currentQuestionIndex]?.id;
      let finalTimePerQuestion = { ...timePerQuestion };
      if (lastQuestionId) {
        const timeSpent = (Date.now() - questionStartTime) / 1000;
        finalTimePerQuestion[lastQuestionId] =
          (finalTimePerQuestion[lastQuestionId] || 0) + timeSpent;
      }

      // --- RESTORED: Your original, correct logic for building the answers object ---
      const finalAnswers = {};
      for (const qId in selectedOptions) {
        finalAnswers[qId] = {
          answer: selectedOptions[qId],
          timeTaken: finalTimePerQuestion[qId] || 0,
        };
      }
      // This second loop ensures unanswered questions are also recorded.
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
        const resultDocRef = await addDoc(collection(db, "mockTestResults"), {
          userId: user.uid,
          testId: instanceData.originalTestId,
          instanceId: instanceId,
          answers: finalAnswers, // Saving the correctly formatted object
          score,
          totalQuestions,
          incorrectAnswers,
          submissionReason: reason,
          isDynamic: true,
          completedAt: serverTimestamp(),
        });
        toast.success("Test submitted!");
        router.push(`/mock-tests/results/results-dynamic/${resultDocRef.id}`);
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
    if (authLoading || !user) return;

    const loadInstance = async () => {
      const data = await getTestInstance(instanceId, user.uid);
      if (data && data.questions) {
        setInstanceData(data);
        setQuestions(data.questions);
        setTimeLeft(data.estimatedTime * 60);
        setTestState("in-progress");
        setQuestionStartTime(Date.now());
      } else {
        toast.error("Could not load this test instance.");
        router.push("/mock-tests");
      }
    };
    loadInstance();
  }, [instanceId, user, authLoading, router]);

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

  if (testState === "error") {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100 text-center p-4'>
        <div>
          <p className='text-xl font-bold text-red-600'>Failed to Load Test</p>
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
