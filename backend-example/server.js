const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('family_privacy.db');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    profileId TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    userAgent TEXT,
    categories TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS website_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    categories TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Content analysis function
function analyzeWebsiteContent(domain, url) {
  // Basic keyword-based categorization
  const categories = [];
  const domainLower = domain.toLowerCase();
  const urlLower = url.toLowerCase();

  // Adult content
  const adultKeywords = ['porn', 'xxx', 'adult', 'sex', 'nude', 'naked'];
  if (adultKeywords.some(keyword => domainLower.includes(keyword) || urlLower.includes(keyword))) {
    categories.push('adult');
  }

  // Social media
  const socialSites = ['facebook', 'twitter', 'instagram', 'tiktok', 'snapchat', 'linkedin'];
  if (socialSites.some(site => domainLower.includes(site))) {
    categories.push('social');
  }

  // Gaming
  const gamingSites = ['steam', 'xbox', 'playstation', 'twitch', 'roblox', 'minecraft'];
  const gamingKeywords = ['game', 'gaming', 'play'];
  if (gamingSites.some(site => domainLower.includes(site)) || 
      gamingKeywords.some(keyword => domainLower.includes(keyword))) {
    categories.push('gaming');
  }

  // Entertainment
  const entertainmentSites = ['youtube', 'netflix', 'hulu', 'disney', 'spotify'];
  if (entertainmentSites.some(site => domainLower.includes(site))) {
    categories.push('entertainment');
  }

  // Gambling
  const gamblingKeywords = ['casino', 'poker', 'bet', 'gambling', 'slots'];
  if (gamblingKeywords.some(keyword => domainLower.includes(keyword))) {
    categories.push('gambling');
  }

  // News
  const newsSites = ['cnn', 'bbc', 'reuters', 'news', 'times', 'post'];
  if (newsSites.some(site => domainLower.includes(site))) {
    categories.push('news');
  }

  // Shopping
  const shoppingSites = ['amazon', 'ebay', 'shop', 'store', 'buy'];
  if (shoppingSites.some(site => domainLower.includes(site))) {
    categories.push('shopping');
  }

  // Educational
  const educationalKeywords = ['edu', 'learn', 'course', 'school', 'university', 'khan'];
  if (educationalKeywords.some(keyword => domainLower.includes(keyword))) {
    categories.push('education');
  }

  // Suspicious/Spam indicators
  const suspiciousKeywords = ['free-download', 'click-here', 'winner', 'congratulations'];
  if (suspiciousKeywords.some(keyword => urlLower.includes(keyword))) {
    categories.push('spam');
  }

  return categories;
}

// Calculate risk level based on categories
function calculateRiskLevel(categories) {
  const highRiskCategories = ['adult', 'gambling', 'violence', 'drugs', 'weapons', 'spam', 'phishing', 'malware'];
  const mediumRiskCategories = ['social', 'gaming'];
  
  if (categories.some(cat => highRiskCategories.includes(cat))) {
    return 'high';
  } else if (categories.some(cat => mediumRiskCategories.includes(cat))) {
    return 'medium';
  } else {
    return 'low';
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Website analysis endpoint
app.post('/api/analyze', (req, res) => {
  const { domain, url, profileId, timestamp } = req.body;

  if (!domain || !url) {
    return res.status(400).json({ error: 'Domain and URL are required' });
  }

  try {
    // Check if we have cached analysis for this domain
    db.get('SELECT * FROM website_categories WHERE domain = ?', [domain], (err, row) => {
      if (err) {
        console.error('Database error:', err);
      }

      let categories;
      let confidence = 0.7;

      if (row && row.categories) {
        // Use cached categories
        categories = JSON.parse(row.categories);
        confidence = row.confidence || 0.7;
      } else {
        // Analyze the website
        categories = analyzeWebsiteContent(domain, url);
        
        // Cache the result
        db.run('INSERT OR REPLACE INTO website_categories (domain, categories, confidence) VALUES (?, ?, ?)',
          [domain, JSON.stringify(categories), confidence], (err) => {
            if (err) console.error('Error caching categories:', err);
          });
      }

      const riskLevel = calculateRiskLevel(categories);

      res.json({
        categories,
        riskLevel,
        confidence,
        analysisTimestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activity logging endpoint
app.post('/api/log-visit', (req, res) => {
  const { domain, url, profileId, timestamp, userAgent } = req.body;

  if (!domain || !url || !profileId) {
    return res.status(400).json({ error: 'Domain, URL, and profileId are required' });
  }

  try {
    // Get categories for this domain
    const categories = analyzeWebsiteContent(domain, url);

    // Insert visit record
    db.run(
      'INSERT INTO visits (domain, url, profileId, timestamp, userAgent, categories) VALUES (?, ?, ?, ?, ?, ?)',
      [domain, url, profileId, timestamp || new Date().toISOString(), userAgent, JSON.stringify(categories)],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to log visit' });
        }

        res.json({
          status: 'logged',
          visitId: this.lastID,
          categories
        });
      }
    );
  } catch (error) {
    console.error('Logging error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get activity for a profile
app.get('/api/activity/:profileId', (req, res) => {
  const { profileId } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  db.all(
    'SELECT * FROM visits WHERE profileId = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [profileId, parseInt(limit), parseInt(offset)],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch activity' });
      }

      const activities = rows.map(row => ({
        ...row,
        categories: JSON.parse(row.categories || '[]')
      }));

      res.json({
        activities,
        total: rows.length,
        profileId
      });
    }
  );
});

// Get statistics for a profile
app.get('/api/stats/:profileId', (req, res) => {
  const { profileId } = req.params;
  const { days = 7 } = req.query;

  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - parseInt(days));

  db.all(
    `SELECT 
      COUNT(*) as totalVisits,
      COUNT(DISTINCT domain) as uniqueDomains,
      DATE(created_at) as date
     FROM visits 
     WHERE profileId = ? AND created_at >= ? 
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [profileId, dateLimit.toISOString()],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }

      res.json({
        stats: rows,
        profileId,
        period: `${days} days`
      });
    }
  );
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Family Privacy API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Configure extension to use: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
