interface GridOverlayProps {
  showGrid: boolean;
  gridSpacing: number;
  gridOffset: { x: number; y: number };
  gridLineColor: string;
  gridLineThickness: string;
}

export const GridOverlay = ({
  showGrid,
  gridSpacing,
  gridOffset,
  gridLineColor,
  gridLineThickness,
}: GridOverlayProps) => {
  if (!showGrid || gridSpacing <= 0) return null;

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
            ${gridLineColor} 0,
            ${gridLineColor} ${gridLineThickness},
            transparent ${gridLineThickness},
            transparent ${gridSpacing}px
          ),
          repeating-linear-gradient(
            to bottom,
            ${gridLineColor} 0,
            ${gridLineColor} ${gridLineThickness},
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
