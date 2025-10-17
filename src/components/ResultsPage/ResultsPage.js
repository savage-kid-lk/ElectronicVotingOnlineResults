import React, { useState, useEffect } from 'react';
import './ResultsPage.css';
import { ElectionAPI } from '../../services/api';

const ResultsPage = ({ onNavigate, lastUpdated, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('National');
  const [provincialResults, setProvincialResults] = useState([]);
  const [regionalResults, setRegionalResults] = useState([]);
  const [seatAllocation, setSeatAllocation] = useState([]);
  const [voteStatistics, setVoteStatistics] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Hardcoded South African regions
  const southAfricanRegions = [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape'
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'National' || activeTab === 'Statistics') {
        const statsData = await ElectionAPI.getVoteStatistics();
        setVoteStatistics(statsData);
      } else if (activeTab === 'Provincial') {
        const provincialData = await ElectionAPI.getProvincialResults();
        setProvincialResults(provincialData);
      } else if (activeTab === 'Regional') {
        const regionalData = await ElectionAPI.getRegionalResults();
        // ✅ Normalize and inject region names
        const normalized = regionalData.map((item, index) => ({
          ...item,
          region: southAfricanRegions[index % southAfricanRegions.length] || 'Unknown Region',
        }));
        setRegionalResults(normalized);
      } else if (activeTab === 'Seats') {
        const seatData = await ElectionAPI.getSeatAllocation();
        setSeatAllocation(seatData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const getPartyColor = (partyName) => {
    const colors = {
      'African National Congress': '#007a33',
      'ANC': '#007a33',
      'Democratic Alliance': '#0047ab',
      'DA': '#0047ab',
      'EFF': '#d71a28',
      'Economic Freedom Fighters': '#d71a28',
      'MK Party': '#000000',
      'uMkhonto weSizwe': '#000000',
      'IFP': '#ffcc00',
      'Inkatha Freedom Party': '#ffcc00',
      'ActionSA': '#800080',
      'Freedom Front Plus': '#f7941d',
      'VF+': '#f7941d'
    };
    return colors[partyName] || '#d3d3d3';
  };

  const isLightColor = (hexColor) => {
    const c = hexColor.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160;
  };

  const renderTable = (data, title, columns) => (
    <div className="data-section">
      <h3>{title}</h3>
      {loading ? (
        <div className="loading">Loading {title.toLowerCase()}...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
              const partyName =
                row.party_name || row.leading_party || row.party || '';
              const color = getPartyColor(partyName);
              const textColor = isLightColor(color) ? '#000' : '#fff';

              return (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor: color,
                    color: textColor,
                    transition: 'background 0.3s ease'
                  }}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {typeof row[col.key] === 'number'
                        ? row[col.key].toLocaleString()
                        : row[col.key] || '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderStatistics = () => {
    const totalVotes = voteStatistics.reduce((sum, s) => sum + parseInt(s.total_votes || 0), 0);
    return renderTable(
      voteStatistics.map(stat => ({
        ...stat,
        percentage: totalVotes > 0 ? ((stat.total_votes / totalVotes) * 100).toFixed(1) + '%' : '0%'
      })),
      'NATIONAL RESULTS OVERVIEW',
      [
        { header: 'Party', key: 'party_name' },
        { header: 'Total Votes', key: 'total_votes' },
        { header: 'Votes Today', key: 'votes_today' },
        { header: 'Percentage', key: 'percentage' }
      ]
    );
  };

  const renderProvincialResults = () => renderTable(
    provincialResults,
    'PROVINCIAL RESULTS OVERVIEW',
    [
      { header: 'Province', key: 'province' },
      { header: 'Leading Party', key: 'leading_party' },
      { header: 'Total Votes', key: 'total_votes' }
    ]
  );

  const renderRegionalResults = () => renderTable(
    regionalResults,
    'REGIONAL RESULTS OVERVIEW',
    [
      { header: 'Region', key: 'region' },
      { header: 'Party', key: 'party_name' },
      { header: 'Candidate', key: 'candidate_name' },
      { header: 'Votes', key: 'vote_count' }
    ]
  );

  const renderSeatAllocation = () => (
    <div className="data-section">
      <h3>NATIONAL ASSEMBLY SEAT ALLOCATION</h3>
      {loading ? (
        <div className="loading">Loading seat allocation...</div>
      ) : (
        <div className="seats-chart">
          {seatAllocation.map((party, index) => {
            const color = getPartyColor(party.party);
            const textColor = isLightColor(color) ? '#000' : '#fff';
            return (
              <div
                key={index}
                className="seat-party"
                style={{ backgroundColor: color, color: textColor }}
              >
                <span className="party-name">{party.party}</span>
                <div className="seat-bar">
                  <div
                    className="seat-fill"
                    style={{ width: `${(party.seats / 400) * 100}%`, background: textColor }}
                  ></div>
                </div>
                <span className="seat-count">{party.seats} seats</span>
                <span className="vote-count">
                  ({party.votes?.toLocaleString()} votes)
                </span>
              </div>
            );
          })}
        </div>
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
        {['National', 'Provincial', 'Regional', 'Seats', 'Statistics'].map((tab) => (
          <button
            key={tab}
            className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} Results
          </button>
        ))}
      </nav>

      <div className="results-content">
        {activeTab === 'National' && renderStatistics()}
        {activeTab === 'Provincial' && renderProvincialResults()}
        {activeTab === 'Regional' && renderRegionalResults()}
        {activeTab === 'Seats' && renderSeatAllocation()}
        {activeTab === 'Statistics' && renderStatistics()}
      </div>
    </div>
  );
};

export default ResultsPage;
