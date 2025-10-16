const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: 'shortline.proxy.rlwy.net',
  port: 36648,
  user: 'root',
  password: 'wHwviYYfzHbeerUnyxIyccXUrYgAhzsL',
  database: 'railway'
};

let connection = null;

const getConnection = async () => {
  if (!connection) {
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('✅ Connected to MySQL database');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
  return connection;
};

// API Routes
app.get('/api/election/summary', async (req, res) => {
  try {
    const conn = await getConnection();
    
    // Total registered voters
    const [voterCount] = await conn.execute('SELECT COUNT(*) as count FROM VOTERS');
    
    // Total votes cast
    const [voteCount] = await conn.execute('SELECT COUNT(*) as count FROM Vote');
    
    // Leading party
    const [leadingParty] = await conn.execute(`
      SELECT party_name, COUNT(*) as vote_count 
      FROM Vote 
      GROUP BY party_name 
      ORDER BY vote_count DESC 
      LIMIT 1
    `);
    
    // Results capture progress
    const [resultsCount] = await conn.execute('SELECT COUNT(DISTINCT party_name) as count FROM Vote');
    
    res.json({
      registeredVoters: voterCount[0].count,
      votesCast: voteCount[0].count,
      leadingParty: leadingParty[0]?.party_name || 'No votes',
      leadingVotes: leadingParty[0]?.vote_count || 0,
      resultsCaptured: resultsCount[0].count
    });
  } catch (error) {
    console.error('Error fetching election summary:', error);
    res.status(500).json({ error: 'Failed to fetch election summary' });
  }
});

app.get('/api/election/statistics', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        party_name,
        COUNT(*) as total_votes,
        COUNT(CASE WHEN DATE(timestamp) = CURDATE() THEN 1 END) as votes_today
      FROM Vote 
      GROUP BY party_name 
      ORDER BY total_votes DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching vote statistics:', error);
    res.status(500).json({ error: 'Failed to fetch vote statistics' });
  }
});

app.get('/api/election/provincial', async (req, res) => {
  try {
    const conn = await getConnection();
    
    const [rows] = await conn.execute(`
      SELECT 
        'Eastern Cape' as province,
        (SELECT party_name FROM Vote WHERE category = 'Provincial' GROUP BY party_name ORDER BY COUNT(*) DESC LIMIT 1) as leading_party,
        COUNT(*) as total_votes
      FROM Vote 
      WHERE category = 'Provincial'
      UNION ALL
      SELECT 'Free State', NULL, 0
      UNION ALL
      SELECT 'Gauteng', NULL, 0
      UNION ALL
      SELECT 'KwaZulu-Natal', NULL, 0
      UNION ALL
      SELECT 'Limpopo', NULL, 0
      UNION ALL
      SELECT 'Mpumalanga', NULL, 0
      UNION ALL
      SELECT 'Northern Cape', NULL, 0
      UNION ALL
      SELECT 'North West', NULL, 0
      UNION ALL
      SELECT 'Western Cape', NULL, 0
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching provincial results:', error);
    res.status(500).json({ error: 'Failed to fetch provincial results' });
  }
});

app.get('/api/election/seats', async (req, res) => {
  try {
    const conn = await getConnection();
    const [voteStats] = await conn.execute(`
      SELECT party_name, COUNT(*) as votes 
      FROM Vote 
      WHERE category = 'National'
      GROUP BY party_name 
      ORDER BY votes DESC
    `);
    
    const totalVotes = voteStats.reduce((sum, party) => sum + party.votes, 0);
    const totalSeats = 400;
    
    const seatAllocation = voteStats.map(party => ({
      party: party.party_name,
      seats: totalVotes > 0 ? Math.round((party.votes / totalVotes) * totalSeats) : 0,
      votes: party.votes
    }));
    
    res.json(seatAllocation);
  } catch (error) {
    console.error('Error fetching seat allocation:', error);
    res.status(500).json({ error: 'Failed to fetch seat allocation' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Election API server running on port ${PORT}`);
});