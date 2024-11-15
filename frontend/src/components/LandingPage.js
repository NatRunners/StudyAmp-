import React from 'react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <section id="landing" className="landing-section">
      <div className="content">
        <h1>
          Welcome to <span className="color-changing">StudyAmp</span>
        </h1>
        <p>Study Amplified, Focus Maximized.</p>
      </div>
    </section>
  );
};

export default LandingPage;
