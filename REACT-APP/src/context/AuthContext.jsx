import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("novacart-user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("novacart-token") || "",
  );

  useEffect(() => {
    if (user) {
      localStorage.setItem("novacart-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("novacart-user");
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("novacart-token", token);
    } else {
      localStorage.removeItem("novacart-token");
    }
  }, [token]);

  const login = ({ user: userData, token: authToken }) => {
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken("");
  };

  const updateUser = (updates) => {
    setUser((currentUser) => ({ ...currentUser, ...updates }));
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      updateUser,
      logout,
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
