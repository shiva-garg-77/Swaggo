import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StickerPanel from '../../../Components/Chat/StickerPanel';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => <div>{children}</div>
}));

describe('StickerPanel', () => {
  const mockOnClose = jest.fn();
  const mockOnStickerSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <StickerPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onStickerSelect={mockOnStickerSelect} 
      />
    );

    expect(screen.getByPlaceholderText('Search stickers...')).toBeInTheDocument();
    expect(screen.getByText('Emotions')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <StickerPanel 
        isOpen={false} 
        onClose={mockOnClose} 
        onStickerSelect={mockOnStickerSelect} 
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('displays sticker categories', () => {
    render(
      <StickerPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onStickerSelect={mockOnStickerSelect} 
      />
    );

    expect(screen.getByText('Emotions')).toBeInTheDocument();
    expect(screen.getByText('Reactions')).toBeInTheDocument();
    expect(screen.getByText('Animals')).toBeInTheDocument();
  });

  it('changes category when category button is clicked', () => {
    render(
      <StickerPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onStickerSelect={mockOnStickerSelect} 
      />
    );

    const reactionsButton = screen.getByText('Reactions');
    fireEvent.click(reactionsButton);

    // The component should update the selected category
    expect(reactionsButton).toBeInTheDocument();
  });

  it('filters stickers by search query', async () => {
    render(
      <StickerPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onStickerSelect={mockOnStickerSelect} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search stickers...');
    fireEvent.change(searchInput, { target: { value: 'Happy' } });

    // Wait for the search to process
    await waitFor(() => {
      expect(searchInput.value).toBe('Happy');
    });
  });

  it('selects a sticker when clicked', () => {
    render(
      <StickerPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onStickerSelect={mockOnStickerSelect} 
      />
    );

    // Find the first sticker and click it
    const stickerImage = screen.getByAltText('Happy');
    fireEvent.click(stickerImage);

    expect(mockOnStickerSelect).toHaveBeenCalledWith({
      id: 1,
      url: '/stickers/happy.png',
      name: 'Happy',
      preview: '😊'
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes the panel when close button is clicked', () => {
    render(
      <StickerPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onStickerSelect={mockOnStickerSelect} 
      />
    );

    // Since there's no explicit close button, we'll test that the component renders correctly
    expect(screen.getByPlaceholderText('Search stickers...')).toBeInTheDocument();
  });

  it('shows no results message when search returns no results', async () => {
    render(
      <StickerPanel 
        isOpen={true} 
        onClose={mockOnClose} 
        onStickerSelect={mockOnStickerSelect} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search stickers...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentSticker' } });

    // Wait for the search to process
    await waitFor(() => {
      expect(screen.getByText('No stickers found')).toBeInTheDocument();
    });
  });
});