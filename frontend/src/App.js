import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import CreateSes from "./components/CreateSes";
import SessionPage from "./components/SessionPage";
import ViewSes from "./components/ViewSes";
import VisualizeFocus from "./components/VisualizeFocus";
import SessionReviewPage from "./components/SessionReviewPage";
import "./App.css";

// Define the dark theme inline
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0bec5",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<SessionPage />} />
          <Route path="/view" element={<ViewSes />} />
          <Route path="/visualize" element={<VisualizeFocus />} />
          <Route path="/session-review/:sessionId" element={<SessionReviewPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
