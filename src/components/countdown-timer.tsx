"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CountdownTimerProps {
  expiresAt: string | Date;
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function CountdownTimer({ 
  expiresAt, 
  className = "", 
  showIcon = true,
  variant = "outline" 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Mark as expiring soon if less than 1 hour
      setIsExpiringSoon(hours < 1);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const badgeVariant = isExpiringSoon ? "destructive" : variant;

  return (
    <Badge variant={badgeVariant} className={`text-xs ${className}`}>
      {showIcon && <Clock className="w-3 h-3 mr-1" />}
      {timeLeft}
    </Badge>
  );
}
