import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import React from "react";
import { Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import Navigation from "./components/Navigation";
import NewSession from "./components/NewSession";
import Overview from "./components/Overview";
import PastSession from "./components/PastSession";
import SessionPage from "./components/SessionPage";

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
                <Home />
              </section>
              <section id="create">
                <NewSession />
              </section>
              <section id="view">
                <PastSession />
              </section>
              <section id="visualize">
                <Overview />
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