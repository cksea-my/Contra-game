import { Player, Bullet, Enemy, PowerupItem, Platform, Particle, BossState, PlayerInput, WeaponType, CharacterType } from '../types';
import { retroAudio } from './audio';

export class RetroGameEngine {
  public player1: Player;
  public player2: Player | null = null;
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  public powerups: PowerupItem[] = [];
  public platforms: Platform[] = [];
  public particles: Particle[] = [];
  public boss: BossState;

  public cameraX: number = 0;
  public stageWidth: number = 4200;
  public stageHeight: number = 600;
  public viewWidth: number = 800;
  public viewHeight: number = 450;

  public isBossEncounter: boolean = false;
  public stageCleared: boolean = false;
  public gameOver: boolean = false;
  public isCoopOnline: boolean = false;
  public isVersusMode: boolean = false;
  public local2PlayerMode: boolean = false;

  private spawnCooldown: number = 0;
  private flyingPodCooldown: number = 180;
  private konamiProgress: number = 0;
  private konamiCode: string[] = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  // Callbacks for network sync
  public onPlayerFire?: (b: Bullet) => void;
  public onEnemyHit?: (enemyId: string, damage: number, killed: boolean) => void;
  public onBossHit?: (damage: number) => void;
  public onPowerupTaken?: (powerupId: string, weapon: WeaponType) => void;

  constructor(localChar: CharacterType = 'bill', isLocal2P: boolean = false) {
    this.local2PlayerMode = isLocal2P;

    this.player1 = this.createPlayer('p1', 'BILL RIZER', localChar, 80, 260);

    if (isLocal2P) {
      this.player2 = this.createPlayer('p2', 'LANCE BEAN', 'lance', 120, 260);
    }

    this.boss = {
      active: false,
      x: 3600,
      y: 120,
      width: 280,
      height: 320,
      hp: 1200,
      maxHp: 1200,
      defeated: false,
      coreShieldOpen: false,
      coreTimer: 0,
      parts: [
        { id: 'bp_top_sniper', name: 'Upper Bunker', x: 3660, y: 150, width: 48, height: 32, hp: 150, maxHp: 150, destroyed: false, aimAngle: 0, cooldown: 60 },
        { id: 'bp_left_cannon', name: 'Left Turret', x: 3620, y: 280, width: 36, height: 36, hp: 200, maxHp: 200, destroyed: false, aimAngle: 0, cooldown: 80 },
        { id: 'bp_right_cannon', name: 'Right Turret', x: 3820, y: 280, width: 36, height: 36, hp: 200, maxHp: 200, destroyed: false, aimAngle: 0, cooldown: 90 },
      ],
      explosionTimer: 0,
    };

    this.initLevelPlatforms();
  }

  private createPlayer(id: string, name: string, character: CharacterType, x: number, y: number): Player {
    return {
      id,
      name,
      character,
      x,
      y,
      vx: 0,
      vy: 0,
      width: 24,
      height: 42,
      isGrounded: false,
      facingLeft: false,
      aimAngle: 0,
      aimDirection: { x: 1, y: 0 },
      state: 'idle',
      weapon: 'NORMAL',
      lives: 3,
      score: 0,
      invincibleTimer: 180,
      fireCooldown: 0,
      isDead: false,
      respawnTimer: 0,
      somersaultFrame: 0,
      runFrame: 0,
    };
  }

  // LEVEL DESIGN: JUNGLE & WATERFALL INVASION
  private initLevelPlatforms() {
    this.platforms = [
      // Ground sectors
      { x: 0, y: 380, width: 700, height: 100, type: 'solid' },
      // First water trench
      { x: 700, y: 410, width: 220, height: 70, type: 'water' },
      { x: 920, y: 380, width: 600, height: 100, type: 'solid' },
      // Waterfall chasm bridge
      { x: 1520, y: 420, width: 260, height: 60, type: 'water' },
      { x: 1780, y: 380, width: 700, height: 100, type: 'solid' },
      // Catwalk ravine
      { x: 2480, y: 420, width: 200, height: 60, type: 'water' },
      { x: 2680, y: 380, width: 680, height: 100, type: 'solid' },
      // Boss arena ground
      { x: 3360, y: 380, width: 840, height: 100, type: 'solid' },

      // Elevated wooden catwalks & steel scaffolding (one-way drop-through)
      { x: 180, y: 290, width: 140, height: 16, type: 'one-way' },
      { x: 360, y: 240, width: 160, height: 16, type: 'one-way' },
      { x: 540, y: 290, width: 120, height: 16, type: 'one-way' },

      // Catwalks over water sector 1
      { x: 710, y: 320, width: 200, height: 16, type: 'one-way' },

      // Middle jungle cliffs
      { x: 980, y: 290, width: 150, height: 16, type: 'one-way' },
      { x: 1160, y: 230, width: 140, height: 16, type: 'one-way' },
      { x: 1320, y: 180, width: 160, height: 16, type: 'one-way' },

      // High suspension bridge over waterfall
      { x: 1510, y: 280, width: 280, height: 16, type: 'one-way' },
      { x: 1580, y: 210, width: 140, height: 16, type: 'one-way' },

      // Military outpost ledges
      { x: 1900, y: 300, width: 160, height: 16, type: 'one-way' },
      { x: 2100, y: 240, width: 180, height: 16, type: 'one-way' },
      { x: 2320, y: 190, width: 150, height: 16, type: 'one-way' },

      // Approach to fortress
      { x: 2750, y: 300, width: 160, height: 16, type: 'one-way' },
      { x: 2940, y: 240, width: 180, height: 16, type: 'one-way' },
      { x: 3150, y: 290, width: 160, height: 16, type: 'one-way' },

      // Boss Arena Platforms
      { x: 3420, y: 310, width: 140, height: 16, type: 'one-way' },
      { x: 3420, y: 230, width: 140, height: 16, type: 'one-way' },
      { x: 3580, y: 180, width: 100, height: 16, type: 'one-way' },
    ];
  }

  // INPUT & CONTROLS UPDATE FOR PLAYER
  public handleInput(player: Player, input: PlayerInput, isSecondPlayer: boolean = false) {
    if (player.isDead) return;

    const moveSpeed = 3.2;

    // Prone check (Holding DOWN while on ground)
    const wantsProne = input.down && player.isGrounded && !input.left && !input.right;
    const isSwimming = this.checkInWater(player);

    if (isSwimming) {
      player.state = 'swim';
      player.height = 24;
    } else if (wantsProne) {
      player.state = 'prone';
      player.height = 18;
      player.vx = 0;
    } else if (!player.isGrounded) {
      player.state = 'jump';
      player.height = 36;
    } else if (input.left || input.right) {
      player.state = 'run';
      player.height = 42;
    } else {
      player.state = 'idle';
      player.height = 42;
    }

    // Horizontal Movement
    if (player.state !== 'prone') {
      if (input.left) {
        player.vx = -moveSpeed;
        player.facingLeft = true;
        player.runFrame += 0.2;
      } else if (input.right) {
        player.vx = moveSpeed;
        player.facingLeft = false;
        player.runFrame += 0.2;
      } else {
        player.vx = 0;
      }
    }

    // Aim Direction (8 Directions)
    let aimX = player.facingLeft ? -1 : 1;
    let aimY = 0;

    if (input.up) {
      aimY = -1;
      if (!input.left && !input.right) {
        aimX = 0; // Straight UP
      }
    } else if (input.down && !player.isGrounded) {
      // Diagonal down in midair
      aimY = 1;
    } else if (wantsProne) {
      aimX = player.facingLeft ? -1 : 1;
      aimY = 0;
    }

    player.aimDirection = { x: aimX, y: aimY };
    player.aimAngle = Math.atan2(aimY, aimX);

    // Jump & Platform drop-through (Down + Jump)
    if (input.jump && player.isGrounded) {
      if (input.down) {
        // Drop through one-way platform
        player.y += 6;
        player.isGrounded = false;
      } else {
        // Jump
        player.vy = -11.5;
        player.isGrounded = false;
        player.somersaultFrame = 0;
        retroAudio.jump();
      }
    }

    // Weapon Firing
    if (player.fireCooldown > 0) {
      player.fireCooldown--;
    }

    if (input.fire && player.fireCooldown <= 0) {
      this.firePlayerWeapon(player);
    }
  }

  // WEAPON FIRE LOGIC
  public firePlayerWeapon(player: Player) {
    const muzzleX = player.x + player.width / 2 + player.aimDirection.x * 18;
    const muzzleY = player.y + (player.state === 'prone' ? 10 : 12) + player.aimDirection.y * 18;

    const angle = player.aimAngle;
    const speed = 9;

    switch (player.weapon) {
      case 'MACHINE_GUN': {
        player.fireCooldown = 6;
        const b: Bullet = {
          id: `b_${Date.now()}_${Math.random()}`,
          ownerId: player.id,
          isPlayer: true,
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(angle) * (speed + 2),
          vy: Math.sin(angle) * (speed + 2),
          width: 8,
          height: 8,
          weapon: 'MACHINE_GUN',
          damage: 25,
          life: 80,
          color: '#fde047',
        };
        this.bullets.push(b);
        retroAudio.shootMachine();
        if (this.onPlayerFire) this.onPlayerFire(b);
        break;
      }

      case 'SPREAD': {
        player.fireCooldown = 18;
        const spreadAngles = [-0.35, -0.18, 0, 0.18, 0.35];
        spreadAngles.forEach((offset) => {
          const a = angle + offset;
          const b: Bullet = {
            id: `b_${Date.now()}_${Math.random()}`,
            ownerId: player.id,
            isPlayer: true,
            x: muzzleX,
            y: muzzleY,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            width: 10,
            height: 10,
            weapon: 'SPREAD',
            damage: 30,
            life: 90,
            color: '#fb923c',
          };
          this.bullets.push(b);
          if (this.onPlayerFire) this.onPlayerFire(b);
        });
        retroAudio.shootSpread();
        break;
      }

      case 'LASER': {
        player.fireCooldown = 20;
        const b: Bullet = {
          id: `b_${Date.now()}_${Math.random()}`,
          ownerId: player.id,
          isPlayer: true,
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(angle) * 14,
          vy: Math.sin(angle) * 14,
          width: 22,
          height: 6,
          weapon: 'LASER',
          damage: 60,
          life: 60,
          color: '#38bdf8',
          penetrates: true,
        };
        this.bullets.push(b);
        retroAudio.shootLaser();
        if (this.onPlayerFire) this.onPlayerFire(b);
        break;
      }

      case 'FIRE': {
        player.fireCooldown = 15;
        const b: Bullet = {
          id: `b_${Date.now()}_${Math.random()}`,
          ownerId: player.id,
          isPlayer: true,
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(angle) * 7,
          vy: Math.sin(angle) * 7,
          width: 14,
          height: 14,
          weapon: 'FIRE',
          damage: 40,
          life: 80,
          color: '#ea580c',
        };
        this.bullets.push(b);
        retroAudio.shootFire();
        if (this.onPlayerFire) this.onPlayerFire(b);
        break;
      }

      default: {
        // NORMAL RIFLE
        player.fireCooldown = 12;
        const b: Bullet = {
          id: `b_${Date.now()}_${Math.random()}`,
          ownerId: player.id,
          isPlayer: true,
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          width: 6,
          height: 6,
          weapon: 'NORMAL',
          damage: 20,
          life: 70,
          color: '#fef08a',
        };
        this.bullets.push(b);
        retroAudio.shootNormal();
        if (this.onPlayerFire) this.onPlayerFire(b);
      }
    }
  }

  // KONAMI CODE LISTENER (30 LIVES EASTER EGG!)
  public handleKeyForKonami(key: string): boolean {
    if (key.toLowerCase() === this.konamiCode[this.konamiProgress].toLowerCase()) {
      this.konamiProgress++;
      if (this.konamiProgress === this.konamiCode.length) {
        this.player1.lives = 30;
        if (this.player2) this.player2.lives = 30;
        this.player1.weapon = 'SPREAD';
        retroAudio.powerup();
        this.createExplosion(this.player1.x, this.player1.y, '#f59e0b', 30);
        this.konamiProgress = 0;
        return true;
      }
    } else {
      this.konamiProgress = 0;
    }
    return false;
  }

  // TICK GAME LOOP
  public update() {
    if (this.stageCleared || this.gameOver) {
      this.updateParticles();
      return;
    }

    // Update active players
    this.updatePlayerPhysics(this.player1);
    if (this.player2 && !this.player2.isRemote) {
      this.updatePlayerPhysics(this.player2);
    }

    // Check game over
    const p1Out = this.player1.isDead && this.player1.lives <= 0;
    const p2Out = !this.player2 || (this.player2.isDead && this.player2.lives <= 0);
    if (p1Out && p2Out) {
      this.gameOver = true;
      retroAudio.stopBgm();
      retroAudio.playerDeath();
    }

    // Update Camera
    this.updateCamera();

    // Check Boss Activation
    if (!this.boss.active && this.cameraX >= 3300) {
      this.boss.active = true;
      this.isBossEncounter = true;
      retroAudio.bossWarning();
      retroAudio.playBgm('boss');
    }

    // Update Boss
    if (this.boss.active) {
      this.updateBoss();
    }

    // Spawners & Enemies
    this.updateSpawners();
    this.updateEnemies();

    // Bullets & Powerups
    this.updateBullets();
    this.updatePowerups();
    this.updateParticles();
  }

  private updatePlayerPhysics(p: Player) {
    if (p.isDead) {
      p.respawnTimer--;
      if (p.respawnTimer <= 0 && p.lives > 0) {
        // Respawn
        p.isDead = false;
        p.x = Math.max(this.cameraX + 40, p.x);
        p.y = 100;
        p.vx = 0;
        p.vy = 0;
        p.invincibleTimer = 180;
        p.weapon = 'NORMAL';
      }
      return;
    }

    if (p.invincibleTimer > 0) p.invincibleTimer--;

    // Gravity
    p.vy += 0.65;
    if (p.vy > 12) p.vy = 12;

    p.x += p.vx;
    p.y += p.vy;

    // Somersault frame spin
    if (!p.isGrounded) {
      p.somersaultFrame += 0.25;
    }

    // Platform collisions
    p.isGrounded = false;
    for (const plat of this.platforms) {
      if (plat.type === 'water') continue;

      // Check collision
      const isWithinX = p.x + p.width > plat.x && p.x < plat.x + plat.width;
      if (isWithinX) {
        // Landing on top of platform
        if (p.vy >= 0 && p.y + p.height >= plat.y && p.y + p.height <= plat.y + 16) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
        }
      }
    }

    // Level Left/Right Clamp
    if (p.x < this.cameraX) p.x = this.cameraX;
    if (p.x > this.stageWidth - p.width) p.x = this.stageWidth - p.width;

    // Pit death
    if (p.y > this.stageHeight) {
      this.killPlayer(p);
    }
  }

  public killPlayer(p: Player) {
    if (p.invincibleTimer > 0 || p.isDead) return;

    p.isDead = true;
    p.lives--;
    p.respawnTimer = 90;
    this.createExplosion(p.x + p.width / 2, p.y + p.height / 2, '#ef4444', 24);
    retroAudio.playerDeath();
  }

  private checkInWater(p: Player): boolean {
    for (const plat of this.platforms) {
      if (plat.type === 'water') {
        if (p.x + p.width > plat.x && p.x < plat.x + plat.width && p.y + p.height >= plat.y) {
          return true;
        }
      }
    }
    return false;
  }

  private updateCamera() {
    let targetX = this.player1.x - this.viewWidth * 0.35;

    // In Co-op, keep camera between both living players
    if (this.player2 && !this.player2.isDead && !this.player1.isDead) {
      const avg = (this.player1.x + this.player2.x) / 2;
      targetX = avg - this.viewWidth * 0.4;
    }

    // Boss Lock: Camera locks on the boss arena!
    if (this.boss.active) {
      this.cameraX = 3360;
      return;
    }

    // Only scroll forward (classic Contra cannot scroll backward!)
    if (targetX > this.cameraX) {
      this.cameraX += (targetX - this.cameraX) * 0.1;
    }

    // Clamp camera
    if (this.cameraX < 0) this.cameraX = 0;
    if (this.cameraX > this.stageWidth - this.viewWidth) {
      this.cameraX = this.stageWidth - this.viewWidth;
    }
  }

  private updateSpawners() {
    if (this.boss.active) return;

    this.spawnCooldown--;
    if (this.spawnCooldown <= 0) {
      this.spawnCooldown = 90 + Math.floor(Math.random() * 60);

      // Spawn Foot Soldier from right edge
      const spawnX = this.cameraX + this.viewWidth + 20;
      this.enemies.push({
        id: `e_${Date.now()}_${Math.random()}`,
        type: 'SOLDIER',
        x: spawnX,
        y: 320,
        vx: -2.2,
        vy: 0,
        width: 22,
        height: 38,
        hp: 15,
        maxHp: 15,
        isGrounded: false,
        facingLeft: true,
        aimAngle: Math.PI,
        shootCooldown: 90,
        stateTimer: 0,
        points: 100,
      });

      // Sometimes spawn an elite sniper on an elevated platform ahead
      if (Math.random() < 0.4) {
        const sniperX = this.cameraX + this.viewWidth + 100;
        this.enemies.push({
          id: `e_snip_${Date.now()}`,
          type: 'SNIPER',
          x: sniperX,
          y: 200,
          vx: 0,
          vy: 0,
          width: 24,
          height: 34,
          hp: 30,
          maxHp: 30,
          isGrounded: false,
          facingLeft: true,
          aimAngle: Math.PI,
          shootCooldown: 110,
          stateTimer: 0,
          points: 250,
        });
      }
    }

    // Flying Powerup Pod
    this.flyingPodCooldown--;
    if (this.flyingPodCooldown <= 0) {
      this.flyingPodCooldown = 320 + Math.floor(Math.random() * 180);

      const weapons: WeaponType[] = ['SPREAD', 'MACHINE_GUN', 'LASER', 'FIRE', 'BARRIER'];
      const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];

      this.enemies.push({
        id: `pod_${Date.now()}`,
        type: 'FLYING_POD',
        x: this.cameraX + this.viewWidth + 30,
        y: 120 + Math.random() * 80,
        vx: -1.8,
        vy: 0,
        width: 32,
        height: 20,
        hp: 10,
        maxHp: 10,
        isGrounded: false,
        facingLeft: true,
        aimAngle: 0,
        shootCooldown: 9999,
        stateTimer: 0,
        points: 500,
        dropsPowerup: randomWeapon,
      });
    }
  }

  private updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.stateTimer++;

      // Enemy Physics
      if (e.type !== 'FLYING_POD' && e.type !== 'TURRET') {
        e.vy += 0.65;
        e.x += e.vx;
        e.y += e.vy;

        // Platform collisions
        e.isGrounded = false;
        for (const plat of this.platforms) {
          if (plat.type === 'water') continue;
          if (e.x + e.width > plat.x && e.x < plat.x + plat.width) {
            if (e.vy >= 0 && e.y + e.height >= plat.y && e.y + e.height <= plat.y + 16) {
              e.y = plat.y - e.height;
              e.vy = 0;
              e.isGrounded = true;
            }
          }
        }
      } else {
        // Flying pod undulating motion
        e.x += e.vx;
        e.y += Math.sin(e.stateTimer * 0.05) * 0.8;
      }

      // Snipers shoot at closest player
      if (e.type === 'SNIPER') {
        e.shootCooldown--;
        const target = this.getClosestPlayer(e.x, e.y);
        if (target && e.shootCooldown <= 0) {
          e.shootCooldown = 120;
          const angle = Math.atan2(target.y + target.height / 2 - (e.y + 12), target.x + target.width / 2 - e.x);
          e.facingLeft = target.x < e.x;
          this.bullets.push({
            id: `eb_${Date.now()}_${Math.random()}`,
            ownerId: e.id,
            isPlayer: false,
            x: e.x + (e.facingLeft ? -8 : e.width + 4),
            y: e.y + 12,
            vx: Math.cos(angle) * 4.5,
            vy: Math.sin(angle) * 4.5,
            width: 7,
            height: 7,
            weapon: 'NORMAL',
            damage: 20,
            life: 100,
            color: '#ef4444',
          });
        }
      }

      // Touch damage with players
      [this.player1, this.player2].forEach((p) => {
        if (!p || p.isDead || p.invincibleTimer > 0) return;
        if (this.checkOverlap(p, e)) {
          if (p.weapon === 'BARRIER') {
            // Barrier kills touching enemy!
            e.hp = 0;
            this.killEnemy(e, i, p);
          } else if (e.type !== 'FLYING_POD') {
            this.killPlayer(p);
          }
        }
      });

      // Cull offscreen enemies behind camera
      if (e.x < this.cameraX - 100 || e.y > this.stageHeight + 50) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Player bullet collisions against enemies
      if (b.isPlayer) {
        let bulletHit = false;

        // Hit regular enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (this.checkOverlap(b, e)) {
            e.hp -= b.damage;
            bulletHit = true;
            this.createExplosion(b.x, b.y, b.color, 6);

            const killed = e.hp <= 0;
            if (this.onEnemyHit) this.onEnemyHit(e.id, b.damage, killed);

            if (killed) {
              const killer = b.ownerId === this.player1.id ? this.player1 : this.player2;
              this.killEnemy(e, j, killer);
            }
            if (!b.penetrates) break;
          }
        }

        // Hit Boss Parts
        if (this.boss.active && !this.boss.defeated) {
          // Check Boss sub-parts
          for (const part of this.boss.parts) {
            if (!part.destroyed && this.checkOverlap(b, part)) {
              part.hp -= b.damage;
              bulletHit = true;
              this.createExplosion(b.x, b.y, '#f59e0b', 8);
              if (part.hp <= 0) {
                part.destroyed = true;
                this.createExplosion(part.x + part.width / 2, part.y + part.height / 2, '#ef4444', 30);
                retroAudio.explode(true);
                const killer = b.ownerId === this.player1.id ? this.player1 : this.player2;
                if (killer) killer.score += 1000;
              }
              break;
            }
          }

          // Check Central Exposed Alien Core
          if (this.boss.coreShieldOpen) {
            const coreBox = {
              x: this.boss.x + this.boss.width / 2 - 24,
              y: this.boss.y + this.boss.height / 2 - 16,
              width: 48,
              height: 48,
            };
            if (this.checkOverlap(b, coreBox)) {
              this.boss.hp -= b.damage;
              bulletHit = true;
              this.createExplosion(b.x, b.y, '#f43f5e', 10);
              retroAudio.shootMachine();

              if (this.onBossHit) this.onBossHit(b.damage);

              if (this.boss.hp <= 0) {
                this.boss.hp = 0;
                this.boss.defeated = true;
                this.triggerBossVictory();
              }
            }
          }
        }

        // Versus Mode: Player hitting player
        if (this.isVersusMode && this.player2 && !this.player2.isDead && b.ownerId === this.player1.id) {
          if (this.checkOverlap(b, this.player2)) {
            this.killPlayer(this.player2);
            this.player1.score += 500;
            bulletHit = true;
          }
        }

        if (bulletHit && !b.penetrates) {
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Enemy bullet hitting players
        [this.player1, this.player2].forEach((p) => {
          if (!p || p.isDead || p.invincibleTimer > 0) return;
          if (this.checkOverlap(b, p)) {
            if (p.weapon === 'BARRIER') {
              // Barrier reflects bullet!
              b.isPlayer = true;
              b.vx = -b.vx;
              b.vy = -b.vy;
              b.ownerId = p.id;
            } else {
              this.killPlayer(p);
              this.bullets.splice(i, 1);
            }
          }
        });
      }

      // Cull offscreen bullets
      if (b.x < this.cameraX - 40 || b.x > this.cameraX + this.viewWidth + 40 || b.y < -40 || b.y > this.stageHeight) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private killEnemy(e: Enemy, index: number, killer: Player | null) {
    this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, '#f97316', 16);
    retroAudio.explode(false);

    if (killer) {
      killer.score += e.points;
    }

    // Drop powerup badge if designated
    if (e.dropsPowerup) {
      this.powerups.push({
        id: `pow_${Date.now()}`,
        x: e.x,
        y: e.y,
        vx: 0,
        vy: -2,
        weapon: e.dropsPowerup,
        collected: false,
        life: 400,
      });
    }

    this.enemies.splice(index, 1);
  }

  private updatePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pow = this.powerups[i];
      pow.y += 0.8; // gently floats downward
      pow.life--;

      if (pow.life <= 0) {
        this.powerups.splice(i, 1);
        continue;
      }

      // Player collection
      [this.player1, this.player2].forEach((p) => {
        if (!p || p.isDead) return;
        const hitbox = { x: pow.x - 4, y: pow.y - 4, width: 28, height: 28 };
        if (this.checkOverlap(p, hitbox)) {
          p.weapon = pow.weapon;
          p.score += 1000;
          if (pow.weapon === 'BARRIER') {
            p.invincibleTimer = 360; // 6 seconds invincibility
          }
          retroAudio.powerup();
          this.createExplosion(pow.x + 12, pow.y + 12, '#38bdf8', 20);

          if (this.onPowerupTaken) this.onPowerupTaken(pow.id, pow.weapon);

          this.powerups.splice(i, 1);
        }
      });
    }
  }

  private updateBoss() {
    if (this.boss.defeated) {
      this.boss.explosionTimer++;
      // Cascade of explosions
      if (this.boss.explosionTimer % 6 === 0 && this.boss.explosionTimer < 180) {
        const ox = this.boss.x + Math.random() * this.boss.width;
        const oy = this.boss.y + Math.random() * this.boss.height;
        this.createExplosion(ox, oy, '#f59e0b', 24);
        retroAudio.explode(true);
      }
      return;
    }

    // Boss Core Shutter Cycle (Opens and closes every 4 seconds)
    this.boss.coreTimer++;
    if (this.boss.coreTimer >= 220) {
      this.boss.coreShieldOpen = !this.boss.coreShieldOpen;
      this.boss.coreTimer = 0;
    }

    // Boss cannons targeting players
    for (const part of this.boss.parts) {
      if (part.destroyed) continue;
      part.cooldown--;

      const target = this.getClosestPlayer(part.x, part.y);
      if (target) {
        const angle = Math.atan2(target.y + target.height / 2 - (part.y + part.height / 2), target.x + target.width / 2 - (part.x + part.width / 2));
        part.aimAngle = angle;

        if (part.cooldown <= 0) {
          part.cooldown = 100 + Math.floor(Math.random() * 40);
          // Fire plasma burst
          this.bullets.push({
            id: `bb_${Date.now()}_${Math.random()}`,
            ownerId: part.id,
            isPlayer: false,
            x: part.x + part.width / 2 + Math.cos(angle) * 20,
            y: part.y + part.height / 2 + Math.sin(angle) * 20,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            width: 10,
            height: 10,
            weapon: 'NORMAL',
            damage: 25,
            life: 140,
            color: '#dc2626',
          });
        }
      }
    }
  }

  private triggerBossVictory() {
    this.stageCleared = true;
    retroAudio.stopBgm();
    retroAudio.victoryFanfare();
    if (this.player1) this.player1.score += 5000;
    if (this.player2) this.player2.score += 5000;
  }

  private createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        gravity: 0.1,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private getClosestPlayer(x: number, y: number): Player | null {
    const candidates = [this.player1, this.player2].filter((p): p is Player => p !== null && !p.isDead);
    if (candidates.length === 0) return null;
    let closest = candidates[0];
    let minDist = Math.hypot(closest.x - x, closest.y - y);

    for (let i = 1; i < candidates.length; i++) {
      const d = Math.hypot(candidates[i].x - x, candidates[i].y - y);
      if (d < minDist) {
        minDist = d;
        closest = candidates[i];
      }
    }
    return closest;
  }

  private checkOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  public restartGame(localChar: CharacterType = 'bill') {
    this.player1 = this.createPlayer('p1', 'BILL RIZER', localChar, 80, 260);
    if (this.local2PlayerMode) {
      this.player2 = this.createPlayer('p2', 'LANCE BEAN', 'lance', 120, 260);
    } else {
      this.player2 = null;
    }
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.cameraX = 0;
    this.stageCleared = false;
    this.gameOver = false;
    this.isBossEncounter = false;
    this.boss.active = false;
    this.boss.hp = 1200;
    this.boss.defeated = false;
    this.boss.explosionTimer = 0;
    this.boss.parts.forEach((p) => {
      p.destroyed = false;
      p.hp = p.maxHp;
    });
    retroAudio.playBgm('stage');
  }
}
