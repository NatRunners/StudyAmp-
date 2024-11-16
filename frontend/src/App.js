import { CssBaseline } from "@mui/material";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Navigation from "./components/Navigation";
import SessionPage from "./components/SessionPage";
import ViewSes from "./components/ViewSes";
import VisualizeFocus from "./components/VisualizeFocus";

/// Define the dark theme inline
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import UserProvider from "./context/UserContext";  // Import the UserProvider
import "./App.css";
import LoginPage from "./components/LoginPage";
import SettingsPage from "./components/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Dark theme config

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#90caf9" },
    background: { default: "#121212", paper: "#1e1e1e" },
    text: { primary: "#ffffff", secondary: "#b0bec5" },
  },
});

function App() {
  return (
    <UserProvider>  {/* Wrap the app inside UserProvider */}
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Router>
          <Navigation />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<SessionPage />} />
            <Route path="/view" element={<ViewSes />} />
            <Route path="/visualize" element={<VisualizeFocus />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/settings" element={<ProtectedRoute component={<SettingsPage />} />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;