
// Used for Cube and Icosahedron
export const vertexShaderSource = `#version 300 es
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

export const fragmentShaderSource = `#version 300 es
  precision mediump float;
  in vec4 vColor;
  out vec4 outColor;

  void main() {
    outColor = vColor;
  }
`;

// Used for Sierpinski Pyramid
export const vertexShaderSource2 = `#version 300 es
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

export const fragmentShaderSource2 = `#version 300 es
  precision mediump float;
  
  in vec3 vColor;
  out vec4 outColor;
  
  void main() {
    outColor = vec4(vColor, 1.0);
  }
`;

// For hypercube
export const vertexShaderSource4D = `#version 300 es
  in vec4 aVertexPosition;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

export const fragmentShaderSource4D = `#version 300 es
  precision mediump float;
  out vec4 outColor;
  
  void main() {
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;

export const vertexShaderSourceTex = `#version 300 es
in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_position;

void main() {
    v_texcoord = a_texcoord;
    v_normal = mat3(transpose(inverse(u_modelMatrix))) * a_normal;
    v_position = vec3(u_modelMatrix * vec4(a_position, 1.0));
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);
}
`;
export const fragmentShaderSourceTex = `#version 300 es
precision highp float;

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_position;

uniform sampler2D u_albedoMap;
uniform sampler2D u_roughnessMap;
uniform sampler2D u_normalMap;

uniform vec3 u_lightDirection;
uniform vec3 u_viewPosition;

out vec4 fragColor;

void main() {
    // Sample textures
    vec3 albedo = texture(u_albedoMap, v_texcoord).rgb;
    float roughness = texture(u_roughnessMap, v_texcoord).r;
    vec3 normal = normalize(texture(u_normalMap, v_texcoord).rgb * 2.0 - 1.0);

    // Transform normal from tangent space to world space
    vec3 N = normalize(v_normal);
    vec3 T = normalize(cross(N, vec3(0.0, 1.0, 0.0)));
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);
    normal = normalize(TBN * normal);

    // Directional light calculations
    vec3 lightDir = normalize(-u_lightDirection);
    vec3 viewDir = normalize(u_viewPosition - v_position);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    // Diffuse
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * albedo;

    // Specular
    float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
    vec3 specular = vec3(0.2) * spec * (1.0 - roughness);

    // Ambient
    vec3 ambient = 0.1 * albedo;

    // Combine results
    vec3 result = ambient + diffuse + specular;

    fragColor = vec4(result, 1.0);
}
`;