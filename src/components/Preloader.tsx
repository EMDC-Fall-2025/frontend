// src/components/Preloader.tsx
import { Box, Typography } from "@mui/material";
import theme from "../theme";
import { useEffect, useState } from "react";

interface PreloaderProps {
  show: boolean;
}

export default function Preloader({ show }: PreloaderProps) {
  const [visible, setVisible] = useState(show);

  // Keep it mounted until fade-out finishes
  useEffect(() => {
    if (show) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 600); // match CSS transition
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#fff",
        width: "100vw",   
        transition: "opacity 0.6s ease-out",
        px: { xs: 2, sm: 3 },
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
        {/* Rotating gear icon */}
        <Box
          sx={{
            width: { xs: 60, sm: 80 },
            height: { xs: 60, sm: 80 },
            animation: "rotate 2s linear infinite",
            "@keyframes rotate": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 80 80"
            style={{ color: theme.palette.success.main }}
          >
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
          </svg>
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
            lineHeight: 1.3,
            px: { xs: 2, sm: 0 },
            animation: "fadeInUp 0.6s ease-out 0.2s both",
            "@keyframes fadeInUp": {
              "0%": { opacity: 0, transform: "translateY(10px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          Engineering Machine Design Contest
        </Typography>

        {/* Loading dots */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            animation: "fadeIn 0.6s ease-out 0.4s both",
            "@keyframes fadeIn": {
              "0%": { opacity: 0 },
              "100%": { opacity: 1 },
            },
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
                animation: `pulse 1.2s ease-in-out infinite ${i * 0.2}s`,
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)", opacity: 0.5 },
                  "50%": { transform: "scale(1.3)", opacity: 1 },
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
