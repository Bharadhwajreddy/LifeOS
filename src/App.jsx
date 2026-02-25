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
  
  const birdRef = useRef({ x: 50, y: 250, velocity: 0 });
  const pipesRef = useRef([]);
  const frameCountRef = useRef(0);
  const assetsRef = useRef({ bird: null, pipe: null });

  useEffect(() => {
    const birdImg = new Image();
    birdImg.src = '/assets/face.png';
    const pipeImg = new Image();
    pipeImg.src = '/assets/ghost.png';
    
    birdImg.onload = () => { assetsRef.current.bird = birdImg; };
    pipeImg.onload = () => { assetsRef.current.pipe = pipeImg; };
  }, []);

  const resetGame = () => {
    birdRef.current = { x: 50, y: 250, velocity: 0 };
    pipesRef.current = [];
    frameCountRef.current = 0;
    setScore(0);
    setGameState('PLAYING');
  };

  const jump = () => {
    if (gameState === 'PLAYING') {
      birdRef.current.velocity = JUMP_STRENGTH;
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

        // Pipe spawning
        frameCountRef.current++;
        if (frameCountRef.current % PIPE_SPAWN_RATE === 0) {
          const gapTop = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
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
            birdRef.current.x + BIRD_SIZE > pipe.x &&
            birdRef.current.x < pipe.x + PIPE_WIDTH &&
            (birdRef.current.y < pipe.gapTop || birdRef.current.y + BIRD_SIZE > pipe.gapTop + PIPE_GAP)
          ) {
            setGameState('GAME_OVER');
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
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = '#70c5ce';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Pipes
      pipesRef.current.forEach(pipe => {
        if (assetsRef.current.pipe) {
          // Top pipe (repeated pattern)
          const pattern = ctx.createPattern(assetsRef.current.pipe, 'repeat');
          ctx.fillStyle = pattern;
          
          ctx.save();
          ctx.translate(pipe.x, 0);
          ctx.fillRect(0, 0, PIPE_WIDTH, pipe.gapTop);
          
          // Bottom pipe
          ctx.translate(0, pipe.gapTop + PIPE_GAP);
          ctx.fillRect(0, 0, PIPE_WIDTH, canvas.height - (pipe.gapTop + PIPE_GAP));
          ctx.restore();
        } else {
          ctx.fillStyle = '#2e7d32';
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapTop);
          ctx.fillRect(pipe.x, pipe.gapTop + PIPE_GAP, PIPE_WIDTH, canvas.height);
        }
      });

      // Draw Bird
      if (assetsRef.current.bird) {
        ctx.drawImage(assetsRef.current.bird, birdRef.current.x, birdRef.current.y, BIRD_SIZE, BIRD_SIZE);
      } else {
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(birdRef.current.x, birdRef.current.y, BIRD_SIZE, BIRD_SIZE);
      }

      // UI
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${score}`, 20, 40);

      if (gameState === 'START') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Press Space or Click to Start', canvas.width / 2, canvas.height / 2);
      }

      if (gameState === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 20);
      }
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, score]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} onClick={jump}>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={600} 
        style={{ border: '4px solid #fff', borderRadius: '8px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} 
      />
    </div>
  );
};

export default App;