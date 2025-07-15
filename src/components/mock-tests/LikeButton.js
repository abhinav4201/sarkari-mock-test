// src/components/mock-tests/LikeButton.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from "firebase/firestore";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LikeButton({ testId, initialLikeCount }) {
  // We now get the user's favorite tests directly from our updated AuthContext
  const { user, openLoginPrompt, favoriteTests } = useAuth();

  const [likes, setLikes] = useState(initialLikeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // This effect will now react to changes in the global favoriteTests state
  useEffect(() => {
    if (favoriteTests) {
      setIsLiked(favoriteTests.includes(testId));
    }
  }, [favoriteTests, testId]);

  const handleLike = async () => {
    if (!user) {
      openLoginPrompt();
      return;
    }
    if (isLoading) return;
    setIsLoading(true);

    const newLikedState = !isLiked;

    // Optimistic UI update for a snappy feel
    setLikes((prev) => (newLikedState ? prev + 1 : prev - 1));
    setIsLiked(newLikedState);

    const userRef = doc(db, "users", user.uid);
    const testRef = doc(db, "mockTests", testId);

    try {
      // Perform both updates in a single transaction for data integrity
      await runTransaction(db, async (transaction) => {
        // Update the user's favorites list
        transaction.update(userRef, {
          favoriteTests: newLikedState
            ? arrayUnion(testId)
            : arrayRemove(testId),
        });

        // Update the test's like count
        const testDoc = await transaction.get(testRef);
        if (!testDoc.exists()) throw new Error("Test not found!");
        const newLikeCount =
          (testDoc.data().likeCount || 0) + (newLikedState ? 1 : -1);
        transaction.update(testRef, { likeCount: newLikeCount });
      });
    } catch (e) {
      toast.error("An error occurred. Please try again.");
      // Revert UI on failure
      setLikes(likes);
      setIsLiked(isLiked);
    } finally {
      setIsLoading(false);
    }
  };

  // The JSX for the button remains the same
  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
        isLiked
          ? "bg-red-100 text-red-600"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      <Heart
        className={`h-4 w-4 ${isLiked ? "text-red-500 fill-current" : ""}`}
      />
      <span>{likes.toLocaleString()}</span>
    </button>
  );
}
