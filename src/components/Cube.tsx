// InteractiveGrid.tsx
import { useState, useEffect, useRef } from "react";

const LIGHT_COLOR = "#B6F2A1";
const DARK_COLOR = "#4E845C";

interface InteractiveGridProps {
  cellSize?: number;
  gap?: number;
}

const InteractiveGrid: React.FC<InteractiveGridProps> = ({ 
  cellSize = 16, 
  gap = 3 
}) => {
  // false = dark (initial), true = light
  const [cells, setCells] = useState<boolean[]>(
    Array(9).fill(false) // 3x3 grid, all dark at start
  );
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isClickingRef = useRef(false);

  const handleClick = (index: number) => {
    setCells(prev =>
      prev.map((value, i) => (i === index ? !value : value))
    );
  };

  const handleMouseDown = () => {
    isClickingRef.current = true;
    setShowTooltip(false);
    // Clear timeout on click
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
  };

  const handleMouseUp = () => {
    // Reset clicking state after a short delay to allow click to complete
    setTimeout(() => {
      isClickingRef.current = false;
    }, 100);
  };

  const handleMouseEnter = () => {
    // Don't show tooltip if user is clicking
    if (isClickingRef.current) return;
    
    setShowTooltip(true);
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    // Auto-hide after 0.4 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 400);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    // Clear timeout on mouse leave
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(3, ${cellSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {cells.map((isLight, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              borderRadius: "4px",
              border: "none",
              outline: "none",
              cursor: "pointer",
              backgroundColor: isLight ? LIGHT_COLOR : DARK_COLOR,
              transition: "background-color 150ms ease, transform 80ms ease",
            }}
          />
        ))}
      </div>
      
      {/* Cloud-shaped Tooltip */}
      {showTooltip && (
        <div
          className="cloud-tooltip"
          style={{
            position: "absolute",
            bottom: "100%",
            left: "80%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            padding: "8px 16px",
            backgroundColor: "#fff",
            color: "#000",
            fontSize: "11px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
            opacity: showTooltip ? 1 : 0,
            transition: "opacity 200ms ease",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          light me up
        </div>
      )}
      
      {/* Cloud shape CSS */}
      <style>
        {`
          .cloud-tooltip {
            position: relative;
            border-radius: 30px 30px 30px 30px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          }
          
          .cloud-tooltip::before {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 30px;
            width: 18px;
            height: 18px;
            background: #fff;
            border-radius: 0 0 18px 0;
            transform: rotate(45deg);
            box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .cloud-tooltip::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 28px;
            width: 14px;
            height: 14px;
            background: #fff;
            border-radius: 50%;
          }
        `}
      </style>
    </div>
  );
};

export default InteractiveGrid;
