"use client";
import { createContext, useState, useEffect } from "react";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [ErrorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);

    // Try auto-login on mount
    useEffect(() => {
        const refresh = async () => {
            try {
                const DataResult = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/refresh-token`, {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });
                
                if (!DataResult.ok) {
                    console.log("Refresh token failed with status:", DataResult.status);
                    setAccessToken(null);
                    return;
                }
                
                const res = await DataResult.json();
                
                if (res.success && res.accessToken) {
                    setAccessToken(res.accessToken);
                    console.log("Auto-login successful");
                } else {
                    console.log("Refresh token response:", res.msg);
                    setAccessToken(null);
                }
            } catch (err) {
                console.error("Refresh token error:", err);
                setAccessToken(null);
            } finally {
                setLoading(false);
            }
        };
        refresh();
    }, []);

    const login = async (info) => {
        // Clear any previous error messages
        setErrorMsg(null);
        
        try {
            const result = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/login`, {
                method: "POST",
                body: JSON.stringify(info),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                },
                credentials: 'include' // important to include cookies
            });
            
            const res = await result.json();
            
            if(res.success){
                setAccessToken(res.accessToken);
                setErrorMsg(null); // Clear error on success
            } else {
                setErrorMsg(res.msg);
                console.log("Error Message", res.msg);
            }
        } catch (error) {
            setErrorMsg("Network error. Please try again.");
            console.error("Login error:", error);
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
            setErrorMsg(null);
            // Redirect will be handled by ProtectedRoute
        }
    };

    const signup = async (info) => {
        // Clear any previous messages
        setErrorMsg(null);
        setSuccessMsg(null);
        setAuthLoading(true);
        
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
            setAuthLoading(false);
        }
    };

    const forgetPassword = async (email) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setAuthLoading(true);
        
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
            setAuthLoading(false);
        }
    };

    const resetPassword = async (passwordData, token) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setAuthLoading(true);
        
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
            setAuthLoading(false);
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

    return (
        <AuthContext.Provider value={{ 
            accessToken, 
            login, 
            signup,
            forgetPassword,
            resetPassword,
            logout, 
            ErrorMsg, 
            successMsg,
            loading, 
            authLoading,
            clearError,
            clearSuccess,
            clearMessages
        }}>
            {children}
        </AuthContext.Provider>
    );
};
