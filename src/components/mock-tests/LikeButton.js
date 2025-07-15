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
  const { user, openLoginPrompt, favoriteTests } = useAuth();
  const [likes, setLikes] = useState(initialLikeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (favoriteTests) {
      setIsLiked(favoriteTests.includes(testId));
    }
  }, [favoriteTests, testId]);

  const handleLike = async () => {
    console.log("--- Like Button Clicked ---");
    if (!user) {
      console.log("User not logged in, opening prompt.");
      openLoginPrompt();
      return;
    }
    if (isLoading) {
      console.log("Already loading, exiting.");
      return;
    }
    setIsLoading(true);

    const newLikedState = !isLiked;
    console.log(`Attempting to set liked state to: ${newLikedState}`);

    // Optimistic UI update
    setLikes((prev) => (newLikedState ? prev + 1 : prev - 1));
    setIsLiked(newLikedState);

    const userRef = doc(db, "users", user.uid);
    const testRef = doc(db, "mockTests", testId);

    try {
      console.log("Starting Firestore transaction...");
      await runTransaction(db, async (transaction) => {
        console.log("Inside transaction. Getting test document...");
        const testDoc = await transaction.get(testRef);
        if (!testDoc.exists()) {
          throw new Error("Test document not found!");
        }
        console.log("Test document found.");

        console.log("Updating user's favoriteTests array...");
        transaction.update(userRef, {
          favoriteTests: newLikedState
            ? arrayUnion(testId)
            : arrayRemove(testId),
        });

        console.log("Updating test's likeCount...");
        const newLikeCount =
          (testDoc.data().likeCount || 0) + (newLikedState ? 1 : -1);
        transaction.update(testRef, { likeCount: newLikeCount });
        console.log("Transaction updates prepared.");
      });
      console.log("--- Transaction Successful ---");
    } catch (e) {
      console.error("--- TRANSACTION FAILED ---");
      console.error("Firebase Error:", e); // This will log the specific permission error
      toast.error("An error occurred. Please try again.");

      // Revert UI on failure
      setLikes(likes);
      setIsLiked(isLiked);
    } finally {
      setIsLoading(false);
      console.log("--- handleLike function finished ---");
    }
  };

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
