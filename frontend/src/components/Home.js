import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
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

export default Home;