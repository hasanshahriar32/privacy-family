# Family Privacy Extension

A comprehensive browser extension designed to help families control and monitor web browsing activities with customizable profiles and intelligent content filtering.

## 🚀 Features

### 👤 Profile Management
- **Multiple Profiles**: Create different profiles for each family member
- **Unique Profile IDs**: Each profile has a unique identifier for backend integration
- **Default Profile**: Automatic loading of a default profile
- **Profile Switching**: Easy switching between profiles via popup

### 🏷️ Content Filtering
- **14+ Content Categories**: Including adult content, gambling, violence, drugs, weapons, social media, entertainment, gaming, news, shopping, education, spam, phishing, and malware
- **Customizable Restrictions**: Toggle each category on/off per profile
- **Real-time Analysis**: Sends website data to backend for intelligent categorization
- **Local Fallback**: Basic keyword-based categorization when offline

### 🌐 Site Management
- **Allow/Block Lists**: Manually allow or block specific domains
- **Quick Actions**: One-click allow/block from popup
- **Override Categories**: Site-specific rules override category restrictions

### ⏰ Time Restrictions
- **Scheduled Access**: Set allowed browsing hours
- **Day-based Controls**: Configure different rules for each day of the week
- **Time-based Blocking**: Automatic blocking outside allowed hours

### 📊 Activity Monitoring
- **Browsing History**: Track all visited websites with timestamps
- **Profile-based Logging**: Associate activity with specific profiles
- **Statistics Dashboard**: View daily stats including sites visited, blocked, and active time
- **Export Functionality**: Export activity data for external analysis

### ⚙️ Advanced Settings
- **Backend Integration**: Configurable API endpoint for external analysis
- **Strict Mode**: Block unknown/unclassified websites by default
- **Logging Controls**: Enable/disable activity logging
- **Data Import/Export**: Backup and restore extension settings

## 🛠️ Installation & Setup

### For Users

1. **Download the Extension**
   - Clone this repository or download as ZIP
   - Extract to a folder on your computer

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder

3. **Initial Setup**
   - Click the extension icon in the toolbar
   - Go to Settings to configure your first profile
   - Set up content categories and restrictions
   - Configure any site-specific rules

### For Developers

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/family-privacy-extension.git
   cd family-privacy-extension
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run pack
   ```

## 🔧 Backend API Integration

The extension is designed to work with a backend API for advanced content analysis. Here's the expected API structure:

### API Endpoints

#### 1. Website Analysis
```
POST /api/analyze
Content-Type: application/json

{
  "domain": "example.com",
  "url": "https://example.com/page",
  "profileId": "profile_abc123_1234567890",
  "timestamp": "2025-07-02T10:30:00.000Z"
}

Response:
{
  "categories": ["social", "entertainment"],
  "riskLevel": "low",
  "confidence": 0.95
}
```

#### 2. Activity Logging
```
POST /api/log-visit
Content-Type: application/json

{
  "domain": "example.com",
  "url": "https://example.com/page",
  "profileId": "profile_abc123_1234567890",
  "timestamp": "2025-07-02T10:30:00.000Z",
  "userAgent": "Mozilla/5.0..."
}

Response:
{
  "status": "logged",
  "visitId": "visit_xyz789"
}
```

### Recommended Backend Technologies

#### Node.js/Express.js Backend
```javascript
const express = require('express');
const app = express();

// Website analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { domain, url, profileId } = req.body;
  
  // Your content analysis logic here
  const categories = await analyzeWebsite(domain, url);
  
  res.json({
    categories,
    riskLevel: calculateRiskLevel(categories),
    confidence: 0.95
  });
});

// Activity logging endpoint
app.post('/api/log-visit', async (req, res) => {
  const visitData = req.body;
  
  // Store in database
  const visitId = await logActivity(visitData);
  
  res.json({
    status: 'logged',
    visitId
  });
});
```

#### Database Schema (MongoDB/PostgreSQL)
```javascript
// Profiles Collection/Table
{
  profileId: "profile_abc123_1234567890",
  name: "Child Profile",
  restrictions: {
    adult: true,
    gambling: true,
    // ... other categories
  },
  allowedSites: ["educational-site.com"],
  blockedSites: ["blocked-site.com"],
  timeRestrictions: {
    enabled: true,
    allowedHours: { start: "09:00", end: "21:00" },
    allowedDays: [1, 2, 3, 4, 5]
  }
}

// Activity Logs Collection/Table
{
  visitId: "visit_xyz789",
  profileId: "profile_abc123_1234567890",
  domain: "example.com",
  url: "https://example.com/page",
  timestamp: "2025-07-02T10:30:00.000Z",
  categories: ["social", "entertainment"],
  action: "allowed" // or "blocked"
}
```

## 📱 Usage Guide

### Setting Up Profiles

1. **Access Settings**
   - Click the extension icon
   - Click "Settings" or "Manage Profiles"

2. **Create Profile**
   - Click "+ Add Profile"
   - Enter profile name and description
   - Set as default if needed
   - Save profile

3. **Configure Restrictions**
   - Go to "Categories" tab
   - Select profile from dropdown
   - Toggle categories on/off (on = blocked)
   - Changes save automatically

### Managing Sites

1. **Allow/Block from Popup**
   - Visit any website
   - Click extension icon
   - Use "Allow This Site" or "Block This Site" buttons

2. **Bulk Site Management**
   - Go to Settings > Sites tab
   - Select profile
   - Add domains to allowed/blocked lists
   - Use format: `example.com` (no https://)

### Time Restrictions

1. **Enable Time Controls**
   - Go to Settings > Time Restrictions
   - Select profile
   - Check "Enable time restrictions"

2. **Set Schedule**
   - Choose start and end times
   - Select allowed days of the week
   - Save changes

### Monitoring Activity

1. **View Recent Activity**
   - Extension popup shows recent visits
   - Click "View Activity" for detailed history

2. **Export Data**
   - Go to Settings > Activity tab
   - Use filters to select data range
   - Click "Export" for CSV download

## 🔒 Privacy & Security

- **Local Storage**: Sensitive data stored locally in browser
- **Encrypted Communication**: HTTPS required for backend API
- **No Personal Data**: Extension doesn't collect personal information
- **Parental Controls**: Designed for family supervision, not surveillance

## 🛠️ Customization

### Adding New Categories

1. **Update Background Script**
   ```javascript
   // In background.js, add to basicCategorization()
   const newCategoryKeywords = ['keyword1', 'keyword2'];
   if (newCategoryKeywords.some(keyword => domain.includes(keyword))) {
     categories.push('newCategory');
   }
   ```

2. **Update Options Page**
   ```javascript
   // In scripts/options.js, add to categories array
   { 
     id: 'newCategory', 
     name: 'New Category', 
     description: 'Description of new category' 
   }
   ```

### Custom Blocked Page

Modify `blocked.html` to customize the appearance and messaging when sites are blocked.

### Backend Integration

Replace the `apiEndpoint` in settings with your backend URL and implement the API endpoints as described above.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚨 Troubleshooting

### Extension Not Loading
- Ensure all files are in the correct directory structure
- Check for JSON syntax errors in `manifest.json`
- Verify Chrome is in Developer Mode

### Sites Not Being Blocked
- Check if site is in allowed list
- Verify profile restrictions are enabled
- Ensure backend API is responding (if configured)

### Performance Issues
- Clear extension storage: Settings > Reset to Defaults
- Check for large activity logs (auto-limited to 1000 entries)
- Ensure backend API has reasonable response times

## 📞 Support

For support, feature requests, or bug reports:
- Create an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

**Note**: This extension is designed for family safety and parental supervision. It should be used responsibly and in accordance with local laws and family agreements.
