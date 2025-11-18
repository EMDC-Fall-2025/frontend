import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useTeamStore } from "../store/primary_stores/teamStore";
import ChampionshipScoreSheetTable from "../components/Tables/ChampionshipScoreSheetTable";

export default function ChampionshipScore() {
  const { role } = useAuthStore();
  const { team, fetchTeamById } = useTeamStore();
  const { judgeId, teamId } = useParams();
  const navigate = useNavigate();
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;
  const parsedTeamId = teamId ? parseInt(teamId, 10) : null;

  useEffect(() => {
    if (role?.user_type == 3 && parsedJudgeId != role.user.id) {
      navigate(`/championship-score/${role.user.id}/${teamId}/`);
    }
  }, [judgeId]);

  useEffect(() => {
    if (parsedTeamId) {
      fetchTeamById(parsedTeamId);
    }
  }, [teamId, fetchTeamById]);

  return (
    <ChampionshipScoreSheetTable
      sheetType={7}
      title="Championship Round Scoring"
      teamName={team?.team_name || ""}
      teamId={parsedTeamId}
      judgeId={parsedJudgeId}
      seperateJrAndSr={true}
    />
  );
}
