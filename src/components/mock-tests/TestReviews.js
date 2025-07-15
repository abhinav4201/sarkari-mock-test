// src/components/mock-tests/TestReviews.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function TestReviews({ testId }) {
  const { user, openLoginPrompt } = useAuth(); // Use openLoginPrompt
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "reviews"),
        where("testId", "==", testId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const fetchedReviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviews(fetchedReviews);

      // Check if the current user has already left a review
      if (user) {
        setHasUserReviewed(fetchedReviews.some((r) => r.userId === user.uid));
      }
    } catch (error) {
      console.error(
        "Could not load reviews, likely a permissions issue or new collection:",
        error
      );

      // toast.error("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, [testId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openLoginPrompt(); // Prompt login if not authenticated
      return;
    }
    if (rating === 0 || comment.trim() === "")
      return toast.error("Please provide a rating and a comment.");

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        testId,
        userId: user.uid,
        userName: user.displayName,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      toast.success("Review submitted successfully!");
      setComment("");
      setRating(0);
      fetchReviews(); // Refresh reviews after submitting
    } catch (error) {
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mt-10 pt-8 border-t border-slate-200'>
      <h3 className='text-2xl font-bold text-slate-800 mb-6'>
        Reviews & Ratings
      </h3>

      {/* Review Submission Form */}
      {user && !hasUserReviewed && (
        <div className='bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8'>
          <h4 className='font-semibold text-lg text-slate-900 mb-3'>
            Leave a Review
          </h4>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-slate-950 font-medium'>
                Your Rating:
              </span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type='button'
                  key={star}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`h-7 w-7 transition-colors cursor-pointer ${
                      star <= rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300 hover:text-amber-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder='Share your experience with this test...'
              className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
              rows={3}
              required
            />
            <button
              type='submit'
              disabled={isSubmitting}
              className='px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}

      {/* Display Reviews */}
      <div className='space-y-6'>
        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className='p-4 border-b border-slate-100'>
              <div className='flex justify-between items-center'>
                <p className='font-bold text-slate-900'>{review.userName}</p>
                <div className='flex'>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className='h-4 w-4 text-amber-400 fill-amber-400'
                    />
                  ))}
                </div>
              </div>
              <p className='text-xs text-slate-500 mt-0.5'>
                {new Date(
                  review.createdAt?.seconds * 1000
                ).toLocaleDateString()}
              </p>
              <p className='text-slate-700 mt-2'>{review.comment}</p>
            </div>
          ))
        ) : (
          <p className='text-center text-slate-600 py-8'>
            No reviews yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
}
