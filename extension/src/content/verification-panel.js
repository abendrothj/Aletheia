// Aletheia Verification Panel - Shadow DOM Component
// Displays C2PA verification results in an isolated modal overlay

class AletheiaVerificationPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  render(imageUrl, verificationData) {
    const { status, claims, history, thumbnail, raw_manifest } = verificationData;

    // Status color mapping
    const statusColors = {
      valid: '#10b981',      // green
      expired: '#f59e0b',    // amber
      invalid: '#ef4444',    // red
      none: '#6b7280',       // gray
      error: '#ef4444'       // red
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999999;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .panel {
          position: relative;
          width: 700px;
          max-width: 100%;
          max-height: 80vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .header {
          padding: 24px;
          background: ${statusColors[status]};
          color: white;
          position: relative;
        }

        .header h2 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
        }

        .content {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .section {
          margin-bottom: 24px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .creator-card {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .creator-card p {
          margin: 8px 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .creator-card p:first-child {
          margin-top: 0;
        }

        .creator-card p:last-child {
          margin-bottom: 0;
        }

        .creator-card strong {
          color: #374151;
        }

        .timeline {
          border-left: 2px solid #e5e7eb;
          padding-left: 16px;
          margin-left: 8px;
        }

        .timeline-item {
          margin-bottom: 16px;
          position: relative;
        }

        .timeline-item:last-child {
          margin-bottom: 0;
        }

        .timeline-item::before {
          content: '';
          position: absolute;
          left: -21px;
          top: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #e5e7eb;
        }

        .timeline-item strong {
          display: block;
          color: #111827;
          margin-bottom: 4px;
        }

        .timeline-item div {
          color: #6b7280;
          font-size: 14px;
        }

        .thumbnail-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .thumbnail-comparison > div p {
          margin: 0 0 8px 0;
          font-weight: 500;
          font-size: 14px;
          color: #374151;
        }

        .thumbnail-comparison img {
          width: 100%;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          display: block;
        }

        details {
          margin-top: 8px;
        }

        summary {
          cursor: pointer;
          user-select: none;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          color: #374151;
        }

        summary:hover {
          background: #f3f4f6;
        }

        pre {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          font-size: 12px;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          line-height: 1.5;
          margin: 8px 0 0 0;
        }

        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .educational-message {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 16px;
          font-size: 14px;
          line-height: 1.6;
          color: #78350f;
        }

        .educational-message p {
          margin: 0 0 12px 0;
        }

        .educational-message p:last-child {
          margin-bottom: 0;
        }

        .educational-message ul {
          margin: 8px 0;
          padding-left: 20px;
        }

        .educational-message li {
          margin: 4px 0;
        }
      </style>

      <div class="overlay">
        <div class="panel">
          <div class="header">
            <h2>Content Credentials Verification</h2>
            <p>${this.getStatusText(status)}</p>
            <button class="close-btn">&times;</button>
          </div>

          <div class="content">
            ${this.renderContent(status, claims, history, thumbnail, imageUrl, raw_manifest)}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.shadowRoot.querySelector('.close-btn').addEventListener('click', () => {
      this.remove();
    });

    this.shadowRoot.querySelector('.overlay').addEventListener('click', (e) => {
      if (e.target.className === 'overlay') {
        this.remove();
      }
    });

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  getStatusText(status) {
    const texts = {
      valid: '✓ Valid Content Credentials - Signature Verified',
      expired: '⚠ Credentials Found but Certificate Expired',
      invalid: '✗ Invalid Signature - Data May Be Tampered',
      none: 'ℹ No Content Credentials Found',
      error: '✗ Error Verifying Image'
    };
    return texts[status] || 'Unknown Status';
  }

  renderContent(status, claims, history, thumbnail, imageUrl, raw_manifest) {
    if (status === 'none') {
      return this.renderNoneMessage();
    }

    if (status === 'error') {
      return this.renderErrorMessage();
    }

    return `
      ${this.renderCreatorSection(claims)}
      ${this.renderHistorySection(history)}
      ${this.renderThumbnailComparison(thumbnail, imageUrl)}
      ${this.renderRawManifest(raw_manifest)}
    `;
  }

  renderNoneMessage() {
    return `
      <div class="educational-message">
        <p><strong>No Content Credentials Found</strong></p>
        <p>This doesn't mean the image is fake - most images lack credentials because:</p>
        <ul>
          <li>The technology is new (adopted since 2023)</li>
          <li>Social media platforms strip metadata</li>
          <li>Consumer cameras don't support it yet</li>
        </ul>
        <p>Be cautious with unverified images making newsworthy claims.</p>
      </div>
    `;
  }

  renderErrorMessage() {
    return `
      <div class="educational-message">
        <p><strong>Error Verifying Image</strong></p>
        <p>There was an error processing the image. This could be due to:</p>
        <ul>
          <li>Corrupted image data</li>
          <li>Unsupported image format</li>
          <li>Network error fetching the image</li>
        </ul>
      </div>
    `;
  }

  renderCreatorSection(claims) {
    if (!claims) return '';

    return `
      <div class="section">
        <div class="section-title">Creator Information</div>
        <div class="creator-card">
          ${claims.title ? `<p><strong>Title:</strong> ${this.escapeHtml(claims.title)}</p>` : ''}
          ${claims.creator ? `<p><strong>Created by:</strong> ${this.escapeHtml(claims.creator)}</p>` : ''}
          ${claims.tool ? `<p><strong>Tool:</strong> ${this.escapeHtml(claims.tool)}</p>` : ''}
          ${claims.date ? `<p><strong>Date:</strong> ${this.formatDate(claims.date)}</p>` : ''}
        </div>
      </div>
    `;
  }

  renderHistorySection(history) {
    if (!history || history.length === 0) return '';

    const items = history.map(event => `
      <div class="timeline-item">
        <strong>${this.escapeHtml(event.action)}</strong>
        <div>${this.escapeHtml(event.tool)} - ${this.formatDate(event.timestamp)}</div>
      </div>
    `).join('');

    return `
      <div class="section">
        <div class="section-title">Edit History</div>
        <div class="timeline">
          ${items}
        </div>
      </div>
    `;
  }

  renderThumbnailComparison(thumbnailData, currentUrl) {
    if (!thumbnailData) return '';

    return `
      <div class="section">
        <div class="section-title">Visual Comparison</div>
        <div class="thumbnail-comparison">
          <div>
            <p>Original Capture</p>
            <img src="data:image/jpeg;base64,${thumbnailData}" alt="Original">
          </div>
          <div>
            <p>Current Version</p>
            <img src="${this.escapeHtml(currentUrl)}" alt="Current">
          </div>
        </div>
      </div>
    `;
  }

  renderRawManifest(raw_manifest) {
    if (!raw_manifest) return '';

    return `
      <div class="section">
        <details>
          <summary>Raw Manifest Data (Advanced)</summary>
          <pre>${this.escapeHtml(JSON.stringify(JSON.parse(raw_manifest), null, 2))}</pre>
        </details>
      </div>
    `;
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('aletheia-verification-panel', AletheiaVerificationPanel);
