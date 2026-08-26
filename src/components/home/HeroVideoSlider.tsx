"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";

export interface VideoSlide {
  id: string;
  title: string;
  videoUrl: string;
}

const HERO_VIDEOS: VideoSlide[] = [
  {
    id: "latest-collections",
    title: "Latest Collections",
    videoUrl: "/hero-video-1.mp4",
  },
  {
    id: "trending-fashion",
    title: "Trending Fashion",
    videoUrl: "/hero-video-2.mp4",
  },
  {
    id: "everyday-essentials",
    title: "Everyday Essentials",
    videoUrl: "/hero-video-3.mp4",
  },
];

export function HeroVideoSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Continuously update progress for active video
  const updateProgress = useCallback(() => {
    const activeVideo = videoRefs.current[currentSlide];
    if (activeVideo) {
      if (activeVideo.duration && activeVideo.duration > 0) {
        const p = (activeVideo.currentTime / activeVideo.duration) * 100;
        setProgress(Math.min(100, Math.max(0, p)));
      }

      // Continue animation loop while component is active
      if (!activeVideo.paused && !activeVideo.ended) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [currentSlide]);

  const startProgressLoop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [updateProgress]);

  // Handle switching slide
  const goToSlide = useCallback((index: number) => {
    videoRefs.current.forEach((vid) => {
      if (vid) vid.pause();
    });

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    setCurrentSlide(index);
    setProgress(0);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % HERO_VIDEOS.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide === 0 ? HERO_VIDEOS.length - 1 : currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Play active video when currentSlide changes
  useEffect(() => {
    HERO_VIDEOS.forEach((_, idx) => {
      const vid = videoRefs.current[idx];
      if (vid) {
        if (idx === currentSlide) {
          vid.currentTime = 0;
          vid.muted = isMuted;
          const promise = vid.play();
          if (promise !== undefined) {
            promise.catch((err) => console.warn("Video play error:", err));
          }
        } else {
          vid.pause();
        }
      }
    });

    startProgressLoop();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentSlide, isMuted, startProgressLoop]);

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    videoRefs.current.forEach((vid) => {
      if (vid) vid.muted = newMuteState;
    });
  };

  const handleVideoEnded = () => {
    nextSlide();
  };

  return (
    <section className="relative h-[420px] sm:h-[480px] md:h-[540px] lg:h-[600px] w-full overflow-hidden group bg-slate-950 text-white select-none">
      {/* Background Videos */}
      {HERO_VIDEOS.map((slide, index) => {
        const isSelected = currentSlide === index;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isSelected ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <video
              ref={(el) => {
                videoRefs.current[index] = el;
              }}
              src={slide.videoUrl}
              autoPlay
              playsInline
              muted={isMuted}
              preload="auto"
              onPlay={startProgressLoop}
              onPlaying={startProgressLoop}
              onTimeUpdate={() => {
                if (isSelected) {
                  const vid = videoRefs.current[index];
                  if (vid && vid.duration > 0) {
                    setProgress((vid.currentTime / vid.duration) * 100);
                  }
                }
              }}
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover"
            />
          </div>
        );
      })}

      {/* Overlay for bottom text contrast */}
      <div className="absolute inset-0 z-15 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Mute/Unmute Audio Toggle Button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-30 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white p-2.5 rounded-full transition-all border border-white/10 shadow-lg focus:outline-none"
        aria-label={isMuted ? "Unmute video audio" : "Mute video audio"}
        title={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-[#FF6600]" />}
      </button>

      {/* Manual Navigation Controls (Chevron Arrows on Hover) */}
      <button
        onClick={prevSlide}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 focus:outline-none border border-white/10"
        aria-label="Previous video slide"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 backdrop-blur-sm text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 focus:outline-none border border-white/10"
        aria-label="Next video slide"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      {/* Bottom Video Progress Line Bar Navigation */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 z-30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-10 max-w-4xl mx-auto">
            {HERO_VIDEOS.map((slide, index) => {
              const isSelected = currentSlide === index;
              return (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className="group/item flex flex-col text-left focus:outline-none transition-all cursor-pointer"
                  aria-label={`Switch to video ${slide.title}`}
                >
                  {/* Title Text */}
                  <span
                    className={`text-xs sm:text-sm md:text-base tracking-wide transition-colors duration-300 truncate ${
                      isSelected
                        ? "text-white font-medium drop-shadow"
                        : "text-white/60 group-hover/item:text-white/90 font-normal"
                    }`}
                  >
                    {slide.title}
                  </span>

                  {/* Horizontal Progress Base & Animated Line */}
                  <div className="w-full h-[2px] sm:h-[2.5px] bg-white/25 rounded-full overflow-hidden mt-2 relative">
                    <div
                      className={`h-full bg-white rounded-full ${
                        isSelected ? "opacity-100 shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "opacity-0"
                      }`}
                      style={{
                        width: isSelected ? `${progress}%` : "0%",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
