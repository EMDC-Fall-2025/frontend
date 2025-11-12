import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import { generalPenaltiesQuestions } from "../data/generalPenaltiesQuestions";
import MultiTeamPenaltyTable from "../components/Tables/MultiTeamPenaltyTable";

export default function GeneralPenaltiesMultiTeam() {
  const { role } = useAuthStore();
  const { judgeId, contestId } = useParams();
  const navigate = useNavigate();
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;
  const { fetchMultiTeamPenalties } = useScoreSheetStore();

  // Security: ensure judges can only access their own penalty sheets
  useEffect(() => {
    if (role?.user_type === 3 && parsedJudgeId !== role.user.id) {
      navigate(`/multi-team-general-penalties/${role.user.id}/${contestId}/`);
    }
  }, [judgeId, role, contestId, navigate, parsedJudgeId]);

  useEffect(() => {
    if (parsedJudgeId && contestId) {
      fetchMultiTeamPenalties(parsedJudgeId, parseInt(contestId), 5);
    }
  }, [parsedJudgeId, contestId, fetchMultiTeamPenalties]);

  if (parsedJudgeId === null) return null;

  return (
    <MultiTeamPenaltyTable
      sheetType={5}
      title="General Penalties - Multi Team"
      teams={[]}
      penalties={generalPenaltiesQuestions}
      judgeId={parsedJudgeId}
      contestId={parseInt(contestId!)}
    />
  );
}