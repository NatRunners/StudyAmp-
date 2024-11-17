import React from 'react';
import { motion } from 'framer-motion';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const textVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section id="landing" className="landing-section">
      <div className="content">
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          Welcome to <span className="color-changing">StudyAmp</span>
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          Study Amplified, Focus Maximized.
        </motion.p>
      </div>
    </section>
  );
};

export default LandingPage;
