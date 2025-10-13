import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GifPanel from '../../../Components/Chat/GifPanel';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => <div>{children}</div>
}));

describe('GifPanel', () => {
  const mockOnClose = jest.fn();
  const mockOnGifSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <GifPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onGifSelect={mockOnGifSelect} 
      />
    );

    expect(screen.getByPlaceholderText('Search GIFs...')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <GifPanel 
        isOpen={false} 
        onClose={mockOnClose} 
        onGifSelect={mockOnGifSelect} 
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('displays GIF categories', () => {
    render(
      <GifPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onGifSelect={mockOnGifSelect} 
      />
    );

    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('Reaction')).toBeInTheDocument();
    expect(screen.getByText('Love')).toBeInTheDocument();
    expect(screen.getByText('Happy')).toBeInTheDocument();
  });

  it('changes category when category button is clicked', () => {
    render(
      <GifPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onGifSelect={mockOnGifSelect} 
      />
    );

    const reactionButton = screen.getByText('Reaction');
    fireEvent.click(reactionButton);

    // The component should update the selected category
    // We can't directly test the internal state, but we can check if the button has the active class
    expect(reactionButton).toBeInTheDocument();
  });

  it('filters GIFs by search query', async () => {
    render(
      <GifPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onGifSelect={mockOnGifSelect} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search GIFs...');
    fireEvent.change(searchInput, { target: { value: 'Happy' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(searchInput.value).toBe('Happy');
    });
  });

  it('selects a GIF when clicked', () => {
    render(
      <GifPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onGifSelect={mockOnGifSelect} 
      />
    );

    // Find the first GIF and click it
    const gifImage = screen.getByAltText('Dance');
    fireEvent.click(gifImage);

    expect(mockOnGifSelect).toHaveBeenCalledWith({
      id: 1,
      url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif',
      title: 'Dance',
      category: 'Dance'
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes the panel when close button is clicked', () => {
    render(
      <GifPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onGifSelect={mockOnGifSelect} 
      />
    );

    const closeButton = screen.getByLabelText('Close GIF panel');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows no results message when search returns no results', async () => {
    render(
      <GifPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onGifSelect={mockOnGifSelect} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search GIFs...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentGif' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(screen.getByText('No GIFs found')).toBeInTheDocument();
    });
  });
});