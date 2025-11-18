import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { journalQuestions } from "../data/journalQuestions";
import MultiTeamScoreSheet from "../components/Tables/MultiTeamScoreTable";
import { useMapClusterJudgeStore } from "../store/map_stores/mapClusterToJudgeStore";
import useClusterTeamStore from "../store/map_stores/mapClusterToTeamStore";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import { api } from "../lib/api";
import { ClusterWithContest, ScoreSheetMappingWithSheet, Team, ScoreSheet, Question } from "../types";

/**
 * Page component for multi-team journal scoring.
 * Allows judges to score multiple teams simultaneously for journal scoresheets.
 */
export default function MultiTeamJournalScore() {
  const { role } = useAuthStore();
  const { judgeId, contestId } = useParams();
  const navigate = useNavigate();
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;
  
  const { fetchAllClustersByJudgeId } = useMapClusterJudgeStore();
  const fetchTeamsByClusterId = useClusterTeamStore((state) => state.fetchTeamsByClusterId);
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([]);
  const [isDataReady, setIsDataReady] = useState(false);

  /**
   * Ensures judges can only access their own scoring pages.
   * Redirects to correct URL if judge ID doesn't match authenticated user.
   */
  useEffect(() => {
    if (role?.user_type === 3 && parsedJudgeId !== role.user.id) {
      navigate(`/multi-team-journal-score/${role.user.id}/${contestId}/`);
    }
  }, [judgeId, role, contestId, navigate, parsedJudgeId]);

  /**
   * Fetches clusters, scoresheets, and teams for the judge.
   * Filters by contest if contestId is provided.
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!parsedJudgeId) return;
      
      try {
        const allClusters = await fetchAllClustersByJudgeId(parsedJudgeId);
        const parsedContestId = contestId ? parseInt(contestId, 10) : null;
        const clusters: ClusterWithContest[] = parsedContestId 
          ? allClusters.filter((c: ClusterWithContest) => c.contest_id === parsedContestId)
          : allClusters;
        
        const clusterIds = clusters.map((c: ClusterWithContest) => c.id);
        
        if (clusterIds.length === 0) {
          setTeams([]);
          setIsDataReady(true);
          return;
        }
        
        const [clusterResults, teamResults] = await Promise.all([
          Promise.all(clusterIds.map(async (clusterId: number): Promise<ScoreSheet[]> => {
            try {
              const response = await api.get<{ ScoreSheets: ScoreSheetMappingWithSheet[] }>(
                `/api/mapping/scoreSheet/getSheetsByJudgeAndCluster/${parsedJudgeId}/${clusterId}/`
              );
              const scoreSheets = response.data?.ScoreSheets || [];
              
              return scoreSheets
                .filter((item: ScoreSheetMappingWithSheet) => item.mapping?.sheetType === 2)
                .map((item: ScoreSheetMappingWithSheet): ScoreSheet => ({
                  ...(item.scoresheet || {}),
                  teamId: item.mapping.teamid,
                  judgeId: item.mapping.judgeid,
                  sheetType: item.mapping.sheetType,
                } as ScoreSheet));
            } catch (error) {
              console.error(`Error fetching scoresheets for cluster ${clusterId}:`, error);
              return [];
            }
          })),
          Promise.all(clusterIds.map(async (clusterId: number): Promise<Team[]> => {
            try {
              return await fetchTeamsByClusterId(clusterId);
            } catch (error) {
              console.error(`Error fetching teams for cluster ${clusterId}:`, error);
              return [];
            }
          }))
        ]);
        
        const allSheets = clusterResults.flat();
        useScoreSheetStore.setState({ multipleScoreSheets: allSheets });
        const allTeams = teamResults.flat();
        
        const teamNameMap = new Map<number, string>();
        allTeams.forEach((team: Team) => {
          teamNameMap.set(team.id, team.team_name || `Team ${team.id}`);
        });
        
        const teamMap = new Map<number, { id: number; name: string }>();
        allSheets.forEach((sheet: ScoreSheet) => {
          if (sheet.teamId) {
            const teamName = teamNameMap.get(sheet.teamId) || `Team ${sheet.teamId}`;
            teamMap.set(sheet.teamId, {
              id: sheet.teamId,
              name: teamName
            });
          }
        });
        
        setTeams(Array.from(teamMap.values()));
        setIsDataReady(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        setTeams([]);
        setIsDataReady(true);
      }
    };

    fetchData();
  }, [parsedJudgeId, contestId, fetchAllClustersByJudgeId, fetchTeamsByClusterId]);

  if (parsedJudgeId === null) return null;

  return (
    <MultiTeamScoreSheet
      sheetType={2}
      title="Journal Scores"
      teams={teams}
      questions={journalQuestions as Question[]}
      judgeId={parsedJudgeId}
      seperateJrAndSr={true}
      isDataReady={isDataReady}
    />
  );
}