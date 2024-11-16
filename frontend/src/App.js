import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import React from "react";
import { Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import "./App.css";
import CreateSes from "./components/CreateSes";
import LandingPage from "./components/LandingPage";
import Navigation from "./components/Navigation";
import SessionPage from "./components/SessionPage";
import ViewSes from "./components/ViewSes";
import VisualizeFocus from "./components/VisualizeFocus";

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

const fadeInSettings = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7 },
};

function AppContent() {
  const location = useLocation();
  const showNavigation = location.pathname !== '/session';

  return (
    <>
      {showNavigation && <Navigation />}
      <Routes>
        <Route
          path="/session"
          element={<SessionPage />}
        />
        <Route
          path="/"
          element={
            <motion.div {...fadeInSettings}>
              <section id="landing">
                <LandingPage />
              </section>
              <section id="create">
                <CreateSes />
              </section>
              <section id="view">
                <ViewSes />
              </section>
              <section id="visualize">
                <VisualizeFocus />
              </section>
            </motion.div>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Router>
  );
}

export default App;