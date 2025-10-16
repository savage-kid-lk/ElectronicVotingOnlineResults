import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard/Dashboard';
import ResultsPage from './components/ResultsPage/ResultsPage';
import AIAssistant from './components/AIAssistant/AIAssistant';
import { ElectionAPI } from './services/api';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [electionData, setElectionData] = useState({
    registeredVoters: 0,
    votesCast: 0,
    leadingParty: '',
    leadingVotes: 0,
    resultsCaptured: 0
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadElectionData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadElectionData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadElectionData = async () => {
    const data = await ElectionAPI.getElectionSummary();
    setElectionData(data);
    setLastUpdated(new Date());
  };

  return (
    <div className="App">
      {currentView === 'dashboard' ? (
        <Dashboard 
          onNavigate={() => setCurrentView('results')}
          electionData={electionData}
          lastUpdated={lastUpdated}
          onRefresh={loadElectionData}
        />
      ) : (
        <ResultsPage 
          onNavigate={() => setCurrentView('dashboard')}
          lastUpdated={lastUpdated}
          onRefresh={loadElectionData}
        />
      )}
      
      {/* AI Assistant Floating Widget */}
      <AIAssistant />
    </div>
  );
}

export default App;