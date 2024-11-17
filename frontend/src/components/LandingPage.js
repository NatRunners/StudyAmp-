import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/create');
  };

  return (
    <section id="landing" className="landing-section">
      <div className="content">
        <h1>
          Welcome to <span className="color-changing">StudyAmp</span>
        </h1>
        <p>Study Amplified, Focus Maximized.</p>
        <button className="start-button" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>
    </section>
  );
};

export default LandingPage;