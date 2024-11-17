import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import '../styles/Global.css';
import '../styles/ViewSes.css';

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

const SessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
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

  const calculateSessionMetrics = (sessions) => {
    const metrics = {
      averageAttentionBySession: {
        labels: sessions.map(s => s.session_id.slice(0, 8)),
        datasets: [{
          label: 'Average Attention',
          data: sessions.map(s => s.average_attention || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
        }]
      },
      sessionDurations: {
        labels: sessions.map(s => s.session_id.slice(0, 8)),
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
        labels: sessions.map(s => s.session_id.slice(0, 8)),
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
      
      setSessions(sessions.filter(s => s.session_id !== sessionId));
      setDeleteConfirm(null);
      calculateSessionMetrics(sessions.filter(s => s.session_id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session');
    }
  };

  const toggleSessionExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (startTime, endTime) => {
    if (!endTime) return 'Ongoing';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.floor((end - start) / 1000 / 60);
    return minutes >= 60 
      ? `${Math.floor(minutes/60)}h ${minutes%60}m`
      : `${minutes}m`;
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      }
    }
  };

  if (isLoading) return <div className="loading-container"><div className="loading-spinner" /></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="view-ses-page">
      <h1>Sessions History & Analytics</h1>
      
      <div className="metrics-grid">
        {metricsData && (
          <>
            <div className="metric-card">
              <h3>Average Attention by Session</h3>
              <Bar data={metricsData.averageAttentionBySession} options={chartOptions} />
            </div>
            <div className="metric-card">
              <h3>Session Durations</h3>
              <Bar data={metricsData.sessionDurations} options={{
                ...chartOptions,
                scales: { 
                  ...chartOptions.scales,
                  y: { 
                    ...chartOptions.scales.y, 
                    max: undefined 
                  } 
                }
              }} />
            </div>
            <div className="metric-card">
              <h3>Attention Trend</h3>
              <Line data={metricsData.attentionTrend} options={chartOptions} />
            </div>
          </>
        )}
      </div>

      <h2>Session Details</h2>
      <div className="scrollable-session-list">
        {sessions.map(session => (
          <div 
            key={session.session_id} 
            className="session-card"
            onClick={() => toggleSessionExpand(session.session_id)}
          >
            <div className="session-header">
              <h3>Session {session.session_id.slice(0, 8)}</h3>
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
              {session.end_time && (
                <>
                  <p><strong>Ended:</strong> {formatDate(session.end_time)}</p>
                  <p><strong>Duration:</strong> {calculateDuration(session.start_time, session.end_time)}</p>
                </>
              )}
              {session.average_attention && (
                <p><strong>Average Attention:</strong> {session.average_attention.toFixed(1)}%</p>
              )}
            </div>

            {expandedSession === session.session_id && session.summaries && session.summaries.length > 0 && (
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
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this session?</p>
            <div className="delete-modal-actions">
              <button 
                onClick={() => handleDeleteSession(deleteConfirm)}
                className="confirm-delete"
              >
                Delete
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="cancel-delete"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionHistory;