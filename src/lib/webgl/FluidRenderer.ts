export class WebGLFluidRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animationRef: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  private targetRgb: [number, number, number][] = [];
  private currentRgb: [number, number, number][] = [];

  private startTime: number = 0;
  private lastTime: number = 0;

  private timeLoc: WebGLUniformLocation | null = null;
  private resLoc: WebGLUniformLocation | null = null;
  private colorLocs: (WebGLUniformLocation | null)[] = [];
  private positionBuffer: WebGLBuffer | null = null;
  private vertShader: WebGLShader | null = null;
  private fragShader: WebGLShader | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.init();
  }

  private init() {
    this.gl = this.canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!this.gl) {
      console.warn('WebGL not supported');
      return;
    }

    const vertShader = this.compileShader(this.gl.VERTEX_SHADER, this.vertexShaderSource);
    const fragShader = this.compileShader(this.gl.FRAGMENT_SHADER, this.fragmentShaderSource);

    if (!vertShader || !fragShader) return;
    this.vertShader = vertShader;
    this.fragShader = fragShader;

    this.program = this.gl.createProgram();
    if (!this.program) return;

    this.gl.attachShader(this.program, vertShader);
    this.gl.attachShader(this.program, fragShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
      return;
    }
    this.gl.useProgram(this.program);

    // Setup Geometry
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Uniform locations
    this.timeLoc = this.gl.getUniformLocation(this.program, 'u_time');
    this.resLoc = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.colorLocs = [
      this.gl.getUniformLocation(this.program, 'u_color0'),
      this.gl.getUniformLocation(this.program, 'u_color1'),
      this.gl.getUniformLocation(this.program, 'u_color2'),
      this.gl.getUniformLocation(this.program, 'u_color3'),
    ];

    // Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.resize();

    this.startTime = Date.now();
    this.lastTime = this.startTime;

    this.render();
  }

  public updateColors(hexColors: string[]) {
    this.targetRgb = hexColors.map(this.hexToRgb);
    if (this.currentRgb.length === 0) {
      this.currentRgb = [...this.targetRgb.map((c) => [...c] as [number, number, number])];
    }
  }

  private resize() {
    if (!this.gl) return;
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    if (displayWidth === 0 || displayHeight === 0) return;

    const targetWidth = Math.max(1, Math.floor(displayWidth * 0.25));
    const targetHeight = Math.max(1, Math.floor(displayHeight * 0.25));

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }
  }

  private render = () => {
    if (!this.gl || !this.program) return;
    const gl = this.gl;

    const now = Date.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const time = (now - this.startTime) / 1000;

    if (this.currentRgb.length === 4 && this.targetRgb.length === 4) {
      // Smoothly interpolate colors
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          this.currentRgb[i][j] += (this.targetRgb[i][j] - this.currentRgb[i][j]) * (dt * 2.0);
        }
      }

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(this.resLoc, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(this.timeLoc, time);

      for (let i = 0; i < 4; i++) {
        gl.uniform3f(
          this.colorLocs[i],
          this.currentRgb[i][0],
          this.currentRgb[i][1],
          this.currentRgb[i][2]
        );
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    this.animationRef = requestAnimationFrame(this.render);
  };

  public destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    cancelAnimationFrame(this.animationRef);

    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
      if (this.vertShader) this.gl.deleteShader(this.vertShader);
      if (this.fragShader) this.gl.deleteShader(this.fragShader);
      if (this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer);
    }
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [0, 0, 0];
  }

  private vertexShaderSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  private fragmentShaderSource = `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_color0;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      float aspect = u_resolution.x / u_resolution.y;
      st.x *= aspect;

      vec2 warp = vec2(
          sin(st.y * 3.0 + u_time * 0.5) * 0.15,
          cos(st.x * 3.0 + u_time * 0.4) * 0.15
      );
      vec2 warpedSt = st + warp;

      vec2 p0 = vec2(0.2 + sin(u_time * 0.3) * 0.4, 0.2 + cos(u_time * 0.4) * 0.4);
      vec2 p1 = vec2(0.8 + cos(u_time * 0.5) * 0.4, 0.2 + sin(u_time * 0.3) * 0.4);
      vec2 p2 = vec2(0.2 + sin(u_time * 0.4) * 0.4, 0.8 + cos(u_time * 0.6) * 0.4);
      vec2 p3 = vec2(0.8 + cos(u_time * 0.6) * 0.4, 0.8 + sin(u_time * 0.5) * 0.4);

      p0.x *= aspect;
      p1.x *= aspect;
      p2.x *= aspect;
      p3.x *= aspect;

      float d0 = length(warpedSt - p0);
      float d1 = length(warpedSt - p1);
      float d2 = length(warpedSt - p2);
      float d3 = length(warpedSt - p3);

      float w0 = 1.0 / pow(d0 + 0.15, 3.5);
      float w1 = 1.0 / pow(d1 + 0.15, 3.5);
      float w2 = 1.0 / pow(d2 + 0.15, 3.5);
      float w3 = 1.0 / pow(d3 + 0.15, 3.5);

      float sum = w0 + w1 + w2 + w3;
      w0 /= sum;
      w1 /= sum;
      w2 /= sum;
      w3 /= sum;

      vec3 color = u_color0 * w0 + u_color1 * w1 + u_color2 * w2 + u_color3 * w3;

      float luminance = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(luminance), color, 1.6);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
}
