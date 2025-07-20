// src/app/admin/question-review/page.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  doc, // Import doc for API call setup
} from "firebase/firestore";
import toast from "react-hot-toast";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { CheckCircle, XCircle, Hourglass, Eye, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Needed for ID token

const PAGE_SIZE = 5; // Number of questions to load at a time

export default function UserQuestionReviewPage() {
  const { user } = useAuth(); // Get user for authorization
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [questionToAction, setQuestionToAction] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchQuestions = useCallback(
    async (loadMore = false) => {
      if (!loadMore) {
        setIsLoading(true);
        setQuestions([]);
        setLastDoc(null);
        setHasMore(true);
      } else {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
      }

      try {
        const qConstraints = [
          collection(db, "mockTestQuestions"),
          where("status", "==", "pending_review"), // Only fetch questions awaiting review
          orderBy("createdAt", "asc"), // Oldest first
          limit(PAGE_SIZE),
        ];

        if (loadMore && lastDoc) {
          qConstraints.push(startAfter(lastDoc));
        }

        const q = query(...qConstraints);
        const snapshot = await getDocs(q);

        const fetchedQuestions = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setQuestions((prev) =>
          loadMore ? [...prev, ...fetchedQuestions] : fetchedQuestions
        );
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(fetchedQuestions.length === PAGE_SIZE);
      } catch (error) {
        toast.error("Failed to fetch questions for review.");
        console.error("Error fetching review questions:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [lastDoc, hasMore, isLoadingMore]
  );

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAction = async (question, decision) => {
    setQuestionToAction(question);
    setActionType(decision);
    setIsConfirmModalOpen(true);
  };

  const confirmAction = async () => {
    if (!user || !questionToAction || !actionType) return;

    setIsProcessingAction(true);
    const loadingToast = toast.loading(
      `${actionType === "approve" ? "Approving" : "Rejecting"} question...`
    );

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/questions/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          questionId: questionToAction.id,
          decision: actionType,
          // Pass necessary question data for approval if applicable
          questionData:
            actionType === "approve"
              ? {
                  questionSvgCode: questionToAction.questionSvgCode,
                  options: questionToAction.options,
                  correctAnswer: questionToAction.correctAnswer,
                  explanation: questionToAction.explanation,
                  topic: questionToAction.topic, // Make sure topic/subject are available here
                  subject: questionToAction.subject, // Make sure topic/subject are available here
                  isPremium: questionToAction.isPremium,
                }
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message, { id: loadingToast });
      // Remove the processed question from the list
      setQuestions((prev) => prev.filter((q) => q.id !== questionToAction.id));
      // If there are no more questions on the current page, try to load more
      if (questions.length === 1 && hasMore) {
        // If only one item left, and we know there could be more
        fetchQuestions(false); // Force a refresh from start to ensure new questions are loaded
      } else {
        fetchQuestions(false); // Reload current page, or load next if applicable
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsProcessingAction(false);
      setIsConfirmModalOpen(false);
      setQuestionToAction(null);
      setActionType(null);
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmAction}
        title={`${actionType === "approve" ? "Approve" : "Reject"} Question?`}
        message={`Are you sure you want to ${actionType} this question?`}
        confirmText={actionType === "approve" ? "Approve" : "Reject"}
        isLoading={isProcessingAction}
      />

      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          User Question Review
        </h1>
        <p className='mb-8 text-slate-600 max-w-4xl'>
          Review questions submitted by users for their tests. Approved
          questions can be added to the central Question Bank for use in dynamic
          tests.
        </p>

        {isLoading ? (
          <p className='text-center p-8 text-slate-600'>
            Loading questions for review...
          </p>
        ) : questions.length > 0 ? (
          <div className='space-y-6'>
            {questions.map((q) => (
              <div
                key={q.id}
                className='p-4 border border-slate-200 rounded-lg bg-white'
              >
                <div className='flex flex-wrap gap-2 items-center mb-2'>
                  <span className='font-bold text-slate-900'>
                    Question from:
                  </span>
                  <span className='px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold'>
                    {q.testId} {/* Display parent test ID */}
                  </span>
                  {q.isPremium && (
                    <span className='px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold'>
                      Premium
                    </span>
                  )}
                  <span className='px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold'>
                    {q.createdAt?.toDate
                      ? new Date(q.createdAt.toDate()).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>

                <SvgDisplayer
                  svgCode={q.questionSvgCode}
                  className='mt-2 h-auto min-h-[10rem] rounded-md border bg-slate-50 flex items-center'
                />
                <ul className='text-sm space-y-1 mt-2'>
                  {q.options.map((opt, i) => (
                    <li
                      key={i}
                      className={`flex items-center ${
                        opt === q.correctAnswer
                          ? "font-bold text-green-700"
                          : "text-slate-800"
                      }`}
                    >
                      {opt === q.correctAnswer && (
                        <CheckCircle className='w-4 h-4 mr-1 text-green-500' />
                      )}
                      {opt}
                    </li>
                  ))}
                </ul>
                <div className='mt-3 text-xs font-semibold text-slate-500 flex flex-wrap gap-x-4'>
                  <span>Topic: {q.topic || "N/A"}</span>
                  <span>Subject: {q.subject || "N/A"}</span>
                </div>
                {q.explanation && (
                  <div className='mt-3 p-2 bg-slate-50 rounded-md border text-sm text-slate-700'>
                    <span className='font-bold'>Explanation:</span>{" "}
                    {q.explanation}
                  </div>
                )}

                <div className='mt-4 flex gap-2 justify-end'>
                  <button
                    onClick={() => handleAction(q, "approve")}
                    disabled={isProcessingAction}
                    className='px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center gap-1.5'
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(q, "reject")}
                    disabled={isProcessingAction}
                    className='px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center gap-1.5'
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-12 bg-white rounded-xl shadow border'>
            <Hourglass className='mx-auto h-12 w-12 text-slate-400' />
            <h3 className='mt-2 text-lg font-semibold text-slate-900'>
              No questions awaiting review.
            </h3>
            <p className='mt-1 text-sm text-slate-500'>
              New user-submitted questions will appear here.
            </p>
          </div>
        )}

        {hasMore && (
          <div className='text-center mt-6'>
            <button
              onClick={() => fetchQuestions(true)}
              disabled={isLoadingMore}
              className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50'
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
