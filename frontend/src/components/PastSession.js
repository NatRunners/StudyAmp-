import React, { useEffect, useState } from 'react';
import '../styles/Global.css';
import '../styles/PastSession.css';

const PastSession = () => {
  // Mock data for past sessions
  const [sessions, setSessions] = useState([
    {
      id: 1,
      name: 'Algorithms Lecture',
      description: 'Covered sorting and searching algorithms in depth.',
      date: '2024-01-10',
      duration: '1h 3m',
    },
    {
      id: 2,
      name: 'Linear Algebra Workshop',
      description: 'Practiced matrix transformations and eigenvalues.',
      date: '2024-01-11',
      duration: '22m',
    },
    {
      id: 3,
      name: 'Project Planning Meeting',
      description: 'Discussed milestones and assigned tasks for the group project.',
      date: '2024-01-12',
      duration: '29m',
    },
    {
      id: 4,
      name: 'Introduction to Computer Graphics',
      description: 'Explored rasterization techniques and 3D rendering basics.',
      date: '2024-01-13',
      duration: '1h 21m',
    },
    {
      id: 5,
      name: 'Database Systems Lecture',
      description: 'Reviewed normalization and query optimization strategies.',
      date: '2024-01-14',
      duration: '1h 4m',
    },
    {
      id: 6,
      name: 'Art Theory Seminar',
      description: 'Analyzed the use of perspective in Renaissance paintings.',
      date: '2024-01-15',
      duration: '1h 8m',
    },
    {
      id: 7,
      name: 'Software Engineering Team Meeting',
      description: 'Reviewed progress and planned the next sprint.',
      date: '2024-01-16',
      duration: '32m',
    }
  ]);

  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    // Mimic fetching updated session data from an API
    setSessions([
      {
        id: 1,
        name: 'Algorithms Lecture',
        description: 'Covered sorting and searching algorithms in depth.',
        date: '2024-01-10',
        duration: '1h 3m',
      },
      {
        id: 2,
        name: 'Linear Algebra Workshop',
        description: 'Practiced matrix transformations and eigenvalues.',
        date: '2024-01-11',
        duration: '22m',
      },
      {
        id: 3,
        name: 'Project Planning Meeting',
        description: 'Discussed milestones and assigned tasks for the group project.',
        date: '2024-01-12',
        duration: '29m',
      },
      {
        id: 4,
        name: 'Introduction to Computer Graphics',
        description: 'Explored rasterization techniques and 3D rendering basics.',
        date: '2024-01-13',
        duration: '1h 21m',
      },
      {
        id: 5,
        name: 'Database Systems Lecture',
        description: 'Reviewed normalization and query optimization strategies.',
        date: '2024-01-14',
        duration: '1h 4m',
      },
      {
        id: 6,
        name: 'Art Theory Seminar',
        description: 'Analyzed the use of perspective in Renaissance paintings.',
        date: '2024-01-15',
        duration: '1h 8m',
      },
      {
        id: 7,
        name: 'Software Engineering Team Meeting',
        description: 'Reviewed progress and planned the next sprint.',
        date: '2024-01-16',
        duration: '32m',
      }
    ]);
  }, []);

  const toggleSessionExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  return (
    <div className="view-sessions-page">
      <h1>Past Sessions</h1>
      <div className="scrollable-session-list">
        {sessions.length > 0 ? (
          sessions.map((session) => (
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

export default PastSession;
