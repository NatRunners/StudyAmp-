import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/SessionReviewPage.css';
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

const SessionReviewPage = () => {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;
  const windowSize = 10; // Added window size parameter

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/sessions/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSessionData(data);
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMovingAverage = (data, windowSize) => {
    let result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const subset = data.slice(start, i + 1);
      const average = subset.reduce((a, b) => a + b, 0) / subset.length;
      result.push(average);
    }
    return result;
  };

  const chartData = {
    labels: sessionData ? sessionData.attention_scores.map((_, index) => index + 1) : [],
    datasets: [
      {
        label: 'Attention Score',
        data: sessionData ? calculateMovingAverage(sessionData.attention_scores, windowSize) : [],
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1,
        fill: {
          target: { value: 50 },
          above: 'rgba(75, 192, 192, 0.5)', // Color for values above 50
          below: 'rgba(255, 99, 132, 0.5)'  // Color for values below 50
        },
        borderWidth: 2, // Added line weight
      }
    ],
  };

  const chartOptions = {
    responsive: true,
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
    },
    animation: { // Added chart animation
      duration: 1000,
      easing: 'easeInOutQuad',
    }
  };

  if (isLoading) return <div className="loading-container"><div className="loading-spinner" /></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="session-review-page global-background">
      <h1>Session Review</h1>
      <button onClick={() => navigate(-1)} className="back-button">Back</button>
      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className="session-details">
        <h2>Session Details</h2>
        <p><strong>Started:</strong> {new Date(sessionData.start_time).toLocaleString()}</p>
        {sessionData.end_time && <p><strong>Ended:</strong> {new Date(sessionData.end_time).toLocaleString()}</p>}
        {sessionData.average_attention && (
          <p><strong>Average Attention:</strong> {sessionData.average_attention.toFixed(1)}%</p>
        )}
        {sessionData.summaries && sessionData.summaries.length > 0 && (
          <div className="session-insights">
            <h3>Session Insights</h3>
            <ul>
              {sessionData.summaries.map((summary, index) => (
                <li key={index}>{summary}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionReviewPage;