"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { ApolloClientContext } from './ApolloProvider';
import { refreshCacheAfterAuth } from '../../lib/apollo/cacheUtils';


export const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // Get Apollo client from context (will be null initially)
    const apolloClient = useContext(ApolloClientContext);
    
    const [ErrorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null); // Add user state for profile data
    const [initialized, setInitialized] = useState(false); // Track if auth state is initialized

    // Helper function to decode JWT and extract user info
    const extractUserFromToken = (token) => {
        try {
            if (!token) return null;
            
            // Decode JWT token (simple base64 decode of payload)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join('')
            );
            
            const payload = JSON.parse(jsonPayload);
            
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Extracted user payload from token:', payload);
                console.log('📝 Profile ID in token payload:', payload.profileid || '❌ NOT PRESENT');
                console.log('👤 Username:', payload.username);
                console.log('🆔 User ID:', payload.id || payload._id);
            }
            
            const userData = {
                id: payload.id || payload._id,
                username: payload.username,
                email: payload.email,
                profileid: payload.profileid,
                profilePic: payload.profilePic,
                name: payload.name,
                dateOfBirth: payload.dateOfBirth
            };
            
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ Final user data object:', userData);
            }
            return userData;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error extracting user from token:', error);
            }
            return null;
        }
    };

    // Update user data whenever accessToken changes
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('\n🔄 Processing access token change...');
        }
        const userData = extractUserFromToken(accessToken);
        setUser(userData);
        
        // Clear Apollo cache when user changes to prevent stale data
        if (apolloClient) {
            if (process.env.NODE_ENV === 'development') {
                console.log('🗑️ Auto-clearing cache on user change...');
            }
            refreshCacheAfterAuth(apolloClient).catch(err => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Auto cache clear failed:', err);
                }
            });
        }
        
        if (process.env.NODE_ENV === 'development') {
            if (userData) {
                console.log('👤 User data set:', userData);
                if (userData.profileid) {
                    console.log('✅ Profile ID available for GraphQL mutations:', userData.profileid);
                } else {
                    console.log('⚠️ Profile ID missing from token! This may cause post creation issues.');
                    console.log('🔧 Check if backend is including profileid in JWT token generation.');
                }
            } else {
                console.log('❌ No user data extracted from token');
            }
        }
    }, [accessToken, apolloClient]);

    // Try auto-login on mount with optimized performance
    useEffect(() => {
        const refresh = async () => {
            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Attempting refresh token to:', `http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/refresh-token`);
                }
                
                const DataResult = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/refresh-token`, {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });
                
                if (process.env.NODE_ENV === 'development') {
                    console.log('Refresh token response status:', DataResult.status);
                    console.log('Refresh token response ok:', DataResult.ok);
                }
                
                if (!DataResult.ok) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log("Refresh token failed with status:", DataResult.status);
                    }
                    setAccessToken(null);
                    return;
                }
                
                const res = await DataResult.json();
                
                if (res.success && res.accessToken) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('✅ Refresh token successful! Setting access token...');
                        console.log('Token preview:', `${res.accessToken.substring(0, 20)}...`);
                        
                        // Try to decode and check if profileid is present
                        const testUser = extractUserFromToken(res.accessToken);
                        if (testUser?.profileid) {
                            console.log('✅ Profile ID found in refreshed token:', testUser.profileid);
                        } else {
                            console.log('⚠️ Profile ID missing in refreshed token!');
                        }
                    }
                    
                    setAccessToken(res.accessToken);
                    
                    if (process.env.NODE_ENV === 'development') {
                        console.log("Auto-login successful with token:", `${res.accessToken.substring(0, 20)}...`);
                    }
                } else {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('❌ Refresh token failed:', res.msg);
                        console.log("Full refresh response:", res);
                    }
                    setAccessToken(null);
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Refresh token network error:", err);
                }
                setAccessToken(null);
            } finally {
                setInitialized(true); // Mark as initialized after first auth check
            }
        };
        
        // Initialize immediately for better UX
        refresh();
    }, []);

    const login = async (info) => {
        console.log('\n🔴 LOGIN FUNCTION CALLED!');
        console.log('- Info received:', info);
        console.log('- Current accessToken:', accessToken || 'NULL');
        
        // Clear any previous error messages
        setErrorMsg(null);
        
        try {
            console.log('- Making request to backend...');
            console.log('- URL:', `http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/login`);
            
            const result = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/login`, {
                method: "POST",
                body: JSON.stringify(info),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                credentials: 'include' // important to include cookies
            });
            
            console.log('Login response status:', result.status);
            console.log('Login response ok:', result.ok);
            
            const res = await result.json();
            console.log('Login response data:', res);
            console.log('Access token in response:', res.accessToken ? `Present (${res.accessToken.substring(0, 20)}...)` : 'MISSING');
            
            if(res.success && res.accessToken){
                console.log('✅ LOGIN SUCCESS! About to set token...');
                console.log('- Token received:', res.accessToken.substring(0, 30) + '...');
                
                // Check if profileid is in the new token
                const loginUser = extractUserFromToken(res.accessToken);
                if (loginUser?.profileid) {
                    console.log('✅ Profile ID found in login token:', loginUser.profileid);
                } else {
                    console.log('⚠️ Profile ID missing in login token!');
                }
                
                console.log('- Setting accessToken now...');
                setAccessToken(res.accessToken);
                console.log('- setAccessToken called!');
                setErrorMsg(null);
                
                // Clear Apollo cache to remove stale data like "test-profile-123"
                if (apolloClient) {
                    console.log('🗑️ Clearing Apollo cache after login...');
                    refreshCacheAfterAuth(apolloClient).catch(err => {
                        console.log('Cache clear failed but login proceeding:', err);
                    });
                }
                
                // Wait a moment and check if it was stored
                setTimeout(() => {
                    console.log('- Current accessToken after 100ms:', accessToken || 'STILL NULL');
                }, 100);
            } else {
                console.log('❌ Login failed:', res.msg);
                setErrorMsg(res.msg || 'Login failed');
            }
        } catch (error) {
            setErrorMsg("Network error. Please try again.");
            console.error("Login network error:", error);
        }
    };

    const logout = async () => {
        try {
            // Call backend to clear refresh token
            await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear client state regardless of backend response
            setAccessToken(null);
            setUser(null); // Clear user data on logout
            setErrorMsg(null);
            
            // Clear Apollo cache to remove all stale user data
            if (apolloClient) {
                console.log('🗑️ Clearing Apollo cache after logout...');
                refreshCacheAfterAuth(apolloClient).catch(err => {
                    console.log('Cache clear failed after logout:', err);
                });
            }
            // Redirect will be handled by ProtectedRoute
        }
    };

    const signup = async (info) => {
        // Clear any previous messages
        setErrorMsg(null);
        setSuccessMsg(null);
        // Auth loading removed
        
        try {
            const result = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/signup`, {
                method: "POST",
                body: JSON.stringify(info),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                credentials: 'include'
            });
            
            const res = await result.json();
            
            if(res.success){
                setAccessToken(res.accessToken);
                setSuccessMsg("Account created successfully!");
                setErrorMsg(null);
                return { success: true };
            } else {
                console.log("Signup error:", res.msg);
                setErrorMsg(res.msg);
                return { success: false, message: res.msg };
            }
        } catch (error) {
            setErrorMsg("Network error. Please try again.");
            console.error("Signup error:", error);
            return { success: false, message: "Network error. Please try again." };
        } finally {
            // Auth loading removed
        }
    };

    const forgetPassword = async (email) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        // Auth loading removed
        
        try {
            const result = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/forget-password`, {
                method: "POST",
                body: JSON.stringify({ email }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                credentials: 'include'
            });
            
            const res = await result.json();
            
            if(res.success){
                setSuccessMsg(res.msg || "Password reset email sent successfully!");
                setErrorMsg(null);
                return { success: true, message: res.msg };
            } else {
                setErrorMsg(res.msg);
                return { success: false, message: res.msg };
            }
        } catch (error) {
            setErrorMsg("Network error. Please try again.");
            console.error("Forget password error:", error);
            return { success: false, message: "Network error. Please try again." };
        } finally {
            // Auth loading removed
        }
    };

    const resetPassword = async (passwordData, token) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        // Auth loading removed
        
        try {
            const result = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/reset-password`, {
                method: "POST",
                body: JSON.stringify({
                    new_password: passwordData.password,
                    confirm_password: passwordData.confirmPassword,
                    token: token
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                credentials: 'include'
            });
            
            const res = await result.json();
            
            if(res.success){
                if(res.accessToken) {
                    setAccessToken(res.accessToken);
                }
                setSuccessMsg(res.msg || "Password reset successfully!");
                setErrorMsg(null);
                return { success: true, message: res.msg, accessToken: res.accessToken };
            } else {
                setErrorMsg(res.msg);
                return { success: false, message: res.msg };
            }
        } catch (error) {
            setErrorMsg("Network error. Please try again.");
            console.error("Reset password error:", error);
            return { success: false, message: "Network error. Please try again." };
        } finally {
            // Auth loading removed
        }
    };

    const clearError = () => {
        setErrorMsg(null);
    };

    const clearSuccess = () => {
        setSuccessMsg(null);
    };

    const clearMessages = () => {
        setErrorMsg(null);
        setSuccessMsg(null);
    };
    
    // Helper function to debug user/profile data
    const debugUserData = () => {
        console.log('\n🔍 DEBUG USER DATA:');
        console.log('- Access Token:', accessToken ? `Present (${accessToken.substring(0, 20)}...)` : 'Not present');
        console.log('- User Object:', user);
        console.log('- Profile ID:', user?.profileid || 'Not available');
        console.log('- Username:', user?.username || 'Not available');
        
        if (accessToken && !user?.profileid) {
            console.log('⚠️ Issue detected: Token present but no profileid!');
            console.log('🔧 Possible solutions:');
            console.log('  1. Check backend JWT token generation includes profileid');
            console.log('  2. Refresh the page to get new token');
            console.log('  3. Logout and login again');
        }
        
        return {
            hasToken: !!accessToken,
            hasUser: !!user,
            hasProfileId: !!user?.profileid,
            userData: user
        };
    };

    return (
        <AuthContext.Provider value={{ 
            accessToken,
            user, // Add user data to context
            initialized, // Add initialized state
            login, 
            signup,
            forgetPassword,
            resetPassword,
            logout, 
            ErrorMsg, 
            successMsg,
            clearError,
            clearSuccess,
            clearMessages,
            debugUserData // Add debug helper
        }}>
            {children}
        </AuthContext.Provider>
    );
};
