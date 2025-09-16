import { useEffect} from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useTeamStore } from "../store/primary_stores/teamStore";
import { presentationQuestions } from "../data/presentationQuestions";
import MultiTeamScoreSheet from "../components/Tables/MultiTeamScoreTable";

// import CircularProgress from "@mui/material/CircularProgress";
// import { Typography } from "@mui/material";

export default function MultiTeamPresentationScore() {
  const { role } = useAuthStore();
  const { teams, fetchAllTeams } = useTeamStore();
  const { judgeId, contestId } = useParams();
  const navigate = useNavigate();
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;

  useEffect(() => {
    if (role?.user_type === 3 && parsedJudgeId !== role.user.id) {
      navigate(`/multi-team-presentation-score/${role.user.id}/${contestId}/`);
    }
  }, [judgeId, role, contestId, navigate]);

  useEffect(() => {
    fetchAllTeams();
  }, []); 

  if (parsedJudgeId === null) return null;

  return (
    <MultiTeamScoreSheet
      sheetType={1}
      title="Presentation Scores"
      teams = {teams.map(team => ({id: team.id, name: team.team_name}))}
      questions={presentationQuestions}
      judgeId={parsedJudgeId}
      seperateJrAndSr={true}
    />
  );
}