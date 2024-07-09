import { useEffect, useRef, useState } from 'react'
import { mat4, vec3 } from 'gl-matrix';
import './App.css'

function App() {
  const [artIndex, setArtIndex] = useState(0);

  function handleLeftClick() {
    setArtIndex((prevIndex) => {
      const newIndex = prevIndex - 1;
      return newIndex < 0 ? 2 : newIndex;
    });
  }
  function handleRightClick() {
    setArtIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      return newIndex > 2 ? 0 : newIndex;
    });
  }

  return (
    <>
      <div className='art-viewer'>
        {(() => {
          switch (artIndex) {
            case 0:
              return <Cube/>;
            case 1:
              return <Icosahedron/>;
            case 2:
              return <SierpinskiPyramid/>;
          }
        })()}
        <div className='art-viewer-controls'>
          <ArtViewerLeft onClick={handleLeftClick}/>
          <ArtViewerRight onClick={handleRightClick}/>
          <p>{artIndex}</p>
        </div>
      </div>
    </>
  )
}
interface ArtViewerProps { //Apparently needed by TS
  onClick: () => void;
}
const ArtViewerLeft: React.FC<ArtViewerProps> = ({onClick}) => {
  return (
    <button onClick={onClick}>Left</button>
  )
}
const ArtViewerRight: React.FC<ArtViewerProps> = ({onClick}) => {
  return (
    <button onClick={onClick}>Right</button>
  )
}

const vertexShaderSource = `#version 300 es
  in vec4 aVertexPosition;
  in vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  out vec4 vColor;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
`;

const fragmentShaderSource = `#version 300 es
  precision mediump float;
  in vec4 vColor;
  out vec4 outColor;

  void main() {
    outColor = vColor;
  }
`;

function createShaderProgram(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram | null {
  // Compile vertex shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) {
    console.error('Failed to create vertex shader');
    return null;
  }
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
    return null;
  }

  // Compile fragment shader
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) {
    console.error('Failed to create fragment shader');
    return null;
  }
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Create and link program
  const program = gl.createProgram();
  if (!program) {
    console.error('Failed to create program');
    return null;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Clean up individual shaders
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

const Cube: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!(gl instanceof WebGL2RenderingContext)) {
      console.error('WebGL 2 not supported');
      return;
    }

    const program = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
      console.error('Failed to create shader program');
      return;
    }

    // Get attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, 'aVertexPosition');
    const colorAttributeLocation = gl.getAttribLocation(program, 'aVertexColor');
    const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'uModelViewMatrix');

    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      // Front face
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,
      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,
      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,
      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,
      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,
      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    const colors = [
      1.0,  0.0,  0.0,  1.0,    // Front face: red
      1.0,  0.0,  0.0,  1.0,
      1.0,  0.0,  0.0,  1.0,
      1.0,  0.0,  0.0,  1.0,
      0.0,  1.0,  0.0,  1.0,    // Back face: green
      0.0,  1.0,  0.0,  1.0,
      0.0,  1.0,  0.0,  1.0,
      0.0,  1.0,  0.0,  1.0,
      0.0,  0.0,  1.0,  1.0,    // Top face: blue
      0.0,  0.0,  1.0,  1.0,
      0.0,  0.0,  1.0,  1.0,
      0.0,  0.0,  1.0,  1.0,
      1.0,  1.0,  0.0,  1.0,    // Bottom face: yellow
      1.0,  1.0,  0.0,  1.0,
      1.0,  1.0,  0.0,  1.0,
      1.0,  1.0,  0.0,  1.0,
      1.0,  0.0,  1.0,  1.0,    // Right face: purple
      1.0,  0.0,  1.0,  1.0,
      1.0,  0.0,  1.0,  1.0,
      1.0,  0.0,  1.0,  1.0,
      0.0,  1.0,  1.0,  1.0,    // Left face: cyan
      0.0,  1.0,  1.0,  1.0,
      0.0,  1.0,  1.0,  1.0,
      0.0,  1.0,  1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Set up attribute pointers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorAttributeLocation);

    // Set up matrices
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);

    // Animation loop
    let rotation = 0;
    const render = (time: number) => {
      rotation = time * 0.001; // Convert time to seconds

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const newModelViewMatrix = mat4.create();
      mat4.translate(newModelViewMatrix, newModelViewMatrix, [0.0, 0.0, -6.0]);
      mat4.rotate(newModelViewMatrix, newModelViewMatrix, rotation, [0, 1, 0]);

      gl.useProgram(program);
      gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
      gl.uniformMatrix4fv(modelViewMatrixLocation, false, newModelViewMatrix);

      gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Cleanup function
    return () => {
      // Not needed as it always renders
    };
  }, []);

  return <canvas ref={canvasRef} width={640} height={480} />;
};

const Icosahedron: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!(gl instanceof WebGL2RenderingContext)) {
      console.error('WebGL 2 not supported');
      return;
    }
    
    const program = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) {
      console.error('Failed to create shader program');
      return;
    }

    // Icosahedron data
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const vertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];

    const indices = [
      0, 11, 5,    0, 5, 1,    0, 1, 7,    0, 7, 10,   0, 10, 11,
      1, 5, 9,     5, 11, 4,   11, 10, 2,  10, 7, 6,   7, 1, 8,
      3, 9, 4,     3, 4, 2,    3, 2, 6,    3, 6, 8,    3, 8, 9,
      4, 9, 5,     2, 4, 11,   6, 2, 10,   8, 6, 7,    9, 8, 1
    ];

    // Flatten vertices array
    const positionArray = new Float32Array(vertices.flat());

    // Create position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

    // Create color data (one color per vertex)
    const colorData = new Float32Array(vertices.length * 4);
    for (let i = 0; i < vertices.length; i++) {
      const r = Math.random();
      const g = Math.random();
      const b = Math.random();
      colorData[i * 4] = r;
      colorData[i * 4 + 1] = g;
      colorData[i * 4 + 2] = b;
      colorData[i * 4 + 3] = 1.0; // Alpha
    }

    // Create color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);

    // Create index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Set up attribute pointers
    const positionAttributeLocation = gl.getAttribLocation(program, 'aVertexPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);

    const colorAttributeLocation = gl.getAttribLocation(program, 'aVertexColor');
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorAttributeLocation);

    // Set up matrices (similar to before)
    const projectionMatrix = mat4.create();
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);

    // Get uniform locations
    const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'uModelViewMatrix');

    // Render loop
    let rotation = 0;
    const render = (time: number) => {
      rotation = time * 0.001;

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const rotatedModelViewMatrix = mat4.create();
      mat4.copy(rotatedModelViewMatrix, modelViewMatrix);
      mat4.rotate(rotatedModelViewMatrix, rotatedModelViewMatrix, rotation, [0, 1, 0]);

      gl.useProgram(program);
      gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
      gl.uniformMatrix4fv(modelViewMatrixLocation, false, rotatedModelViewMatrix);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);

    // Cleanup function
    return () => {
      // Delete buffers and program
    };
  }, []);

  return <canvas ref={canvasRef} width={640} height={480} />;
};

const vertexShaderSource2 = `#version 300 es
  in vec3 aVertexPosition;
  in vec3 aVertexColor;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  out vec3 vColor;
  
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vColor = aVertexColor;
  }
`;

const fragmentShaderSource2 = `#version 300 es
  precision mediump float;
  
  in vec3 vColor;
  out vec4 outColor;
  
  void main() {
    outColor = vec4(vColor, 1.0);
  }
`;

const SierpinskiPyramid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!(gl instanceof WebGL2RenderingContext)) {
      console.error('WebGL 2 not supported');
      return;
    }

    const program = createShaderProgram(gl, vertexShaderSource2, fragmentShaderSource2);
    if (!program) {
      console.error('Failed to create shader program');
      return;
    }

    // Generate Sierpinski pyramid vertices
    function generateSierpinskiPyramid(depth: number): [number[], number[]] {
      const vertices: number[] = [];
      const colors: number[] = [];

      function tetrahedron(a: vec3, b: vec3, c: vec3, d: vec3, depth: number) {
        if (depth === 0) {
          // Add the four triangles of the tetrahedron
          vertices.push(...a, ...b, ...c);
          vertices.push(...a, ...c, ...d);
          vertices.push(...a, ...d, ...b);
          vertices.push(...b, ...d, ...c);

          // Add colors (one per vertex)
          for (let i = 0; i < 4; i++) {
            const color = [Math.random(), Math.random(), Math.random()];
            // Use the same color for all three vertices of the face
            colors.push(...color, ...color, ...color);
          }
        } else {
          const ab = vec3.lerp(vec3.create(), a, b, 0.5);
          const ac = vec3.lerp(vec3.create(), a, c, 0.5);
          const ad = vec3.lerp(vec3.create(), a, d, 0.5);
          const bc = vec3.lerp(vec3.create(), b, c, 0.5);
          const bd = vec3.lerp(vec3.create(), b, d, 0.5);
          const cd = vec3.lerp(vec3.create(), c, d, 0.5);

          tetrahedron(a, ab, ac, ad, depth - 1);
          tetrahedron(ab, b, bc, bd, depth - 1);
          tetrahedron(ac, bc, c, cd, depth - 1);
          tetrahedron(ad, bd, cd, d, depth - 1);
        }
      }

      const a = vec3.fromValues(0, 1, 0);
      const b = vec3.fromValues(-0.8165, -0.3333, -0.4714);
      const c = vec3.fromValues(0.8165, -0.3333, -0.4714);
      const d = vec3.fromValues(0, -0.3333, 0.9428);

      tetrahedron(a, b, c, d, depth);

      return [vertices, colors];
    }

    const [vertices, colors] = generateSierpinskiPyramid(5); // Adjust depth as needed

    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Create and bind color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Get attribute locations
    const positionAttributeLocation = gl.getAttribLocation(program, 'aVertexPosition');
    const colorAttributeLocation = gl.getAttribLocation(program, 'aVertexColor');

    // Get uniform locations
    const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'uModelViewMatrix');

    // Set up matrices
    const projectionMatrix = mat4.create();
    const modelViewMatrix = mat4.create();

    mat4.perspective(projectionMatrix, 25 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, -0.25, -4.0]);

    // Render loop
    const render = (time: number) => {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      gl.useProgram(program);

      // Set up attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionAttributeLocation);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(colorAttributeLocation);

      // Update model-view matrix for rotation
      const rotatedModelViewMatrix = mat4.create();
      mat4.copy(rotatedModelViewMatrix, modelViewMatrix);
      mat4.rotate(rotatedModelViewMatrix, rotatedModelViewMatrix, time * 0.001, [0.3, 0.3, 0]);

      // Set uniforms
      gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
      gl.uniformMatrix4fv(modelViewMatrixLocation, false, rotatedModelViewMatrix);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    // Cleanup function
    return () => {
    };
  }, []);

  return <canvas ref={canvasRef} width={1920} height={1080} />;
};

export default App
