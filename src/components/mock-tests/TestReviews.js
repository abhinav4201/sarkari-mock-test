// src/components/mock-tests/TestReviews.js

"use client";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import ReviewModal from "./ReviewModal"; // Import the new modal
import { MessageSquare } from "lucide-react";

export default function TestReviews({ testId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  // Fetch only the count of reviews to display on the button
  const fetchReviewCount = useCallback(async () => {
    try {
      const q = query(collection(db, "reviews"), where("testId", "==", testId));
      const snapshot = await getDocs(q);
      setReviewCount(snapshot.size);
    } catch (error) {
      // It's okay to fail silently here as it's not critical
      console.error("Could not load review count:", error);
    }
  }, [testId]);

  useEffect(() => {
    fetchReviewCount();
  }, [fetchReviewCount]);

  return (
    <>
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        testId={testId}
      />
      <div className='mt-10 pt-8 border-t border-slate-200'>
        <div className='flex justify-between items-center'>
          <h3 className='text-2xl font-bold text-slate-800'>
            Reviews & Ratings
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className='inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-lg hover:bg-slate-200 transition-colors'
          >
            <MessageSquare size={16} />
            Show All Reviews ({reviewCount})
          </button>
        </div>
      </div>
    </>
  );
}
