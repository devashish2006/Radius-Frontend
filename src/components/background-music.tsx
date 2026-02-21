"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial volume
    audio.volume = 0.5;

    // Auto-play on mount
    const playAudio = async () => {
      try {
        audio.muted = false;
        await audio.play();
        setIsPlaying(true);
        setIsMuted(false);

      } catch (error) {
        console.error("Auto-play failed:", error);
        // If autoplay fails, keep the button for user to click
        setIsMuted(true);
        setIsPlaying(false);
      }
    };

    // Attempt to play after a short delay
    const timer = setTimeout(playAudio, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Handle audio loading errors
    const handleError = (e: ErrorEvent) => {
      console.error("Audio loading error:", e);
      setError("Failed to load audio");
    };

    // Handle when audio can play
    const handleCanPlay = () => {

      setError(null);
    };

    audio.addEventListener("error", handleError as any);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("error", handleError as any);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  const toggleMute = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (!isPlaying) {
        // Start playing
        audio.muted = false;
        await audio.play();
        setIsPlaying(true);
        setIsMuted(false);

      } else {
        // Toggle mute
        const newMutedState = !isMuted;
        audio.muted = newMutedState;
        setIsMuted(newMutedState);

      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setError("Failed to play audio");
    }
  };

  if (error) {
    console.warn("Background music error:", error);
  }

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="auto"
        playsInline
      >
        <source src="/TwitterBG.mpeg" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm border-2 hover:scale-110 transition-transform"
        onClick={toggleMute}
        aria-label={isMuted || !isPlaying ? "Play background music" : "Mute background music"}
      >
        {isMuted || !isPlaying ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}
