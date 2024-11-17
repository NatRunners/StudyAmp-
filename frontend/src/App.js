import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import LandingPage from "./components/LandingPage";
import Navigation from "./components/Navigation";
import SessionPage from "./components/SessionPage";
import ViewSes from "./components/ViewSes";
import VisualizeFocus from "./components/VisualizeFocus";

/// Define the dark theme inline
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
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;