class VideoLibraryApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000';
        this.videos = [];
        this.filteredVideos = [];
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadVideos();
        this.checkServerStatus();
    }

    initializeElements() {
        // Main elements
        this.videoGrid = document.getElementById('videoGrid');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        // Header elements
        this.refreshBtn = document.getElementById('refreshBtn');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        
        // Stats elements
        this.totalVideos = document.getElementById('totalVideos');
        this.totalDuration = document.getElementById('totalDuration');
        this.totalSize = document.getElementById('totalSize');
        
        // Filter elements
        this.searchInput = document.getElementById('searchInput');
        this.sortSelect = document.getElementById('sortSelect');
        
        // Modal elements
        this.modal = document.getElementById('videoModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalContent = document.getElementById('modalContent');
        this.modalClose = document.querySelector('.modal-close');
        
        // Action buttons
        this.retryBtn = document.getElementById('retryBtn');
    }

    bindEvents() {
        // Button events
        this.refreshBtn.addEventListener('click', () => this.refreshVideos());
        this.retryBtn.addEventListener('click', () => this.loadVideos());
        
        // Filter events
        this.searchInput.addEventListener('input', () => this.filterVideos());
        this.sortSelect.addEventListener('change', () => this.sortVideos());
        
        // Modal events
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    async checkServerStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            
            if (response.ok && data.status === 'healthy') {
                this.updateServerStatus('online', 'Server Online');
            } else {
                this.updateServerStatus('offline', 'Server Error');
            }
        } catch (error) {
            this.updateServerStatus('offline', 'Server Offline');
        }
    }

    updateServerStatus(status, text) {
        this.statusDot.className = `status-dot ${status}`;
        this.statusText.textContent = text;
    }

    async loadVideos() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        this.hideError();

        try {
            const response = await fetch(`${this.apiBaseUrl}/videos`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.videos = data.videos || [];
            this.filteredVideos = [...this.videos];
            
            this.updateStats();
            this.sortVideos();
            this.renderVideos();
            this.hideLoading();
            
            await this.checkServerStatus();
            
        } catch (error) {
            console.error('Failed to load videos:', error);
            this.showError(`Failed to load videos: ${error.message}`);
            this.hideLoading();
            this.updateServerStatus('offline', 'Connection Error');
        } finally {
            this.isLoading = false;
        }
    }

    async refreshVideos() {
        try {
            this.refreshBtn.disabled = true;
            this.refreshBtn.innerHTML = '⏳ Refreshing...';
            
            // First refresh the database
            const refreshResponse = await fetch(`${this.apiBaseUrl}/refresh`, {
                method: 'POST'
            });
            
            if (!refreshResponse.ok) {
                throw new Error('Failed to refresh database');
            }
            
            // Then reload the videos
            await this.loadVideos();
            
        } catch (error) {
            console.error('Failed to refresh videos:', error);
            this.showError(`Failed to refresh: ${error.message}`);
        } finally {
            this.refreshBtn.disabled = false;
            this.refreshBtn.innerHTML = '<span class="icon">🔄</span>Refresh';
        }
    }

    filterVideos() {
        const searchTerm = this.searchInput.value.toLowerCase();
        
        this.filteredVideos = this.videos.filter(video => {
            return video.filename.toLowerCase().includes(searchTerm) ||
                   video.id.toLowerCase().includes(searchTerm);
        });
        
        this.renderVideos();
    }

    sortVideos() {
        const sortBy = this.sortSelect.value;
        console.log("filtered", this.filteredVideos);
        this.filteredVideos.sort((a, b) => {
            console.log('a', a)
            switch (sortBy) {
                case 'filename':
                    return a.filename.localeCompare(b.filename);
                case 'duration':
                    return (b.duration || 0) - (a.duration || 0);
                case 'fileSize':
                    return (b.fileSize || 0) - (a.fileSize || 0);
                case 'resolution':
                    const aRes = (a.video?.width || 0) * (a.video?.height || 0);
                    const bRes = (b.video?.width || 0) * (b.video?.height || 0);
                    return bRes - aRes;
                default:
                    return 0;
            }
        });
        
        this.renderVideos();
    }

    renderVideos() {
        if (this.filteredVideos.length === 0) {
            this.videoGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📹</div>
                    <h3>No videos found</h3>
                    <p style="color: #666; margin-top: 10px;">
                        ${this.videos.length === 0 ? 'No videos available' : 'Try adjusting your search criteria'}
                    </p>
                </div>
            `;
            return;
        }

        this.videoGrid.innerHTML = this.filteredVideos.map((video, index) => `
            <div class="video-card" onclick="app.showVideoDetails('${video.id}')" style="animation-delay: ${index * 0.1}s">
                <div class="video-header">
                    <div class="video-icon">🎬</div>
                    <div class="video-title">${video.filename}</div>
                </div>
                <div class="video-info">
                    <div class="info-row">
                        <span class="info-label">Duration:</span>
                        <span class="info-value">${this.formatDuration(video.duration)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Size:</span>
                        <span class="info-value">${this.formatFileSize(video.fileSize)}</span>
                    </div>
                    ${video.video ? `
                    <div class="info-row">
                        <span class="info-label">Resolution:</span>
                        <span class="resolution-badge">${video.video.width}×${video.video.height}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Codec:</span>
                        <span class="info-value">${video.video.codec.toUpperCase()}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    async showVideoDetails(videoId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/video/${videoId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load video details');
            }
            
            const video = await response.json();
            
            this.modalTitle.textContent = `${video.filename}`;
            this.modalContent.innerHTML = `
                <div class="detail-grid">
                    <div class="detail-section">
                        <h3>📁 File Information</h3>
                        <div class="detail-item">
                            <span class="detail-label">ID:</span>
                            <span class="detail-value">${video.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Filename:</span>
                            <span class="detail-value">${video.filename}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Duration:</span>
                            <span class="detail-value">${this.formatDuration(video.duration)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">File Size:</span>
                            <span class="detail-value">${this.formatFileSize(video.fileSize)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Bit Rate:</span>
                            <span class="detail-value">${this.formatBitRate(video.bitRate)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Format:</span>
                            <span class="detail-value">${video.format || 'N/A'}</span>
                        </div>
                        ${video.createdAt ? `
                        <div class="detail-item">
                            <span class="detail-label">Created:</span>
                            <span class="detail-value">${new Date(video.createdAt).toLocaleString()}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${video.video ? `
                    <div class="detail-section">
                        <h3>🎥 Video Stream</h3>
                        <div class="detail-item">
                            <span class="detail-label">Codec:</span>
                            <span class="detail-value">${video.video.codec.toUpperCase()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Resolution:</span>
                            <span class="detail-value">${video.video.width}×${video.video.height}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Frame Rate:</span>
                            <span class="detail-value">${video.video.frameRate} fps</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Bit Rate:</span>
                            <span class="detail-value">${this.formatBitRate(video.video.bitRate)}</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${video.audio ? `
                    <div class="detail-section">
                        <h3>🔊 Audio Stream</h3>
                        <div class="detail-item">
                            <span class="detail-label">Codec:</span>
                            <span class="detail-value">${video.audio.codec.toUpperCase()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Sample Rate:</span>
                            <span class="detail-value">${video.audio.sampleRate} Hz</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Channels:</span>
                            <span class="detail-value">${video.audio.channels}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Bit Rate:</span>
                            <span class="detail-value">${this.formatBitRate(video.audio.bitRate)}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            this.modal.style.display = 'block';
            
        } catch (error) {
            console.error('Failed to load video details:', error);
            alert('Failed to load video details');
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    updateStats() {
        const totalVideos = this.videos.length;
        const totalDurationSeconds = this.videos.reduce((sum, video) => sum + (video.duration || 0), 0);
        const totalSizeBytes = this.videos.reduce((sum, video) => sum + (video.fileSize || 0), 0);

        this.totalVideos.textContent = totalVideos.toLocaleString();
        this.totalDuration.textContent = this.formatDuration(totalDurationSeconds);
        this.totalSize.textContent = this.formatFileSize(totalSizeBytes);
    }

    showLoading() {
        this.loadingSpinner.style.display = 'block';
        this.videoGrid.style.display = 'none';
    }

    hideLoading() {
        this.loadingSpinner.style.display = 'none';
        this.videoGrid.style.display = 'grid';
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    // Utility functions
    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatBitRate(bitRate) {
        if (!bitRate || bitRate === 0) return 'N/A';
        
        if (bitRate >= 1000000) {
            return Math.round(bitRate / 1000000 * 100) / 100 + ' Mbps';
        } else if (bitRate >= 1000) {
            return Math.round(bitRate / 1000 * 100) / 100 + ' Kbps';
        } else {
            return bitRate + ' bps';
        }
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VideoLibraryApp();
});

// Auto-refresh every 5 minutes
setInterval(() => {
    if (app && !app.isLoading) {
        app.checkServerStatus();
    }
}, 300000);