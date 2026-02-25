import React, { useEffect, useRef, useState } from 'react';

const GRAVITY = 0.6;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 100; // frames
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const BIRD_SIZE = 40;

const App = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAME_OVER
  const [score, setScore] = useState(0);
  
  const birdRef = useRef({ 
    x: 50, 
    y: 250, 
    velocity: 0, 
    scale: 1, 
    rotation: 0 
  });
  const pipesRef = useRef([]);
  const frameCountRef = useRef(0);
  const assetsRef = useRef({ bird: null, pipe: null, snore: null, growl: null });
  const particlesRef = useRef([]);

  useEffect(() => {
    const birdImg = new Image();
    birdImg.src = '/assets/face.png';
    const pipeImg = new Image();
    pipeImg.src = '/assets/brick.jpg';
    
    birdImg.onload = () => { assetsRef.current.bird = birdImg; };
    pipeImg.onload = () => { assetsRef.current.pipe = pipeImg; };

    // Load Sounds
    assetsRef.current.snore = new Audio('/assets/snore.mp3');
    assetsRef.current.growl = new Audio('/assets/growl.mp3');

    // Initialize particles
    particlesRef.current = Array.from({ length: 20 }, () => ({
      x: Math.random() * 400,
      y: Math.random() * 600,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 1 + 0.5,
      opacity: Math.random() * 0.5 + 0.2
    }));
  }, []);

  const resetGame = () => {
    birdRef.current = { x: 50, y: 250, velocity: 0, scale: 1, rotation: 0 };
    pipesRef.current = [];
    frameCountRef.current = 0;
    setScore(0);
    setGameState('PLAYING');
  };

  const jump = () => {
    if (gameState === 'PLAYING') {
      birdRef.current.velocity = JUMP_STRENGTH;
      birdRef.current.scale = 1.3; // Bounce effect start
      
      // Play Snore sound on jump
      if (assetsRef.current.snore) {
        assetsRef.current.snore.currentTime = 0;
        assetsRef.current.snore.play().catch(e => console.log("Audio play blocked", e));
      }
    } else if (gameState === 'START' || gameState === 'GAME_OVER') {
      resetGame();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') jump();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const update = () => {
      if (gameState === 'PLAYING') {
        // Bird physics
        birdRef.current.velocity += GRAVITY;
        birdRef.current.y += birdRef.current.velocity;
        
        // Juiciness: Scale back to 1
        if (birdRef.current.scale > 1) {
          birdRef.current.scale -= 0.05;
        } else {
          birdRef.current.scale = 1;
        }

        // Animations: Rotate based on velocity
        birdRef.current.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdRef.current.velocity * 0.1));

        // Background particles update
        particlesRef.current.forEach(p => {
          p.x -= p.speed;
          if (p.x < -10) p.x = canvas.width + 10;
        });

        // Pipe spawning
        frameCountRef.current++;
        if (frameCountRef.current % PIPE_SPAWN_RATE === 0) {
          const gapTop = Math.random() * (canvas.height - PIPE_GAP - 150) + 75;
          pipesRef.current.push({
            x: canvas.width,
            gapTop,
            passed: false
          });
        }

        // Pipe movement & collision
        pipesRef.current.forEach((pipe, index) => {
          pipe.x -= PIPE_SPEED;

          // Collision detection
          if (
            birdRef.current.x + BIRD_SIZE * 0.7 > pipe.x &&
            birdRef.current.x < pipe.x + PIPE_WIDTH &&
            (birdRef.current.y < pipe.gapTop || birdRef.current.y + BIRD_SIZE * 0.8 > pipe.gapTop + PIPE_GAP)
          ) {
            setGameState('GAME_OVER');
            if (assetsRef.current.growl) assetsRef.current.growl.play().catch(e => console.log(e));
          }

          // Score tracking
          if (!pipe.passed && birdRef.current.x > pipe.x + PIPE_WIDTH) {
            pipe.passed = true;
            setScore(s => s + 1);
          }
        });

        // Cleanup off-screen pipes
        pipesRef.current = pipesRef.current.filter(p => p.x + PIPE_WIDTH > 0);

        // Ground/Ceiling collision
        if (birdRef.current.y + BIRD_SIZE > canvas.height || birdRef.current.y < 0) {
          setGameState('GAME_OVER');
          if (assetsRef.current.growl) assetsRef.current.growl.play().catch(e => console.log(e));
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#4facfe');
      gradient.addColorStop(1, '#00f2fe');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Particles (Clouds/Dust)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      particlesRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Pipes with Texture
      pipesRef.current.forEach(pipe => {
        if (assetsRef.current.pipe) {
          const img = assetsRef.current.pipe;
          // Calculate height to maintain aspect ratio
          // Default to 1.775 aspect ratio if image not fully loaded, or calculate
          const aspectRatio = (img.naturalHeight && img.naturalWidth) 
            ? img.naturalHeight / img.naturalWidth 
            : 1.775;
            
          const pipeImgHeight = PIPE_WIDTH * aspectRatio;

          // Top pipe
          ctx.save();
          // Clip to pipe area
          ctx.beginPath();
          ctx.rect(pipe.x, 0, PIPE_WIDTH, pipe.gapTop);
          ctx.clip();
          // Draw image repeated
          for (let y = 0; y < pipe.gapTop; y += pipeImgHeight) {
             ctx.drawImage(img, pipe.x, y, PIPE_WIDTH, pipeImgHeight);
          }
          ctx.restore();

          // Bottom pipe
          ctx.save();
          ctx.beginPath();
          ctx.rect(pipe.x, pipe.gapTop + PIPE_GAP, PIPE_WIDTH, canvas.height - (pipe.gapTop + PIPE_GAP));
          ctx.clip();
          for (let y = pipe.gapTop + PIPE_GAP; y < canvas.height; y += pipeImgHeight) {
             ctx.drawImage(img, pipe.x, y, PIPE_WIDTH, pipeImgHeight);
          }
          ctx.restore();
          
          // Pipe borders
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.gapTop);
          ctx.strokeRect(pipe.x, pipe.gapTop + PIPE_GAP, PIPE_WIDTH, canvas.height - (pipe.gapTop + PIPE_GAP));

        } else {
          ctx.fillStyle = '#2e7d32';
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapTop);
          ctx.fillRect(pipe.x, pipe.gapTop + PIPE_GAP, PIPE_WIDTH, canvas.height);
        }
      });

      // Draw Bird with Rotation and Scale
      ctx.save();
      const centerX = birdRef.current.x + BIRD_SIZE / 2;
      const centerY = birdRef.current.y + BIRD_SIZE / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(birdRef.current.rotation);
      ctx.scale(birdRef.current.scale, birdRef.current.scale);
      
      if (assetsRef.current.bird) {
        ctx.drawImage(assetsRef.current.bird, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
      } else {
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
      }
      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, score]);

  const overlayStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    minWidth: '200px',
    userSelect: 'none',
    pointerEvents: 'none',
    zIndex: 10
  };

  const buttonStyle = {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '18px',
    borderRadius: '10px',
    border: 'none',
    background: '#fff',
    color: '#333',
    cursor: 'pointer',
    pointerEvents: 'auto',
    transition: 'transform 0.1s'
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }} onClick={jump}>
      <div style={{ position: 'relative', width: '400px', height: '600px' }}>
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={600} 
          style={{ 
            display: 'block',
            border: '4px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            boxShadow: '0 0 40px rgba(0,0,0,0.8)' 
          }} 
        />
        
        {/* Glassmorphism Overlays */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '20px',
          fontWeight: 'bold',
          border: '1px solid rgba(255,255,255,0.2)',
          pointerEvents: 'none'
        }}>
          Score: {score}
        </div>

        {gameState === 'START' && (
          <div style={overlayStyle}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '32px' }}>Flappy Boss</h1>
            <p style={{ margin: '0 0 20px 0', opacity: 0.8 }}>Master the skies</p>
            <button style={buttonStyle}>Start Game</button>
            <p style={{ fontSize: '12px', marginTop: '15px', opacity: 0.7 }}>Press Space or Click</p>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div style={overlayStyle}>
            <h1 style={{ margin: '0 0 10px 0', color: '#ff4d4d' }}>Game Over</h1>
            <p style={{ 
              color: '#ff4d4d', 
              fontWeight: 'bold', 
              fontSize: '24px', 
              margin: '10px 0',
              textTransform: 'uppercase'
            }}>
              Madda cheekura puka
            </p>
            <p style={{ fontSize: '24px', margin: '0 0 20px 0' }}>Score: {score}</p>
            <button style={buttonStyle}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;