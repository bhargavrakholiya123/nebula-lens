import { useState, useEffect } from "react";

export function useRelativeTime(date: Date | string | number): string {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    const getRelativeTimeString = () => {
      const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return "just now";
      }
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes} min ago`;
      }
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      }
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    };

    // Set initial value
    setRelativeTime(getRelativeTimeString());

    const interval = setInterval(() => {
      setRelativeTime(getRelativeTimeString());
    }, 30000);

    return () => clearInterval(interval);
  }, [date]);

  return relativeTime;
}
