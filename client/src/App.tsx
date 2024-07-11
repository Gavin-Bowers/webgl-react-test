import { useEffect, useRef, useState } from 'react'
import { mat4, vec3, vec4 } from 'gl-matrix';
import './App.css'

function App() {
  const [artIndex, setArtIndex] = useState(0);

  const slides = [
    {name: 'Cube', 
    component: <Cube/>, 
    controls:<></>},
    {name: 'Icosahedron',
    component: <Icosahedron/>, 
    controls:<></>},
    {name: 'Sierpinski Pyramid', 
    component: <SierpinskiPyramid/>, 
    controls:<></>},
    {name: 'Tesseract', 
    component: <Tesseract/>, 
    controls:<></>},
  ];

  function handleLeftClick() {
    setArtIndex((prevIndex) => {
      const newIndex = prevIndex - 1;
      return newIndex < 0 ? slides.length - 1 : newIndex;
    });
  }
  function handleRightClick() {
    setArtIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      return newIndex > slides.length - 1 ? 0 : newIndex;
    });
  }

  return (
    <>
      <div className='art-viewer'>
        <div className='art-viewer-controls'>
          <ArtViewerLeft onClick={handleLeftClick}/>
          <h3 className='art-title'>{slides[artIndex].name}</h3>
          <ArtViewerRight onClick={handleRightClick}/>
        </div>
        {slides[artIndex].component || <div>Invalid slide</div>}
        {slides[artIndex].controls || <></>}
      </div>
    </>
  )
}
interface ArtViewerProps { //Apparently needed by TS
  onClick: () => void;
}
const ArtViewerLeft: React.FC<ArtViewerProps> = ({onClick}) => {
  return (
    <button onClick={onClick}>
      <span className="material-symbols-outlined">
        chevron_left
      </span>
    </button>
  )
}
const ArtViewerRight: React.FC<ArtViewerProps> = ({onClick}) => {
  return (
    <button onClick={onClick}>
      <span className="material-symbols-outlined">
        chevron_right
      </span>
    </button>
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
    const red = [0.9, 0.1, 0.1, 1.0];
    const green = [0.1,  0.9,  0.1,  1.0];
    const blue = [0.1,  0.1,  0.9,  1.0];
    const yellow = [0.9,  0.9,  0.1,  1.0];
    const purple = [0.9,  0.1,  0.9,  1.0];
    const cyan = [0.1,  0.9,  0.9,  1.0];

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var colors = [];
    colors.push(...red);
    colors.push(...red);
    colors.push(...red);
    colors.push(...red);
    colors.push(...green);
    colors.push(...green);
    colors.push(...green);
    colors.push(...green);
    colors.push(...blue);
    colors.push(...blue);
    colors.push(...blue);
    colors.push(...blue);
    colors.push(...yellow);
    colors.push(...yellow);
    colors.push(...yellow);
    colors.push(...yellow);
    colors.push(...purple);
    colors.push(...purple);
    colors.push(...purple);
    colors.push(...purple);
    colors.push(...cyan);
    colors.push(...cyan);
    colors.push(...cyan);
    colors.push(...cyan);
    
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
      mat4.rotate(newModelViewMatrix, newModelViewMatrix, rotation, [-1, 1, 0]);

      gl.useProgram(program);
      gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
      gl.uniformMatrix4fv(modelViewMatrixLocation, false, newModelViewMatrix);

      gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Cleanup function
    return () => {
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
    ];//.map(v => vec3.normalize(vec3.create(), v as vec3) as [number, number, number]);

    const indices = [
      0, 11, 5,    0, 5, 1,    0, 1, 7,    0, 7, 10,   0, 10, 11,
      1, 5, 9,     5, 11, 4,   11, 10, 2,  10, 7, 6,   7, 1, 8,
      3, 9, 4,     3, 4, 2,    3, 2, 6,    3, 6, 8,    3, 8, 9,
      4, 9, 5,     2, 4, 11,   6, 2, 10,   8, 6, 7,    9, 8, 1
    ];
// Calculate face centers and determine color based on position
const faceColors = [];
for (let i = 0; i < indices.length; i += 3) {
  const v1 = vertices[indices[i]];
  const v2 = vertices[indices[i + 1]];
  const v3 = vertices[indices[i + 2]];
  
  // Calculate face center
  const center = vec3.fromValues(
    (v1[0] + v2[0] + v3[0]) / 3,
    (v1[1] + v2[1] + v3[1]) / 3,
    (v1[2] + v2[2] + v3[2]) / 3
  );
  
  // Normalize center to get a value between -1 and 1
  vec3.normalize(center, center);
  
  // Map the x-coordinate to a hue
  const h = (center[0] + 1 + center[1] + 1) / 4; // Map [-1, 1] to [0, 1]
  const s = 0.9;
  const v = 0.9;

  // Hue to RGB conversion
  const c = v * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = v - c;

  var r1 = 0.0, g1 = 0.0, b1 = 0.0;

  if (0 <= h && h < 1/6) {
    [r1, g1, b1] = [c, x, 0];

  } else if (1/6 <= h && h < 2/6) {
    [r1, g1, b1] = [x, c, 0];

  } else if (2/6 <= h && h < 3/6) {
    [r1, g1, b1] = [0, c, x];

  } else if (3/6 <= h && h < 4/6) {
    [r1, g1, b1] = [0, x, c];

  } else if (4/6 <= h && h < 5/6) {
    [r1, g1, b1] = [x, 0, c];

  } else {
    [r1, g1, b1] = [c, 0, x];
  }

  const r = r1 + m;
  const g = g1 + m;
  const b = b1 + m;
  
  faceColors.push([r, g, b, 1.0]);
}

// Create a new array of vertices that includes color data
const coloredVertices = [];
const coloredIndices = [];

for (let i = 0; i < indices.length; i += 3) {
  const faceColor = faceColors[i / 3];
  for (let j = 0; j < 3; j++) {
    const vertexIndex = indices[i + j];
    coloredVertices.push(
      ...vertices[vertexIndex],
      ...faceColor
    );
    coloredIndices.push(coloredVertices.length / 7 - 1);
  }
}

    // Flatten vertices array
    const positionColorArray = new Float32Array(coloredVertices);

    // Create position and color buffer
    const positionColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionColorArray, gl.STATIC_DRAW);

    // Create index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coloredIndices), gl.STATIC_DRAW);

    // Set up attribute pointers
    const positionAttributeLocation = gl.getAttribLocation(program, 'aVertexPosition');
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);

    const colorAttributeLocation = gl.getAttribLocation(program, 'aVertexColor');
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
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

          // Add colors
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
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -4.6]);

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

  return <canvas ref={canvasRef} width={640} height={480}/>;
};

const vertexShaderSource4D = `#version 300 es
  in vec4 aVertexPosition;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

const fragmentShaderSource4D = `#version 300 es
  precision mediump float;
  out vec4 outColor;
  
  void main() {
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;

const Tesseract: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }

    const program = createShaderProgram(gl, vertexShaderSource4D, fragmentShaderSource4D);
    if (!program) {
      console.error('Failed to create shader program');
      return;
    }

    // Get attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, 'aVertexPosition');
    const projectionMatrixLocation = gl.getUniformLocation(program, 'uProjectionMatrix');
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'uModelViewMatrix');

    // Create buffers
    const positionBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    // Set up matrices
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.width / gl.canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -15.0]);

    // Generate 4D hypercube vertices
    const generateHypercubeVertices = () => {
      const vertices = [];
      for (let x = -1; x <= 1; x += 2) {
        for (let y = -1; y <= 1; y += 2) {
          for (let z = -1; z <= 1; z += 2) {
            for (let w = -1; w <= 1; w += 2) {
              vertices.push([x, y, z, w]);
            }
          }
        }
      }
      return vertices;
    };

    const hypercubeVertices = generateHypercubeVertices();

    // Generate edges (connections between vertices)
    const generateHypercubeEdges = () => {
      const edges = [];
      for (let i = 0; i < hypercubeVertices.length; i++) {
        for (let j = i + 1; j < hypercubeVertices.length; j++) {
          let diffCount = 0;
          for (let k = 0; k < 4; k++) {
            if (hypercubeVertices[i][k] !== hypercubeVertices[j][k]) {
              diffCount++;
            }
          }
          if (diffCount === 1) {
            edges.push(i, j);
          }
        }
      }
      return edges;
    };

    const hypercubeEdges = generateHypercubeEdges();

    // Rotation matrices in 4D
    const rotateXY = (angle: number): mat4 => {
      return mat4.fromValues(
        Math.cos(angle), -Math.sin(angle), 0, 0,
        Math.sin(angle), Math.cos(angle), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      );
    };
    
    const rotateXZ = (angle: number): mat4 => {
      return mat4.fromValues(
        Math.cos(angle), 0, -Math.sin(angle), 0,
        0, 1, 0, 0,
        Math.sin(angle), 0, Math.cos(angle), 0,
        0, 0, 0, 1,
      );
    };
    
    const rotateXW = (angle: number): mat4 => {
      return mat4.fromValues(
        Math.cos(angle), 0, 0, -Math.sin(angle),
        0, 1, 0, 0,
        0, 0, 1, 0,
        Math.sin(angle), 0, 0, Math.cos(angle),
      );
    };

    // Animation loop
    const render = (time: number) => {
      time *= 0.001;  // convert to seconds
    
      const rotatedVertices = hypercubeVertices.map(v => {
        let rotated = vec4.fromValues(v[0], v[1], v[2], v[3]);
        vec4.transformMat4(rotated, rotated, rotateXY(time * 0.5));
        vec4.transformMat4(rotated, rotated, rotateXZ(time * 0.3));
        vec4.transformMat4(rotated, rotated, rotateXW(time * 0.2));
        return rotated;
      });

      // Project 4D to 3D (simple perspective projection)
      const projected3D = rotatedVertices.map(v => {
        const w = 2 / (2 + v[3]); // Perspective divide
        return [v[0] * w, v[1] * w, v[2] * w];
      });

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(projected3D.flat()), gl.DYNAMIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hypercubeEdges), gl.STATIC_DRAW);

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
      gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionAttributeLocation);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.LINES, hypercubeEdges.length, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    // Cleanup function
    return () => {
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(indexBuffer);
    };
  }, []);

  return <canvas ref={canvasRef} width={640} height={480} />;
};

const TesseractControls = () => {
  return (
    <div className='bottom-controls'>
    
    </div>
  );
}

export default App
