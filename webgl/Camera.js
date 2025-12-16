import Handler from './abstract/Handler.js';
import * as THREE from 'three';


export default class Camera extends Handler {

  static instance;

  constructor() {
    super(Camera.id);

    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;
    this.mouse = this.experience.mouse;
    this.debug = this.experience.debug;
    this.time = this.experience.time;

    // Movement settings
    this.moveSpeed = 2.0;
    this.lookSensitivity = 0.002;

    // State
    this.keys = {};
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.isPointerLocked = false;
    this.delta = 0.016; // Default delta

    // Listen to time updates for delta
    this.time.on('update', (time, delta) => {
      this.delta = delta;
    });

    // Setup
    this.setupCamera();
    this.setupControls();
  }


  static getInstance() {
    if (!Camera.instance) {
      Camera.instance = new Camera();
    }

    return Camera.instance;
  }


  setupCamera() {
    this.target = new THREE.PerspectiveCamera(50, this.sizes.aspect, 0.1, 1000);
    this.target.position.set(0, 0, 1.5);

    this.scene.add(this.target);

    this.resize();
  }


  setupControls() {
    // Keyboard controls
    this.keys = {};
    
    window.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
    });

    window.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });

    // Create instruction overlay
    this.instructionOverlay = document.createElement('div');
    this.instructionOverlay.id = 'controls-instruction';
    this.instructionOverlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2000;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 40px;
      border-radius: 10px;
      text-align: center;
      font-family: sans-serif;
      pointer-events: none;
      transition: opacity 0.3s;
    `;
    this.instructionOverlay.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 10px; font-weight: bold;">Click to Enable Controls</div>
      <div style="font-size: 14px; opacity: 0.8;">
        WASD to move | Mouse to look | ESC to exit
      </div>
    `;
    document.body.appendChild(this.instructionOverlay);

    // Pointer lock for mouse look
    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    // Pointer lock change events
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
      // Hide/show instruction overlay
      if (this.instructionOverlay) {
        this.instructionOverlay.style.opacity = this.isPointerLocked ? '0' : '1';
      }
    });

    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock failed');
    });

    // Mouse movement for looking around
    document.addEventListener('mousemove', (event) => {
      if (this.isPointerLocked) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.euler.setFromQuaternion(this.target.quaternion);
        this.euler.y -= movementX * this.lookSensitivity;
        this.euler.x -= movementY * this.lookSensitivity;

        // Limit vertical rotation to prevent flipping
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

        this.target.quaternion.setFromEuler(this.euler);
      }
    });

    // ESC to exit pointer lock
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && this.isPointerLocked) {
        document.exitPointerLock();
      }
    });
  }


  setupCinematicMovement() {

  }


  resize() {
    this.target.aspect = this.sizes.aspect;
    this.target.updateProjectionMatrix();
  }


  update() {
    if (!this.isPointerLocked) return;

    // Calculate movement direction based on camera orientation
    this.velocity.set(0, 0, 0);

    // Forward/Backward (W/S)
    if (this.keys['KeyW']) {
      this.velocity.z -= 1;
    }
    if (this.keys['KeyS']) {
      this.velocity.z += 1;
    }

    // Left/Right (A/D)
    if (this.keys['KeyA']) {
      this.velocity.x -= 1;
    }
    if (this.keys['KeyD']) {
      this.velocity.x += 1;
    }

    // Normalize velocity to prevent faster diagonal movement
    if (this.velocity.length() > 0) {
      this.velocity.normalize();
    }

    // Apply camera rotation to movement direction
    this.direction.set(0, 0, 0);
    this.direction.addScaledVector(this.target.getWorldDirection(new THREE.Vector3()), -this.velocity.z);
    
    // Get right vector for strafing
    const right = new THREE.Vector3();
    right.setFromMatrixColumn(this.target.matrixWorld, 0);
    this.direction.addScaledVector(right, this.velocity.x);

    // Move camera
    this.target.position.addScaledVector(this.direction, this.moveSpeed * this.delta);
  }
}