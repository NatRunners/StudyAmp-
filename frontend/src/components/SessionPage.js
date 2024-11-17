import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';
import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/CreateSes.css';
import '../styles/Global.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SessionPage = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Attention Score',
        data: [],
        fill: {
          target: { value: 50 },
          above: 'rgba(75, 192, 192, 0.5)', // Color for values above 50
          below: 'rgba(255, 99, 132, 0.5)'  // Color for values below 50
        },
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  });

  const [movingAverage, setMovingAverage] = useState(0);
  const [attentionScores, setAttentionScores] = useState([]);
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('');
  
  const audioChunks = useRef([]);
  const lowAttentionPeriods = useRef([]);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const calculateMovingAverage = (scores) => {
    if (!scores || scores.length === 0) return 0;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return (sum / scores.length).toFixed(2);
  };

  const handleBack = () => {
    if (socket) {
      socket.close();
    }
    navigate(-1);
  };

  const handleConfirmStart = async () => {
    try {
      setIsLoading(true);
      audioChunks.current = [];
      lowAttentionPeriods.current = [];
      setSummaries([]);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.start(1000);
      setMediaRecorder(recorder);
      
      handleStartSession();
      setIsConfirmed(true);
      setSessionEnded(false);
    } catch (error) {
      console.error('Error starting session:', error);
      setIsLoading(false);
      setIsConfirmed(false);
    }
  };

  const handleStartSession = () => {
    setChartData({
      labels: [],
      datasets: [
        {
          label: 'Attention Score',
          data: [],
          fill: {
            target: { value: 50 },
            above: 'rgba(75, 192, 192, 0.5)', // Color for values above 50
            below: 'rgba(255, 99, 132, 0.5)'  // Color for values below 50
          },
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    });

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

  const handleStopSession = async () => {
    if (!socket || !mediaRecorder) return;

    try {
      setProcessingStatus('Stopping recording...');
      mediaRecorder.stop();
      
      await new Promise(resolve => {
        mediaRecorder.onstop = async () => {
          if (audioChunks.current.length > 0 && lowAttentionPeriods.current.length > 0) {
            setProcessingStatus('Preparing audio data...');
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('timestamps', JSON.stringify(lowAttentionPeriods.current));

            try {
              setProcessingStatus('Processing audio segments...');
              const response = await fetch(`${apiUrl}/process_audio`, {
                method: 'POST',
                body: formData,
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              setProcessingStatus('');
              setSummaries(data.summaries || ['No insights available for this session.']);
            } catch (error) {
              console.error('Error processing audio:', error);
              setProcessingStatus('');
              setSummaries(['Failed to process audio. Please try again.']);
            }
          } else {
            setProcessingStatus('');
            setSummaries(['No attention drops detected during this session.']);
          }
          resolve();
        };
      });

      // Reset states
      setMovingAverage(0);
      setAttentionScores([]);
      audioChunks.current = [];
      lowAttentionPeriods.current = [];

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
    } catch (error) {
      console.error('Error stopping session:', error);
      setProcessingStatus('');
      setSummaries(['An error occurred while ending the session.']);
    }
  };

  const startWebSocketConnection = (session) => {
    if (!session || !session.session_id) {
      console.error('Invalid session data');
      setIsLoading(false);
      return;
    }

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
      setIsLoading(false);
      console.log('Message from server: ', data);

      const attentionScore = data.attention_score;
      const timestamp = new Date(data.timestamp * 1000).toLocaleTimeString();

      if (data.attention_score < 50) {
        lowAttentionPeriods.current.push({
          timestamp: data.timestamp,
          score: data.attention_score
        });
      }

      // Update attention scores array for moving average
      setAttentionScores(prev => {
        const newScores = [...prev, attentionScore];
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

  const buttonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.9 },
  };

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad',
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      }
    }
  };

  return (
    <div className="create-ses-page">
      <div className="text-content">
        <h1>New Session</h1>
        {!isConfirmed || sessionEnded ? (
          <>
            <p>Click start when you're ready to commence your session.</p>
            <motion.button 
              onClick={handleConfirmStart} 
              className="start-session-button"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Start Session
            </motion.button>
            <motion.button 
              onClick={handleBack} 
              className="start-session-button" 
              style={{ margin: 20 }}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Back
            </motion.button>
          </>
        ) : (
          <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
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
                    <h2>Average Attention Score: {movingAverage || 0}</h2>
                  </div>
                  <Line data={chartData} options={chartOptions} width={960} height={400} />
                </>
              )}
            </div>
            <motion.button
              onClick={handleStopSession}
              className="start-session-button"
              style={{ backgroundColor: '#dc2626', marginBottom: '2rem' }}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Stop Session
            </motion.button>
          </div>
        )}

        {processingStatus && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{processingStatus}</p>
          </div>
        )}

        {Array.isArray(summaries) && summaries.length > 0 && (
          <div className="summaries-container">
            <h2>Session Insights</h2>
            {summaries.map((summary, index) => (
              <div key={index} className="summary-card">
                <p>{summary || 'No summary available'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionPage;