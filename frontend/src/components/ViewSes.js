import React, { useState, useEffect } from 'react';
import '../styles/ViewSes.css';

const ViewSes = () => {
  // Mock data for past sessions
  const [sessions, setSessions] = useState([
    {
      id: 1,
      name: 'Focus Session 1',
      description: 'A productive morning session.',
      date: '2023-11-01',
      duration: '1h 30m',
    },
    {
      id: 2,
      name: 'Afternoon Focus',
      description: 'Worked on learning objectives.',
      date: '2023-11-02',
      duration: '2h 00m',
    },
    {
      id: 3,
      name: 'Evening Deep Work',
      description: 'Focused on reading and understanding.',
      date: '2023-11-03',
      duration: '1h 45m',
    },
    {
      id: 4,
      name: 'Night Study',
      description: 'Focused on project work.',
      date: '2023-11-04',
      duration: '2h 15m',
    },
    {
      id: 5,
      name: 'Early Morning Focus',
      description: 'Worked on important tasks.',
      date: '2023-11-05',
      duration: '1h 20m',
    },
  ]);

  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    // If you're fetching data from an API, replace this mock data with an API call here.
    // Example: fetchSessionsFromAPI().then(data => setSessions(data));
  }, []);

  // Show only the last 4 sessions
  const recentSessions = sessions.slice(-4);

  const toggleSessionExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  return (
    <div className="view-sessions-page">
      <h1>Past Sessions</h1>
      <div className="session-list">
        {recentSessions.length > 0 ? (
          recentSessions.map((session) => (
            <div key={session.id} className="session-card" onClick={() => toggleSessionExpand(session.id)}>
              <h2>{session.name}</h2>
              <p><strong>Date:</strong> {session.date}</p>
              <p><strong>Duration:</strong> {session.duration}</p>
              <p><strong>Description:</strong> {session.description}</p>
              {expandedSession === session.id && (
                <div className="analytics-graph">
                  {/* Placeholder for analytics graph */}
                  <p>Analytics Graph (Placeholder)</p>
                  <div className="dummy-graph">[Graph Placeholder]</div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No sessions found.</p>
        )}
      </div>
    </div>
  );
};

export default ViewSes;
