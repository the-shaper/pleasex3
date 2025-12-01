export interface HandConfig {
    rotation: number;
    scale: number;
    offX: number;
    offY: number;
    pathString: string | null; // The SVG path 'd' attribute
}

export interface GlobalConfig {
    pathAngle: number;
    spreadFactor: number;
}

export interface HandsSettings {
    global: GlobalConfig;
    left: HandConfig;
    right: HandConfig;
    showCircles: boolean;
    showPath: boolean;
}
