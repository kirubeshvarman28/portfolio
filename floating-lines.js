/**
 * FloatingLines Vanilla JS Implementation
 * Adapted from react-bits.dev
 */

const vertexShader = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) return baseColor;
  if (lineGradientCount == 1) return lineGradient[0] * 0.5;
  
  float clampedT = clamp(t, 0.0, 0.9999);
  float scaled = clampedT * float(lineGradientCount - 1);
  int idx = int(floor(scaled));
  float f = fract(scaled);
  int idx2 = min(idx + 1, lineGradientCount - 1);

  vec3 c1 = lineGradient[idx];
  vec3 c2 = lineGradient[idx2];
  return mix(c1, c2, f) * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;
  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;

  if (parallax) baseUv += parallaxOffset;

  vec3 col = vec3(0.0);
  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  if (enableBottom) {
    for (int i = 0; i < 20; ++i) {
      if (i >= bottomLineCount) break;
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y), 1.5 + 0.2 * fi, baseUv, mouseUv, interactive) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < 20; ++i) {
      if (i >= middleLineCount) break;
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y), 2.0 + 0.15 * fi, baseUv, mouseUv, interactive);
    }
  }

  if (enableTop) {
    for (int i = 0; i < 20; ++i) {
      if (i >= topLineCount) break;
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y), 1.0 + 0.2 * fi, baseUv, mouseUv, interactive) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

function hexToVec3(hex) {
  let value = hex.trim();
  if (value.startsWith('#')) value = value.slice(1);
  let r = 255, g = 255, b = 255;
  if (value.length === 3) {
    r = parseInt(value[0] + value[0], 16);
    g = parseInt(value[1] + value[1], 16);
    b = parseInt(value[2] + value[2], 16);
  } else if (value.length === 6) {
    r = parseInt(value.slice(0, 2), 16);
    g = parseInt(value.slice(2, 4), 16);
    b = parseInt(value.slice(4, 6), 16);
  }
  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

class FloatingLines {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.options = Object.assign({
      linesGradient: ["#ca1c1c", "#090a0b", "#d80e0e"],
      enabledWaves: ['top', 'middle', 'bottom'],
      lineCount: [6, 6, 6],
      lineDistance: [5, 5, 5],
      animationSpeed: 1,
      interactive: true,
      bendRadius: 5.0,
      bendStrength: -0.5,
      mouseDamping: 0.05,
      parallax: true,
      parallaxStrength: 0.2,
      topWavePosition: { x: 10.0, y: 0.5, rotate: -0.4 },
      middleWavePosition: { x: 5.0, y: 0.0, rotate: 0.2 },
      bottomWavePosition: { x: 2.0, y: -0.7, rotate: 0.4 }
    }, options);

    this.targetMouse = new THREE.Vector2(-1000, -1000);
    this.currentMouse = new THREE.Vector2(-1000, -1000);
    this.targetInfluence = 0;
    this.currentInfluence = 0;
    this.targetParallax = new THREE.Vector2(0, 0);
    this.currentParallax = new THREE.Vector2(0, 0);

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    const topLineCount = this.options.enabledWaves.includes('top') ? this.options.lineCount[0] : 0;
    const middleLineCount = this.options.enabledWaves.includes('middle') ? this.options.lineCount[1] : 0;
    const bottomLineCount = this.options.enabledWaves.includes('bottom') ? this.options.lineCount[2] : 0;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(this.renderer.domElement.width, this.renderer.domElement.height, 1) },
      animationSpeed: { value: this.options.animationSpeed },
      enableTop: { value: this.options.enabledWaves.includes('top') },
      enableMiddle: { value: this.options.enabledWaves.includes('middle') },
      enableBottom: { value: this.options.enabledWaves.includes('bottom') },
      topLineCount: { value: topLineCount },
      middleLineCount: { value: middleLineCount },
      bottomLineCount: { value: bottomLineCount },
      topLineDistance: { value: this.options.lineDistance[0] * 0.01 },
      middleLineDistance: { value: this.options.lineDistance[1] * 0.01 },
      bottomLineDistance: { value: this.options.lineDistance[2] * 0.01 },
      topWavePosition: { value: new THREE.Vector3(this.options.topWavePosition.x, this.options.topWavePosition.y, this.options.topWavePosition.rotate) },
      middleWavePosition: { value: new THREE.Vector3(this.options.middleWavePosition.x, this.options.middleWavePosition.y, this.options.middleWavePosition.rotate) },
      bottomWavePosition: { value: new THREE.Vector3(this.options.bottomWavePosition.x, this.options.bottomWavePosition.y, this.options.bottomWavePosition.rotate) },
      iMouse: { value: new THREE.Vector2(-1000, -1000) },
      interactive: { value: this.options.interactive },
      bendRadius: { value: this.options.bendRadius },
      bendStrength: { value: this.options.bendStrength },
      bendInfluence: { value: 0 },
      parallax: { value: this.options.parallax },
      parallaxStrength: { value: this.options.parallaxStrength },
      parallaxOffset: { value: new THREE.Vector2(0, 0) },
      lineGradient: { value: Array.from({ length: 8 }, () => new THREE.Vector3(1, 1, 1)) },
      lineGradientCount: { value: 0 }
    };

    if (this.options.linesGradient && this.options.linesGradient.length > 0) {
      const stops = this.options.linesGradient.slice(0, 8);
      uniforms.lineGradientCount.value = stops.length;
      stops.forEach((hex, i) => {
        const color = hexToVec3(hex);
        uniforms.lineGradient.value[i].set(color.x, color.y, color.z);
      });
    }

    this.material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this.onResize());
    if (this.options.interactive) {
      window.addEventListener('pointermove', (e) => this.onPointerMove(e));
      window.addEventListener('pointerleave', () => this.onPointerLeave());
    }

    this.animate();
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
    this.material.uniforms.iResolution.value.set(this.renderer.domElement.width, this.renderer.domElement.height, 1);
  }

  onPointerMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dpr = this.renderer.getPixelRatio();

    this.targetMouse.set(x * dpr, (rect.height - y) * dpr);
    this.targetInfluence = 1.0;

    if (this.options.parallax) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const offsetX = (x - centerX) / rect.width;
      const offsetY = -(y - centerY) / rect.height;
      this.targetParallax.set(offsetX * this.options.parallaxStrength, offsetY * this.options.parallaxStrength);
    }
  }

  onPointerLeave() {
    this.targetInfluence = 0.0;
  }

  animate() {
    this.raf = requestAnimationFrame(() => this.animate());

    this.material.uniforms.iTime.value = this.clock.getElapsedTime();

    if (this.options.interactive) {
      this.currentMouse.lerp(this.targetMouse, this.options.mouseDamping);
      this.material.uniforms.iMouse.value.copy(this.currentMouse);
      this.currentInfluence += (this.targetInfluence - this.currentInfluence) * this.options.mouseDamping;
      this.material.uniforms.bendInfluence.value = this.currentInfluence;
    }

    if (this.options.parallax) {
      this.currentParallax.lerp(this.targetParallax, this.options.mouseDamping);
      this.material.uniforms.parallaxOffset.value.copy(this.currentParallax);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
