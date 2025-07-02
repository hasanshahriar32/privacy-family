# Family Privacy Extension - Backend API Example

This is a simple Node.js/Express backend that works with the Family Privacy Extension.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install express cors helmet body-parser sqlite3
   ```

2. **Run the Server**
   ```bash
   node server.js
   ```

3. **Configure Extension**
   - Set API endpoint to: `http://localhost:3000/api`
   - Enable activity logging

## API Endpoints

### POST /api/analyze
Analyzes a website and returns content categories.

**Request:**
```json
{
  "domain": "example.com",
  "url": "https://example.com/page",
  "profileId": "profile_abc123",
  "timestamp": "2025-07-02T10:30:00.000Z"
}
```

**Response:**
```json
{
  "categories": ["social", "entertainment"],
  "riskLevel": "medium",
  "confidence": 0.85
}
```

### POST /api/log-visit
Logs a website visit for monitoring.

**Request:**
```json
{
  "domain": "example.com",
  "url": "https://example.com/page",
  "profileId": "profile_abc123",
  "timestamp": "2025-07-02T10:30:00.000Z",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "status": "logged",
  "visitId": "visit_123456"
}
```

## Deployment

### Heroku Deployment
1. Create a Heroku app
2. Push this code to Heroku
3. Set environment variables if needed
4. Use the Heroku URL in extension settings

### Other Platforms
- **Vercel**: Great for Node.js APIs
- **Railway**: Simple deployment
- **DigitalOcean**: Full server control
- **AWS Lambda**: Serverless option
