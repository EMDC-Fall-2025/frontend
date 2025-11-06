import { CircularProgress, Link, Typography } from "@mui/material";
import ScoreBreakdownTableStandard from "../components/Tables/ScoreBreakdownTableStandard";
import { journalQuestions } from "../data/journalQuestions";
import { presentationQuestions } from "../data/presentationQuestions";
import { machineDesignQuestions } from "../data/machineDesignQuestions";
import { useEffect, useRef } from "react";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import { useParams, useNavigate } from "react-router-dom";
import ScoreBreakdownTableGeneralPenalties from "../components/Tables/ScoreBreakdownTableGeneralPenalties";
import ScoreBreakdownTableRunPenalties from "../components/Tables/ScoreBreakdownTableRunPenalties";

export default function PulicScoreBreakdown() {
  const { teamId } = useParams();
  const parsedTeamId = teamId ? parseInt(teamId, 10) : undefined;
  const { getScoreSheetBreakdown, isLoadingScoreSheet, clearScoreBreakdown } =
    useScoreSheetStore();
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
      <Link
        onClick={() => navigate(-1)}
        sx={{ textDecoration: "none", cursor: "pointer" }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            ml: { xs: 1, sm: 2 }, 
            mt: { xs: 1, sm: 2 },
            fontSize: { xs: "0.9rem", sm: "1rem" }
          }}
        >
          {"<"} Back to Results{" "}
        </Typography>
      </Link>
      <Typography 
        variant="h1" 
        sx={{ 
          ml: { xs: 2, sm: 5 }, 
          mt: { xs: 2, sm: 5 }, 
          mr: { xs: 2, sm: 5 }, 
          mb: { xs: 1, sm: 2 },
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" }
        }}
      >
        Score Breakdown
      </Typography>
      
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
        }}
      >
        Journal
      </Typography>
      <ScoreBreakdownTableStandard type={2} questions={journalQuestions} />
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
        }}
      >
        Presentation
      </Typography>
      <ScoreBreakdownTableStandard type={1} questions={presentationQuestions} />
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
        }}
      >
        Machine Design and Operation
      </Typography>
      <ScoreBreakdownTableStandard
        type={3}
        questions={machineDesignQuestions}
      />
      <Typography 
        variant="h2" 
        sx={{ 
          mt: { xs: 2, sm: 5 }, 
          ml: { xs: 2, sm: 5 }, 
          mr: { xs: 2, sm: 5 },
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
        }}
      >
        General Penalties
      </Typography>
      <ScoreBreakdownTableGeneralPenalties />
      <Typography 
        variant="h2" 
        sx={{ 
          mt: { xs: 2, sm: 5 }, 
          ml: { xs: 2, sm: 5 }, 
          mr: { xs: 2, sm: 5 },
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
        }}
      >
        Run Penalties
      </Typography>
      <ScoreBreakdownTableRunPenalties />
    </>
  );
}
