import { createContext, useContext, useState, useEffect } from "react"
import Cookies from 'js-cookie';

const AuthContext = createContext(null)

export function AuthProvider({children}){
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

    useEffect(() => {
        const fetchUser = async () => {
            const token = Cookies.get('token')
            if(!token){
                setLoading(false)
                return
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                
                if(res.ok){
                    const userData = await res.json()
                    setUser(userData)
                } else {
                    Cookies.remove('token')
                }
            } catch (error) {
                console.error("Network/Server offline during session restore:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    const login = (userData, token) => {
        Cookies.set('token', token, { expires: 7})
        setUser(userData)
    }

    const logout = () => {
        Cookies.remove('token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{user, loading, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
