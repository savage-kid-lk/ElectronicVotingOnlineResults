const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

let connection = null;

// Connect to database once
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

// Root route
app.get('/', (req, res) => {
  res.send('✅ Election API server is live!');
});

// ------------------------ SUMMARY ------------------------
app.get('/api/election/summary', async (req, res) => {
  try {
    const conn = await getConnection();
    const [voterCount] = await conn.execute('SELECT COUNT(*) as count FROM VOTERS');
    const [voteCount] = await conn.execute('SELECT COUNT(*) as count FROM Vote');
    const [leadingParty] = await conn.execute(`
      SELECT party_name, COUNT(*) AS vote_count
      FROM Vote
      GROUP BY party_name
      ORDER BY vote_count DESC
      LIMIT 1
    `);
    const [resultsCount] = await conn.execute('SELECT COUNT(DISTINCT party_name) AS count FROM Vote');

    res.json({
      registeredVoters: voterCount[0].count,
      votesCast: voteCount[0].count,
      leadingParty: leadingParty[0]?.party_name || 'No votes yet',
      leadingVotes: leadingParty[0]?.vote_count || 0,
      resultsCaptured: resultsCount[0].count
    });
  } catch (error) {
    console.error('Error fetching election summary:', error);
    res.status(500).json({ error: 'Failed to fetch election summary' });
  }
});

// ------------------------ NATIONAL RESULTS ------------------------
app.get('/api/election/statistics', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        nb.party_name,
        nb.candidate_name,
        COUNT(v.id) AS total_votes
      FROM NationalBallot nb
      LEFT JOIN Vote v 
        ON v.party_name = nb.party_name 
        AND v.category = 'National'
      GROUP BY nb.party_name, nb.candidate_name
      ORDER BY total_votes DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching national results:', error);
    res.status(500).json({ error: 'Failed to fetch national results' });
  }
});

// ------------------------ PROVINCIAL RESULTS ------------------------
app.get('/api/election/provincial', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        pb.party_name,
        pb.candidate_name,
        COUNT(v.id) AS total_votes
      FROM ProvincialBallot pb
      LEFT JOIN Vote v 
        ON v.party_name = pb.party_name 
        AND v.category = 'Provincial'
      GROUP BY pb.party_name, pb.candidate_name
      ORDER BY total_votes DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching provincial results:', error);
    res.status(500).json({ error: 'Failed to fetch provincial results' });
  }
});

// ------------------------ REGIONAL RESULTS (FIXED) ------------------------
app.get('/api/election/regional', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT 
        rb.party_name,
        rb.candidate_name,
        COUNT(v.id) AS total_votes
      FROM RegionalBallot rb
      LEFT JOIN Vote v 
        ON v.party_name = rb.party_name 
        AND v.category = 'Regional'
      GROUP BY rb.party_name, rb.candidate_name
      ORDER BY total_votes DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching regional results:', error);
    res.status(500).json({ error: 'Failed to fetch regional results' });
  }
});

// ------------------------ SEAT ALLOCATION ------------------------
app.get('/api/election/seats', async (req, res) => {
  try {
    const conn = await getConnection();
    const [voteStats] = await conn.execute(`
      SELECT party_name, COUNT(*) AS votes
      FROM Vote
      WHERE category = 'National'
      GROUP BY party_name
      ORDER BY votes DESC
    `);

    const totalVotes = voteStats.reduce((sum, p) => sum + p.votes, 0);
    const totalSeats = 400;

    const seatAllocation = voteStats.map(party => ({
      party: party.party_name,
      votes: party.votes,
      seats: totalVotes > 0 ? Math.round((party.votes / totalVotes) * totalSeats) : 0
    }));

    res.json(seatAllocation);
  } catch (error) {
    console.error('Error fetching seat allocation:', error);
    res.status(500).json({ error: 'Failed to fetch seat allocation' });
  }
});

// ------------------------ START SERVER ------------------------
app.listen(PORT, () => {
  console.log(`🚀 Election API server running on port ${PORT}`);
});
