import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
  } from 'chart.js';
  import React, { useState } from 'react';
  import { Line } from 'react-chartjs-2';
  import { useNavigate } from 'react-router-dom';
  import '../styles/CreateSes.css';
  import '../styles/Global.css';
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );
  
  const SessionPage = () => {
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
    const [socket, setSocket] = useState(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false); // Track if session has ended
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;
  
    const handleConfirmStart = () => {
      handleStartSession();
      setIsConfirmed(true);
    };
  
    const handleBack = () => {
      if (socket) {
        socket.close();
      }
      navigate(-1);
    };
  
    const handleStartSession = () => {
      const requestOptions = {
        method: 'POST',
        redirect: 'follow',
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
    };
  
    const startWebSocketConnection = (session) => {
      const wsUrl = process.env.REACT_APP_WS_URL;
      const newSocket = new WebSocket(`${wsUrl}/${session.session_id}`);
      setSocket(newSocket);
  
      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        newSocket.send(
          JSON.stringify({ message: 'Session started', sessionId: session.session_id })
        );
      };
  
      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
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
  
    const handleStopSession = () => {
      if (socket) {
        fetch(`${apiUrl}/sessions/${session.session_id}`, { method: 'DELETE' })
          .then((response) => response.text())
          .then((result) => {
            console.log(result);
            socket.close();
            setSocket(null);
            setSession(null);
            setSessionEnded(true);
          })
          .catch((error) => console.error(error));
      }
    };
  
    return (
      <div className="create-ses-page">
        <div className="text-content">
          <h1>New Session</h1>
          {!isConfirmed || sessionEnded ? (
            <>
              <p>Click start when you're ready to commence your session.</p>
              <button onClick={handleConfirmStart} className="start-session-button">
                Start Session
              </button>
              <button onClick={handleBack} className="start-session-button" style={{ margin: 20 }}>
                Back
              </button>
            </>
          ) : (
            <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
              <div className="graph-container">
                <h1>Real-Time Attention Score</h1>
                <Line data={chartData} width={960} height={400} />
              </div>
              <button
                onClick={handleStopSession}
                className="start-session-button"
                style={{ backgroundColor: '#dc2626', marginBottom: '2rem' }}
              >
                Stop Session
              </button>
            </div>
          )}
  
          {sessionEnded && (
            <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
              <div className="graph-container">
                <h1>Session Ended</h1>
                {/* Placeholder graph */}
                <div
                  style={{
                    width: '100%',
                    height: '400px',
                    backgroundColor: '#f1f1f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <p>No data available. Session has ended.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default SessionPage;
  