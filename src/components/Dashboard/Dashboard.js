import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { ElectionAPI } from '../../services/api';

const Dashboard = ({ onNavigate, electionData, lastUpdated, onRefresh }) => {
  const [partyResults, setPartyResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartyResults();
  }, []);

  const loadPartyResults = async () => {
    setLoading(true);
    const stats = await ElectionAPI.getVoteStatistics();
    
    // Calculate percentages
    const totalVotes = stats.reduce((sum, party) => sum + parseInt(party.total_votes), 0);
    const resultsWithPercentage = stats.map(party => ({
      name: party.party_name,
      votes: party.total_votes.toLocaleString(),
      rawVotes: party.total_votes,
      percentage: totalVotes > 0 ? ((party.total_votes / totalVotes) * 100).toFixed(1) + '%' : '0%',
      percentageValue: totalVotes > 0 ? (party.total_votes / totalVotes) * 100 : 0,
      color: getPartyColor(party.party_name)
    }));
    
    setPartyResults(resultsWithPercentage);
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

  const statsData = [
    { 
      title: 'Registered Voters', 
      value: electionData.registeredVoters.toLocaleString(), 
      color: 'blue' 
    },
    { 
      title: 'Votes Cast', 
      value: electionData.votesCast.toLocaleString(), 
      percentage: electionData.registeredVoters > 0 
        ? ((electionData.votesCast / electionData.registeredVoters) * 100).toFixed(1) + '%' 
        : '0%', 
      color: 'yellow' 
    },
    { 
      title: 'National Results Captured', 
      value: `${electionData.resultsCaptured}/50+`, 
      percentage: '100%', 
      color: 'green' 
    },
    { 
      title: 'Leading Party', 
      value: electionData.leadingParty,
      votes: electionData.leadingVotes.toLocaleString() + ' votes',
      percentage: electionData.votesCast > 0 
        ? ((electionData.leadingVotes / electionData.votesCast) * 100).toFixed(1) + '%' 
        : '0%', 
      color: 'red' 
    }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">2024 NATIONAL AND PROVINCIAL ELECTIONS</h1>
        <p className="dashboard-subtitle">NATIONAL RESULTS DASHBOARD</p>
        <div className="header-controls">
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button className="refresh-btn" onClick={() => { onRefresh(); loadPartyResults(); }}>
            🔄 Refresh Data
          </button>
        </div>
      </header>

      <div className="stats-grid">
        {statsData.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <h3>{stat.title}</h3>
            <div className="stat-value">{stat.value}</div>
            {stat.percentage && <div className="stat-percentage">{stat.percentage}</div>}
            {stat.votes && <div className="stat-votes">{stat.votes}</div>}
          </div>
        ))}
      </div>

      <div className="results-section">
        <h2 className="section-title">NATIONAL RESULTS SUMMARY</h2>
        {loading ? (
          <div className="loading">Loading results...</div>
        ) : (
          <div className="party-results">
            {partyResults.map((party, index) => (
              <div key={index} className="party-result">
                <div className="party-info">
                  <span className="party-name">{party.name}</span>
                  <span className="party-votes">{party.votes} votes</span>
                </div>
                <div className="percentage-bar">
                  <div 
                    className={`percentage-fill ${party.color}`}
                    style={{ width: `${party.percentageValue}%` }}
                  ></div>
                  <span className="percentage-text">{party.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="view-results-btn" onClick={onNavigate}>
        View Detailed Results
      </button>
    </div>
  );
};

export default Dashboard;