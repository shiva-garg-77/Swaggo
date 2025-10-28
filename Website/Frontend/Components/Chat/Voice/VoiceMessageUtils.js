'use client';

class VoiceMessageRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      
      return true;
    } catch (error) {
      console.error('Error starting voice recording:', error);
      return false;
    }
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Stop all tracks to free up the microphone
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        
        this.isRecording = false;
        
        resolve({
          blob: audioBlob,
          url: audioUrl,
          duration: this.calculateDuration(),
          waveform: this.generateWaveform()
        });
      };

      this.mediaRecorder.stop();
    });
  }

  calculateDuration() {
    // This would typically be calculated from the actual audio data
    // For demo purposes, we'll use a placeholder
    return Math.floor(Math.random() * 60) + 5; // 5-65 seconds
  }

  generateWaveform() {
    // Generate a sample waveform for visualization
    // In a real implementation, you would analyze the audio data
    const points = 20;
    const waveform = [];
    
    for (let i = 0; i < points; i++) {
      waveform.push(Math.random() * 0.8 + 0.2); // Heights between 0.2 and 1.0
    }
    
    return waveform;
  }

  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      
      this.isRecording = false;
      this.audioChunks = [];
    }
  }
}

class VoiceMessagePlayer {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.onTimeUpdate = null;
    this.onEnded = null;
  }

  load(audioUrl) {
    return new Promise((resolve, reject) => {
      this.audio = new Audio(audioUrl);
      
      this.audio.addEventListener('loadedmetadata', () => {
        this.duration = this.audio.duration;
        resolve(this.duration);
      });

      this.audio.addEventListener('timeupdate', () => {
        this.currentTime = this.audio.currentTime;
        if (this.onTimeUpdate) {
          this.onTimeUpdate(this.currentTime, this.duration);
        }
      });

      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentTime = 0;
        if (this.onEnded) {
          this.onEnded();
        }
      });

      this.audio.addEventListener('error', (error) => {
        reject(error);
      });
    });
  }

  play() {
    if (this.audio) {
      this.audio.play();
      this.isPlaying = true;
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.currentTime = 0;
    }
  }

  seek(time) {
    if (this.audio) {
      this.audio.currentTime = time;
      this.currentTime = time;
    }
  }

  setVolume(volume) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
}

// Utility functions
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const isVoiceMessageSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Stop immediately after getting permission
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
};

export { VoiceMessageRecorder, VoiceMessagePlayer };
