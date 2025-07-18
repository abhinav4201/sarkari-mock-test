"use client";

import Modal from "@/components/ui/Modal";
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
  limit,
  startAfter,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { Star, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import ConfirmationModal from "../ui/ConfirmationModal";

const PAGE_SIZE = 5;

const ReplyForm = ({ reviewId, onActionCompletes }) => {
  const { user, openLoginPrompt } = useAuth();
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!user) return openLoginPrompt();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ replyText }),
      });
      if (!res.ok)
        throw new Error((await res.json()).message || "Server error");
      toast.success("Reply posted!");
      setReplyText("");
      if (onActionCompletes) onActionCompletes();
    } catch (error) {
      toast.error(`Failed to post reply: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className='mt-4 text-center'>
        <button
          onClick={openLoginPrompt}
          className='text-sm font-semibold text-indigo-600 hover:underline'
        >
          Login to reply
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleReplySubmit} className='mt-4 flex gap-2'>
      <input
        type='text'
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder='Write a public reply...'
        className='w-full p-2 border rounded-md text-slate-800'
      />
      <button
        type='submit'
        disabled={isSubmitting}
        className='px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50'
      >
        {isSubmitting ? "..." : "Reply"}
      </button>
    </form>
  );
};

const ReviewItem = ({ review, onRefreshNeeded }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);

  const fetchReplies = useCallback(async () => {
    if (!review.id) return;
    const repliesQuery = query(
      collection(db, `reviews/${review.id}/replies`),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(repliesQuery);
    setReplies(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }, [review.id]);

  useEffect(() => {
    if (showReplies) {
      fetchReplies();
    }
  }, [showReplies, fetchReplies]);

  return (
    <div className='p-4 border-b border-slate-100'>
      <p className='font-bold text-slate-900'>{review.userName}</p>
      <div className='flex mt-1'>
        {[...Array(review.rating)].map((_, i) => (
          <Star key={i} className='h-4 w-4 text-amber-400 fill-amber-400' />
        ))}
      </div>
      <p className='text-xs text-slate-500 mt-0.5'>
        {new Date(review.createdAt?.seconds * 1000).toLocaleDateString()}
      </p>
      <p className='text-slate-700 mt-2'>{review.comment}</p>
      <button
        onClick={() => setShowReplies(!showReplies)}
        className='text-sm font-semibold text-indigo-600 mt-2'
      >
        {showReplies ? "Hide" : "View"} Replies ({review.replyCount || 0})
      </button>
      {showReplies && (
        <div className='mt-4 pl-6 border-l-2 border-slate-200 space-y-3'>
          {replies.map((reply) => (
            <div key={reply.id} className='relative group'>
              <p className='font-bold text-sm text-slate-800'>
                {reply.authorName}
              </p>
              <p className='text-xs text-slate-500'>
                {new Date(reply.createdAt?.seconds * 1000).toLocaleDateString()}
              </p>
              <p className='text-slate-600 text-sm mt-1'>{reply.text}</p>
            </div>
          ))}
          <ReplyForm reviewId={review.id} onActionCompletes={onRefreshNeeded} />
        </div>
      )}
    </div>
  );
};

export default function ReviewModal({
  isOpen,
  onClose,
  testId,
  onReviewSubmitSuccess,
}) {
  const { user, openLoginPrompt } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReviews = useCallback(
    async (loadMore = false) => {
      if (loadMore && !hasMore) return;
      if (!loadMore) setLoading(true);
      else setLoadingMore(true);

      try {
        const queryConstraints = [
          where("testId", "==", testId),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];
        if (loadMore && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }
        const q = query(collection(db, "reviews"), ...queryConstraints);
        const snapshot = await getDocs(q);
        const fetchedReviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(fetchedReviews.length === PAGE_SIZE);

        setReviews((prev) =>
          loadMore ? [...prev, ...fetchedReviews] : fetchedReviews
        );

        if (user && !loadMore) {
          setHasUserReviewed(fetchedReviews.some((r) => r.userId === user.uid));
        }
      } catch (error) {
        toast.error("Could not load reviews.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [testId, user, hasMore, lastDoc]
  );

  const handleRefresh = useCallback(() => {
    fetchReviews(false);
    if (onReviewSubmitSuccess) {
      onReviewSubmitSuccess();
    }
  }, [fetchReviews, onReviewSubmitSuccess]);

  useEffect(() => {
    if (isOpen) {
      handleRefresh();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return openLoginPrompt();
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
        replyCount: 0,
      });
      toast.success("Review submitted!");
      setComment("");
      setRating(0);
      handleRefresh();
    } catch (error) {
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Reviews & Ratings'>
      <div className='flex flex-col max-h-[80vh]'>
        {user && !loading && !hasUserReviewed && (
          <div className='flex-shrink-0 p-4 border-b border-slate-200 bg-slate-50'>
            <h4 className='font-semibold text-lg'>Leave a Review</h4>
            <form onSubmit={handleSubmit} className='space-y-4 mt-3'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>Your Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type='button'
                    key={star}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
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
                placeholder='Share your experience...'
                className='w-full p-3 border rounded-lg'
                rows={3}
                required
              />
              <button
                type='submit'
                disabled={isSubmitting}
                className='px-6 py-2 bg-indigo-600 text-white rounded-lg'
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        )}
        <div className='flex-grow overflow-y-auto p-2'>
          {loading ? (
            <p className='text-center p-8'>Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onRefreshNeeded={handleRefresh}
              />
            ))
          ) : (
            <p className='text-center text-slate-600 py-8'>No reviews yet.</p>
          )}
          {hasMore && !loading && (
            <div className='text-center p-4'>
              <button
                onClick={() => fetchReviews(true)}
                disabled={loadingMore}
                className='px-6 py-2 bg-slate-200 rounded-lg'
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
