import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import '../styles/CreateSes.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CreateSes = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Attention Score',
        data: [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  });
  const [session, setSession] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;

  const [isSessionActive, setIsSessionActive] = useState(false); // Track session state
  const [socket, setSocket] = useState(null); // Store WebSocket instance

  const handleStartSession = () => {
    const requestOptions = {
      method: "POST",
      redirect: "follow"
    };
    
    fetch(`${apiUrl}/sessions`, requestOptions)
      .then((response) => response.text())
      .then((result) => {
        result = JSON.parse(result);
        console.log(result);
        setSession(result);
        startWebSocketConnection(result);
      })
      .catch((error) => console.error(error));
    
    setIsSessionActive(true); // Session has started
    console.log('Session Started');
  };

  const handleStopSession = () => {
    if (socket) {
      fetch(`${apiUrl}/sessions/${session.session_id}`, {method: 'DELETE'})
        .then((response) => response.text())
        .then((result) => {
          console.log(result);
          socket.close(); // Close the WebSocket connection
          setIsSessionActive(false); // Session has stopped
          setSocket(null); // Reset WebSocket instance
          setSession(null);
        })
        .catch((error) => console.error(error));
      console.log('Session Stopped');
    }
  };

  const startWebSocketConnection = (session) => {
    const wsUrl = process.env.REACT_APP_WS_URL;
    console.log(wsUrl);

    const newSocket = new WebSocket(`${wsUrl}/${session.session_id}`);
    setSocket(newSocket); // Store WebSocket instance for later use

    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      newSocket.send(JSON.stringify({ message: 'Session started', sessionId: session.session_id }));
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Message from server: ', data);

      const attentionScore = data.attention_score;
      const timestamp = new Date(data.timestamp * 1000).toLocaleTimeString();

      setChartData((prevData) => {
        const newLabels = [...prevData.labels, timestamp];
        const newData = [...prevData.datasets[0].data, attentionScore];

        if (newLabels.length > 20) {
          newLabels.shift();
          newData.shift();
        }

        return {
          labels: newLabels,
          datasets: [
            {
              ...prevData.datasets[0],
              data: newData,
            },
          ],
        };
      });
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error: ', error);
    };

    newSocket.onclose = () => {
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

        {!isSessionActive ? (
          <button onClick={handleStartSession} className="start-session-button">
            Start Session
          </button>
        ) : (
          <button onClick={handleStopSession} className="start-session-button">
            Stop Session
          </button>
        )}
      </div>

      <div className="graph-container">
        <h2>Real-Time Attention Score</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default CreateSes;
