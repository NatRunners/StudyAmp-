import React from 'react';
import '../styles/CreateSes.css';

const CreateSes = () => {
  const handleStartSession = () => {
    // Handle session start logic here
    console.log('Session Started');
  };

  return (
    <div className="create-ses-page">
      <div className="text-content">
        <h1>Create a New Focus Session</h1>
        <p>
          Start a session to monitor your focus levels in real time and improve
          your productivity. Each session is designed to help you achieve
          better concentration and track your progress.
        </p>
        <button onClick={handleStartSession} className="start-session-button">
          Start Session
        </button>
      </div>
    </div>
  );
};

export default CreateSes;
