import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useTeamStore } from "../store/primary_stores/teamStore";
import { generalPenaltiesQuestions } from "../data/generalPenaltiesQuestions";
import MultiTeamPenaltyTable from "../components/Tables/MultiTeamPenaltyTable";

export default function GeneralPenaltiesMultiTeam() {
  const { role } = useAuthStore();
  const { teams, fetchAllTeams } = useTeamStore();
  const { judgeId, contestId } = useParams();
  const navigate = useNavigate();
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;

  // Security: ensure judges can only access their own penalty sheets
  useEffect(() => {
    if (role?.user_type === 3 && parsedJudgeId !== role.user.id) {
      navigate(`/multi-team-general-penalties/${role.user.id}/${contestId}/`);
    }
  }, [judgeId, role, contestId, navigate, parsedJudgeId]);

  // Fetch all teams
  useEffect(() => {
    fetchAllTeams();
  }, [fetchAllTeams]);

  if (parsedJudgeId === null) return null;

  return (
    <MultiTeamPenaltyTable
      sheetType={5}
      title="General Penalties - Multi Team"
      teams={teams.map((team) => ({ id: team.id, name: team.team_name }))}
      penalties={generalPenaltiesQuestions}
      judgeId={parsedJudgeId}
    />
  );
}