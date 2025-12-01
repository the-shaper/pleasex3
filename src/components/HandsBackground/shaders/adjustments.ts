// Adjustments GLSL Shaders
// Blur, Gamma, Contrast adjustments

export const adjustmentsVertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Single-pass blur + gamma + contrast shader
// For blur, we use stepped box blur that scales with radius
export const adjustmentsFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_blurRadius;    // 0.0 - 100.0 (in pixels)
  uniform float u_gamma;         // 0.2 - 3.0 (1.0 = no change)
  uniform float u_contrast;      // 0.0 - 2.0 (1.0 = no change)
  uniform float u_brightness;    // -1.0 - 1.0 (0.0 = no change)
  uniform float u_saturation;    // 0.0 - 2.0 (1.0 = no change)
  
  varying vec2 v_texCoord;
  
  // Stepped box blur - samples at wider intervals for larger radii
  // This keeps performance reasonable while allowing large blur values
  vec4 blur(sampler2D tex, vec2 uv, vec2 texelSize, float radius) {
    if (radius < 0.5) {
      return texture2D(tex, uv);
    }
    
    vec4 color = vec4(0.0);
    float total = 0.0;
    
    // Calculate step size - for large radii, sample every Nth pixel
    // This keeps samples around 100-200 total regardless of radius
    float step = max(1.0, radius / 7.0);
    
    // Sample in a grid pattern with stepped intervals
    for (int x = -7; x <= 7; x++) {
      for (int y = -7; y <= 7; y++) {
        float fx = float(x) * step;
        float fy = float(y) * step;
        
        // Skip samples outside the blur radius
        if (abs(fx) > radius || abs(fy) > radius) continue;
        
        vec2 offset = vec2(fx, fy) * texelSize;
        
        // Gaussian-ish weight falloff for smoother results
        float dist = length(vec2(fx, fy));
        float weight = exp(-0.5 * (dist * dist) / (radius * radius * 0.5));
        
        color += texture2D(tex, uv + offset) * weight;
        total += weight;
      }
    }
    
    return color / total;
  }
  
  // Apply gamma correction
  vec3 applyGamma(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
  }
  
  // Apply contrast adjustment
  vec3 applyContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
  }
  
  // Apply brightness adjustment
  vec3 applyBrightness(vec3 color, float brightness) {
    return color + brightness;
  }
  
  // Apply saturation adjustment
  vec3 applySaturation(vec3 color, float saturation) {
    float grey = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(grey), color, saturation);
  }
  
  void main() {
    vec2 texelSize = 1.0 / u_resolution;
    
    // Apply blur
    vec4 color = blur(u_texture, v_texCoord, texelSize, u_blurRadius);
    
    // Apply adjustments in order: brightness -> contrast -> gamma -> saturation
    vec3 rgb = color.rgb;
    
    rgb = applyBrightness(rgb, u_brightness);
    rgb = applyContrast(rgb, u_contrast);
    rgb = applyGamma(rgb, u_gamma);
    rgb = applySaturation(rgb, u_saturation);
    
    // Clamp to valid range
    rgb = clamp(rgb, 0.0, 1.0);
    
    gl_FragColor = vec4(rgb, color.a);
  }
`;

// Higher quality gaussian blur (separate horizontal/vertical passes)
export const blurHorizontalFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_blurRadius;
  
  varying vec2 v_texCoord;
  
  void main() {
    if (u_blurRadius < 0.5) {
      gl_FragColor = texture2D(u_texture, v_texCoord);
      return;
    }
    
    vec2 texelSize = vec2(1.0 / u_resolution.x, 0.0);
    vec4 color = vec4(0.0);
    float total = 0.0;
    
    for (int i = -10; i <= 10; i++) {
      float offset = float(i);
      if (abs(offset) > u_blurRadius) continue;
      
      // Gaussian weight approximation
      float weight = exp(-0.5 * (offset * offset) / (u_blurRadius * u_blurRadius * 0.25));
      color += texture2D(u_texture, v_texCoord + texelSize * offset) * weight;
      total += weight;
    }
    
    gl_FragColor = color / total;
  }
`;

export const blurVerticalFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_blurRadius;
  
  varying vec2 v_texCoord;
  
  void main() {
    if (u_blurRadius < 0.5) {
      gl_FragColor = texture2D(u_texture, v_texCoord);
      return;
    }
    
    vec2 texelSize = vec2(0.0, 1.0 / u_resolution.y);
    vec4 color = vec4(0.0);
    float total = 0.0;
    
    for (int i = -10; i <= 10; i++) {
      float offset = float(i);
      if (abs(offset) > u_blurRadius) continue;
      
      // Gaussian weight approximation
      float weight = exp(-0.5 * (offset * offset) / (u_blurRadius * u_blurRadius * 0.25));
      color += texture2D(u_texture, v_texCoord + texelSize * offset) * weight;
      total += weight;
    }
    
    gl_FragColor = color / total;
  }
`;

// Color adjustments only (no blur) - for use after blur passes
export const colorAdjustmentsFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_gamma;
  uniform float u_contrast;
  uniform float u_brightness;
  uniform float u_saturation;
  
  varying vec2 v_texCoord;
  
  vec3 applyGamma(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
  }
  
  vec3 applyContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
  }
  
  vec3 applyBrightness(vec3 color, float brightness) {
    return color + brightness;
  }
  
  vec3 applySaturation(vec3 color, float saturation) {
    float grey = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(grey), color, saturation);
  }
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    vec3 rgb = color.rgb;
    
    rgb = applyBrightness(rgb, u_brightness);
    rgb = applyContrast(rgb, u_contrast);
    rgb = applyGamma(rgb, u_gamma);
    rgb = applySaturation(rgb, u_saturation);
    
    rgb = clamp(rgb, 0.0, 1.0);
    
    gl_FragColor = vec4(rgb, color.a);
  }
`;
