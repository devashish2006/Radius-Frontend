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

  // Log once when component mounts or expiresAt changes
  useEffect(() => {

  }, [expiresAt]);

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

      // Mark as expiring soon if less than 30 minutes
      setIsExpiringSoon(hours === 0 && minutes < 30);

      // Format as hrs:min:sec
      const formattedHours = String(hours).padStart(2, '0');
      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = String(seconds).padStart(2, '0');
      
      setTimeLeft(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
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
