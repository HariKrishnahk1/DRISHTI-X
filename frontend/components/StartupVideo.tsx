'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';

interface StartupVideoProps {
  onComplete?: () => void;
}

export default function StartupVideo({ onComplete }: StartupVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const handleDismiss = () => {
    setIsFading(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('drishti_intro_session_done', 'true');
      } catch (e) {}
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 600);
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted) {
        setAutoplayBlocked(false);
      }
    }
  };

  const handleContainerClick = () => {
    // If browser blocked unmuted autoplay, clicking anywhere activates audio
    if (autoplayBlocked && videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      setAutoplayBlocked(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // The user requested that the video start with music (unmuted)
    video.muted = false;
    video.volume = 1.0;
    video.currentTime = 0;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsMuted(false);
          setAutoplayBlocked(false);
        })
        .catch((error) => {
          console.warn(
            '[DRISHTI-X] Browser autoplay policy restricted unmuted audio. Initiating muted fallback with user activation prompt.',
            error
          );
          // Browser prevented audio playback without user gesture
          video.muted = true;
          setIsMuted(true);
          setAutoplayBlocked(true);
          video.play().catch((e) => console.error('[DRISHTI-X] Playback error:', e));
        });
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      onClick={handleContainerClick}
      className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-700 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="region"
      aria-label="Startup Intro Video"
    >
      {/* Background Video (Full Screen) */}
      <video
        ref={videoRef}
        src="/drishti-intro.mp4"
        playsInline
        autoPlay
        preload="auto"
        onEnded={handleDismiss}
        className="w-full h-full object-cover md:object-contain bg-black pointer-events-auto"
      />

      {/* Subtle Tactical HUD Vignette & Grid */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/60" />

      {/* TOP LEFT CORNER: Mute / Unmute Button */}
      <div className="absolute top-5 left-5 md:top-8 md:left-8 z-30">
        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wider backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-2xl border ${
            isMuted
              ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/60 text-rose-200 shadow-rose-950/50'
              : 'bg-black/70 hover:bg-black/90 border-amber-500/60 text-amber-300 hover:text-white shadow-amber-950/50 hover:border-amber-400'
          }`}
        >
          {isMuted ? (
            <>
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                <VolumeX className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-[11px] text-white">UNMUTE AUDIO</span>
                <span className="text-[9px] text-rose-300 font-normal">MUTED</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Volume2 className="w-4 h-4 text-amber-300 animate-bounce" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-[11px] text-amber-200">MUTE AUDIO</span>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] text-emerald-400 font-bold">LIVE MUSIC</span>
                </div>
              </div>
            </>
          )}
        </button>
      </div>

      {/* TOP RIGHT CORNER: Skip Video Button */}
      <div className="absolute top-5 right-5 md:top-8 md:right-8 z-30">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          title="Skip Video"
          className="group flex items-center gap-3 px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider backdrop-blur-xl bg-black/70 hover:bg-black/90 border border-slate-700/80 hover:border-amber-500 text-slate-200 hover:text-amber-300 transition-all duration-200 cursor-pointer shadow-2xl hover:shadow-amber-500/20"
        >
          <div className="flex flex-col text-right leading-tight">
            <span className="text-[11px] text-white group-hover:text-amber-300 transition-colors">SKIP VIDEO</span>
            <span className="text-[9px] text-slate-400 font-normal">ENTER PLATFORM</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 flex items-center justify-center text-amber-400 transition-transform group-hover:translate-x-0.5">
            <SkipForward className="w-4 h-4 text-amber-300" />
          </div>
        </button>
      </div>



      {/* TACTICAL HUD CORNER ACCENTS */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-500/40 pointer-events-none" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-500/40 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-500/40 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-500/40 pointer-events-none" />
    </div>
  );
}
