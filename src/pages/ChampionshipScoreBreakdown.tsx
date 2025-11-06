import { CircularProgress, Link, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useNavigate } from "react-router-dom";
import { journalQuestions } from "../data/journalQuestions";
import ScoreBreakdownTableStandard from "../components/Tables/ScoreBreakdownTableStandard";
import ChampionshipMachineDesignBreakdown from "../components/Tables/ChampionshipMachineDesignBreakdown";
import ChampionshipPresentationBreakdown from "../components/Tables/ChampionshipPresentationBreakdown";
import ChampionshipScoreBreakdownTableGeneralPenalties from "../components/Tables/ChampionshipScoreBreakdownTableGeneralPenalties";
import ChampionshipScoreBreakdownTableRunPenalties from "../components/Tables/ChampionshipScoreBreakdownTableRunPenalties";

export default function ChampionshipScoreBreakdown() {
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
      {role?.user_type == 4 && (
        <Link href="/coach/" sx={{ textDecoration: "none" }}>
          <Typography 
            variant="body2" 
            sx={{ 
              ml: { xs: 1, sm: 2 }, 
              mt: { xs: 1, sm: 2 },
              fontSize: { xs: "0.9rem", sm: "1rem" }
            }}
          >
            {"<"} Back to Dashboard{" "}
          </Typography>
        </Link>
      )}
      {role?.user_type != 4 && (
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
      )}
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
        Championship Score Breakdown
      </Typography>
      
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
        }}
      >
        Journal Scores
      </Typography>
      <ScoreBreakdownTableStandard type={2} questions={journalQuestions}/>
      
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
        }}
      >
        Machine Design and Operation
      </Typography>
      <ChampionshipMachineDesignBreakdown />
      
      <Typography 
        variant="h2" 
        sx={{ 
          m: { xs: 2, sm: 5 },
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" }
        }}
      >
        Presentation
      </Typography>
      <ChampionshipPresentationBreakdown />
      
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
      <ChampionshipScoreBreakdownTableGeneralPenalties />
      
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
      <ChampionshipScoreBreakdownTableRunPenalties />

    </>
  );
}
