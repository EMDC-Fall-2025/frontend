// Judging.tsx
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useJudgeStore } from "../store/primary_stores/judgeStore";
import { useRankingsStore } from "../store/primary_stores/rankingsStore";
import { useEffect, useState } from "react";
import { useMapClusterJudgeStore } from "../store/map_stores/mapClusterToJudgeStore";
import useClusterTeamStore from "../store/map_stores/mapClusterToTeamStore";
import JudgeDashboardTable from "../components/Tables/JudgeDashboardTable";
import theme from "../theme";
import { Team } from "../types";

export default function Judging() {
  const { judgeId } = useParams();
  const judgeIdNumber = judgeId ? parseInt(judgeId, 10) : null;
  const { judge, fetchJudgeById, clearJudge } = useJudgeStore();
  const { listAdvancers } = useRankingsStore();
  const { fetchClusterByJudgeId, fetchAllClustersByJudgeId, clearCluster } = useMapClusterJudgeStore();
  const {
    mapClusterToTeamError,
    clearClusterTeamMappings,
    clearTeamsByClusterId,
    fetchTeamsByClusterId,
  } = useClusterTeamStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentCluster, setCurrentCluster] = useState<any>(null);
  const [advancers, setAdvancers] = useState<any[]>([]);
  const [showAdvancers, setShowAdvancers] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleListAdvancers = async () => {
    // Get contest ID from the current cluster or the first cluster
    let contestId = null;
    
    
    if (currentCluster?.contest_id) {
      contestId = currentCluster.contest_id;
    } else if (teams.length > 0 && (teams[0] as any).contestid) {
      contestId = (teams[0] as any).contestid;
    } else if (teams.length > 0 && (teams[0] as any).contest_id) {
      contestId = (teams[0] as any).contest_id;
    }
    
    if (!contestId) {
      console.error('No contest ID found in cluster or team data');
      return;
    }

    try {
      const result = await listAdvancers(contestId);
      setAdvancers(result.advanced || []);
      setShowAdvancers(true);
    } catch (error) {
      console.error('Error fetching advancers:', error);
      setAdvancers([]);
      setShowAdvancers(false);
    }
  };

  useEffect(() => {
    if (judgeIdNumber) {
      fetchJudgeById(judgeIdNumber);
      // Fetch all clusters for this judge across all contests
      fetchAllClustersForJudge(judgeIdNumber);
    }
  }, [judgeIdNumber]);


  // to fetch all clusters for a judge using stores
  const fetchAllClustersForJudge = async (judgeId: number) => {
    try {
      //  fetch all clusters for the judge
      const allClusters = await fetchAllClustersByJudgeId(judgeId);
      
      if (allClusters && allClusters.length > 0) {
        // Check if we have any championship/redesign clusters that are active
        const championshipClusters = allClusters.filter((cluster: any) => 
          cluster.cluster_type === 'championship' || 
          cluster.cluster_type === 'redesign' ||
          // Fallback: check by name for existing clusters (transition period)
          cluster.cluster_name?.toLowerCase().includes('championship') ||
          cluster.cluster_name?.toLowerCase().includes('redesign')
        );
        
        // Check if championship clusters actually have teams
        let hasTeamsInChampionshipClusters = false;
        for (const cluster of championshipClusters) {
          try {
            const teams = await fetchTeamsByClusterId(cluster.id);
            if (teams && teams.length > 0) {
              hasTeamsInChampionshipClusters = true;
              break;
            }
          } catch (error) {
            // Silently continue if cluster has no teams
          }
        }
        
        let filteredClusters = allClusters;
        
        if (hasTeamsInChampionshipClusters) {
          // Only show championship and redesign clusters after advancement
          filteredClusters = championshipClusters;
        } else {
          // Show all clusters (preliminary clusters) when no teams in championship clusters
          filteredClusters = allClusters;
        }
        
        // Fetch teams from filtered clusters only
        const allTeams: Team[] = [];
        
        for (const cluster of filteredClusters) {
          try {
            // Use store function to fetch teams for this cluster
            const teams = await fetchTeamsByClusterId(cluster.id);
            
            if (teams && teams.length > 0) {
              // Map teams to include advanced_to_championship field
              const mappedTeams = teams.map((t: any) => ({
                ...t,
                advanced_to_championship: t.advanced_to_championship ?? false
              }));
              allTeams.push(...mappedTeams);
            }
          } catch (error: any) {
            console.error(`Error fetching teams for cluster ${cluster.id}:`, error);
          }
        }
        
        setTeams(allTeams);
        setHasLoaded(true);
        
        // Set the current cluster to the first cluster that has teams
        let currentClusterToSet = null;
        for (const cluster of filteredClusters) {
          try {
            const teams = await fetchTeamsByClusterId(cluster.id);
            if (teams && teams.length > 0) {
              currentClusterToSet = cluster;
              break;
            }
          } catch (error) {
            // Silently continue
          }
        }
        
        setCurrentCluster(currentClusterToSet);
      } else {
        setTeams([]);
        setHasLoaded(true);
      }
    } catch (error: any) {
      console.error('Error fetching all clusters for judge:', error);
      setHasLoaded(true);
      // Fallback to original single cluster fetch
      fetchClusterByJudgeId(judgeId);
    }
  };

  useEffect(() => {
    const handlePageHide = () => {
      clearCluster();
      clearClusterTeamMappings();
      clearTeamsByClusterId();
      clearJudge();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  const StatCard = ({ value, label }: { value: number | string; label: string }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.grey[300]}`,
        backgroundColor: "#fff",
      }}
    >
      <CardContent sx={{ py: 3, px: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: theme.palette.success.dark, lineHeight: 1, mb: 0.5 }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

 
  try {
    return (
      <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        {mapClusterToTeamError ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Typography variant="h6" color="error">
              Error loading judge dashboard. Please refresh the page.
            </Typography>
          </Box>
        ) : (
          <>
            <Stack spacing={1} sx={{ mb: 3, mt: 3 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800, 
                  color: theme.palette.success.main,
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" }
                }}
              >
                Judge Dashboard
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
              >
                {judge?.first_name} {judge?.last_name}
              </Typography>
            </Stack>


            {/* Stat Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard value={teams.length} label="Teams Assigned" />
              </Grid>
          
            </Grid>

            {/* List Advancers Button */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                onClick={handleListAdvancers}
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  "&:hover": {
                    borderColor: theme.palette.primary.dark,
                    bgcolor: theme.palette.primary.light,
                  },
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                List Championship Advancers
              </Button>
            </Box>

            {/* Advancers Display */}
            {showAdvancers && (
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Championship Advancers
                </Typography>
                {advancers.length > 0 ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Total advanced teams: {advancers.length}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {advancers.map((team) => (
                        <Box
                          key={team.id}
                          sx={{
                            p: 1,
                            backgroundColor: theme.palette.success.light,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.success.main}`,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {team.team_name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No teams have advanced to championship yet.
                  </Typography>
                )}
              </Box>
            )}

            {/* Table Section */}
            <Box
              sx={{
                border: `1px solid ${theme.palette.grey[300]}`,
                borderRadius: 3,
                backgroundColor: "#fff",
              }}
            >
              <Box sx={{ px: 3, py: 2 , backgroundColor:" rgba(46, 125, 50, 0.06)"}}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Team Overview
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ px: 3, pb: 3 }}>
                {teams.length > 0 ? (
                  <JudgeDashboardTable teams={teams} currentCluster={currentCluster} />
                ) : hasLoaded ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No teams available for this judge.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Please contact the organizer if you believe this is an error.
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
  } catch (error) {
    console.error('Error in Judging component:', error);
    return (
      <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Typography variant="h6" color="error">
              Error loading judge dashboard. Please refresh the page.
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }
}
