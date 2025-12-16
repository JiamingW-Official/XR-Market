import Experience from './Experience.js';
import Handler from './abstract/Handler.js';
import * as THREE from 'three';
import GPGPU from './gpgpu/GPGPU.js'


export default class ModelHandler extends Handler {

  static instance;

  static getInstance() {
    if (!ModelHandler.instance) {
      ModelHandler.instance = new ModelHandler();
    }

    return ModelHandler.instance;
  }

  constructor() {
    super();


    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;
    this.renderer = this.experience.renderer;
    this.camera = this.experience.camera;
    this.mouse = this.experience.mouse;
    this.sizes = this.experience.sizes;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug;

    // Current model name
    this.currentModel = 'apollo'; // Default to apollo

    // Model-specific parameters
    this.modelParams = {
      apollo: {
        color: new THREE.Color('#F777A8'),
        size: 1.7,
        minAlpha: 0.04,
        maxAlpha: 0.8,
        force: 0.7,
      },
      athena: {
        color: new THREE.Color('#A8F777'),
        size: 1.7,
        minAlpha: 0.04,
        maxAlpha: 0.8,
        force: 0.7,
      },
      hermes: {
        color: new THREE.Color('#77A8F7'),
        size: 1.7,
        minAlpha: 0.04,
        maxAlpha: 0.8,
        force: 0.7,
      }
    };

    this.params = this.modelParams[this.currentModel];
    this.gpgpu = null;
    this.model = null;

    this.init();
  }


  init() {
    this.setupModel();
    this.setupGPGPU();
    this.setupDebug();
    this.setupAudio();
    this.setupModelSwitcher();
  }


  setupModel() {
    const modelData = this.resources.models[this.currentModel];
    if (modelData && modelData.scene && modelData.scene.children.length > 0) {
      // Get the first child mesh
      this.model = modelData.scene.children[0];
    } else {
      console.warn(`Model ${this.currentModel} not ready yet`);
    }
  }


  switchModel(modelName) {
    if (!this.resources.models[modelName]) {
      console.error(`Model ${modelName} not found`);
      return;
    }

    // Dispose current GPGPU if exists
    if (this.gpgpu) {
      if (this.gpgpu.mesh) {
        this.scene.remove(this.gpgpu.mesh);
        if (this.gpgpu.mesh.geometry) {
          this.gpgpu.mesh.geometry.dispose();
        }
        if (this.gpgpu.material) {
          this.gpgpu.material.dispose();
        }
      }
      // Dispose GPGPU compute resources
      if (this.gpgpu.gpgpuCompute) {
        this.gpgpu.gpgpuCompute.dispose();
      }
    }

    // Update current model
    this.currentModel = modelName;
    // Create a copy with new Color instance to avoid reference issues
    const originalParams = this.modelParams[modelName];
    this.params = {
      color: new THREE.Color(originalParams.color),
      size: originalParams.size,
      minAlpha: originalParams.minAlpha,
      maxAlpha: originalParams.maxAlpha,
      force: originalParams.force
    };

    // Setup new model
    this.setupModel();
    if (this.model) {
      this.setupGPGPU();
      this.setupDebug();
    }
  }


  setupCameraPosition() {
    this.camera.orbitControls._rotateLeft(Math.PI);
  }


  setupGPGPU() {
    if (!this.model) return;

    this.gpgpu = new GPGPU({
      size: 1200,
      camera: this.camera.target,
      renderer: this.renderer.webglRenderer,
      mouse: this.mouse,
      scene: this.scene,
      sizes: this.sizes,
      model: this.model,
      debug: this.debug,
      params: this.params
    })
  }


  setupDebug() {
    if (this.debug.active && this.gpgpu) {
      // Remove old folder if exists
      const existingFolder = this.debug.gui.children.find(child => child._title === 'particles');
      if (existingFolder) {
        this.debug.gui.removeFolder(existingFolder);
      }

      const particlesFolder = this.debug.gui.addFolder('particles');
      particlesFolder.addColor(this.gpgpu.material.uniforms.uColor, 'value').name('Color');
      particlesFolder.add(this.gpgpu.material.uniforms.uParticleSize, 'value').name('Size').min(1).max(10).step(0.1);
      particlesFolder.add(this.gpgpu.uniforms.velocityUniforms.uForce, 'value').name('Force').min(0).max(0.8).step(0.01);
      particlesFolder.add(this.gpgpu.material.uniforms.uMinAlpha, 'value').name('Min Alpha').min(0).max(1).step(0.01);
      particlesFolder.add(this.gpgpu.material.uniforms.uMaxAlpha, 'value').name('Max Alpha').min(0).max(1).step(0.01);
    }
  }


  setupAudio() {
    // Create audio element
    this.audio = new Audio('/Neutral _ Uncertainty.wav.wav');
    this.audio.loop = true;
    this.audio.volume = 0.5;

    // Play audio on user interaction (required for autoplay policies)
    const playAudio = () => {
      this.audio.play().catch(err => console.log('Audio play failed:', err));
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
      document.removeEventListener('keydown', playAudio);
    };

    document.addEventListener('click', playAudio);
    document.addEventListener('touchstart', playAudio);
    document.addEventListener('keydown', playAudio);
  }


  setupModelSwitcher() {
    // Create model switcher UI
    const switcher = document.createElement('div');
    switcher.id = 'model-switcher';
    switcher.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      gap: 10px;
      flex-direction: column;
    `;

    const models = ['apollo', 'athena', 'hermes'];
    models.forEach(modelName => {
      const button = document.createElement('button');
      button.textContent = modelName.charAt(0).toUpperCase() + modelName.slice(1);
      button.style.cssText = `
        padding: 10px 20px;
        background: ${this.currentModel === modelName ? '#F777A8' : 'rgba(255, 255, 255, 0.1)'};
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        cursor: pointer;
        font-family: sans-serif;
        font-size: 14px;
        transition: all 0.3s;
      `;
      button.addEventListener('click', () => {
        this.switchModel(modelName);
        // Update button styles
        models.forEach((name, idx) => {
          const btn = switcher.children[idx];
          btn.style.background = name === modelName ? '#F777A8' : 'rgba(255, 255, 255, 0.1)';
        });
      });
      switcher.appendChild(button);
    });

    document.body.appendChild(switcher);
  }


  update() {
    if (this.gpgpu) this.gpgpu.compute();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Experience(document.querySelector('canvas.experience__canvas'), ModelHandler);
})

