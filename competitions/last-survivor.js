/**
 * COMPETITION 3: LAST FLAG STANDING
 * Survival arena with dynamically collapsing hex tiles.
 * Avoid falling into the void and outlast all opponents!
 */

import * as THREE from '../libraries/three.module.js';
import { Competition } from '../js/competition-manager.js';
import { FlagCharacter } from '../js/flag-character.js';
import { AIController } from '../js/ai-controller.js';
import { BodyType, ShapeType } from '../js/physics-engine.js';

export class LastFlagStanding extends Competition {
  constructor(engine, countries, options = {}) {
    super(engine, countries, options);
    this.modeId = 'last-survivor';
    this.modeName = 'Last Flag Standing';
    this.modeDescription = 'Platform tiles shake and collapse over time! Stay on solid ground and survive.';
    this.tiles = [];
    this.arenaMeshes = [];
    this.tileDropTimer = 3.0;
    this.init();
  }

  init() {
    this.buildTileGrid();
    this.spawnCompetitors();
    this.startCountdown();
  }

  buildTileGrid() {
    // 5x5 Grid of hexagonal/square platform tiles
    const rows = 5;
    const cols = 5;
    const tileSize = 3.2;
    const spacing = 3.4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) * 0.5) * spacing;
        const z = (r - (rows - 1) * 0.5) * spacing;

        const tileGeom = new THREE.CylinderGeometry(tileSize * 0.5, tileSize * 0.5, 0.8, 6);
        const tileMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.5,
          metalness: 0.2
        });
        const tileMesh = new THREE.Mesh(tileGeom, tileMat);
        tileMesh.position.set(x, -0.4, z);
        tileMesh.receiveShadow = true;
        this.scene.add(tileMesh);
        this.arenaMeshes.push(tileMesh);

        const body = this.world.createRigidBody({
          type: BodyType.STATIC,
          position: tileMesh.position.clone()
        });

        const collider = this.world.createCollider({
          shapeType: ShapeType.BOX,
          halfExtents: new THREE.Vector3(tileSize * 0.45, 0.4, tileSize * 0.45),
          restitution: 0.3,
          friction: 0.6
        }, body);

        this.tiles.push({
          mesh: tileMesh,
          body,
          collider,
          isWarning: false,
          warningTimer: 0,
          isFalling: false,
          hasFallen: false,
          originalY: tileMesh.position.y
        });
      }
    }
  }

  spawnCompetitors() {
    const count = this.countries.length;
    this.countries.forEach((country, idx) => {
      const tile = this.tiles[idx % this.tiles.length];
      const char = new FlagCharacter(country, this.world, {
        position: new THREE.Vector3(
          tile.mesh.position.x + (Math.random() - 0.5) * 1.0,
          1.5,
          tile.mesh.position.z + (Math.random() - 0.5) * 1.0
        )
      });

      this.scene.add(char.group);
      this.characters.push(char);

      const ai = new AIController(char, this);
      this.aiControllers.push(ai);
    });
  }

  onMatchUpdate(dt) {
    // 1. Tile Drop Logic
    this.tileDropTimer -= dt;
    if (this.tileDropTimer <= 0) {
      // Pick 1-2 random safe tiles to start collapsing
      const available = this.tiles.filter(t => !t.isWarning && !t.isFalling && !t.hasFallen);
      if (available.length > 3) {
        const dropCount = Math.min(2, Math.floor(available.length * 0.25) || 1);
        for (let i = 0; i < dropCount; i++) {
          const chosen = available[Math.floor(Math.random() * available.length)];
          chosen.isWarning = true;
          chosen.warningTimer = 2.0; // 2s warning
          chosen.mesh.material.color.setHex(0xEF4444); // Flash red
        }
      }
      this.tileDropTimer = Math.max(1.8, 4.0 - this.matchTimer * 0.04);
    }

    // 2. Animate Tiles
    this.tiles.forEach(tile => {
      if (tile.isWarning) {
        tile.warningTimer -= dt;
        // Shake tile
        tile.mesh.position.x += (Math.random() - 0.5) * 0.08;
        tile.mesh.position.z += (Math.random() - 0.5) * 0.08;

        if (tile.warningTimer <= 0) {
          tile.isWarning = false;
          tile.isFalling = true;
          this.world.removeCollider(tile.collider); // Remove physics collision
        }
      } else if (tile.isFalling) {
        tile.mesh.position.y -= 15 * dt;
        if (tile.mesh.position.y < -30) {
          tile.isFalling = false;
          tile.hasFallen = true;
          tile.mesh.visible = false;
        }
      }
    });

    // 3. Fall checks
    const alive = this.characters.filter(c => c.isAlive);
    for (const char of alive) {
      if (char.body.position.y < -2.0) {
        this.handleElimination(char, 'Fell into the Void!');
      }
    }

    // 4. Win condition
    const remaining = this.characters.filter(c => c.isAlive);
    if (remaining.length === 1 && this.characters.length > 1) {
      const winner = remaining[0].country;
      const podium = [
        winner,
        this.eliminatedCharacters[this.eliminatedCharacters.length - 1]?.country || winner,
        this.eliminatedCharacters[this.eliminatedCharacters.length - 2]?.country || winner
      ];
      this.finishMatch(winner, podium);
    } else if (remaining.length === 0) {
      const last = this.eliminatedCharacters[this.eliminatedCharacters.length - 1];
      const winner = last ? last.country : this.countries[0];
      this.finishMatch(winner, [winner]);
    }
  }

  destroy() {
    super.destroy();
    this.arenaMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.arenaMeshes = [];
    this.tiles = [];
  }
}
