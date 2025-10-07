import { CircularProgress, Link, Typography } from "@mui/material";
import ScoreBreakdownTableStandard from "../components/Tables/ScoreBreakdownTableStandard";
import { journalQuestions } from "../data/journalQuestions";
import { presentationQuestions } from "../data/presentationQuestions";
import { machineDesignQuestions } from "../data/machineDesignQuestions";
import { useEffect } from "react";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import { useParams } from "react-router-dom";
import ScoreBreakdownTableGeneralPenalties from "../components/Tables/ScoreBreakdownTableGeneralPenalties";
import ScoreBreakdownTableRunPenalties from "../components/Tables/ScoreBreakdownTableRunPenalties";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useNavigate } from "react-router-dom";

export default function ScoreBreakdown() {
  const { teamId } = useParams();
  const parsedTeamId = teamId ? parseInt(teamId, 10) : undefined;
  const { getScoreSheetBreakdown, isLoadingScoreSheet, clearScoreBreakdown } =
    useScoreSheetStore();
  const { role } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
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
          <Typography variant="body2" sx={{ ml: 2, mt: 2 }}>
            {"<"} Back to Dashboard{" "}
          </Typography>
        </Link>
      )}
      {role?.user_type != 4 && (
        <Link
          onClick={() => navigate(-1)}
          sx={{ textDecoration: "none", cursor: "pointer" }}
        >
          <Typography variant="body2" sx={{ ml: 2, mt: 2 }}>
            {"<"} Back to Results{" "}
          </Typography>
        </Link>
      )}
      <Typography variant="h1" sx={{ ml: 5, mt: 5, mr: 5, mb: 2 }}>
        Score Breakdown
      </Typography>
      
      <Typography variant="h2" sx={{ m: 5 }}>
        Journal
      </Typography>
      <ScoreBreakdownTableStandard type={2} questions={journalQuestions} />
      <Typography variant="h2" sx={{ m: 5 }}>
        Presentation
      </Typography>
      <ScoreBreakdownTableStandard type={1} questions={presentationQuestions} />
      <Typography variant="h2" sx={{ m: 5 }}>
        Machine Design and Operation
      </Typography>
      <ScoreBreakdownTableStandard
        type={3}
        questions={machineDesignQuestions}
      />
      <Typography variant="h2" sx={{ mt: 5, ml: 5, mr: 5 }}>
        General Penalties
      </Typography>
      <ScoreBreakdownTableGeneralPenalties />
      <Typography variant="h2" sx={{ mt: 5, ml: 5, mr: 5 }}>
        Run Penalties
      </Typography>
      <ScoreBreakdownTableRunPenalties />
    </>
  );
}
