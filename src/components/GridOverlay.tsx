interface GridOverlayProps {
  showGrid: boolean;
  gridSpacing: number;
  gridOffset: { x: number; y: number };
  gridLineColor: string;
  gridLineThickness: string;
  gridOpacity?: number;
}

export const GridOverlay = ({
  showGrid,
  gridSpacing,
  gridOffset,
  gridLineColor,
  gridLineThickness,
  gridOpacity = 1,
}: GridOverlayProps) => {
  if (!showGrid || gridSpacing <= 0) return null;

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const lineColor = hexToRgba(gridLineColor, gridOpacity);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        // GPU hinting and smoothing
        willChange: "background-position, background-size",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",

        // Performance and smoothness
        imageRendering: "crisp-edges",
        contain: "strict",

        backgroundImage: `
          repeating-linear-gradient(
            to right,
            ${lineColor} 0,
            ${lineColor} ${gridLineThickness},
            transparent ${gridLineThickness},
            transparent ${gridSpacing}px
          ),
          repeating-linear-gradient(
            to bottom,
            ${lineColor} 0,
            ${lineColor} ${gridLineThickness},
            transparent ${gridLineThickness},
            transparent ${gridSpacing}px
          )
        `,
        backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
        backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
      }}
    />
  );
};
