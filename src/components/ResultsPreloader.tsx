import { useEffect, useState } from "react";
import { Box, Typography, Fade, keyframes } from "@mui/material";
import theme from "../theme";

const combineAnimation = keyframes`
  0% {
    transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.7);
    opacity: 0.4;
  }
  60% {
    transform: translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2)) rotate(calc(var(--rot) * 0.3)) scale(0.95);
    opacity: 0.9;
  }
  100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
`;

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const dotPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export default function ResultsPreloader() {
  const [isCombined, setIsCombined] = useState(false);

  useEffect(() => {
    // After a short delay, mark as combined and start rotating.
    // Lifetime of this preloader is now controlled by the parent component,
    // so we do NOT auto-hide here anymore.
    const combineTimer = setTimeout(() => {
      setIsCombined(true);
    }, 600);

    return () => {
      clearTimeout(combineTimer);
    };
  }, []);

  // Define the 4 parts with their initial positions (spread out)
  const parts = [
    { tx: -40, ty: -40, rot: -90 }, // Top-left
    { tx: 40, ty: -40, rot: 90 },   // Top-right
    { tx: -40, ty: 40, rot: -180 }, // Bottom-left
    { tx: 40, ty: 40, rot: 180 },   // Bottom-right
  ];

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { xs: 2, sm: 3, md: 4 },
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Gear icon split into 4 parts that combine */}
          <Box
            sx={{
              position: "relative",
              width: { xs: 60, sm: 80 },
              height: { xs: 60, sm: 80 },
            }}
          >
            {parts.map((part, index) => (
              <Box
                key={index}
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  animation: isCombined
                    ? `${rotateAnimation} 2s linear infinite`
                    : `${combineAnimation} 0.6s ease-out forwards`,
                  animationDelay: isCombined ? "0s" : `${index * 0.05}s`,
                  "--tx": `${part.tx}px`,
                  "--ty": `${part.ty}px`,
                  "--rot": `${part.rot}deg`,
                  transformOrigin: "center center",
                  overflow: "hidden",
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 80 80"
                  style={{ color: theme.palette.success.main }}
                >
                  <defs>
                    <clipPath id={`gear-clip-${index}`}>
                      <rect
                        x={index % 2 === 0 ? 0 : 40}
                        y={index < 2 ? 0 : 40}
                        width="40"
                        height="40"
                      />
                    </clipPath>
                  </defs>
                  <g clipPath={`url(#gear-clip-${index})`}>
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    {Array.from({ length: 8 }).map((_, i) => {
                      const angle = (i * 45 * Math.PI) / 180;
                      const x1 = 40 + Math.cos(angle) * 30;
                      const y1 = 40 + Math.sin(angle) * 30;
                      const x2 = 40 + Math.cos(angle) * 38;
                      const y2 = 40 + Math.sin(angle) * 38;
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      );
                    })}
                    <circle
                      cx="40"
                      cy="40"
                      r="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </g>
                </svg>
              </Box>
            ))}
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "text.primary",
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.875rem" },
              textAlign: "center",
              animation: `${fadeInUp} 0.6s ease-out 0.2s both`,
            }}
          >
            Loading Results…
          </Typography>

          {/* Loading dots */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              animation: `${fadeIn} 0.6s ease-out 0.4s both`,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: { xs: 6, sm: 8 },
                  height: { xs: 6, sm: 8 },
                  borderRadius: "50%",
                  bgcolor: theme.palette.success.main,
                  animation: `${dotPulse} 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}
