"use client";

import React, { useState } from "react";
import SignUpButton from "./SignUpButton";
import Confetti from "../ui/Confetti";
import { PartyPopper } from "lucide-react";

// Simplified SVG visuals inspired by your images
const TrophyIcon = () => (
  <svg
    width='80'
    height='80'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M18 2H6C4.89543 2 4 2.89543 4 4V11C4 12.1046 4.89543 13 6 13H18C19.1046 13 20 12.1046 20 11V4C20 2.89543 19.1046 2 18 2Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12 13V22'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M8 22H16'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M4 7H2'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M22 7H20'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const SuccessIcon = () => (
  <svg
    width='80'
    height='80'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M13 20.8418V3.1582'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M13 4.1582L20 7.31641V13.6836L13 16.8418'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M13 4.1582L6 7.31641V13.6836L13 16.8418'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export default function CTASection() {
  const [showConfetti, setShowConfetti] = useState(false);

  return (
    <>
      <Confetti
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
      <section className='py-20'>
        <div className='container mx-auto px-6'>
          <div className='relative bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl shadow-xl p-10 md:p-16 text-center overflow-hidden'>
            <div className='absolute -top-4 -left-4 text-indigo-400/30'>
              <TrophyIcon />
            </div>
            <div className='absolute -bottom-4 -right-4 text-purple-400/30'>
              <SuccessIcon />
            </div>

            <div className='relative z-10'>
              <h2 className='text-3xl font-bold'>
                Ready to Achieve Your Goals?
              </h2>
              <p className='mt-4 max-w-xl mx-auto'>
                Join thousands of successful students. From NEET and IIT-JEE to
                UPSC, SSC CGL, and Banking exams, we provide advanced mock tests
                for every ambition. Prepare smarter, achieve more.
              </p>
              <div className='mt-8 flex flex-col sm:flex-row items-center justify-center gap-4'>
                <SignUpButton />
                <button
                  onClick={() => setShowConfetti(true)}
                  className='flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-all'
                >
                  <PartyPopper size={20} />
                  Celebrate
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
