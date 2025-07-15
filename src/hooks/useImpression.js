// src/hooks/useImpression.js

import { useEffect, useRef } from "react";

export const useImpression = (testId) => {
  const ref = useRef(null);

  useEffect(() => {
    // Ensure this code only runs in the browser
    if (typeof window === "undefined" || !ref.current) return;

    const storageKey = `impression-logged-${testId}`;

    // Check if an impression has already been logged in this session
    if (sessionStorage.getItem(storageKey)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the element is visible and an impression hasn't been logged
        if (entry.isIntersecting) {
          // Log the impression in sessionStorage to prevent re-firing
          sessionStorage.setItem(storageKey, "true");

          // Send the request to the server
          fetch(`/api/tests/${testId}/track-impression`, { method: "POST" });

          // Disconnect the observer since its job is done for this session
          observer.disconnect();
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the element is visible
    );

    observer.observe(ref.current);

    return () => {
      if (observer) observer.disconnect();
    };
  }, [ref, testId]); // Only depends on testId now

  return ref;
};
