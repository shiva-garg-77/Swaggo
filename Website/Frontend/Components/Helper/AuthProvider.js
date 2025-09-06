import { createContext, useState, useEffect } from "react";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Try auto-login on mount
    useEffect(() => {
        const refresh = async () => {
            try {
                const DataResult = await fetch('http://localhost:4000/api/refresh-token', {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });
            const res = await DataResult.json();
                setAccessToken(res.data.accessToken);
            } catch (err) {
                setAccessToken(null);
            } finally {
                setLoading(false);
            }
        };
        refresh();
    }, []);

    const login = async (info) => {
        const result = await fetch(`http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/login`, {
            method: "POST",
            body: JSON.stringify(info),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            credentials: 'include' // important to include cookies
        })

        const res = await result.json()
        setAccessToken(res.data.accessToken);
    };

    const logout = () => {
        setAccessToken(null);
        // optionally tell backend to clear refresh cookie
    };

    return (
        <AuthContext.Provider value={{ accessToken, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
