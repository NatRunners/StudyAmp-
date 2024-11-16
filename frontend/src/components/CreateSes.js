import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import '../styles/CreateSes.css';
import '../styles/Global.css';

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
  const [movingAverage, setMovingAverage] = useState(0);
  const [attentionScores, setAttentionScores] = useState([]);
  const [session, setSession] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;

  const [isSessionActive, setIsSessionActive] = useState(false); // Track session state
  const [socket, setSocket] = useState(null); // Store WebSocket instance
  const [isLoading, setIsLoading] = useState(false);

  const calculateMovingAverage = (scores) => {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return (sum / scores.length).toFixed(2);
  };

  const handleStartSession = () => {
    setIsLoading(true);
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
      setIsSessionActive(false); 
      setMovingAverage(0);
      setAttentionScores([]);
  
      fetch(`${apiUrl}/sessions/${session.session_id}`, { method: 'DELETE' })
        .then((response) => response.text())
        .then((result) => {
          console.log(result);
          socket.close(); // Close the WebSocket connection
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
      setIsLoading(false); // Stop loading when first data arrives
      console.log('Message from server: ', data);

      const attentionScore = data.attention_score;
      const timestamp = new Date(data.timestamp * 1000).toLocaleTimeString();

      // Update attention scores array for moving average
      setAttentionScores(prev => {
        const newScores = [...prev, attentionScore];
        // Keep only last 33 scores (approximately 8.25 seconds at 4 readings per second)
        const updatedScores = newScores.slice(-33);
        setMovingAverage(calculateMovingAverage(updatedScores));
        return updatedScores;
      });

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
      {isSessionActive && (
        <div className="graph-container">
          <h1>Real-Time Attention Score</h1>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Initializing session...</p>
            </div>
          ) : (
            <>
              <div className="average-score">
                <h2>Average Attention Score: {movingAverage}</h2>
              </div>
              <Line data={chartData} width={960} height={400}/>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateSes;