"use client";

import { useEffect, useState } from "react";

const COOLDOWN_SECONDS = 30;

export function useRpcCooldown() {
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (secondsRemaining === 0) return;
    const timer = window.setTimeout(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsRemaining]);

  return {
    secondsRemaining,
    startCooldown: () => setSecondsRemaining(COOLDOWN_SECONDS),
  };
}
