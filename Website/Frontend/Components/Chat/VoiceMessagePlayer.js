'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';

export default function VoiceMessagePlayer({ voiceData, isOwn, timestamp }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize audio when component mounts
  useEffect(() => {
    if (voiceData?.url) {
      const audio = new Audio(voiceData.url);
      audio.preload = 'metadata';
      audioRef.current = audio;
      
      const handleLoadedMetadata = () => setDuration(audio.duration);
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlayThrough = () => setIsLoading(false);
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      
      // Set volume
      audio.volume = volume;
      
      // CRITICAL FIX: Memory leak prevention - cleanup event listeners
      return () => {
        if (audio) {
          audio.pause();
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('loadstart', handleLoadStart);
          audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [voiceData?.url, volume]);

  // Draw waveform
  useEffect(() => {
    if (canvasRef.current && voiceData?.waveform) {
      drawWaveform();
    }
  }, [voiceData?.waveform, currentTime, duration, isPlaying]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const waveform = voiceData.waveform || [];
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (waveform.length === 0) {
      // Draw placeholder bars if no waveform data
      const bars = 20;
      const barWidth = width / bars;
      
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * (height * 0.8) + height * 0.1;
        const x = i * barWidth + barWidth * 0.2;
        const y = (height - barHeight) / 2;
        
        ctx.fillStyle = isOwn ? 'rgba(255,255,255,0.4)' : 'rgba(59,130,246,0.4)';
        ctx.fillRect(x, y, barWidth * 0.6, barHeight);
      }
      return;
    }
    
    // Draw actual waveform
    const barWidth = width / waveform.length;
    const progress = duration > 0 ? currentTime / duration : 0;
    
    for (let i = 0; i < waveform.length; i++) {
      const barHeight = (waveform[i] || 0) * height * 0.8;
      const x = i * barWidth + barWidth * 0.2;
      const y = (height - barHeight) / 2;
      
      // Color based on progress
      const isPlayed = i / waveform.length <= progress;
      ctx.fillStyle = isPlayed 
        ? (isOwn ? 'rgba(255,255,255,0.9)' : 'rgba(59,130,246,0.9)')
        : (isOwn ? 'rgba(255,255,255,0.4)' : 'rgba(59,130,246,0.4)');
      
      ctx.fillRect(x, y, barWidth * 0.6, barHeight);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current || duration === 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / canvas.width;
    const newTime = progress * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleDownload = () => {
    if (voiceData?.url) {
      const link = document.createElement('a');
      link.href = voiceData.url;
      link.download = `voice_message_${timestamp || Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 py-2 px-1 min-w-[250px] ${
      isOwn ? 'text-white' : 'text-gray-800 dark:text-gray-100'
    }`}>
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          isOwn 
            ? 'bg-white/20 hover:bg-white/30 active:bg-white/40' 
            : 'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 dark:bg-blue-900 dark:hover:bg-blue-800'
        } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isLoading ? (
          <div className={`w-5 h-5 border-2 border-current border-r-transparent rounded-full animate-spin ${
            isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'
          }`} />
        ) : isPlaying ? (
          <Pause className={`w-5 h-5 ${
            isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'
          }`} />
        ) : (
          <Play className={`w-5 h-5 ml-0.5 ${
            isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'
          }`} />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={200}
          height={40}
          className="w-full h-10 cursor-pointer rounded"
          onClick={handleProgressClick}
          role="progressbar"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-label="Voice message progress"
        />
        
        {/* Duration */}
        <div className={`text-xs mt-1 flex justify-between ${
          isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <span className="tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="tabular-nums">
            {formatTime(duration || voiceData?.duration || 0)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Volume/Mute Button */}
        <button
          onClick={toggleMute}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
            isOwn 
              ? 'hover:bg-white/20 active:bg-white/30' 
              : 'hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className={`w-4 h-4 ${
              isOwn ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'
            }`} />
          ) : (
            <Volume2 className={`w-4 h-4 ${
              isOwn ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'
            }`} />
          )}
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
            isOwn 
              ? 'hover:bg-white/20 active:bg-white/30' 
              : 'hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="Download voice message"
        >
          <Download className={`w-4 h-4 ${
            isOwn ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'
          }`} />
        </button>
      </div>

      {/* Transcription (if available) */}
      {voiceData?.transcription && (
        <div className={`absolute -bottom-8 left-0 right-0 text-xs italic opacity-75 ${
          isOwn ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'
        }`}>
          "{voiceData.transcription}"
        </div>
      )}
    </div>
  );
}