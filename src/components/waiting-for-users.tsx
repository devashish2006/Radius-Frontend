"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WaitingForUsersProps {
  roomName?: string;
  roomType?: string;
  onTimeout?: () => void;
}

export function WaitingForUsers({ roomName, roomType, onTimeout }: WaitingForUsersProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Music starts at 1:44 (104 seconds) and plays till end (230 seconds total)
  // So duration = 230 - 104 = 126 seconds (2:06)
  const [timeLeft, setTimeLeft] = useState(126); // 2:06 in seconds
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set volume and start time at 1:44 (104 seconds)
    audio.volume = 0.3;
    audio.currentTime = 104; // Start at 1:44
    
    const playAudio = async () => {
      try {
        await audio.play();
        console.log("Background music started at 1:44");
      } catch (error) {
        console.log("Audio autoplay prevented:", error);
      }
    };

    playAudio();

    // Cleanup: stop audio when component unmounts
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        
        // Show warning when less than 60 seconds
        if (prev <= 60) {
          setIsWarning(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle timeout when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0) {
      // Stop the music
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Trigger timeout callback
      if (onTimeout) {
        onTimeout();
      }
    }
  }, [timeLeft, onTimeout]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Hidden audio element - no loop, will end when music ends */}
      <audio ref={audioRef} preload="auto">
        <source src="/TwitterBG.mpeg" type="audio/mpeg" />
      </audio>

      {/* Waiting Screen */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md">
        <div className="relative w-full max-w-md px-4">
          {/* Animated background glow */}
          <div className="absolute inset-0 -z-10">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse ${
              isWarning ? 'bg-destructive/20' : 'bg-primary/20'
            }`} />
          </div>

          <Card className={`border-2 shadow-2xl overflow-hidden ${
            isWarning ? 'border-destructive/50' : 'border-primary/50'
          }`}>
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              {/* Countdown Timer Badge */}
              <div className="flex justify-center">
                <Badge 
                  variant={isWarning ? "destructive" : "secondary"} 
                  className={`text-lg px-4 py-2 gap-2 ${isWarning ? 'animate-pulse' : ''}`}
                >
                  <Clock className="w-5 h-5" />
                  {formatTime(timeLeft)}
                </Badge>
              </div>

              {/* Warning message when time is low */}
              {isWarning && (
                <div className="flex items-center justify-center gap-2 text-destructive text-sm animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Room closing soon!</span>
                </div>
              )}

              {/* Animated Icon */}
              <div className="relative mx-auto w-20 h-20">
                <div className={`absolute inset-0 rounded-full animate-ping ${
                  isWarning ? 'bg-destructive/20' : 'bg-primary/20'
                }`} />
                <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border-2 ${
                  isWarning ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/10 border-primary/30'
                }`}>
                  <Users className={`w-10 h-10 animate-pulse ${
                    isWarning ? 'text-destructive' : 'text-primary'
                  }`} />
                </div>
              </div>

              {/* Main Message */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className={`w-5 h-5 animate-pulse ${
                    isWarning ? 'text-destructive' : 'text-primary'
                  }`} />
                  <h2 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                    isWarning 
                      ? 'from-destructive to-destructive/60' 
                      : 'from-primary to-primary/60'
                  }`}>
                    Waiting for Others
                  </h2>
                  <Sparkles className={`w-5 h-5 animate-pulse ${
                    isWarning ? 'text-destructive' : 'text-primary'
                  }`} />
                </div>
                
                <p className="text-muted-foreground">
                  You&apos;re the first one here! 
                </p>
                
                <p className="text-sm text-muted-foreground">
                  The chat will begin once another person joins
                </p>
              </div>

              {/* Room Info */}
              {(roomName || roomType) && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  {roomName && (
                    <Badge variant="secondary" className="text-sm">
                      {roomName}
                    </Badge>
                  )}
                  {roomType && (
                    <Badge variant="outline" className="text-sm">
                      {roomType}
                    </Badge>
                  )}
                </div>
              )}

              {/* Animated Dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isWarning ? 'bg-destructive' : 'bg-primary'
                }`} style={{ animationDelay: "0ms" }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isWarning ? 'bg-destructive' : 'bg-primary'
                }`} style={{ animationDelay: "150ms" }} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  isWarning ? 'bg-destructive' : 'bg-primary'
                }`} style={{ animationDelay: "300ms" }} />
              </div>

              {/* Subtle hint */}
              <p className="text-xs text-muted-foreground/60 italic">
                {isWarning 
                  ? "Room will close if no one joins soon" 
                  : "Share this room with friends to start chatting"
                }
              </p>
            </CardContent>
          </Card>

          {/* Floating particles animation */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-1 rounded-full animate-float ${
                  isWarning ? 'bg-destructive/30' : 'bg-primary/30'
                }`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
