import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/ViewSes.css';
import '../styles/Global.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ViewSes = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      calculateSessionMetrics(sessions);
    }
  }, [sessions]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/sessions/history?limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      setSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
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

  const calculateSessionMetrics = (sessions) => {
    const metrics = {
      averageAttentionBySession: {
        labels: sessions.map(s => new Date(s.start_time).toLocaleString()),
        datasets: [{
          label: 'Average Attention',
          data: sessions.map(s => s.average_attention || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
        }]
      },
      sessionDurations: {
        labels: sessions.map(s => new Date(s.start_time).toLocaleString()),
        datasets: [{
          label: 'Session Duration (minutes)',
          data: sessions.map(s => {
            const start = new Date(s.start_time);
            const end = s.end_time ? new Date(s.end_time) : new Date();
            return ((end - start) / 1000 / 60).toFixed(1);
          }),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgb(153, 102, 255)',
        }]
      },
      attentionTrend: {
        labels: sessions.map(s => new Date(s.start_time).toLocaleString()),
        datasets: [{
          label: 'Attention Trend',
          data: sessions.map(s => s.average_attention || 0),
          fill: false,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }]
      }
    };
    setMetricsData(metrics);
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await fetch(`${apiUrl}/sessions/${sessionId}/delete`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      // Remove session from local state
      setSessions(sessions.filter(s => s.session_id !== sessionId));
      setDeleteConfirm(null);
      // Recalculate metrics
      calculateSessionMetrics(sessions.filter(s => s.session_id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSessionClick = (sessionId) => {
    navigate(`/session-review/${sessionId}`);
  };

  const handleReview = (sessionId) => {
    navigate(`/session-review/${sessionId}`);
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
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  const buttonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.9 },
  };

  if (isLoading) return <div className="loading-container"><div className="loading-spinner" /></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="view-sessions-page global-background">
      <h1>Session History & Analytics</h1>
      
      {isLoading ? <div className="loading-container"><div className="loading-spinner" /></div> :
        error ? <div className="error-message">{error}</div> : (
          <>
            <div className="metrics-grid">
              {metricsData && (
                <>
                  <div className="metric-card">
                    <h3>Average Attention by Session</h3>
                    <Bar data={metricsData.averageAttentionBySession} options={{
                      ...chartOptions,
                      scales: { x: { display: false }, y: { beginAtZero: true } }
                    }} />
                  </div>
                  <div className="metric-card">
                    <h3>Session Durations</h3>
                    <Bar data={metricsData.sessionDurations} options={{
                      ...chartOptions,
                      scales: { x: { display: false }, y: { beginAtZero: true } }
                    }} />
                  </div>
                  <div className="metric-card">
                    <h3>Attention Trend</h3>
                    <Line data={metricsData.attentionTrend} options={{
                      ...chartOptions,
                      scales: { x: { display: false }, y: { beginAtZero: true } }
                    }} />
                  </div>
                </>
              )}
            </div>

            <div className="sessions-grid">
              {sessions.map(session => (
                <div key={session.session_id} className="session-card" onClick={() => handleSessionClick(session.session_id)}>
                  <div className="session-header">
                    <h3>Session {formatDate(session.start_time)}</h3>
                    <div className="session-actions">
                      <span className={`status-badge ${session.status}`}>{session.status}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(session.session_id);
                        }}
                        className="delete-button"
                        title="Delete session"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="session-details">
                    <p><strong>Started:</strong> {formatDate(session.start_time)}</p>
                    {session.end_time && <p><strong>Ended:</strong> {formatDate(session.end_time)}</p>}
                    {session.average_attention && (
                      <p><strong>Average Attention:</strong> {session.average_attention.toFixed(1)}%</p>
                    )}
                  </div>
                  {session.summaries && session.summaries.length > 0 && (
                    <div className="session-insights">
                      <h4>Session Insights</h4>
                      <ul>
                        {session.summaries.map((summary, index) => (
                          <li key={index}>{summary}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {deleteConfirm && (
              <motion.div 
                className="delete-modal"
                initial="hidden"
                animate="visible"
                variants={modalVariants}
              >
                <div className="delete-modal-content">
                  <h3>Confirm Delete</h3>
                  <p>Are you sure you want to delete this session?</p>
                  <div className="delete-modal-actions">
                    <motion.button 
                      onClick={() => handleDeleteSession(deleteConfirm)}
                      className="confirm-delete"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      Delete
                    </motion.button>
                    <motion.button 
                      onClick={() => setDeleteConfirm(null)}
                      className="cancel-delete"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )
      }
    </div>
  );
};

export default ViewSes;
