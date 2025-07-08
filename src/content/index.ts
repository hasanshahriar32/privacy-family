// Content script for Family Privacy Extension
console.log('Family Privacy Extension content script loaded');

// Monitor page content and send updates to background script
class ContentMonitor {
  constructor() {
    this.init();
  }

  init() {
    // Send page info to background script
    this.reportPageVisit();
    
    // Monitor for dynamic content changes
    this.observeContentChanges();
  }

  reportPageVisit() {
    try {
      const pageInfo = {
        url: window.location.href,
        domain: window.location.hostname,
        title: document.title,
        timestamp: Date.now()
      };

      chrome.runtime.sendMessage({
        action: 'pageVisit',
        data: pageInfo
      });
    } catch (error) {
      console.error('Error reporting page visit:', error);
    }
  }

  observeContentChanges() {
    // Create a MutationObserver to watch for content changes
    const observer = new MutationObserver((mutations) => {
      // Check for potentially harmful content
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.scanNewContent(mutation.addedNodes);
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  scanNewContent(nodes: NodeList) {
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        
        // Check for suspicious content patterns
        const text = element.textContent?.toLowerCase() || '';
        
        // Example: Check for adult content keywords (simplified)
        const suspiciousKeywords = ['adult', 'explicit', 'casino', 'gambling'];
        const foundSuspicious = suspiciousKeywords.some(keyword => text.includes(keyword));
        
        if (foundSuspicious) {
          chrome.runtime.sendMessage({
            action: 'suspiciousContent',
            data: {
              url: window.location.href,
              content: text.substring(0, 100), // First 100 chars
              timestamp: Date.now()
            }
          });
        }
      }
    });
  }
}

// Only initialize if we're in a regular page (not extension pages)
if (window.location.protocol !== 'chrome-extension:') {
  new ContentMonitor();
}
