import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import Navigation from "./components/Navigation";
import NewSession from "./components/NewSession";
import Overview from "./components/Overview";
import PastSession from "./components/PastSession";
import SessionPage from "./components/SessionPage";

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
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewSession />} />
          <Route path="/create" element={<SessionPage />} />
          <Route path="/view" element={<PastSession />} />
          <Route path="/visualize" element={<Overview />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;