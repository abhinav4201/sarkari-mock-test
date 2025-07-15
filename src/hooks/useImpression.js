// src/hooks/useImpression.js (NEW FILE)

import { useEffect, useRef, useState } from "react";

export const useImpression = (testId) => {
  const ref = useRef(null);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);

  useEffect(() => {
    if (!ref.current || hasBeenViewed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenViewed(true);
          // Send a request to the server to log the impression
          fetch(`/api/tests/${testId}/track-impression`, { method: "POST" });
          observer.disconnect(); // Disconnect after firing once
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the element is visible
    );

    observer.observe(ref.current);

    return () => {
      if (observer) observer.disconnect();
    };
  }, [ref, testId, hasBeenViewed]);

  return ref;
};
