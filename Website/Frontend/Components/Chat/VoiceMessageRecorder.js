'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Send, Trash2, Play, Pause } from 'lucide-react';

export default function VoiceMessageRecorder({ onSend, onCancel, isOpen }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveform, setWaveform] = useState([]);
  const [permission, setPermission] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Request microphone permission
  useEffect(() => {
    if (isOpen) {
      requestPermission();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      setPermission('granted');
      
      // Set up audio context for waveform visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermission('denied');
    }
  };

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      await requestPermission();
      if (!streamRef.current) return;
    }

    try {
      chunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 0.1);
      }, 100);
      
      // Start waveform visualization
      startWaveformVisualization();
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isRecording]);

  const startWaveformVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedVolume = average / 255;
      
      // Add to waveform data
      setWaveform(prev => {
        const newWaveform = [...prev, normalizedVolume];
        // Keep only last 100 points for performance
        return newWaveform.slice(-100);
      });
      
      // Draw waveform bars
      const barWidth = canvas.width / Math.min(waveform.length, 100);
      
      waveform.slice(-100).forEach((value, index) => {
        const barHeight = value * canvas.height * 0.8;
        const x = index * barWidth;
        const y = (canvas.height - barHeight) / 2;
        
        // Color based on volume level
        const intensity = Math.min(value * 2, 1);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      });
      
      if (isRecording) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };
    
    draw();
  };

  const playRecording = async () => {
    if (!audioUrl) return;
    
    try {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        } else {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => setIsPlaying(false);
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing recording:', error);
    }
  };

  const sendRecording = () => {
    if (audioBlob) {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result.split(',')[1]; // Remove data URL prefix
        
        const voiceData = {
          duration: duration,
          waveform: waveform,
          timestamp: new Date().toISOString(),
          base64: base64Data,
          mimeType: audioBlob.type || 'audio/webm',
          size: audioBlob.size
        };
        
        onSend(voiceData);
        reset();
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const reset = () => {
    setIsRecording(false);
    setIsPlaying(false);
    setDuration(0);
    setAudioBlob(null);
    setWaveform([]);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    chunksRef.current = [];
  };

  const cleanup = () => {
    reset();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 m-4">
        <div className="flex items-center gap-3">
          <MicOff className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Microphone access denied
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Please enable microphone permissions to record voice messages.
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="mt-3 px-4 py-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 m-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isRecording ? 'Recording...' : audioBlob ? 'Voice Message Ready' : 'Record Voice Message'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Waveform Visualization */}
      <div className="mb-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={80}
          className="w-full h-20 bg-gray-50 dark:bg-gray-700 rounded-lg"
        />
      </div>

      {/* Duration */}
      <div className="text-center mb-4">
        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
          {formatTime(duration)}
        </div>
        {isRecording && (
          <div className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-2 mt-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording in progress
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!audioBlob ? (
          // Recording controls
          <>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                aria-label="Start recording"
              >
                <Mic className="w-8 h-8" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                aria-label="Stop recording"
              >
                <Square className="w-8 h-8" />
              </button>
            )}
          </>
        ) : (
          // Playback and send controls
          <>
            <button
              onClick={() => { reset(); onCancel && onCancel(); }}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
              aria-label="Delete recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={playRecording}
              className="w-12 h-12 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
              aria-label={isPlaying ? "Pause playback" : "Play recording"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={sendRecording}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              aria-label="Send voice message"
            >
              <Send className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
        {!audioBlob ? (
          isRecording ? (
            'Click stop when finished recording'
          ) : (
            'Click the microphone to start recording'
          )
        ) : (
          'Click play to preview, or send to share your voice message'
        )}
      </div>
    </div>
  );
}