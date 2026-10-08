// Animated space background: parallax star layers, twinkling, shooting stars.
(() => {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const LAYERS = [
        { depth: 0.15, density: 0.00022, size: [0.3, 0.9], speed: 0.02 },
        { depth: 0.35, density: 0.00010, size: [0.6, 1.3], speed: 0.04 },
        { depth: 0.7,  density: 0.00003, size: [1.0, 1.9], speed: 0.08 },
    ];
    const TINTS = ['255,255,255', '255,255,255', '200,220,255', '255,230,200', '210,200,255'];

    let width, height, dpr;
    let stars = [];
    let shootingStars = [];
    let nextShootingStar = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const rand = (min, max) => Math.random() * (max - min) + min;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        createStars();
    }

    function createStars() {
        stars = [];
        LAYERS.forEach(layer => {
            const count = Math.round(width * height * layer.density);
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: rand(layer.size[0], layer.size[1]),
                    alpha: rand(0.4, 1),
                    twinkleSpeed: rand(0.5, 2.5),
                    phase: Math.random() * Math.PI * 2,
                    tint: TINTS[Math.floor(Math.random() * TINTS.length)],
                    layer,
                });
            }
        });
    }

    function spawnShootingStar() {
        const fromLeft = Math.random() < 0.5;
        const angle = rand(0.35, 0.6) * (fromLeft ? 1 : -1);
        const speed = rand(9, 15);
        shootingStars.push({
            x: fromLeft ? rand(-50, width * 0.6) : rand(width * 0.4, width + 50),
            y: rand(-20, height * 0.4),
            vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
            vy: Math.abs(Math.sin(angle)) * speed,
            length: rand(120, 260),
            life: 0,
            maxLife: rand(50, 90),
        });
    }

    function drawStar(s, time, offsetX, offsetY) {
        const twinkle = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(time * 0.001 * s.twinkleSpeed + s.phase);
        let x = (s.x + offsetX * s.layer.depth) % width;
        let y = (s.y + offsetY * s.layer.depth) % height;
        if (x < 0) x += width;
        if (y < 0) y += height;

        ctx.globalAlpha = s.alpha * twinkle;
        ctx.fillStyle = `rgb(${s.tint})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Soft glow + cross flare on the brightest foreground stars
        if (s.r > 1.5) {
            ctx.globalAlpha = s.alpha * twinkle * 0.25;
            ctx.beginPath();
            ctx.arc(x, y, s.r * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = s.alpha * twinkle * 0.5;
            ctx.fillRect(x - s.r * 4, y - 0.4, s.r * 8, 0.8);
            ctx.fillRect(x - 0.4, y - s.r * 4, 0.8, s.r * 8);
        }
    }

    function drawShootingStar(s) {
        const progress = s.life / s.maxLife;
        const fade = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        const mag = Math.hypot(s.vx, s.vy);
        const tailX = s.x - (s.vx / mag) * s.length;
        const tailY = s.y - (s.vy / mag) * s.length;

        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${fade})`);
        grad.addColorStop(0.3, `rgba(180,200,255,${fade * 0.5})`);
        grad.addColorStop(1, 'rgba(180,200,255,0)');

        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    function frame(time) {
        ctx.clearRect(0, 0, width, height);

        // Ease the mouse parallax so it feels floaty
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;

        const drift = reduceMotion ? 0 : time * 0.01;
        const scroll = window.scrollY;

        for (const s of stars) {
            const offsetX = -drift * s.layer.speed * 10 - mouse.x * 40;
            const offsetY = -scroll * 0.5 - mouse.y * 40;
            drawStar(s, time, offsetX, offsetY);
        }

        if (!reduceMotion) {
            if (time > nextShootingStar) {
                spawnShootingStar();
                nextShootingStar = time + rand(1500, 5000);
            }
            shootingStars = shootingStars.filter(s => s.life < s.maxLife);
            for (const s of shootingStars) {
                s.x += s.vx;
                s.y += s.vy;
                s.life++;
                drawShootingStar(s);
            }
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', e => {
        mouse.tx = e.clientX / width - 0.5;
        mouse.ty = e.clientY / height - 0.5;
        document.documentElement.style.setProperty('--mx', mouse.tx.toFixed(3));
        document.documentElement.style.setProperty('--my', mouse.ty.toFixed(3));
    });
    window.addEventListener('scroll', () => {
        document.documentElement.style.setProperty('--scroll', window.scrollY);
    }, { passive: true });

    resize();
    requestAnimationFrame(frame);
})();
