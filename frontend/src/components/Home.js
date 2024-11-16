import React from 'react';
import '../styles/Home.css';

const Home = () => {
  return (
    <section id="landing" className="landing-section">
      <div className="content">
        <h1>
          Welcome to <span className="color-changing">StudyAmp</span>
        </h1>
        <p>Study Amplified, Focus Maximized.</p>
        <button className="start-button" onClick={() => scrollToSection("create")}>Get Started</button>
      </div>
    </section>
  );
};

const scrollToSection = (section) => {
  const sectionElement = document.getElementById(section);
  if (sectionElement) {
    sectionElement.scrollIntoView({ behavior: "smooth" });
  }
};

export default Home;
