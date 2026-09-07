import { createContext, useContext, useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { authAPI } from "../services/apiService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(Cookies.get('token') || null);
    const [loading, setLoading] = useState(true);

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
                const res = await authAPI.getMe();
                setUser(res.data);
                setToken(savedToken);

            } catch (error) {
                console.error("Session restore failed:", error);
                Cookies.remove('token');
                setToken(null);
                setUser(null)
                
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