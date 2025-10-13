import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SharedMediaGrid from '../../../Components/Chat/SharedMediaGrid';

// Mock the performance optimizations module
jest.mock('../../../utils/performanceOptimizations', () => ({
  useIntersectionObserver: () => ({
    elementRef: { current: null },
    hasIntersected: false,
    isIntersecting: false
  })
}));

// Mock environment
jest.mock('../../../config/environment', () => ({
  isDevelopment: false,
  isProduction: true,
  isStaging: false,
  apiConfig: {},
  config: {},
  notificationConfig: {},
  getConfig: () => null,
  debugConfig: null
}));

describe('Progressive Loading', () => {
  const mockMessages = [
    {
      messageid: '1',
      sender: { username: 'User1' },
      createdAt: new Date().toISOString(),
      attachments: [
        {
          type: 'image',
          url: 'image1.jpg',
          thumbnailUrl: 'thumb1.jpg',
          filename: 'image1.jpg'
        },
        {
          type: 'image',
          url: 'image2.jpg',
          thumbnailUrl: 'thumb2.jpg',
          filename: 'image2.jpg'
        }
      ]
    },
    {
      messageid: '2',
      sender: { username: 'User2' },
      createdAt: new Date().toISOString(),
      attachments: [
        {
          type: 'video',
          url: 'video1.mp4',
          thumbnailUrl: 'thumb3.jpg',
          filename: 'video1.mp4'
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders shared media grid with initial items', () => {
    render(<SharedMediaGrid messages={mockMessages} />);
    
    // Check that tabs are rendered
    expect(screen.getByText('Photos (2)')).toBeInTheDocument();
    expect(screen.getByText('Videos (1)')).toBeInTheDocument();
    expect(screen.getByText('Files (0)')).toBeInTheDocument();
    
    // Check that images are rendered
    expect(screen.getByAltText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('image2.jpg')).toBeInTheDocument();
  });

  it('switches between media tabs correctly', () => {
    render(<SharedMediaGrid messages={mockMessages} />);
    
    // Initially on Photos tab
    expect(screen.getByAltText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('image2.jpg')).toBeInTheDocument();
    
    // Switch to Videos tab
    const videosTab = screen.getByText('Videos (1)');
    fireEvent.click(videosTab);
    
    // Should now show video
    expect(screen.getByText('Videos (1)')).toHaveClass('text-red-600');
    
    // Switch to Files tab
    const filesTab = screen.getByText('Files (0)');
    fireEvent.click(filesTab);
    
    // Should show no files message
    expect(screen.getByText('No files')).toBeInTheDocument();
  });

  it('opens media preview modal when media is clicked', () => {
    render(<SharedMediaGrid messages={mockMessages} />);
    
    // Initially there should be one image with alt text 'image1.jpg' (the thumbnail)
    const initialImages = screen.getAllByAltText('image1.jpg');
    expect(initialImages).toHaveLength(1);
    expect(initialImages[0]).toHaveClass('w-full'); // Thumbnail has this class
    
    // Click on the thumbnail
    fireEvent.click(initialImages[0]);
    
    // Now there should be two images with alt text 'image1.jpg' (thumbnail and modal)
    const imagesAfterClick = screen.getAllByAltText('image1.jpg');
    expect(imagesAfterClick).toHaveLength(2);
    
    // One should be the thumbnail (with w-full class), one should be modal (with max-h-[80vh] class)
    const thumbnail = imagesAfterClick.find(img => img.classList.contains('w-full'));
    const modal = imagesAfterClick.find(img => img.classList.contains('max-h-[80vh]'));
    expect(thumbnail).toBeInTheDocument();
    expect(modal).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: '' }); // Close button
    fireEvent.click(closeButton);
    
    // Should be back to just the thumbnail
    const imagesAfterClose = screen.getAllByAltText('image1.jpg');
    expect(imagesAfterClose).toHaveLength(1);
    expect(imagesAfterClose[0]).toHaveClass('w-full');
  });
});