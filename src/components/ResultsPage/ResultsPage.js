import React, { useState, useEffect } from 'react';
import './ResultsPage.css';
import { ElectionAPI } from '../../services/api';

const ResultsPage = ({ onNavigate, lastUpdated, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('National');
  const [provincialResults, setProvincialResults] = useState([]);
  const [seatAllocation, setSeatAllocation] = useState([]);
  const [voteStatistics, setVoteStatistics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      if (activeTab === 'National') {
        const statsData = await ElectionAPI.getVoteStatistics();
        setVoteStatistics(statsData);
      } else if (activeTab === 'Provincial') {
        const provincialData = await ElectionAPI.getProvincialResults();
        setProvincialResults(provincialData);
      } else if (activeTab === 'Seats') {
        const seatData = await ElectionAPI.getSeatAllocation();
        setSeatAllocation(seatData);
      } else if (activeTab === 'Statistics') {
        const statsData = await ElectionAPI.getVoteStatistics();
        setVoteStatistics(statsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    setLoading(false);
  };

  const getPartyColor = (partyName) => {
    const colors = {
      'African National Congress': 'green',
      'Democratic Alliance': 'blue',
      'MK Party': 'black',
      'EFF': 'red',
      'IFP': 'yellow',
      'Freedom Front Plus': 'orange',
      'ActionSA': 'purple'
    };
    return colors[partyName] || 'gray';
  };

  const renderProvincialResults = () => (
    <div className="data-section">
      <h3>PROVINCIAL RESULTS OVERVIEW</h3>
      {loading ? (
        <div className="loading">Loading provincial results...</div>
      ) : (
        <div className="provincial-grid">
          {provincialResults.map((province, index) => (
            <div key={index} className="province-card">
              <h4>{province.province}</h4>
              <div className="province-stats">
                <div className="stat">
                  <span className="label">Results Captured:</span>
                  <span className="value captured">100%</span>
                </div>
                <div className="stat">
                  <span className="label">Leading Party:</span>
                  <span className={`value leading ${getPartyColor(province.leading_party)}`}>
                    {province.leading_party || 'Counting...'}
                  </span>
                </div>
                <div className="stat">
                  <span className="label">Total Votes:</span>
                  <span className="value">{province.total_votes?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSeatAllocation = () => (
    <div className="data-section">
      <h3>NATIONAL ASSEMBLY SEAT ALLOCATION</h3>
      {loading ? (
        <div className="loading">Loading seat allocation...</div>
      ) : (
        <div className="seats-chart">
          {seatAllocation.map((party, index) => (
            <div key={index} className={`seat-party ${getPartyColor(party.party)}`}>
              <span className="party-name">{party.party}</span>
              <div className="seat-bar">
                <div 
                  className="seat-fill"
                  style={{ width: `${(party.seats / 400) * 100}%` }}
                ></div>
              </div>
              <span className="seat-count">{party.seats} seats</span>
              <span className="vote-count">({party.votes?.toLocaleString()} votes)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatistics = () => (
    <div className="data-section">
      <h3>VOTE STATISTICS</h3>
      {loading ? (
        <div className="loading">Loading statistics...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Party</th>
              <th>Total Votes</th>
              <th>Votes Today</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {voteStatistics.map((stat, index) => {
              const totalVotes = voteStatistics.reduce((sum, s) => sum + parseInt(s.total_votes), 0);
              const percentage = totalVotes > 0 ? ((stat.total_votes / totalVotes) * 100).toFixed(1) : 0;
              
              return (
                <tr key={index}>
                  <td>
                    <span className={`party-badge ${getPartyColor(stat.party_name)}`}>
                      {stat.party_name}
                    </span>
                  </td>
                  <td>{stat.total_votes?.toLocaleString()}</td>
                  <td>{stat.votes_today?.toLocaleString()}</td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="header-content">
          <h1>2024 NATIONAL AND PROVINCIAL ELECTIONS</h1>
          <p>DETAILED RESULTS PORTAL</p>
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
        <div className="header-controls">
          <button className="refresh-btn" onClick={() => { onRefresh(); loadData(); }}>
            🔄 Refresh
          </button>
          <button className="back-btn" onClick={onNavigate}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <nav className="results-nav">
        <button 
          className={`nav-btn ${activeTab === 'National' ? 'active' : ''}`}
          onClick={() => setActiveTab('National')}
        >
          National Results
        </button>
        <button 
          className={`nav-btn ${activeTab === 'Provincial' ? 'active' : ''}`}
          onClick={() => setActiveTab('Provincial')}
        >
          Provincial Results
        </button>
        <button 
          className={`nav-btn ${activeTab === 'Seats' ? 'active' : ''}`}
          onClick={() => setActiveTab('Seats')}
        >
          Seat Allocation
        </button>
        <button 
          className={`nav-btn ${activeTab === 'Statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('Statistics')}
        >
          Statistics
        </button>
      </nav>

      <div className="results-content">
        {activeTab === 'National' && renderStatistics()}
        {activeTab === 'Provincial' && renderProvincialResults()}
        {activeTab === 'Seats' && renderSeatAllocation()}
        {activeTab === 'Statistics' && renderStatistics()}
      </div>
    </div>
  );
};

export default ResultsPage;