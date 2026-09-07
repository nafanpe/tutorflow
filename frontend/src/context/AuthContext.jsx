import { createContext, useContext, useState, useEffect } from "react";
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(Cookies.get('token') || null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchUser = async () => {
            const savedToken = Cookies.get('token');
            if (!savedToken || savedToken === 'undefined') {
                Cookies.remove('token')
                setToken(null)
                setLoading(false)
                return
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${savedToken}` }
                });
                
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                    setToken(savedToken);
                } else {
                    Cookies.remove('token');
                    setToken(null);
                }
            } catch (error) {
                console.error("Network/Server offline during session restore:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const login = (userData, receivedToken) => {
        Cookies.set('token', receivedToken, { expires: 7 });
        setToken(receivedToken);
        setUser(userData);
    };

    const logout = () => {
        Cookies.remove('token');
        setToken(null); 
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);