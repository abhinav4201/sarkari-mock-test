"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Trophy,
  IndianRupee,
  UserCircle,
  Users,
  Target,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import XPSummary from "@/components/results/XPSummary";

// New background component with a "results" and "achievement" theme
const ResultsBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    <Target className='absolute -top-20 -left-20 h-80 w-80 text-blue-500/10 transform rotate-12' />
    <BookOpen className='absolute -bottom-24 -right-24 h-96 w-96 text-purple-500/10 transform -rotate-12' />
    <ArrowUpRight className='absolute top-1/4 right-10 h-24 w-24 text-green-500/20' />
    <Target className='absolute bottom-1/4 left-10 h-28 w-28 text-red-400/10 transform' />
  </div>
);

export default function LiveTestEventResultPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const { liveTestId } = params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !user || !liveTestId) return;

    const fetchEventData = async () => {
      setLoading(true);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/live-tests/results/${liveTestId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch event results.");
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [liveTestId, user, authLoading]);

  const userResultInWinnerList = event?.winners?.find(
    (winner) => winner.userId === user?.uid
  );
  const userParticipated = !!event?.userResult;

  const renderWinnerList = () => {
    if (
      event.status === "completed" &&
      event.winners &&
      event.winners.length > 0
    ) {
      return (
        <>
          <h2 className='text-2xl font-bold text-slate-800 mb-4 text-center'>
            🏆 Top 5 Winners 🏆
          </h2>
          <div className='space-y-2'>
            {event.winners.slice(0, 5).map((winner) => (
              <div
                key={winner.rank}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  winner.userId === user?.uid
                    ? "bg-blue-100 border-2 border-blue-400 scale-105 shadow-lg"
                    : "bg-slate-50/70"
                }`}
              >
                <div className='flex items-center gap-4'>
                  <span className='font-bold text-lg w-8 text-center text-slate-600'>
                    {winner.rank}
                  </span>
                  <span className='font-semibold text-slate-700'>
                    {winner.userName}
                    {winner.userId === user?.uid && " (You)"}
                  </span>
                </div>
                <div className='text-right'>
                  <p className='font-bold text-green-600'>
                    + ₹{winner.prizeAmount.toLocaleString()}
                  </p>
                  <p className='text-sm text-slate-500'>
                    {winner.score} Points
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (event.status === "completed") {
      return (
        <div className='text-center py-8 text-slate-500'>
          <Users className='mx-auto h-10 w-10 text-slate-400' />
          <p className='mt-2 font-semibold'>Event Completed</p>
          <p className='mt-1 text-sm'>
            Based on {event.participantCount || 0} participants, no prize
            winners were declared for this event.
          </p>
        </div>
      );
    }

    return (
      <div className='text-center py-8 text-slate-500'>
        <h2 className='text-2xl font-bold text-slate-800 mb-4 text-center'>
          🏆 Winners 🏆
        </h2>
        <p>The event has finished! Final rankings will be published shortly.</p>
      </div>
    );
  };

  const renderUserResultSection = () => {
    if (event.status !== "completed") return null;

    if (!userParticipated) {
      return (
        <div className='mt-8 p-4 bg-red-100 border-2 border-red-200 rounded-lg text-center'>
          <p className='font-semibold text-gray-700'>
            You did not participate in this event.
          </p>
        </div>
      );
    }
    if (userResultInWinnerList) {
      return null;
    }

    return (
      <div className='mt-8 p-4 bg-amber-50/70 border-2 border-amber-200 rounded-lg text-center'>
        <UserCircle className='mx-auto h-10 w-10 text-amber-600' />
        <h3 className='font-bold text-amber-800 mt-2'>
          Better Luck Next Time!
        </h3>
        <p className='text-sm text-amber-700'>
          You scored{" "}
          <span className='font-bold'>
            {event.userResult.score} / {event.userResult.totalQuestions}
          </span>
          . Keep practicing!
        </p>
      </div>
    );
  };

  if (loading || authLoading) {
    return <div className='text-center p-12'>Loading Event Results...</div>;
  }

  if (error) {
    return <div className='text-center p-12 text-red-600'>{error}</div>;
  }

  if (!event) {
    return <div className='text-center p-12'>Event not found.</div>;
  }

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 py-16 overflow-hidden'>
      <ResultsBackground />
      <div className='relative z-10 container mx-auto px-4'>
        <div className='max-w-3xl mx-auto bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-200/50'>
          <div className='text-center'>
            <Trophy className='mx-auto h-16 w-16 text-amber-500' />
            <h1 className='text-3xl font-extrabold text-slate-900 mt-4'>
              {event.title}
            </h1>
            <p className='text-slate-600'>Event Results</p>
          </div>

          <XPSummary />

          <div className='my-8 text-center bg-indigo-50/70 p-6 rounded-xl'>
            <p className='text-lg font-medium text-indigo-800'>
              Total Prize Pool
            </p>
            <p className='text-5xl font-bold text-indigo-600 flex items-center justify-center'>
              <IndianRupee size={36} />{" "}
              {event.totalPrizePool?.toLocaleString() || 0}
            </p>
          </div>

          <div>{renderWinnerList()}</div>

          {renderUserResultSection()}

          <div className='mt-8 text-center'>
            <Link
              href='/live-tests'
              className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl'
            >
              Back to All Live Tests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
