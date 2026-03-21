/**
 * Crimson Network Cursor Animation
 * Tactical digital web that connects nodes based on proximity.
 */

class CrimsonNetwork {
    constructor() {
        this.canvas = document.getElementById('shard-cursor'); // Reusing the same canvas ID for simplicity
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.mouse = { x: 0, y: 0 };
        this.lastSpawn = { x: 0, y: 0 };
        this.maxDist = 100; // Max distance to draw a line
        this.active = false;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.handleMove(e));
        window.addEventListener('touchmove', (e) => this.handleTouch(e));
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.spawnPoint();
        this.active = true;
    }

    handleTouch(e) {
        if (e.touches.length > 0) {
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
            this.spawnPoint();
            this.active = true;
        }
    }

    spawnPoint() {
        // Only spawn if mouse moved enough to avoid overcrowding
        const d = Math.hypot(this.mouse.x - this.lastSpawn.x, this.mouse.y - this.lastSpawn.y);
        if (d > 5) {
            this.points.push(new NetworkPoint(this.mouse.x, this.mouse.y));
            this.lastSpawn.x = this.mouse.x;
            this.lastSpawn.y = this.mouse.y;
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw points
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            p.update();
            
            if (p.life <= 0) {
                this.points.splice(i, 1);
                i--;
                continue;
            }

            // Draw connections
            for (let j = i + 1; j < this.points.length; j++) {
                const p2 = this.points[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                
                if (dist < this.maxDist) {
                    const alpha = Math.min(p.life, p2.life) * (1 - dist / this.maxDist);
                    this.ctx.strokeStyle = `rgba(255, 0, 53, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }

            // Draw point node
            this.ctx.fillStyle = `rgba(255, 0, 53, ${p.life})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}

class NetworkPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.01;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
}

// Initialize
window.addEventListener('load', () => {
    new CrimsonNetwork();
});
