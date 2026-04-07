'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

// 定義點的屬性介面
interface Point {
  x: number;
  y: number;
  originX: number; // 原始 X 座標 (回彈目標)
  originY: number; // 原始 Y 座標 (回彈目標)
  vx: number; // X 軸速度
  vy: number; // Y 軸速度
  size: number; // 點的大小
  color: string; // 點的顏色
  driftAngle: number; // 漂移角度 (用於有機運動)
  driftSpeed: number; // 漂移速度
  driftRadius: number; // 漂移半徑
  history: { x: number; y: number }[]; // 歷史位置記錄 (用於繪製殘影軌跡)
}

// 定義波紋的屬性介面
interface Wave {
  x: number;
  y: number;
  radius: number; // 當前半徑
  maxRadius: number; // 最大半徑
  strength: number; // 波紋強度
  life: number; // 生命週期 (0 到 1，1 為剛產生)
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // 使用 useRef 儲存動畫狀態，避免 React 重複渲染導致效能問題
  const stateRef = useRef({
    points: [] as Point[],
    waves: [] as Wave[],
    mouse: { x: -1000, y: -1000 },
    lastMouse: { x: -100, y: -1000 },
    mouseSpeed: 0,
    width: 0,
    height: 0,
    animationFrame: 0,
    lastInteractionTime: 0, // 上次互動時間
    idleWaveTimer: 0, // 用於控制閒置時波紋產生的計時器
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ==========================================
    // 參數設定區 (Configuration)
    // 您可以在這裡調整動畫的各項數值
    // ==========================================
    const config = {
      // 網格設定
      gridSpacing: 50, // 點與點之間的間距 (數值越小點越密集，效能消耗越大)
      pointSize: 2.5, // 點的基礎大小

      // 物理運動設定
      friction: 0.9, // 摩擦力 (0.0 ~ 1.0)，數值越小停止越快，越大滑動越久
      ease: 0.02, // 回彈係數 (0.0 ~ 1.0)，數值越小回彈越慢越柔和

      // 滑鼠互動設定 (吸引效果)
      baseMouseRadius: 180, // 滑鼠靜止時的影響半徑
      maxMouseRadius: 400, // 滑鼠快速移動時的最大影響半徑
      baseMouseStrength: 2, // 基礎吸引力強度 (數值越小吸力越弱)
      maxMouseStrength: 2, // 最大吸引力強度 (快速移動時)

      // 視覺效果設定
      trailLength: 2, // 殘影軌跡長度 (數值越大尾巴越長)

      // 顏色設定 (根據主題切換)
      colors:
        theme === 'dark-orange'
          ? ['#FF4C33', '#FF334C', '#FFB233', '#33FFB2'] // 深色主題
          : ['#1e3a8a', '#3b82f6', '#0ea5e9'], // 淺色主題
    };

    // 處理視窗大小改變
    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container;
      canvas.width = width;
      canvas.height = height;
      stateRef.current.width = width;
      stateRef.current.height = height;
      initPoints(width, height);
    };

    // 初始化點陣
    const initPoints = (width: number, height: number) => {
      const points: Point[] = [];
      // 計算需要多少行列來填滿畫面 (+2 是為了邊緣緩衝)
      const cols = Math.ceil(width / config.gridSpacing) + 2;
      const rows = Math.ceil(height / config.gridSpacing) + 2;

      const offsetX = -config.gridSpacing;
      const offsetY = -config.gridSpacing;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const baseX = offsetX + i * config.gridSpacing;
          const baseY = offsetY + j * config.gridSpacing;

          // 為每個點增加隨機偏移
          const randomX = (Math.random() - 0.5) * 30;
          const randomY = (Math.random() - 0.5) * 30;
          const originX = baseX + randomX;
          const originY = baseY + randomY;

          points.push({
            x: originX,
            y: originY,
            originX,
            originY,
            vx: 0,
            vy: 0,
            size: config.pointSize + Math.random() * 1.5, // 隨機大小變化
            color:
              config.colors[Math.floor(Math.random() * config.colors.length)],
            driftAngle: Math.random() * Math.PI * 2, // 隨機初始漂移角度
            driftSpeed: 0.005 + Math.random() * 0.015, // 隨機漂移速度
            driftRadius: 5 + Math.random() * 10, // 隨機漂移範圍
            history: [],
          });
        }
      }
      stateRef.current.points = points;
    };

    // 動畫主迴圈
    const animate = () => {
      ctx.clearRect(0, 0, stateRef.current.width, stateRef.current.height);

      // 讓滑鼠速度隨時間衰減 (如果滑鼠停止，速度感應效果會消失)
      stateRef.current.mouseSpeed *= 0.2;

      // ==========================================
      // 閒置效果邏輯 (Idle Effect)
      // ==========================================
      const now = Date.now();
      const isIdle =
        now - stateRef.current.lastInteractionTime > 5000 ||
        stateRef.current.lastInteractionTime === 0;

      if (isIdle) {
        stateRef.current.idleWaveTimer++;
        if (stateRef.current.idleWaveTimer > 90) {
          stateRef.current.waves.push({
            x: stateRef.current.width * 0.2, // 右上角 X 位置
            y: stateRef.current.height * 0.6, // 右上角 Y 位置
            radius: 0,
            maxRadius: 600,
            strength: 0.8,
            life: 1,
          });
          stateRef.current.idleWaveTimer = 0;
        }
      } else {
        stateRef.current.idleWaveTimer = 0;
      }

      // 根據滑鼠速度計算動態半徑與強度
      const speedFactor = Math.min(stateRef.current.mouseSpeed / 50, 1);

      const currentMouseRadius =
        config.baseMouseRadius +
        (config.maxMouseRadius - config.baseMouseRadius) * speedFactor;
      const currentMouseStrength =
        config.baseMouseStrength +
        (config.maxMouseStrength - config.baseMouseStrength) * speedFactor;

      // 更新波紋狀態
      for (let i = stateRef.current.waves.length - 1; i >= 0; i--) {
        const wave = stateRef.current.waves[i];
        wave.radius += 5; // 波紋擴散速度
        wave.life -= 0.01; // 波紋消失速度
        if (wave.life <= 0) stateRef.current.waves.splice(i, 1);
      }

      // 更新與繪製每個點
      stateRef.current.points.forEach(point => {
        // 更新歷史軌跡 (用於繪製殘影)
        point.history.push({ x: point.x, y: point.y });
        if (point.history.length > config.trailLength) {
          point.history.shift();
        }

        // 0. 有機漂移 (Organic Drift) - 讓點點在原地輕微畫圓漂浮
        point.driftAngle += point.driftSpeed;
        const driftX = Math.cos(point.driftAngle) * point.driftRadius;
        const driftY = Math.sin(point.driftAngle) * point.driftRadius;

        const targetX = point.originX + driftX;
        const targetY = point.originY + driftY;

        // 1. 彈簧力 (Spring Force) - 讓點點試圖回到漂移目標位置
        const dx = targetX - point.x;
        const dy = targetY - point.y;
        point.vx += dx * config.ease;
        point.vy += dy * config.ease;

        // 2. 滑鼠吸引力 (Gravity Well)
        const mouseDx = point.x - stateRef.current.mouse.x;
        const mouseDy = point.y - stateRef.current.mouse.y;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

        let opacity = 0.05; // 基礎透明度 (很淡)

        if (mouseDist < currentMouseRadius) {
          const force = (currentMouseRadius - mouseDist) / currentMouseRadius;
          const angle = Math.atan2(mouseDy, mouseDx);

          // 吸引力計算：負值代表吸引，正值代表排斥
          // 這裡乘以 -1 實現吸引效果
          const pushX = Math.cos(angle) * force * currentMouseStrength * -1;
          const pushY = Math.sin(angle) * force * currentMouseStrength * -1;

          point.vx += pushX;
          point.vy += pushY;

          // 靠近滑鼠時增加透明度
          opacity += force * 0.95;
        }

        // 3. 波紋互動 (Wave Interaction) - 點擊時的衝擊波
        stateRef.current.waves.forEach(wave => {
          const waveDx = point.x - wave.x;
          const waveDy = point.y - wave.y;
          const dist = Math.sqrt(waveDx * waveDx + waveDy * waveDy);
          const distFromWaveEdge = Math.abs(dist - wave.radius);
          const waveWidth = 150; // 波紋寬度

          if (distFromWaveEdge < waveWidth) {
            const force =
              (1 - distFromWaveEdge / waveWidth) * wave.strength * wave.life;
            const angle = Math.atan2(waveDy, waveDx);
            // 波紋依然保持排斥效果，產生衝擊感
            point.vx += Math.cos(angle) * force * 3;
            point.vy += Math.sin(angle) * force * 3;
            // 波紋經過時增加透明度
            opacity += force * 0.8;
          }
        });

        // 物理模擬：應用速度與摩擦力
        point.vx *= config.friction;
        point.vy *= config.friction;
        point.x += point.vx;
        point.y += point.vy;

        // 繪製殘影軌跡 (Trail)
        if (point.history.length > 1 && opacity > 0.1) {
          ctx.beginPath();
          ctx.moveTo(point.history[0].x, point.history[0].y);
          for (let i = 1; i < point.history.length; i++) {
            ctx.lineTo(point.history[i].x, point.history[i].y);
          }
          ctx.lineTo(point.x, point.y);
          ctx.strokeStyle = point.color;
          ctx.lineWidth = point.size * 0.5;
          ctx.globalAlpha = opacity * 0.5; // 軌跡比點本身淡
          ctx.stroke();
        }

        // 繪製點 (Point)
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.globalAlpha = Math.min(Math.max(opacity, 0), 1); // 限制透明度在 0~1 之間
        ctx.fill();
      });

      stateRef.current.animationFrame = requestAnimationFrame(animate);
    };

    // 滑鼠移動事件處理
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 計算滑鼠移動速度
      const dx = x - stateRef.current.lastMouse.x;
      const dy = y - stateRef.current.lastMouse.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      stateRef.current.mouseSpeed = speed;
      stateRef.current.lastMouse = { x, y };
      stateRef.current.mouse = { x, y };
      stateRef.current.lastInteractionTime = Date.now(); // 更新互動時間
    };

    const handleMouseLeave = () => {
      stateRef.current.mouse.x = -1000;
      stateRef.current.mouse.y = -1000;
    };

    // 點擊事件處理 (產生波紋)
    const handleClick = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      stateRef.current.waves.push({
        x,
        y,
        radius: 0,
        maxRadius: 500,
        strength: 2,
        life: 1,
      });
      stateRef.current.lastInteractionTime = Date.now();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);
    document.addEventListener('mouseleave', handleMouseLeave);

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClick);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(stateRef.current.animationFrame);
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
