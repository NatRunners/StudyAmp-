import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import FadeIn from "react-fade-in";
import "./App.css";
import CreateSes from "./components/CreateSes";


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
      <Navigation />
        <FadeIn transitionDuration={700}>
        <section id="landing">
        <LandingPage />
        </section>
        <section id="create">
        <CreateSes />
        </section>
        </FadeIn>



      
      
    </ThemeProvider>
  );
}

export default App;
