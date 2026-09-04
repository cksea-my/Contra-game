import { CharacterType, Player, Enemy, Bullet, PowerupItem, BossState, Particle, WeaponType } from '../types';

export class RetroSpriteRenderer {
  // Utility: Draw pixel rectangle (scales automatically)
  private static p(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  // DRAW HERO (BILL / LANCE)
  public static drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
    if (player.isDead) return;

    // Invincibility flicker
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 0) {
      return;
    }

    ctx.save();

    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;

    ctx.translate(cx, cy);
    if (player.facingLeft) {
      ctx.scale(-1, 1);
    }

    const isBill = player.character === 'bill';
    const pantsColor = isBill ? '#2563eb' : '#dc2626'; // Blue for Bill, Red for Lance
    const pantsShade = isBill ? '#1d4ed8' : '#b91c1c';
    const headbandColor = isBill ? '#60a5fa' : '#f87171';
    const skinColor = '#fbcfe8'; // peach/tan
    const skinShadow = '#f472b6';
    const hairColor = isBill ? '#78350f' : '#1e1b4b'; // brown hair vs dark hair
    const beltColor = '#eab308';
    const gunColor = '#475569';
    const gunHighlight = '#cbd5e1';

    // 1. SOMERSAULT JUMP ANIMATION (Signature Contra spinning ball!)
    if (player.state === 'jump') {
      const frame = Math.floor(player.somersaultFrame) % 4;
      const angle = frame * (Math.PI / 2);
      ctx.rotate(angle);

      // Spinning commando ball
      // Outer limbs
      this.p(ctx, -12, -12, 24, 24, pantsColor);
      this.p(ctx, -9, -9, 18, 18, skinColor);
      this.p(ctx, -6, -6, 12, 12, hairColor);
      this.p(ctx, -3, -11, 6, 4, headbandColor);
      this.p(ctx, 4, -4, 8, 8, gunColor);

      ctx.restore();

      // Barrier effect if active
      if (player.weapon === 'BARRIER') {
        this.drawBarrierShield(ctx, player.x + player.width / 2, player.y + player.height / 2);
      }
      return;
    }

    // 2. PRONE / DUCK ANIMATION (Flat on ground)
    if (player.state === 'prone') {
      // Body horizontal
      this.p(ctx, -18, 4, 28, 10, pantsColor); // Legs & torso
      this.p(ctx, -14, 6, 10, 8, pantsShade);
      this.p(ctx, 6, 0, 10, 10, skinColor); // Head
      this.p(ctx, 4, -2, 10, 4, hairColor); // Hair
      this.p(ctx, 6, 2, 8, 3, headbandColor); // Headband
      // Rifle resting forward
      this.p(ctx, 12, 4, 18, 4, gunColor);
      this.p(ctx, 22, 2, 6, 2, gunHighlight);

      ctx.restore();
      if (player.weapon === 'BARRIER') {
        this.drawBarrierShield(ctx, player.x + player.width / 2, player.y + player.height / 2);
      }
      return;
    }

    // 3. SWIMMING IN WATER
    if (player.state === 'swim') {
      // Only head and gun above water
      this.p(ctx, -6, 0, 12, 12, skinColor);
      this.p(ctx, -6, -3, 12, 5, hairColor);
      this.p(ctx, -6, 1, 12, 3, headbandColor);
      // Gun aiming diagonally or straight
      if (player.aimDirection.y < -0.3) {
        this.p(ctx, 4, -8, 6, 14, gunColor);
      } else {
        this.p(ctx, 4, 2, 14, 4, gunColor);
      }
      // Water ripples
      this.p(ctx, -16, 12, 32, 4, '#38bdf8');
      this.p(ctx, -12, 14, 24, 2, '#bae6fd');

      ctx.restore();
      return;
    }

    // 4. STANDING & RUNNING ANIMATION
    const runOffset = player.state === 'run' ? Math.sin(player.runFrame * 1.2) * 4 : 0;
    const legFrame = Math.floor(player.runFrame) % 4;

    // Legs
    if (player.state === 'run') {
      if (legFrame === 0) {
        this.p(ctx, -8, 8, 6, 16, pantsColor);
        this.p(ctx, 2, 10, 6, 14, pantsShade);
      } else if (legFrame === 1) {
        this.p(ctx, -10, 6, 8, 14, pantsShade);
        this.p(ctx, 4, 12, 6, 12, pantsColor);
      } else if (legFrame === 2) {
        this.p(ctx, -4, 10, 6, 14, pantsColor);
        this.p(ctx, 6, 8, 6, 16, pantsShade);
      } else {
        this.p(ctx, -6, 12, 6, 12, pantsShade);
        this.p(ctx, -2, 6, 8, 16, pantsColor);
      }
    } else {
      // Standing legs
      this.p(ctx, -6, 8, 5, 16, pantsColor);
      this.p(ctx, 1, 8, 5, 16, pantsShade);
    }

    // Boots
    this.p(ctx, -8, 20, 6, 4, '#1e293b');
    this.p(ctx, 2, 20, 6, 4, '#1e293b');

    // Belt
    this.p(ctx, -7, 6, 14, 3, beltColor);

    // Muscular Bare Chest & Torso
    this.p(ctx, -7, -8 + runOffset * 0.5, 14, 14, skinColor);
    this.p(ctx, -5, -4 + runOffset * 0.5, 10, 8, skinShadow);

    // Head & Face
    this.p(ctx, -6, -20 + runOffset * 0.5, 12, 12, skinColor);
    this.p(ctx, -6, -22 + runOffset * 0.5, 12, 5, hairColor);
    this.p(ctx, -6, -18 + runOffset * 0.5, 12, 3, headbandColor);
    // Trailing headband ribbon blowing in wind
    this.p(ctx, -12, -18 + runOffset * 0.5, 6, 2, headbandColor);
    this.p(ctx, -16, -16 + runOffset * 0.5, 5, 2, headbandColor);

    // Eye
    this.p(ctx, 2, -15 + runOffset * 0.5, 2, 2, '#0f172a');

    // ARMS & RIFLE (Oriented toward aim direction)
    const aimUp = player.aimDirection.y < -0.4;
    const aimDown = player.aimDirection.y > 0.4;
    const aimDiag = aimUp && Math.abs(player.aimDirection.x) > 0.3;

    if (aimUp && !aimDiag) {
      // Straight Up
      this.p(ctx, -2, -26, 4, 18, gunColor);
      this.p(ctx, -3, -32, 6, 8, gunHighlight);
      this.p(ctx, -2, -8, 6, 8, skinColor);
    } else if (aimDiag) {
      // Diagonal Up
      ctx.save();
      ctx.translate(4, -6 + runOffset * 0.5);
      ctx.rotate(-Math.PI / 4);
      this.p(ctx, 0, -3, 24, 5, gunColor);
      this.p(ctx, 16, -4, 8, 3, gunHighlight);
      ctx.restore();
    } else if (aimDown && !player.isGrounded) {
      // Diagonal Down (only in air)
      ctx.save();
      ctx.translate(4, 2 + runOffset * 0.5);
      ctx.rotate(Math.PI / 4);
      this.p(ctx, 0, -3, 22, 5, gunColor);
      ctx.restore();
    } else {
      // Horizontal Straight Ahead
      this.p(ctx, 4, -5 + runOffset * 0.5, 22, 5, gunColor);
      this.p(ctx, 18, -6 + runOffset * 0.5, 8, 2, gunHighlight);
      this.p(ctx, 2, -3 + runOffset * 0.5, 8, 6, skinColor); // hands
    }

    ctx.restore();

    // Barrier effect if active
    if (player.weapon === 'BARRIER') {
      this.drawBarrierShield(ctx, player.x + player.width / 2, player.y + player.height / 2);
    }

    // Overhead Player Name Tag
    ctx.fillStyle = isBill ? '#60a5fa' : '#f87171';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x + player.width / 2, player.y - 12);
  }

  // BARRIER SHIELD (Orbiting energy spheres)
  private static drawBarrierShield(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const time = Date.now() / 150;
    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'];

    for (let i = 0; i < 4; i++) {
      const angle = time + (i * Math.PI) / 2;
      const ox = cx + Math.cos(angle) * 24;
      const oy = cy + Math.sin(angle) * 24;

      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(ox, oy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ox - 1, oy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // DRAW ENEMIES
  public static drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    ctx.save();
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;

    switch (enemy.type) {
      case 'SOLDIER': {
        // Red Falcon Running Foot Soldier
        ctx.translate(cx, cy);
        if (enemy.facingLeft) ctx.scale(-1, 1);

        const frame = Math.floor(enemy.stateTimer / 6) % 4;

        // Uniform (Red Falcon Charcoal / Crimson)
        this.p(ctx, -7, -14, 14, 12, '#334155'); // Helmet / head
        this.p(ctx, 3, -11, 4, 3, '#ef4444'); // Red visor/goggle
        this.p(ctx, -8, -2, 16, 14, '#475569'); // Torso
        this.p(ctx, -6, 2, 12, 3, '#dc2626'); // Red chest webbing

        // Running legs
        if (frame === 0) {
          this.p(ctx, -7, 12, 6, 12, '#1e293b');
          this.p(ctx, 2, 12, 6, 12, '#0f172a');
        } else if (frame === 1) {
          this.p(ctx, -10, 10, 6, 14, '#1e293b');
          this.p(ctx, 4, 14, 6, 10, '#0f172a');
        } else if (frame === 2) {
          this.p(ctx, -4, 14, 6, 10, '#1e293b');
          this.p(ctx, 4, 10, 6, 14, '#0f172a');
        } else {
          this.p(ctx, -2, 12, 6, 12, '#1e293b');
          this.p(ctx, -8, 12, 6, 12, '#0f172a');
        }

        // Gun
        this.p(ctx, 2, 0, 16, 4, '#94a3b8');
        break;
      }

      case 'SNIPER': {
        // Red Guard Sniper Kneeling
        ctx.translate(cx, cy);
        if (enemy.facingLeft) ctx.scale(-1, 1);

        this.p(ctx, -8, -12, 14, 10, '#dc2626'); // Red beret
        this.p(ctx, -6, -4, 12, 8, '#fed7aa'); // Face
        this.p(ctx, -8, 2, 16, 12, '#b91c1c'); // Red coat
        this.p(ctx, -10, 12, 20, 8, '#450a0a'); // Kneeling legs

        // Long Sniper Rifle with muzzle flash if shooting
        this.p(ctx, 0, 2, 26, 4, '#1e293b');
        this.p(ctx, 16, 0, 8, 2, '#38bdf8'); // Scope

        if (enemy.shootCooldown < 10) {
          // Muzzle flash!
          this.p(ctx, 26, -2, 8, 8, '#fde047');
          this.p(ctx, 28, 0, 4, 4, '#ffffff');
        }
        break;
      }

      case 'TURRET': {
        // Armored Dual-Barrel Pillbox Turret
        ctx.translate(cx, cy);

        // Armored circular base
        this.p(ctx, -16, -16, 32, 32, '#334155');
        this.p(ctx, -12, -12, 24, 24, '#475569');
        this.p(ctx, -8, -8, 16, 16, '#64748b');

        // Center rotating gun mount
        ctx.rotate(enemy.aimAngle);
        this.p(ctx, 0, -5, 20, 4, '#0f172a'); // Barrel 1
        this.p(ctx, 0, 2, 20, 4, '#0f172a'); // Barrel 2
        this.p(ctx, -6, -6, 12, 12, '#dc2626'); // Red sensor light
        break;
      }

      case 'SCUBA': {
        // Water Commando popping out of water
        ctx.translate(cx, cy);
        this.p(ctx, -8, -10, 16, 12, '#065f46'); // Camo mask
        this.p(ctx, 0, -14, 3, 6, '#0f172a'); // Snorkel
        this.p(ctx, 2, -15, 4, 3, '#ef4444'); // Snorkel tip
        this.p(ctx, -10, 2, 20, 10, '#047857'); // Wetsuit
        this.p(ctx, 0, 4, 18, 4, '#334155'); // Harpoon rifle
        // Water ripples around diver
        this.p(ctx, -14, 10, 28, 3, '#38bdf8');
        break;
      }

      case 'FLYING_POD': {
        // Winged Red Falcon Powerup Capsule
        ctx.translate(cx, cy);
        const flap = Math.sin(Date.now() / 100) * 6;

        // Pod Body
        this.p(ctx, -12, -6, 24, 12, '#e2e8f0');
        this.p(ctx, -8, -4, 16, 8, '#dc2626');
        this.p(ctx, -4, -2, 8, 4, '#ffffff');

        // Left Wing
        this.p(ctx, -18, -10 + flap, 8, 12, '#cbd5e1');
        // Right Wing
        this.p(ctx, 10, -10 + flap, 8, 12, '#cbd5e1');
        break;
      }
    }

    ctx.restore();
  }

  // DRAW POWERUP BADGES ([S], [M], [L], [F], [B])
  public static drawPowerup(ctx: CanvasRenderingContext2D, item: PowerupItem) {
    if (item.collected) return;

    ctx.save();
    ctx.translate(item.x + 12, item.y + 12);

    const bob = Math.sin(Date.now() / 150) * 3;
    ctx.translate(0, bob);

    let badgeColor = '#ef4444';
    let letter = 'S';

    switch (item.weapon) {
      case 'SPREAD':
        badgeColor = '#ef4444'; // Red
        letter = 'S';
        break;
      case 'MACHINE_GUN':
        badgeColor = '#f59e0b'; // Amber
        letter = 'M';
        break;
      case 'LASER':
        badgeColor = '#06b6d4'; // Cyan
        letter = 'L';
        break;
      case 'FIRE':
        badgeColor = '#ea580c'; // Orange
        letter = 'F';
        break;
      case 'BARRIER':
        badgeColor = '#a855f7'; // Purple
        letter = 'B';
        break;
      default:
        badgeColor = '#10b981';
        letter = 'R';
    }

    // Outer Falcon Wings Emblem
    this.p(ctx, -14, -8, 28, 16, '#e2e8f0');
    this.p(ctx, -12, -6, 24, 12, badgeColor);

    // Letter badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 0, 1);

    ctx.restore();
  }

  // DRAW BULLETS
  public static drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
    ctx.save();

    switch (b.weapon) {
      case 'SPREAD': {
        // Red-orange glowing spread ball
        const grad = ctx.createRadialGradient(b.x + b.width / 2, b.y + b.height / 2, 1, b.x + b.width / 2, b.y + b.height / 2, b.width);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#fb923c');
        grad.addColorStop(1, '#dc2626');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'LASER': {
        // Cyan-white piercing laser beam
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        break;
      }

      case 'FIRE': {
        // Swirling rotating fireball
        const angle = Date.now() / 60;
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(angle);

        ctx.fillStyle = '#f97316';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -1, 2, 2);
        break;
      }

      case 'MACHINE_GUN': {
        // Elongated tracer pellet
        ctx.fillStyle = '#fde047';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x + 1, b.y + 1, b.width - 2, b.height - 2);
        break;
      }

      default: {
        // Normal bullet or enemy bullet
        ctx.fillStyle = b.isPlayer ? '#fef08a' : '#ef4444';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x + 1, b.y + 1, Math.max(1, b.width - 2), Math.max(1, b.height - 2));
      }
    }

    ctx.restore();
  }

  // DRAW STAGE 1 BOSS: IRON DEFENSE WALL & ALIEN CORE
  public static drawBoss(ctx: CanvasRenderingContext2D, boss: BossState) {
    if (!boss.active) return;

    ctx.save();
    const bx = boss.x;
    const by = boss.y;

    // 1. Heavy Reinforced Steel Fortress Wall
    this.p(ctx, bx, by, boss.width, boss.height, '#1e293b'); // Base dark iron
    this.p(ctx, bx + 8, by + 8, boss.width - 16, boss.height - 16, '#334155');

    // Rivets & Metal Plates
    for (let py = by + 20; py < by + boss.height; py += 32) {
      this.p(ctx, bx, py, boss.width, 3, '#0f172a');
      this.p(ctx, bx + 16, py + 8, 4, 4, '#64748b');
      this.p(ctx, bx + boss.width - 20, py + 8, 4, 4, '#64748b');
    }

    // Hazard Stripes (Contra Yellow/Black warning stripes)
    for (let hx = bx + 10; hx < bx + boss.width - 10; hx += 20) {
      this.p(ctx, hx, by + 12, 10, 6, '#eab308');
      this.p(ctx, hx + 10, by + 12, 10, 6, '#0f172a');
    }

    // 2. Boss Sub-Parts (Upper sniper, Left cannon, Right cannon)
    boss.parts.forEach((part) => {
      if (part.destroyed) {
        // Smoldering rubble
        this.p(ctx, part.x, part.y, part.width, part.height, '#0f172a');
        this.p(ctx, part.x + 4, part.y + 4, part.width - 8, part.height - 8, '#450a0a');
        return;
      }

      ctx.save();
      const px = part.x + part.width / 2;
      const py = part.y + part.height / 2;
      ctx.translate(px, py);

      if (part.name.includes('Turret')) {
        // Rotating Heavy Cannon
        this.p(ctx, -14, -14, 28, 28, '#475569');
        this.p(ctx, -10, -10, 20, 20, '#64748b');
        ctx.rotate(part.aimAngle);
        this.p(ctx, 0, -4, 26, 8, '#0f172a'); // Long barrel
        this.p(ctx, 2, -2, 22, 4, '#dc2626');
      } else {
        // Sniper Bunker Nest
        this.p(ctx, -18, -12, 36, 24, '#1e293b');
        this.p(ctx, -14, -8, 28, 16, '#991b1b');
        this.p(ctx, -6, -4, 12, 8, '#fde047'); // Spotlight/Gunner
      }
      ctx.restore();
    });

    // 3. Central Alien Bio-Mechanical Core
    const coreX = bx + boss.width / 2 - 28;
    const coreY = by + boss.height / 2 - 20;

    if (!boss.defeated) {
      if (boss.coreShieldOpen) {
        // OPEN DOORS -> EXPOSED VULNERABLE PULSATING HEART
        this.p(ctx, coreX - 10, coreY - 10, 76, 76, '#450a0a'); // Core chamber

        // Pulsating glowing red/magenta heart
        const pulse = Math.sin(Date.now() / 120) * 4;
        const heartGrad = ctx.createRadialGradient(coreX + 28, coreY + 28, 4, coreX + 28, coreY + 28, 24 + pulse);
        heartGrad.addColorStop(0, '#ffffff');
        heartGrad.addColorStop(0.3, '#f43f5e');
        heartGrad.addColorStop(0.7, '#be123c');
        heartGrad.addColorStop(1, '#4c0519');

        ctx.fillStyle = heartGrad;
        ctx.beginPath();
        ctx.arc(coreX + 28, coreY + 28, 20 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Shutter Doors slid open
        this.p(ctx, coreX - 16, coreY - 6, 12, 68, '#475569');
        this.p(ctx, coreX + 60, coreY - 6, 12, 68, '#475569');
      } else {
        // CLOSED STEEL SHUTTERS (Shielded)
        this.p(ctx, coreX - 6, coreY - 6, 68, 68, '#334155');
        this.p(ctx, coreX, coreY, 56, 56, '#475569');
        // Red glowing barrier warning sign
        this.p(ctx, coreX + 16, coreY + 24, 24, 8, '#dc2626');
        this.p(ctx, coreX + 24, coreY + 16, 8, 24, '#dc2626');
      }
    } else {
      // DEFEATED EXPLODING CORE
      this.p(ctx, coreX - 10, coreY - 10, 76, 76, '#0f172a');
    }

    ctx.restore();
  }

  // DRAW PARTICLES & EXPLOSIONS
  public static drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.floor(p.size), Math.floor(p.size));
    ctx.restore();
  }
}
