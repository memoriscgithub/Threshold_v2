class PixelGrid {
    constructor() {
        this.canvas = document.getElementById('pixelGrid');
        this.ctx = this.canvas.getContext('2d');
        this.pixelSize = 8;
        this.gap = 1;
        this.count = 100;
        this.pointSize = 8;
        this.lineWidth = 8;
        this.darkGray = 'rgb(55, 65, 81)';
        this.orangeColor = 'rgb(255, 165, 0)';
        
        this.pointPosition = { x: -1, y: 100 };
        this.isDragging = false;
        this.showCornerLabels = false;
        this.showPrimeLabels = false;
        this.savedCornerLabelsState = false;
        this.lastControl = 0;
        
        this.setupEventListeners();
        this.draw();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        document.addEventListener('click', (e) => {
            if (this.showPrimeLabels && !e.target.matches('#show-prime')) {
                document.getElementById('show-prime').checked = false;
                this.showPrimeLabels = false;
                this.showCornerLabels = this.savedCornerLabelsState;
                document.getElementById('show-corners').checked = this.savedCornerLabelsState;
                this.updateCorners();
                this.draw();
            }
        });
        
        document.getElementById('show-corners').addEventListener('change', (e) => {
            this.showCornerLabels = e.target.checked;
            this.savedCornerLabelsState = e.target.checked;
            this.updateCorners();
            this.draw();
        });
        
        document.getElementById('show-prime').addEventListener('change', (e) => {
            if (this.pointPosition.x === -1 || this.pointPosition.y === 100) {
                this.showError();
                e.target.checked = false;
                return;
            }
            this.showPrimeLabels = e.target.checked;
            if (e.target.checked) {
                this.savedCornerLabelsState = this.showCornerLabels;
                this.showCornerLabels = false;
                document.getElementById('show-corners').checked = false;
            } else {
                this.showCornerLabels = this.savedCornerLabelsState;
                document.getElementById('show-corners').checked = this.savedCornerLabelsState;
            }
            this.updateCorners();
            this.draw();
        });
    }

    calculateControl() {
        if (this.pointPosition.x < 0 || this.pointPosition.y === 100) return 0;
        const totalWhiteCells = 100 * 100;
        let controlledCells = 0;
        if (this.pointPosition.x >= 0 && this.pointPosition.y < 100) {
            controlledCells = (this.pointPosition.x + 1) * (100 - this.pointPosition.y);
        }
        return Math.min(100, (controlledCells / totalWhiteCells) * 100);
    }

    getStatus(controlValue) {
        if (controlValue === 50) return "Threshold";
        return controlValue > 50 ? "DEMIURGE" : "semiurge";
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgb(107, 114, 128)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid borders
        this.ctx.fillStyle = this.darkGray;
        for(let row = 0; row <= this.count; row++) {
            this.ctx.fillRect(0, row * (this.pixelSize + this.gap), this.pixelSize, this.pixelSize);
        }
        for(let col = 0; col <= this.count; col++) {
            this.ctx.fillRect(col * (this.pixelSize + this.gap), 
                            this.count * (this.pixelSize + this.gap), 
                            this.pixelSize, this.pixelSize);
        }
        
        // Draw white cells
        this.ctx.fillStyle = '#ffffff';
        for(let row = 0; row < this.count; row++) {
            for(let col = 1; col <= this.count; col++) {
                this.ctx.fillRect(col * (this.pixelSize + this.gap), 
                                row * (this.pixelSize + this.gap), 
                                this.pixelSize, this.pixelSize);
            }
        }

        const pointScreenX = (this.pointPosition.x + 1) * (this.pixelSize + this.gap) + this.pixelSize / 2;
        const pointScreenY = this.pointPosition.y * (this.pixelSize + this.gap) + this.pixelSize / 2;

        // Draw horizontal red line
        if (this.pointPosition.x > -1) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.moveTo(pointScreenX, pointScreenY);
            this.ctx.lineTo(this.pixelSize + this.gap, pointScreenY);
            this.ctx.stroke();
        }

        // Draw vertical green line
        const ezoptronValue = 100 - this.pointPosition.y;
        if (this.pointPosition.y < 100 && ezoptronValue !== 1) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#22c55e';
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.moveTo(pointScreenX, pointScreenY);
            this.ctx.lineTo(pointScreenX, this.count * (this.pixelSize + this.gap));
            this.ctx.stroke();
        }

        // Draw orange area
        if (this.showPrimeLabels && this.pointPosition.x >= 0 && this.pointPosition.y < 100) {
            const startX = this.pixelSize + this.gap;
            const startY = this.count * (this.pixelSize + this.gap);
            const endX = (this.pointPosition.x + 1) * (this.pixelSize + this.gap) + this.pixelSize;
            const endY = this.pointPosition.y * (this.pixelSize + this.gap);

            this.ctx.fillStyle = this.orangeColor;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(startX, endY);
            this.ctx.lineTo(endX, endY);
            this.ctx.lineTo(endX, startY);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Draw blue point
        this.ctx.fillStyle = '#3b82f6';
        const pixelX = (this.pointPosition.x + 1) * (this.pixelSize + this.gap) + 
                      (this.pixelSize - this.pointSize) / 2;
        const pixelY = this.pointPosition.y * (this.pixelSize + this.gap) + 
                      (this.pixelSize - this.pointSize) / 2;
        this.ctx.fillRect(pixelX, pixelY, this.pointSize, this.pointSize);

        // Update metrics
        this.updateMetrics();
    }

    getGridPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        let gridX = Math.round(x / (this.pixelSize + this.gap)) - 1;
        let gridY = Math.round(y / (this.pixelSize + this.gap));
        gridX = Math.max(-1, Math.min(this.count - 1, gridX));
        gridY = Math.max(0, Math.min(this.count, gridY));
        return { x: gridX, y: gridY };
    }

    handleMouseDown(e) {
        const mousePos = this.getGridPosition(e.clientX, e.clientY);
        const mousePixelX = (mousePos.x + 1) * (this.pixelSize + this.gap) + 
                          (this.pixelSize - this.pointSize) / 2;
        const mousePixelY = mousePos.y * (this.pixelSize + this.gap) + 
                          (this.pixelSize - this.pointSize) / 2;
        const pointPixelX = (this.pointPosition.x + 1) * (this.pixelSize + this.gap) + 
                          (this.pixelSize - this.pointSize) / 2;
        const pointPixelY = this.pointPosition.y * (this.pixelSize + this.gap) + 
                          (this.pixelSize - this.pointSize) / 2;
        
        if (Math.abs(mousePixelX - pointPixelX) < this.pointSize * 1.5 && 
            Math.abs(mousePixelY - pointPixelY) < this.pointSize * 1.5) {
            this.isDragging = true;
        }
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            const pos = this.getGridPosition(e.clientX, e.clientY);
            this.pointPosition = pos;
            const control = this.calculateControl();
            
            if ((this.lastControl < 50 && control >= 50) || 
                (this.lastControl > 50 && control <= 50)) {
                this.showThresholdStatus();
            }
            
            this.lastControl = control;
            this.draw();
            this.updateCorners();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    updateMetrics() {
        document.getElementById('reparatron-value').textContent = 
            `${this.pointPosition.x + 1}%`;
        document.getElementById('ezoptron-value').textContent = 
            `${100 - this.pointPosition.y}%`;
        
        const control = this.calculateControl();
        document.getElementById('control-value').textContent = 
            `${control.toFixed(2)}%`;
        
        const status = this.getStatus(control);
        document.getElementById('status-value').textContent = status;
    }

    updateCorners() {
        const cornersContainer = document.getElementById('corners');
        cornersContainer.innerHTML = '';

        if (!this.showPrimeLabels && this.showCornerLabels) {
            this.addCorner(cornersContainer, 'A', -32, 908);
            this.addCorner(cornersContainer, 'B', -32, 0);
            this.addCorner(cornersContainer, 'C', 920, 0);  // Changed position
            this.addCorner(cornersContainer, 'D', 920, 908); // Changed position
        }

        if (this.showPrimeLabels && this.pointPosition.x >= 0 && this.pointPosition.y < 100) {
            const endX = (this.pointPosition.x + 1) * (this.pixelSize + this.gap) + this.pixelSize;
            const endY = this.pointPosition.y * (this.pixelSize + this.gap);
            
            this.addCorner(cornersContainer, "A'", -32, 908, true);
            this.addCorner(cornersContainer, "B'", -32, endY, true);
            this.addCorner(cornersContainer, "C'", endX, endY, true);
            this.addCorner(cornersContainer, "D'", endX, 908, true);
        }
    }

    addCorner(container, label, left, top, isPrime = false) {
        const corner = document.createElement('div');
        corner.className = `corner${isPrime ? ' prime' : ''}`;
        corner.textContent = label;
        corner.style.left = `${left < 0 ? left : left - 12}px`;
        corner.style.top = `${top - (top === 908 ? 24 : 0)}px`;
        container.appendChild(corner);
    }

    showThresholdStatus() {
        const statusIndicator = document.getElementById('status-indicator');
        statusIndicator.textContent = 'Threshold';
        statusIndicator.classList.remove('status-hidden');
        setTimeout(() => {
            statusIndicator.classList.add('status-hidden');
        }, 1000);
    }

    showError() {
        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.remove('error-hidden');
        
        const hideError = () => {
            errorMessage.classList.add('error-hidden');
            document.removeEventListener('mousedown', hideError);
            document.removeEventListener('keydown', hideError);
        };
        
        document.addEventListener('mousedown', hideError);
        document.addEventListener('keydown', hideError);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PixelGrid();
});