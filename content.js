// Content script for Family Privacy Extension
class ContentMonitor {
  constructor() {
    this.init();
  }

  init() {
    // Send page information to background script
    this.reportPageLoad();
    
    // Monitor for dynamic content changes
    this.observePageChanges();
    
    // Check for suspicious content
    this.scanPageContent();
  }

  reportPageLoad() {
    const pageInfo = {
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      timestamp: new Date().toISOString()
    };

    chrome.runtime.sendMessage({
      action: 'pageLoaded',
      data: pageInfo
    });
  }

  observePageChanges() {
    // Monitor for URL changes (SPA navigation)
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver((mutations) => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.reportPageLoad();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => this.reportPageLoad(), 100);
    });
  }

  scanPageContent() {
    // Basic content analysis for additional safety
    const suspiciousKeywords = [
      'adults only', 'explicit content', '18+', 'xxx', 
      'gambling', 'casino', 'bet now', 'poker',
      'download crack', 'free hack', 'virus',
      'phishing', 'suspicious activity'
    ];

    const pageText = document.body.innerText.toLowerCase();
    const foundKeywords = suspiciousKeywords.filter(keyword => 
      pageText.includes(keyword)
    );

    if (foundKeywords.length > 0) {
      chrome.runtime.sendMessage({
        action: 'suspiciousContent',
        data: {
          url: window.location.href,
          keywords: foundKeywords,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Method to inject warning banner for questionable content
  showWarningBanner(message) {
    const banner = document.createElement('div');
    banner.id = 'family-privacy-warning';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(135deg, #ff6b6b, #ff8e53);
      color: white;
      padding: 15px;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      border-bottom: 3px solid #e55656;
    `;
    banner.innerHTML = `
      <div>⚠️ ${message}</div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="margin-left: 15px; padding: 5px 10px; background: rgba(255,255,255,0.2); 
                     border: 1px solid white; color: white; border-radius: 3px; cursor: pointer;">
        Dismiss
      </button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }
}

// Initialize content monitor
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ContentMonitor());
} else {
  new ContentMonitor();
}
