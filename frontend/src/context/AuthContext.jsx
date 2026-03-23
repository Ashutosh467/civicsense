import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("civicsense_token") || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If we have a token, we consider them logged in 
        // (A real app would verify the token on the backend here)
        if (token) {
            const storedUser = localStorage.getItem("civicsense_user");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    }, [token]);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem("civicsense_token", jwtToken);
        localStorage.setItem("civicsense_user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("civicsense_token");
        localStorage.removeItem("civicsense_user");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
