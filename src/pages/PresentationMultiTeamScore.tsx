import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { presentationQuestions } from "../data/presentationQuestions";
import MultiTeamScoreSheet from "../components/Tables/MultiTeamScoreTable";
import { useMapClusterJudgeStore } from "../store/map_stores/mapClusterToJudgeStore";
import useClusterTeamStore from "../store/map_stores/mapClusterToTeamStore";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import { api } from "../lib/api";

export default function MultiTeamPresentationScore() {
  const { role } = useAuthStore();
  const { judgeId, contestId } = useParams();
  const navigate = useNavigate();
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;
  
  const { fetchAllClustersByJudgeId } = useMapClusterJudgeStore();
  const fetchTeamsByClusterId = useClusterTeamStore((state) => state.fetchTeamsByClusterId);
  const [teams, setTeams] = useState<Array<{ id: number; name: string }>>([]);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    if (role?.user_type === 3 && parsedJudgeId !== role.user.id) {
      navigate(`/multi-team-presentation-score/${role.user.id}/${contestId}/`);
    }
  }, [judgeId, role, contestId, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!parsedJudgeId) return;
      
      try {
        // Get all clusters for this judge
        const allClusters = await fetchAllClustersByJudgeId(parsedJudgeId);
        
        // Filter clusters by contestId (clusters have contest_id field from backend)
        const parsedContestId = contestId ? parseInt(contestId, 10) : null;
        const clusters = parsedContestId 
          ? allClusters.filter((c: any) => c.contest_id === parsedContestId)
          : allClusters;
        
        const clusterIds = clusters.map((c: any) => c.id);
        
        if (clusterIds.length === 0) {
          console.warn(`No clusters found for judge ${parsedJudgeId} in contest ${parsedContestId}`);
          setTeams([]);
          setIsDataReady(true);
          return;
        }
        
        // Fetch scoresheets and teams in parallel for faster loading
        const [clusterResults, teamResults] = await Promise.all([
          // Fetch scoresheets for all clusters (sheetType 1 = Presentation)
          Promise.all(clusterIds.map(async (clusterId) => {
            try {
              const response = await api.get(`/api/mapping/scoreSheet/getSheetsByJudgeAndCluster/${parsedJudgeId}/${clusterId}/`);
              const scoreSheets = response.data?.ScoreSheets || [];
              
              // Filter by sheetType 1 (Presentation) and transform
              return scoreSheets
                .filter((item: any) => item.mapping?.sheetType === 1)
                .map((item: any) => ({
                  ...item.scoresheet,
                  teamId: item.mapping.teamid,
                  judgeId: item.mapping.judgeid,
                  sheetType: item.mapping.sheetType,
                }));
            } catch (error) {
              console.error(`Error fetching scoresheets for cluster ${clusterId}:`, error);
              return [];
            }
          })),
          // Fetch team names from clusters
          Promise.all(clusterIds.map(async (clusterId) => {
            try {
              return await fetchTeamsByClusterId(clusterId);
            } catch (error) {
              console.error(`Error fetching teams for cluster ${clusterId}:`, error);
              return [];
            }
          }))
        ]);
        
        const allSheets = clusterResults.flat();
        
        // Update the store with fetched scoresheets
        useScoreSheetStore.setState({ multipleScoreSheets: allSheets });
        const allTeams = teamResults.flat();
        
        // Create a map of team IDs to team names
        const teamNameMap = new Map<number, string>();
        allTeams.forEach((team: any) => {
          teamNameMap.set(team.id, team.team_name || team.name || `Team ${team.id}`);
        });
        
        // Extract unique teams from scoresheets and add names
        const teamMap = new Map<number, { id: number; name: string }>();
        allSheets.forEach((sheet: any) => {
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
      sheetType={1}
      title="Presentation Scores"
      teams={teams}
      questions={presentationQuestions}
      judgeId={parsedJudgeId}
      seperateJrAndSr={true}
      isDataReady={isDataReady}
    />
  );
}