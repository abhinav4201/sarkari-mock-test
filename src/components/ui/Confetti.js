"use client";

import React, { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

export default function Confetti({ active, onComplete }) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      run={active} // Control the animation with the 'run' prop
      recycle={false}
      numberOfPieces={500}
      tweenDuration={10000}
      onConfettiComplete={(confetti) => {
        // When the animation is done, call the onComplete prop if it exists
        if (onComplete) {
          onComplete();
        }
        // Clean up the confetti instance
        if (confetti) {
          confetti.reset();
        }
      }}
    />
  );
}
