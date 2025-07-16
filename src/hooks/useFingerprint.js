// src/hooks/useFingerprint.js

import { useState, useEffect } from "react";
import { getFingerprint } from "@guardhivefraudshield/device-fingerprint";

export const useFingerprint = () => {
  const [visitorId, setVisitorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        const fingerprint = await getFingerprint();
        setVisitorId(fingerprint);
      } catch (error) {
        console.error("Error generating fingerprint:", error);
      } finally {
        setLoading(false);
      }
    };

    generateFingerprint();
  }, []);

  return { visitorId, loading };
};
