/**
 * @fileoverview Test for OptimizedLink component
 * @module Tests/Components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import OptimizedLink from '../Components/Helper/OptimizedLink';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: jest.fn(),
    push: jest.fn()
  })
}));

// Mock the FixedSecureAuthContext
const mockUseFixedSecureAuth = jest.fn();
jest.mock('../context/FixedSecureAuthContext', () => ({
  useFixedSecureAuth: () => mockUseFixedSecureAuth()
}));

describe('OptimizedLink', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders children correctly', () => {
    mockUseFixedSecureAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    });

    render(
      <OptimizedLink href="/test">
        Test Link
      </OptimizedLink>
    );
    
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  test('applies className correctly', () => {
    mockUseFixedSecureAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    });

    render(
      <OptimizedLink href="/test" className="test-class">
        Test Link
      </OptimizedLink>
    );
    
    const link = screen.getByText('Test Link');
    expect(link).toHaveClass('test-class');
  });

  test('handles unauthenticated routes correctly', () => {
    // Mock unauthenticated state
    mockUseFixedSecureAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    });
    
    render(
      <OptimizedLink href="/signup">
        Signup
      </OptimizedLink>
    );
    
    // The component should render without errors
    expect(screen.getByText('Signup')).toBeInTheDocument();
  });

  test('handles authenticated routes when not authenticated', () => {
    // Mock unauthenticated state
    mockUseFixedSecureAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    });
    
    render(
      <OptimizedLink href="/home">
        Home
      </OptimizedLink>
    );
    
    // The component should render without errors
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});