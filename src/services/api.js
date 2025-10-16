const API_BASE_URL = 'http://localhost:5000/api';

export const ElectionAPI = {
  // Get election summary stats
  getElectionSummary: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/election/summary`);
      if (!response.ok) throw new Error('Failed to fetch election summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching election summary:', error);
      return {
        registeredVoters: 0,
        votesCast: 0,
        leadingParty: 'No data',
        leadingVotes: 0,
        resultsCaptured: 0
      };
    }
  },

  // Get vote statistics for public display
  getVoteStatistics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/election/statistics`);
      if (!response.ok) throw new Error('Failed to fetch vote statistics');
      return await response.json();
    } catch (error) {
      console.error('Error fetching vote statistics:', error);
      return [];
    }
  },

  // Get provincial results
  getProvincialResults: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/election/provincial`);
      if (!response.ok) throw new Error('Failed to fetch provincial results');
      return await response.json();
    } catch (error) {
      console.error('Error fetching provincial results:', error);
      return [];
    }
  },

  // Get seat allocation
  getSeatAllocation: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/election/seats`);
      if (!response.ok) throw new Error('Failed to fetch seat allocation');
      return await response.json();
    } catch (error) {
      console.error('Error fetching seat allocation:', error);
      return [];
    }
  }
};