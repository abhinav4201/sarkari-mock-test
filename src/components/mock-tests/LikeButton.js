"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LikeButton({ testId, initialLikeCount }) {
  // Your custom hook for auth context is the correct approach.
  const { user, openLoginPrompt } = useAuth();

  // Initialize state with the prop, or a random number as a fallback.
  const [likes, setLikes] = useState(
    initialLikeCount || Math.floor(10000 + Math.random() * 5000)
  );
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // This `hasMounted` state is the correct way to prevent hydration
  // errors in Next.js when using localStorage.
  const [hasMounted, setHasMounted] = useState(false);

  const storageKey = `liked-test-${testId}`;

  // This effect correctly checks localStorage after the component mounts on the client.
  useEffect(() => {
    setHasMounted(true);
    const userHasLiked = localStorage.getItem(storageKey) === "true";
    setIsLiked(userHasLiked);
  }, [storageKey]);

  const handleLike = async () => {
    // This is the essential check to prompt login.
    if (!user) {
      openLoginPrompt();
      return;
    }
    if (isLoading) return;
    setIsLoading(true);

    const testRef = doc(db, "mockTests", testId);
    const newLikedState = !isLiked;

    // Your optimistic UI update is perfect. The UI feels instant.
    setLikes((prev) => (newLikedState ? prev + 1 : prev - 1));
    setIsLiked(newLikedState);
    if (newLikedState) {
      localStorage.setItem(storageKey, "true");
    } else {
      localStorage.removeItem(storageKey);
    }

    try {
      // Using a transaction is the most robust way to handle read-then-write operations.
      // This was failing because of the security rule, not because of your code.
      await runTransaction(db, async (transaction) => {
        const testDoc = await transaction.get(testRef);
        if (!testDoc.exists()) throw new Error("Test not found!");

        const data = testDoc.data();
        // This correctly handles cases where 'likeCount' might not exist on old documents.
        let currentDbCount = data.likeCount;
        if (currentDbCount === undefined || currentDbCount === null) {
          currentDbCount = Math.floor(10000 + Math.random() * 5000);
        }

        const newDbCount = newLikedState
          ? currentDbCount + 1
          : currentDbCount - 1;

        // This update will now be allowed by the corrected security rule.
        transaction.update(testRef, { likeCount: newDbCount });
      });
    } catch (e) {
      // Your error handling correctly reverts the UI if the transaction fails.
      toast.error("Could not update like count.");
      setLikes(likes); // Revert state
      setIsLiked(isLiked); // Revert state
      if (isLiked) {
        localStorage.setItem(storageKey, "true");
      } else {
        localStorage.removeItem(storageKey);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // This server-side placeholder is essential for avoiding hydration errors.
  if (!hasMounted) {
    return (
      <button
        disabled={true}
        className='flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-600 opacity-70'
      >
        <Heart className='h-4 w-4' />
        <span>{(initialLikeCount || 0).toLocaleString()}</span>
      </button>
    );
  }

  // Your final JSX with dynamic styling is clean and effective.
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
