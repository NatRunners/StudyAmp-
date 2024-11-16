import React from 'react';
import '../styles/CreateSes.css';

const CreateSes = () => {
  const handleStartSession = () => {
    // Handle session start logic here
    const apiUrl = process.env.REACT_APP_API_URL;
    const requestOptions = {
      method: "POST",
      redirect: "follow"
    };
    
    fetch(`${apiUrl}/sessions`, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        result = JSON.parse(result);
        console.log(result);
        startWebSocketConnection(result);
      })
      .catch((error) => console.error(error));
    console.log('Session Started');
  };

  // WebSocket connection function using session data
  const startWebSocketConnection = (session) => {
    // Assuming session contains necessary data to connect
    const wsUrl = process.env.REACT_APP_WS_URL;
    console.log(wsUrl);

    const socket = new WebSocket(`${wsUrl}/${session.session_id}`);

    socket.onopen = () => {
      console.log('WebSocket connection established');
      // You can send messages or listen for events after connection
      socket.send(JSON.stringify({ message: 'Session started', sessionId: session.session_id }));
    };

    socket.onmessage = (event) => {
      console.log('Message from server: ', event.data);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error: ', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
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
