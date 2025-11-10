// Canvas-based animations for FarmToHome
class CanvasAnimator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.init();
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = 400; // Hero height
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = 400;
        });
    }

    // Organic leaves animation
    addLeaf() {
        const leaf = {
            x: Math.random() * this.canvas.width,
            y: -20,
            size: 15 + Math.random() * 10,
            speedY: 1 + Math.random() * 2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02
        };
        this.particles.push(leaf);
    }

    drawLeaf(leaf) {
        this.ctx.save();
        this.ctx.translate(leaf.x, leaf.y);
        this.ctx.rotate(leaf.rotation);
        
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(43, 147, 72, 0.4)';
        this.ctx.moveTo(0, -leaf.size/2);
        this.ctx.bezierCurveTo(
            leaf.size/2, -leaf.size/2,
            leaf.size/2, leaf.size/2,
            0, leaf.size/2
        );
        this.ctx.bezierCurveTo(
            -leaf.size/2, leaf.size/2,
            -leaf.size/2, -leaf.size/2,
            0, -leaf.size/2
        );
        this.ctx.fill();
        this.ctx.restore();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(Math.random() < 0.05) this.addLeaf();

        for(let i = this.particles.length - 1; i >= 0; i--) {
            const leaf = this.particles[i];
            leaf.y += leaf.speedY;
            leaf.x += leaf.speedX;
            leaf.rotation += leaf.rotationSpeed;
            
            this.drawLeaf(leaf);
            
            if(leaf.y > this.canvas.height) {
                this.particles.splice(i, 1);
            }
        }
        requestAnimationFrame(() => this.animate());
    }
}

// Product card hover effect
class ProductCardEffect {
    constructor(cardEl) {
        this.card = cardEl;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'card-canvas';
        this.ctx = this.canvas.getContext('2d');
        this.card.appendChild(this.canvas);
        this.init();
    }

    init() {
        this.canvas.width = this.card.offsetWidth;
        this.canvas.height = this.card.offsetHeight;
        this.card.addEventListener('mousemove', (e) => this.handleHover(e));
        this.card.addEventListener('mouseleave', () => this.handleLeave());
    }

    handleHover(e) {
        const rect = this.card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const gradient = this.ctx.createRadialGradient(
            x, y, 0,
            x, y, 100
        );
        
        gradient.addColorStop(0, 'rgba(43, 147, 72, 0.1)');
        gradient.addColorStop(1, 'rgba(43, 147, 72, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    handleLeave() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize animations when document loads
document.addEventListener('DOMContentLoaded', () => {
    // Hero animation (only if canvas exists on this page)
    if(document.getElementById('heroCanvas')){
        const heroAnimator = new CanvasAnimator('heroCanvas');
        heroAnimator.animate();
    }
    
    // Product cards effect
    document.querySelectorAll('.product-card').forEach(card => {
        new ProductCardEffect(card);
    });

    // Plant canvases: create canvas inside .plant-anim if not present and observe 'grow' class
    document.querySelectorAll('.plant-anim').forEach(el=>{
        let canvas = el.querySelector('canvas');
        if(!canvas){
            canvas = document.createElement('canvas');
            canvas.width = 140; canvas.height = 140;
            el.appendChild(canvas);
        }
        const ctx = canvas.getContext('2d');

        function drawSprout(progress){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height-10);
            ctx.strokeStyle = '#2b9348';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0,0);
            const h = -40 * progress;
            ctx.quadraticCurveTo(-10*h*0.02, h/2, 0, h);
            ctx.stroke();
            // leaf
            ctx.fillStyle = '#2b9348';
            ctx.beginPath();
            ctx.ellipse(-6, h/2, 6*progress, 10*progress, -0.5, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }

        function animateSprout(){
            let t = 0;
            function step(){
                t += 0.06;
                drawSprout(Math.min(1, t));
                if(t < 1) requestAnimationFrame(step);
            }
            step();
        }

        // Observe class changes to trigger animation when 'grow' is added
        const mo = new MutationObserver(mutations=>{
            mutations.forEach(m=>{
                if(m.attributeName === 'class'){
                    if(el.classList.contains('grow')) animateSprout();
                }
            });
        });
        mo.observe(el, { attributes: true });
    });
});