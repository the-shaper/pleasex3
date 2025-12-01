// Halftone GLSL Shaders
// Based on traditional CMYK print halftone screens with rotated angles

export const halftoneVertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const halftoneFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_dotSize;       // 0.1 - 1.0 (dot radius within cell)
  uniform float u_gridSpacing;   // cells per unit (higher = more dots, smaller)
  uniform float u_gridAngle;     // global rotation in radians
  uniform float u_smoothness;
  uniform int u_pattern;         // 0 = dot, 1 = square
  uniform int u_colorMode;       // 0 = cmyk, 1 = rgb, 2 = mono
  uniform vec3 u_monoColor;
  uniform float u_showOriginal;
  
  varying vec2 v_texCoord;
  
  // Create rotation matrix from angle in radians
  mat2 rotate2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
  }
  
  // Traditional CMYK screen angle offsets (relative to global angle)
  // These create the classic halftone pattern that avoids moiré
  const float ANGLE_K = 0.7854;   // 45° in radians
  const float ANGLE_C = 0.3618;   // 15° in radians  
  const float ANGLE_M = 0.309;    // 75° in radians
  const float ANGLE_Y = 0.0;      // 0°
  
  float halftonePattern(vec2 st, float dotRadius, float intensity, float channelAngle) {
    // Apply global rotation + channel-specific angle
    mat2 rot = rotate2d(u_gridAngle + channelAngle);
    vec2 rotatedSt = rot * st;
    
    // Get position within cell (-0.5 to 0.5)
    vec2 cellPos = fract(rotatedSt) - 0.5;
    
    // Dot radius scales with intensity (darker = bigger dot)
    // dotRadius parameter controls max size, intensity controls actual size
    float radius = sqrt(intensity) * dotRadius * 0.5;
    
    if (u_pattern == 0) {
      // Circular dot pattern
      float dist = length(cellPos);
      float edge = u_smoothness * 0.05;
      return smoothstep(radius + edge, radius - edge, dist);
    } else {
      // Square pattern
      float edge = u_smoothness * 0.05;
      float halfSize = radius * 0.9;
      vec2 d = abs(cellPos) - halfSize;
      float dist = max(d.x, d.y);
      return smoothstep(edge, -edge, dist);
    }
  }
  
  // RGB to CMY conversion (K calculated separately)
  vec3 rgb2cmy(vec3 rgb) {
    return 0.0 - rgb; // 1.0 adds black dots
  }
  
  void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    
    // Aspect-ratio corrected coordinates
    vec2 st = v_texCoord * u_resolution / min(u_resolution.x, u_resolution.y);
    
    // Apply grid spacing (number of cells)
    st *= u_gridSpacing;
    
    vec3 halftoneColor;
    
    if (u_colorMode == 0) {
      // CMYK mode - traditional print halftone
      vec3 cmy = rgb2cmy(texColor.rgb);
      
      // Extract K (black) from CMY
      float k = min(cmy.r, min(cmy.g, cmy.b));
      
      // Reduce CMY by K amount (undercolor removal)
      vec3 cmyReduced = cmy - k;
      
      // Each channel gets its own angle offset for the classic look
      float c = halftonePattern(st, u_dotSize, cmyReduced.r, ANGLE_C);
      float m = halftonePattern(st, u_dotSize, cmyReduced.g, ANGLE_M);
      float y = halftonePattern(st, u_dotSize, cmyReduced.b, ANGLE_Y);
      float kDot = halftonePattern(st, u_dotSize, k, ANGLE_K);
      
      // Composite CMYK back to RGB (subtractive color mixing)
      vec3 cmyScreen = 1.0 - vec3(c, m, y) * 0.9;
      halftoneColor = cmyScreen * (1.0 - kDot * 0.85);
      
    } else if (u_colorMode == 1) {
      // RGB mode - additive color halftone
      float r = halftonePattern(st, u_dotSize, texColor.r, ANGLE_C);
      float g = halftonePattern(st, u_dotSize, texColor.g, ANGLE_M);
      float b = halftonePattern(st, u_dotSize, texColor.b, ANGLE_Y);
      
      halftoneColor = vec3(r, g, b);
      
    } else {
      // Mono mode - single color halftone
      float grey = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
      float mono = halftonePattern(st, u_dotSize, grey, ANGLE_K);
      halftoneColor = mix(vec3(1.0), u_monoColor, mono);
    }
    
    // Blend with original based on showOriginal slider
    vec3 finalColor = mix(halftoneColor, texColor.rgb, u_showOriginal);
    
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

// Passthrough shader for when halftone is disabled
export const passthroughFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  varying vec2 v_texCoord;
  
  void main() {
    gl_FragColor = texture2D(u_texture, v_texCoord);
  }
`;
