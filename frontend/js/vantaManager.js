/**
 * VantaManager - Manages the Vanta.js 3D Clouds background.
 * Syncs with the AtmosIntel Day/Night theme system.
 */
export class VantaManager {
  constructor(elementId) {
    this.elementId = elementId;
    this.vantaEffect = null;
    this.isDay = true;
  }

  init(isDay = true) {
    if (typeof VANTA === 'undefined') {
      console.warn('Vanta.js not loaded. Skipping 3D background.');
      return;
    }

    this.isDay = isDay;
    const options = this.getThemeOptions(isDay);

    this.vantaEffect = VANTA.CLOUDS({
      el: `#${this.elementId}`,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      THREE: window.THREE, // Use the Three.js r134 we injected
      ...options
    });
  }

  getThemeOptions(isDay) {
    if (isDay) {
      // Professional "Orbital" Day (High contrast, vibrant atmospheric depth)
      return {
        skyColor: 0x22a1e0,        // Rich cerulean sky
        cloudColor: 0xffffff,      // Crisp white clouds
        cloudShadowColor: 0x184d7a,// Deep atmospheric shadows for volume
        sunColor: 0xff8c00,        // Vibrant solar core
        sunGlareColor: 0xffd700,   // Golden flare
        sunLightColor: 0xffffff,
        speed: 0.8,
        quantity: 3.0              // If available in latest, otherwise ignored
      };
    } else {
      // Professional "Deep Space" Night (Technical, high-end navy textures)
      return {
        skyColor: 0x050e24,        // Deep navy/Prussian blue
        cloudColor: 0x1e2d4d,      // Slate clouds with depth
        cloudShadowColor: 0x02050c, // Near-black for max dimensionality
        sunColor: 0x1e3a8a,        // Subdued night-glow
        sunGlareColor: 0x0f172a,   // Technical dark flare
        sunLightColor: 0x000000,
        speed: 0.4
      };
    }
  }

  updateTheme(isDay) {
    if (!this.vantaEffect) return;
    this.isDay = isDay;
    const options = this.getThemeOptions(isDay);
    
    // Smoothly update the Vanta options
    this.vantaEffect.setOptions(options);
  }

  destroy() {
    if (this.vantaEffect) {
      this.vantaEffect.destroy();
      this.vantaEffect = null;
    }
  }
}
