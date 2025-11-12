import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import { runPenaltiesQuestions } from "../data/runPenaltiesQuestions";
import MultiTeamPenaltyTable from "../components/Tables/MultiTeamPenaltyTable";

export default function RunPenaltiesMultiTeam() {
  const { role } = useAuthStore();
  const { judgeId, contestId } = useParams();
  const navigate = useNavigate();
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;
  const { fetchMultiTeamPenalties } = useScoreSheetStore();

  // Security: ensure judges can only access their own penalty sheets
  useEffect(() => {
    if (role?.user_type === 3 && parsedJudgeId !== role.user.id) {
      navigate(`/multi-team-run-penalties/${role.user.id}/${contestId}/`);
    }
  }, [judgeId, role, contestId, navigate, parsedJudgeId]);

  useEffect(() => {
    if (parsedJudgeId && contestId) {
      fetchMultiTeamPenalties(parsedJudgeId, parseInt(contestId), 4);
    }
  }, [parsedJudgeId, contestId, fetchMultiTeamPenalties]);

  if (parsedJudgeId === null) return null;

  return (
    <MultiTeamPenaltyTable
      sheetType={4}
      title="Run Penalties - Multi Team"
      teams={[]}
      penalties={runPenaltiesQuestions}
      judgeId={parsedJudgeId}
      contestId={parseInt(contestId!)}
    />
  );
}