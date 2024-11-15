import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { motion } from "framer-motion"; // Import motion from Framer Motion
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import "./App.css";
import CreateSes from "./components/CreateSes";
import ViewSes from "./components/ViewSes";
import VisualizeFocus from "./components/VisualizeFocus";

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

// Animation settings for fade-in effect
const fadeInSettings = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7 },
};

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Navigation />
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
    </ThemeProvider>
  );
}

export default App;
