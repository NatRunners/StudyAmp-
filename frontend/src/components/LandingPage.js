import React from 'react';

const LandingPage = () => {
  return (
    <section id="landing" style={styles.landing}>
      <h1 style={styles.title}>Welcome to StudyAmp</h1>
      <p style={styles.subtitle}>Enhance your focus. Improve your learning.</p>
    </section>
  );
};

const styles = {
  landing: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#121212', // Match the dark theme
    color: '#ffffff', // White text for dark background
  },
  title: { fontSize: '3rem', marginBottom: '1rem' },
  subtitle: { fontSize: '1.5rem' },
};

export default LandingPage;
