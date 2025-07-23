"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Trophy,
  Clock,
  Users,
  IndianRupee,
  PlayCircle,
  Lock,
  Gift,
} from "lucide-react";
import Link from "next/link";

export default function LiveTestCard({ test }) {
  const { user, openLoginPrompt } = useAuth();
  const [status, setStatus] = useState("loading");
  const [hasJoined, setHasJoined] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const startTime = test.startTime.toDate();
      const endTime = test.endTime.toDate();

      if (now < startTime) setStatus("Scheduled");
      else if (now >= startTime && now <= endTime) setStatus("Live");
      else setStatus("Completed");
    };

    const checkParticipation = async () => {
      if (user) {
        const participantRef = doc(
          db,
          `liveTests/${test.id}/participants`,
          user.uid
        );
        const docSnap = await getDoc(participantRef);
        setHasJoined(docSnap.exists());
      }
    };

    checkStatus();
    checkParticipation();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [test, user]);

  const handleJoin = async () => {
    if (!user) return openLoginPrompt();

    const toastId = toast.loading("Processing your entry...");
    try {
      const idToken = await user.getIdToken();

      if (test.isFree) {
        const res = await fetch("/api/live-tests/join-free", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ liveTestId: test.id }),
        });
        if (!res.ok)
          throw new Error((await res.json()).message || "Failed to join.");
        toast.success("Successfully joined the free test!", { id: toastId });
        setHasJoined(true);
        return;
      }

      // Paid flow remains the same
      const res = await fetch("/api/live-tests/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ amount: test.entryFee }),
      });

      if (!res.ok) throw new Error("Failed to create payment order.");
      const { order } = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: test.title,
        description: "Live Test Entry Fee",
        order_id: order.id,
        handler: async function (response) {
          const verificationRes = await fetch(
            "/api/live-tests/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ ...response, liveTestId: test.id }),
            }
          );

          if (verificationRes.ok) {
            toast.success("Successfully joined the test!");
            setHasJoined(true);
          } else {
            toast.error("Payment verification failed.");
          }
        },
        prefill: { name: user.displayName, email: user.email },
        theme: { color: "#4f46e5" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      toast.dismiss(toastId);
    } catch (error) {
      toast.error(error.message || "Could not process entry.", { id: toastId });
    }
  };

  const handleStartTest = () => {
    if (!hasJoined) return toast.error("You must join the test first.");
    router.push(`/mock-tests/take/${test.sourceTestId}`);
  };

  const prizePool = (test.totalPot * 0.8).toLocaleString();

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between'>
      <div>
        <h3 className='text-xl font-bold text-slate-800'>{test.title}</h3>
        <p className='text-sm text-slate-500'>
          Starts: {test.startTime.toDate().toLocaleString()}
        </p>

        <div className='mt-4 flex flex-wrap gap-4 text-sm text-slate-700'>
          <span className='flex items-center gap-1'>
            <Users size={16} /> {test.participantCount} Participants
          </span>
          {test.isFree ? (
            <span className='flex items-center gap-1'>
              <Gift size={16} /> {test.bonusCoinPrize} Bonus Coins
            </span>
          ) : (
            <>
              <span className='flex items-center gap-1'>
                <Trophy size={16} /> Est. Prize: ₹{prizePool}
              </span>
              <span className='flex items-center gap-1'>
                <IndianRupee size={16} /> ₹{test.entryFee} Entry
              </span>
            </>
          )}
        </div>
      </div>

      <div className='mt-6'>
        {status === "Scheduled" && !hasJoined && (
          <button
            onClick={handleJoin}
            className={`w-full py-3 font-bold rounded-lg text-white ${
              test.isFree
                ? "bg-green-600 hover:bg-green-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {test.isFree ? "Join for Free" : "Join Now"}
          </button>
        )}
        {status === "Scheduled" && hasJoined && (
          <p className='w-full py-3 text-center bg-green-100 text-green-700 font-bold rounded-lg'>
            You've Joined!
          </p>
        )}
        {status === "Live" && hasJoined && (
          <button
            onClick={handleStartTest}
            className='w-full py-3 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2'
          >
            <PlayCircle /> Start Test Now
          </button>
        )}
        {status === "Live" && !hasJoined && (
          <p className='w-full py-3 text-center bg-red-100 text-red-700 font-bold rounded-lg flex items-center justify-center gap-2'>
            <Lock /> Entry Closed
          </p>
        )}
        {status === "Completed" && (
          <Link
            href={`/live-tests/results/${test.id}`}
            className='w-full block text-center py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300'
          >
            View Results
          </Link>
        )}
      </div>
    </div>
  );
}
