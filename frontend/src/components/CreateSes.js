import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import '../styles/CreateSes.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CreateSes = () => {
  const [chartData, setChartData] = useState({
    labels: [], // Time stamps or data points
    datasets: [
      {
        label: 'Attention Score',
        data: [], // Your real-time attention scores
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  });

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
    const wsUrl = process.env.REACT_APP_WS_URL;
    console.log(wsUrl);

    const socket = new WebSocket(`${wsUrl}/${session.session_id}`);

    socket.onopen = () => {
      console.log('WebSocket connection established');
      socket.send(JSON.stringify({ message: 'Session started', sessionId: session.session_id }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data); // Assuming the message contains an object with `attention_score`, `timestamp`, etc.
      console.log('Message from server: ', data);

      // Extract the attention_score and timestamp
      const attentionScore = data.attention_score;
      const timestamp = new Date(data.timestamp * 1000).toLocaleTimeString(); // Convert to readable time

      // Update chart with real-time data
      setChartData((prevData) => {
        const newLabels = [...prevData.labels, timestamp]; // Add the formatted timestamp
        const newData = [...prevData.datasets[0].data, attentionScore]; // Add the attention score

        // Keep only the last 20 data points for smoother scrolling
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

      <div className="graph-container">
        <h2>Real-Time Attention Score</h2>
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default CreateSes;
