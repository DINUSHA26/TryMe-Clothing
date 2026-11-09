"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { playNotificationChime, initAudioUnlock } from "@/lib/utils/sound";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AdminSoundTestButton() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTestSound = () => {
    initAudioUnlock();
    setIsPlaying(true);
    playNotificationChime();

    toast.success("🔔 Sound Alert Verified!", {
      description: "Audio is active! You will hear this chime whenever a new order, signup, or subscription occurs.",
      duration: 4000,
    });

    setTimeout(() => {
      setIsPlaying(false);
    }, 1200);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTestSound}
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Test Bell Sound Alert"
          >
            <Volume2 className={`h-5 w-5 ${isPlaying ? "text-amber-500 scale-110" : ""} transition-transform`} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs font-medium">Test Sound Alerts (Active)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
