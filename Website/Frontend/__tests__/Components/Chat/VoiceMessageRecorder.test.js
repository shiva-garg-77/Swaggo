import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceMessageRecorder from '../../../Components/Chat/VoiceMessageRecorder';

// Mock MediaRecorder
class MockMediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }
}

// Mock Blob
global.Blob = class MockBlob {
  constructor(chunks, options) {
    this.chunks = chunks;
    this.options = options;
    this.size = 1024;
    this.type = 'audio/webm';
  }
};

// Mock FileReader
global.FileReader = class MockFileReader {
  readAsDataURL(blob) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({
          target: {
            result: 'data:audio/webm;base64,dGVzdCBhdWRpbyBkYXRh'
          }
        });
      }
    }, 0);
  }
};

// Mock URL
global.URL.createObjectURL = jest.fn(() => 'mock-audio-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Audio
global.Audio = class MockAudio {
  constructor(url) {
    this.url = url;
    this.currentTime = 0;
  }

  play() {
    return Promise.resolve();
  }

  pause() {}
};

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn()
}));

describe('VoiceMessageRecorder', () => {
  const mockOnSend = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.MediaRecorder = MockMediaRecorder;
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }]
      })
    };
  });

  it('renders correctly when open', () => {
    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByText('Record Voice Message')).toBeInTheDocument();
    expect(screen.getByLabelText('Start recording')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <VoiceMessageRecorder 
        isOpen={false} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows permission denied message when microphone access is denied', async () => {
    global.navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(new Error('Permission denied'));

    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    // Wait for permission check
    await waitFor(() => {
      expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
    });
  });

  it('starts recording when microphone button is clicked', async () => {
    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    const recordButton = screen.getByLabelText('Start recording');
    fireEvent.click(recordButton);

    // Wait for recording to start
    await waitFor(() => {
      expect(screen.getByText('Recording in progress')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Stop recording')).toBeInTheDocument();
  });

  it('stops recording and shows playback controls', async () => {
    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    // Start recording
    const recordButton = screen.getByLabelText('Start recording');
    fireEvent.click(recordButton);

    // Stop recording
    const stopButton = await screen.findByLabelText('Stop recording');
    fireEvent.click(stopButton);

    // Check that playback controls are shown
    await waitFor(() => {
      expect(screen.getByLabelText('Delete recording')).toBeInTheDocument();
      expect(screen.getByLabelText('Play recording')).toBeInTheDocument();
      expect(screen.getByLabelText('Send voice message')).toBeInTheDocument();
    });
  });

  it('plays and pauses the recording', async () => {
    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    // Start and stop recording to get to playback state
    const recordButton = screen.getByLabelText('Start recording');
    fireEvent.click(recordButton);

    const stopButton = await screen.findByLabelText('Stop recording');
    fireEvent.click(stopButton);

    // Play the recording
    const playButton = await screen.findByLabelText('Play recording');
    fireEvent.click(playButton);

    // Check that pause button is shown
    await waitFor(() => {
      expect(screen.getByLabelText('Pause playback')).toBeInTheDocument();
    });

    // Pause the recording
    const pauseButton = screen.getByLabelText('Pause playback');
    fireEvent.click(pauseButton);

    // Check that play button is shown again
    await waitFor(() => {
      expect(screen.getByLabelText('Play recording')).toBeInTheDocument();
    });
  });

  it('sends the recording when send button is clicked', async () => {
    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    // Start and stop recording
    const recordButton = screen.getByLabelText('Start recording');
    fireEvent.click(recordButton);

    const stopButton = await screen.findByLabelText('Stop recording');
    fireEvent.click(stopButton);

    // Send the recording
    const sendButton = await screen.findByLabelText('Send voice message');
    fireEvent.click(sendButton);

    // Check that onSend was called with voice data
    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith({
        duration: expect.any(Number),
        waveform: expect.any(Array),
        timestamp: expect.any(String),
        base64: 'dGVzdCBhdWRpbyBkYXRh',
        mimeType: 'audio/webm',
        size: 1024
      });
    });
  });

  it('resets and cancels when delete button is clicked', async () => {
    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    // Start and stop recording
    const recordButton = screen.getByLabelText('Start recording');
    fireEvent.click(recordButton);

    const stopButton = await screen.findByLabelText('Stop recording');
    fireEvent.click(stopButton);

    // Delete the recording
    const deleteButton = await screen.findByLabelText('Delete recording');
    fireEvent.click(deleteButton);

    // Check that we're back to initial state
    await waitFor(() => {
      expect(screen.getByText('Record Voice Message')).toBeInTheDocument();
      expect(screen.getByLabelText('Start recording')).toBeInTheDocument();
    });
  });

  it('cancels the recorder when close button is clicked', () => {
    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('formats time correctly', () => {
    render(
      <VoiceMessageRecorder 
        isOpen={true} 
        onSend={mockOnSend} 
        onCancel={mockOnCancel} 
      />
    );

    // Check initial time display
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });
});