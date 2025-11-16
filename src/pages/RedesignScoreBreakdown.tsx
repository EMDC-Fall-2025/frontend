import { CircularProgress, Link, Typography, Button, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import theme from "../theme";
import ScoreBreakdownTableStandard from "../components/Tables/ScoreBreakdownTableStandard";
import { redesignQuestions } from "../data/redesignQuestions";
import { useEffect, useRef } from "react";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useNavigate } from "react-router-dom";

export default function RedesignScoreBreakdown() {
  const { teamId } = useParams();
  const parsedTeamId = teamId ? parseInt(teamId, 10) : undefined;
  const { getScoreSheetBreakdown, isLoadingScoreSheet, clearScoreBreakdown } =
    useScoreSheetStore();
  const { role } = useAuthStore();
  const navigate = useNavigate();

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true; // guard against React 18 StrictMode double-invoke
    if (parsedTeamId) {
      getScoreSheetBreakdown(parsedTeamId);
    }
    return () => {
      clearScoreBreakdown();
    };
  }, [parsedTeamId]);

  useEffect(() => {
    const handlePageHide = () => {
      clearScoreBreakdown();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return isLoadingScoreSheet ? (
    <CircularProgress />
  ) : (
    <>
      <Box sx={{ mb: 2, mt: { xs: 2, sm: 3 }, ml: { xs: 2, sm: 3 } }}>
        {role?.user_type == 4 && (
          <Button
            component={Link}
            href="/coach/"
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: "none",
              color: theme.palette.success.dark,
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              fontWeight: 500,
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              borderRadius: "8px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(76, 175, 80, 0.08)",
                transform: "translateX(-2px)",
              },
            }}
          >
            Back to Dashboard
          </Button>
        )}
        {role?.user_type != 4 && (
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: "none",
              color: theme.palette.success.dark,
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              fontWeight: 500,
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              borderRadius: "8px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(76, 175, 80, 0.08)",
                transform: "translateX(-2px)",
              },
            }}
          >
            Back to Results
          </Button>
        )}
      </Box>
      <Typography 
        variant="h1" 
        sx={{ 
          ml: { xs: 2, sm: 5 }, 
          mt: { xs: 2, sm: 5 }, 
          mr: { xs: 2, sm: 5 }, 
          mb: { xs: 1, sm: 2 },
          fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        Redesign Score Breakdown
      </Typography>
      
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        Redesign Scores
      </Typography>
      <ScoreBreakdownTableStandard type={6} questions={redesignQuestions} />
    </>
  );
}
