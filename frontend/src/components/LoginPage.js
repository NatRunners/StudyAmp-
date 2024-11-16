import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { Box, TextField, Button, Typography } from "@mui/material";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(UserContext);  // Get login function from UserContext
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === "user" && password === "password") {
      const userData = { username };  // Mock user data
      login(userData);  // Set user in context and localStorage
      navigate("/settings");  // Redirect to settings
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Typography variant="h4" gutterBottom>Login</Typography>
      <TextField label="Username" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2, width: "300px" }} />
      <TextField label="Password" variant="outlined" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2, width: "300px" }} />
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Button variant="contained" onClick={handleLogin}>Login</Button>
    </Box>
  );
};

export default LoginPage;
