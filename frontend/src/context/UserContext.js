import React, { createContext, useState, useEffect } from "react";

// Create UserContext
export const UserContext = createContext();

const UserProvider = ({ children }) => {
  // State to hold logged-in user data (null if not logged in)
  const [user, setUser] = useState(null);

  // On component mount, check if user info exists in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Parse and set the user state
    }
  }, []);

  // Login function to set user data and save to localStorage
  const login = (userData) => {
    setUser(userData);  // Update user state
    localStorage.setItem("user", JSON.stringify(userData)); // Persist user data
  };

  // Logout function to clear user data from state and localStorage
  const logout = () => {
    setUser(null);  // Clear user state
    localStorage.removeItem("user");  // Remove user from localStorage
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
