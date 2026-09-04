export class RetroBackgroundRenderer {
  public static draw(ctx: CanvasRenderingContext2D, cameraX: number, viewWidth: number, viewHeight: number) {
    // 1. SKY GRADIENT (Fiery Twilight Arcade Atmosphere)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewHeight);
    skyGrad.addColorStop(0, '#020617'); // Dark Space / Night
    skyGrad.addColorStop(0.35, '#1e1b4b'); // Deep Indigo
    skyGrad.addColorStop(0.65, '#4c0519'); // Crimson Red Horizon
    skyGrad.addColorStop(1, '#1e293b'); // Dark Slate Ground

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Distant Stars & Alien Red Moon
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    const moonX = 580 - (cameraX * 0.02) % (viewWidth + 200);
    ctx.arc(moonX, 80, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(moonX - 4, 76, 24, 0, Math.PI * 2);
    ctx.fill();

    // 2. FAR PARALLAX LAYER: Volcanic Jagged Mountains (0.1x camera scroll)
    const farX = -(cameraX * 0.1) % 400;
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    for (let x = farX - 400; x < viewWidth + 400; x += 200) {
      ctx.lineTo(x, viewHeight);
      ctx.lineTo(x + 60, viewHeight - 160);
      ctx.lineTo(x + 120, viewHeight - 210);
      ctx.lineTo(x + 160, viewHeight - 140);
      ctx.lineTo(x + 200, viewHeight);
    }
    ctx.fill();

    // Mountain Lava Veins
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = farX - 400; x < viewWidth + 400; x += 200) {
      ctx.moveTo(x + 120, viewHeight - 210);
      ctx.lineTo(x + 110, viewHeight - 160);
      ctx.lineTo(x + 130, viewHeight - 120);
    }
    ctx.stroke();

    // 3. MID PARALLAX LAYER: Jungle Canopy & Waterfall (0.35x camera scroll)
    const midX = -(cameraX * 0.35) % 300;
    ctx.fillStyle = '#064e3b'; // Dark Jungle Green

    for (let x = midX - 300; x < viewWidth + 300; x += 150) {
      // Giant Jungle Tree Trunks
      ctx.fillRect(x + 60, viewHeight - 220, 20, 220);

      // Clustered Canopy Circles
      ctx.beginPath();
      ctx.arc(x + 70, viewHeight - 220, 50, 0, Math.PI * 2);
      ctx.arc(x + 40, viewHeight - 200, 40, 0, Math.PI * 2);
      ctx.arc(x + 100, viewHeight - 200, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // Animated Waterfall Stream (Around x ~ 1520 in world space)
    const waterfallWorldX = 1550;
    const waterfallScreenX = waterfallWorldX - cameraX;
    if (waterfallScreenX > -100 && waterfallScreenX < viewWidth + 100) {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(waterfallScreenX, 140, 60, 280);

      // Cascading foam ripples
      ctx.fillStyle = '#e0f2fe';
      const offset = (Date.now() / 40) % 20;
      for (let y = 140 + offset; y < 420; y += 20) {
        ctx.fillRect(waterfallScreenX + 4, y, 52, 4);
      }
    }
  }

  // DRAW TERRAIN TILES & PLATFORMS
  public static drawPlatforms(ctx: CanvasRenderingContext2D, platforms: any[], cameraX: number) {
    for (const plat of platforms) {
      const sx = plat.x - cameraX;
      if (sx + plat.width < -50 || sx > 850) continue;

      if (plat.type === 'solid') {
        // Jungle Rock / Earth Ground with grass top
        // Grass surface layer
        ctx.fillStyle = '#15803d'; // Green Grass
        ctx.fillRect(sx, plat.y, plat.width, 8);
        ctx.fillStyle = '#22c55e'; // Bright Grass edge
        ctx.fillRect(sx, plat.y, plat.width, 3);

        // Rocky Dirt Layer
        ctx.fillStyle = '#78350f'; // Dark Brown Earth
        ctx.fillRect(sx, plat.y + 8, plat.width, plat.height - 8);

        // Stone Crags inside dirt
        ctx.fillStyle = '#451a03';
        for (let ix = sx + 8; ix < sx + plat.width - 10; ix += 28) {
          ctx.fillRect(ix, plat.y + 16, 12, 10);
          ctx.fillRect(ix + 10, plat.y + 36, 14, 12);
        }
      } else if (plat.type === 'one-way') {
        // High-Tech Military Catwalk / Steel Truss Platform
        ctx.fillStyle = '#334155'; // Slate beam
        ctx.fillRect(sx, plat.y, plat.width, plat.height);

        // Steel Grate Tread Pattern
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sx, plat.y, plat.width, 3);

        // Cross Struts / Bolts
        ctx.fillStyle = '#0f172a';
        for (let bx = sx + 6; bx < sx + plat.width - 6; bx += 18) {
          ctx.fillRect(bx, plat.y + 4, 3, plat.height - 4);
          ctx.fillRect(bx + 1, plat.y + 6, 1, 1); // bolt rivet
        }
      } else if (plat.type === 'water') {
        // Water Trench Basin
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(sx, plat.y, plat.width, plat.height);

        // Water surface animation
        const wave = Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(sx, plat.y + wave, plat.width, 6);

        ctx.fillStyle = '#bae6fd';
        for (let wx = sx; wx < sx + plat.width; wx += 24) {
          ctx.fillRect(wx + (wave * 2), plat.y + wave, 12, 2);
        }
      }
    }
  }
}
