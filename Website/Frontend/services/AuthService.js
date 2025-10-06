/**
 * Auth Service - Minimal implementation for WebRTC Service
 * This provides the basic user authentication information needed by WebRTC
 */

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  getCurrentUser() {
    // Try to get user from local storage or return a default
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.warn('Failed to parse user data from localStorage');
        }
      }
    }

    // Return default user structure
    return {
      profileid: 'anonymous',
      username: 'Anonymous User',
      id: 'anonymous'
    };
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  isAuthenticated() {
    const user = this.getCurrentUser();
    return user && user.profileid !== 'anonymous';
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;