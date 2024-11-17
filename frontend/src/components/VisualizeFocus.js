import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import '../styles/Global.css';
import '../styles/VisualizeFocus.css';

// Register the necessary components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const VisualizeFocus = () => {
  const [summaryStats, setSummaryStats] = useState({
    totalSessions: 10,
    averageFocusDuration: '1h 20m',
    averageFocusLevel: 75,
  });

  const lineData = {
    labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6'],
    datasets: [
      {
        label: 'Focus Duration (minutes)',
        data: [50, 70, 80, 65, 90, 75],
        fill: false,
        backgroundColor: '#3e8a84',
        borderColor: '#3e8a84',
      },
    ],
  };

  const barData = {
    labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6'],
    datasets: [
      {
        label: 'Focus Level (%)',
        data: [80, 85, 75, 70, 90, 78],
        backgroundColor: '#3e8a84',
      },
    ],
  };

  useEffect(() => {
    // Fetch data from API or use mock data
    //use mock data for time being
    setSummaryStats({
        totalSessions: 10,
        averageFocusDuration: '1h 20m',
        averageFocusLevel: 75,
    });
    
  }, []);

  return (
    <div className="visualize-focus-page">
      <h1>Focus Overview</h1>
      
      <div className="summary-stats">
        <div className="stat-item">
          <h2>Total Sessions</h2>
          <p>{summaryStats.totalSessions}</p>
        </div>
        <div className="stat-item">
          <h2>Average Focus Duration</h2>
          <p>{summaryStats.averageFocusDuration}</p>
        </div>
        <div className="stat-item">
          <h2>Average Focus Level</h2>
          <p>{summaryStats.averageFocusLevel}%</p>
        </div>
      </div>

      <div className="chart-container">
        <h2>Focus Duration Over Sessions</h2>
        <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>

      <div className="chart-container">
        <h2>Focus Level Across Sessions</h2>
        <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </div>
  );
};

export default VisualizeFocus;
