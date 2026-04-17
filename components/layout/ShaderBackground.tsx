"use client";

import { useEffect, useRef, useCallback } from "react";

const VERTEX_SHADER = `#version 300 es
in vec4 aPosition;
void main() {
    gl_Position = aPosition;
}`;

// Optimized fragment shader with configurable iteration count
function getFragmentShader(iterations: number) {
  return `#version 300 es
precision mediump float;

uniform vec3 iResolution;
uniform float iTime;
out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec4 o = vec4(0.0);
    float t = 4.0 * iTime;
    vec3 p;

    for (float i = 0.0, z = 0.0, d; i < ${iterations.toFixed(1)}; i++) {
        p = z * normalize(vec3(uv, 0.95));
        p.z += t;

        float len = length(p.xy);
        float swirl = 0.1 * sin(len * 1.0 - t * 0.5);
        mat2 rot = mat2(cos(swirl), -sin(swirl),
                        sin(swirl),  cos(swirl));
        p.xy *= rot;

        vec4 angle = vec4(0.0, 33.0, 11.0, 0.0);
        vec4 a = z * 0.3 + t * 0.2 - angle;
        p.xy *= mat2(cos(a.x), -sin(a.x), sin(a.x), cos(a.x));
        z += d = length(cos(p + cos(p.yzx + p.z - t * 0.2)).xy) / 5.0;
        o += (sin(p.x + t + vec4(0.0, 2.0, 3.0, 0.0)) + 0.8) / d;
    }

    o = 3.0 * tanh(o / 6000.0);
    fragColor = vec4(o.rgb, 1.0);
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}`;
}

function detectPerformanceTier(): "high" | "mid" | "low" {
  if (typeof navigator === "undefined") return "mid";

  const cores = navigator.hardwareConcurrency || 2;
  // Check for mobile/touch device
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  const isTouch = "ontouchstart" in window;
  const memoryGB = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;

  if (isMobile || isTouch || cores <= 2 || memoryGB <= 2) return "low";
  if (cores <= 4 || memoryGB <= 4) return "mid";
  return "high";
}

function getTierConfig(tier: "high" | "mid" | "low") {
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const configs = {
    high: { iterations: 60, pixelRatio: dpr, resScale: 1.0 },
    mid:  { iterations: 40, pixelRatio: 1, resScale: 0.75 },
    low:  { iterations: 25, pixelRatio: 1, resScale: 0.5 },
  };
  return configs[tier];
}

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      // WebGL2 not available — degrade gracefully to CSS gradient (handled by globals.css fallback)
      canvas.style.display = "none";
      return;
    }

    const tier = detectPerformanceTier();
    const config = getTierConfig(tier);

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      canvas.style.display = "none";
      return;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, getFragmentShader(config.iterations));
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      canvas.style.display = "none";
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.style.display = "none";
      return;
    }

    const posLoc = gl.getAttribLocation(program, "aPosition");
    const resLoc = gl.getUniformLocation(program, "iResolution");
    const timeLoc = gl.getUniformLocation(program, "iTime");

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      const dpr = config.pixelRatio;
      const scale = config.resScale;
      canvas!.width = Math.floor(window.innerWidth * dpr * scale);
      canvas!.height = Math.floor(window.innerHeight * dpr * scale);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    resize();
    window.addEventListener("resize", resize);

    // Throttle rendering on low-end devices
    let lastFrame = 0;
    const frameInterval = tier === "low" ? 33 : tier === "mid" ? 20 : 0; // ~30fps, ~50fps, uncapped

    function render(time: number) {
      if (frameInterval && time - lastFrame < frameInterval) {
        animRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrame = time;

      gl!.uniform3f(resLoc, canvas!.width, canvas!.height, 1.0);
      gl!.uniform1f(timeLoc, time * 0.001);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return () => cleanup?.();
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      id="shader-bg"
      className="shader-canvas"
      aria-hidden="true"
    />
  );
}
