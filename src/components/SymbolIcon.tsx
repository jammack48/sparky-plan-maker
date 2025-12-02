import heatPumpImage from "@/assets/heat-pump.png";
import downlightImage from "@/assets/downlight.png";

interface SymbolIconProps {
  type: string;
  size?: number;
}

export const SymbolIcon = ({ type, size = 16 }: SymbolIconProps) => {
  const half = size / 2;
  const third = size / 3;
  const quarter = size / 4;

  switch (type) {
    case "downlight":
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={half}
            cy={half}
            r={half - 1}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <line
            x1={2}
            y1={2}
            x2={size - 2}
            y2={size - 2}
            stroke="currentColor"
            strokeWidth="1"
          />
          <line
            x1={size - 2}
            y1={2}
            x2={2}
            y2={size - 2}
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      );

    case "power-point":
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect
            x={2}
            y={2}
            width={size - 4}
            height={size - 4}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <line x1={half} y1={quarter} x2={half} y2={half} stroke="currentColor" strokeWidth="1" />
          <line x1={half} y1={half + quarter} x2={half} y2={size - quarter} stroke="currentColor" strokeWidth="1" />
        </svg>
      );

    case "single-switch":
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect
            x={quarter}
            y={2}
            width={half}
            height={size - 4}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      );

    case "double-switch":
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect
            x={2}
            y={2}
            width={third}
            height={size - 4}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <rect
            x={2 + third + 2}
            y={2}
            width={third}
            height={size - 4}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      );

    case "triple-switch":
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect
            x={2}
            y={2}
            width={quarter}
            height={size - 4}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <rect
            x={quarter + 2}
            y={2}
            width={quarter}
            height={size - 4}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <rect
            x={half + 2}
            y={2}
            width={quarter}
            height={size - 4}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      );

    case "fan":
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={half} cy={half} r={2} fill="currentColor" />
          <path
            d={`M ${half} ${half} Q ${2} ${2} ${quarter} ${2}`}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d={`M ${half} ${half} Q ${size - 2} ${2} ${size - quarter} ${quarter}`}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d={`M ${half} ${half} Q ${size - 2} ${size - 2} ${half + quarter} ${size - 2}`}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <path
            d={`M ${half} ${half} Q ${2} ${size - 2} ${quarter} ${size - quarter}`}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      );

    case "downlight-real":
      return (
        <img 
          src={downlightImage} 
          alt="Downlight" 
          style={{ 
            width: size, 
            height: size, 
            objectFit: 'contain' 
          }} 
        />
      );

    case "heat-pump":
      return (
        <img 
          src={heatPumpImage} 
          alt="Heat Pump" 
          style={{ 
            width: size, 
            height: size, 
            objectFit: 'contain' 
          }} 
        />
      );

    case "indoor-unit":
      // Rectangle 800x1200mm ratio (2:3), blue
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect
            x={3}
            y={1}
            width={size - 6}
            height={size - 2}
            stroke="#2563eb"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      );

    case "supply-grill":
      // Round diffuser 200mm, blue
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={half}
            cy={half}
            r={half - 2}
            stroke="#2563eb"
            strokeWidth="1.5"
            fill="none"
          />
          <circle
            cx={half}
            cy={half}
            r={half - 5}
            stroke="#2563eb"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      );

    case "return-grill":
      // Square 400mm, blue
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect
            x={2}
            y={2}
            width={size - 4}
            height={size - 4}
            stroke="#2563eb"
            strokeWidth="1.5"
            fill="none"
          />
          <line x1={4} y1={half} x2={size - 4} y2={half} stroke="#2563eb" strokeWidth="0.5" />
          <line x1={half} y1={4} x2={half} y2={size - 4} stroke="#2563eb" strokeWidth="0.5" />
        </svg>
      );

    default:
      return null;
  }
};
