import { Box } from "@mui/material";

const DOT_SIZE = 12;
const GREENS = ["#4caf50", "#388e3c", "#43a047"];

export default function GreenDotsStepPreloader() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end", // start all dots at bottom for step effect
        justifyContent: "center",
        width: "100%",
        minHeight: 50,
      }}
      data-testid="green-dots-step-preloader"
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: "50%",
            bgcolor: GREENS[i],
            mx: 1,
            // Animation for "stepping" effect
            animation: "green-step-bounce 1.2s cubic-bezier(.6,-0.29,.7,1.49) infinite",
            animationDelay: `${i * 0.28}s`, // staggered for step-by-step
            "@keyframes green-step-bounce": {
              "0%": { transform: "translateY(0)" },
              "15%": { transform: "translateY(-16px)" },
              "30%": { transform: "translateY(0)" },
              "100%": { transform: "translateY(0)" },
            },
          }}
        />
      ))}
    </Box>
  );
}