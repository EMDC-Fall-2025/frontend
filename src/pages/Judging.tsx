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
import { useParams, useNavigate } from "react-router-dom";
import { useJudgeStore } from "../store/primary_stores/judgeStore";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useEffect, useState, useRef } from "react";
import { useMapClusterJudgeStore } from "../store/map_stores/mapClusterToJudgeStore";
import useClusterTeamStore from "../store/map_stores/mapClusterToTeamStore";
import JudgeDashboardTable from "../components/Tables/JudgeDashboardTable";
import theme from "../theme";
import { Team } from "../types";
import { api } from "../lib/api";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function Judging() {
  const { judgeId } = useParams();
  const judgeIdNumber = judgeId ? parseInt(judgeId, 10) : null;
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const { judge, fetchJudgeById, clearJudge } = useJudgeStore();
  const { fetchAllClustersByJudgeId, clearCluster } = useMapClusterJudgeStore();
  // Use selectors to subscribe to team updates
  const mapClusterToTeamError = useClusterTeamStore((state) => state.mapClusterToTeamError);
  const fetchTeamsByJudgeId = useClusterTeamStore((state) => state.fetchTeamsByJudgeId);
  const fetchTeamsByClusterId = useClusterTeamStore((state) => state.fetchTeamsByClusterId);
  const teamsByClusterId = useClusterTeamStore((state) => state.teamsByClusterId);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentCluster, setCurrentCluster] = useState<any>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isInitialLoadRef = useRef(true);


  useEffect(() => {
    if (judgeIdNumber) {
      // Clear teams on initial load to prevent showing stale data
      setTeams([]);
      setHasLoaded(false);
      isInitialLoadRef.current = true;
      fetchJudgeById(judgeIdNumber);
      // Fetch all clusters for this judge across all contests
      fetchAllClustersForJudge(judgeIdNumber);
    }
  }, [judgeIdNumber]);

  // Simplified: Fetch teams directly for judge, then fetch clusters only for filtering logic
  const fetchAllClustersForJudge = async (judgeId: number) => {
    try {
      // Fetch teams and clusters in parallel
      const [allTeamsForJudge, allClusters] = await Promise.all([
        fetchTeamsByJudgeId(judgeId),
        fetchAllClustersByJudgeId(judgeId)
      ]);
      
      if (allClusters && allClusters.length > 0) {
        // Check if we have any championship/redesign clusters
        const championshipClusters = allClusters.filter((cluster: any) => 
          cluster.cluster_type === 'championship' || 
          cluster.cluster_type === 'redesign' ||
          cluster.cluster_name?.toLowerCase().includes('championship') ||
          cluster.cluster_name?.toLowerCase().includes('redesign')
        );
        
        // Group clusters by contest_id
        const clustersByContest: {[contestId: number | string]: any[]} = {};
        const clustersWithoutContest: any[] = [];
        
        allClusters.forEach((cluster: any) => {
          const contestId = cluster.contest_id;
          if (contestId) {
            const key = contestId.toString();
            if (!clustersByContest[key]) {
              clustersByContest[key] = [];
            }
            clustersByContest[key].push(cluster);
          } else {
            clustersWithoutContest.push(cluster);
          }
        });
        
        // Check if championship clusters have teams by checking store cache only
        // Avoid API calls during initial load to prevent flash and store updates
        const championshipCheckPromises = championshipClusters.map(async (cluster: any) => {
          // For initial load, only check store cache (no API calls to prevent flash)
          if (isInitialLoadRef.current) {
            const cachedTeams = teamsByClusterId[cluster.id];
            return { 
              cluster, 
              hasTeams: cachedTeams && cachedTeams.length > 0, 
              contestId: cluster.contest_id 
            };
          }
          // For subsequent loads, we can fetch if needed
          try {
            const teams = await fetchTeamsByClusterId(cluster.id);
            return { cluster, hasTeams: teams && teams.length > 0, contestId: cluster.contest_id };
          } catch (error) {
            return { cluster, hasTeams: false, contestId: cluster.contest_id };
          }
        });
        
        const championshipChecks = await Promise.all(championshipCheckPromises);
        
        // Determine which clusters to show per contest
        const clustersToShow: any[] = [];
        const contestIds = Object.keys(clustersByContest);
        
        for (const contestIdKey of contestIds) {
          const contestId = parseInt(contestIdKey, 10);
          const contestClusters = clustersByContest[contestIdKey];
          const contestChampionshipClusters = contestClusters.filter((c: any) => 
            championshipClusters.some((cc: any) => cc.id === c.id)
          );
          
          const hasTeamsInThisContestChampionship = championshipChecks.some(check => 
            check.contestId === contestId && check.hasTeams
          );
          
          if (hasTeamsInThisContestChampionship) {
            clustersToShow.push(...contestChampionshipClusters);
        } else {
            clustersToShow.push(...contestClusters);
          }
        }
        
        clustersToShow.push(...clustersWithoutContest);
        
        // Process teams from direct fetch
        // Note: allTeamsForJudge already contains only teams from judge's clusters
        // (fetched via the backend endpoint that filters by judge's clusters)
        const processedTeams = allTeamsForJudge.map((t: any) => ({
                ...t,
                advanced_to_championship: t.advanced_to_championship ?? false
              }));
      
      
        isInitialLoadRef.current = false;
        setTeams(processedTeams);

        setHasLoaded(true);
        
        // Set current cluster 
        const currentClusterToSet = clustersToShow[0] || null;
        
        setCurrentCluster(currentClusterToSet);

        // Run tabulation in background if needed
        const contestId = (currentClusterToSet as any)?.contest_id || (processedTeams[0] as any)?.contest_id || (processedTeams[0] as any)?.contestid;
        if (contestId && championshipClusters.length > 0) {
          api.put(`/api/tabulation/tabulateScores/`, {
            contestid: contestId,
          }).then(() => {
            // Refetch teams after tabulation
            return fetchTeamsByJudgeId(judgeId, true);
          }).then((refreshedTeams) => {
            if (refreshedTeams && refreshedTeams.length > 0) {
              const processed = refreshedTeams.map((t: any) => ({
                ...t,
                advanced_to_championship: t.advanced_to_championship ?? false
              }));
              setTeams(processed);
            }
          }).catch((error) => {
            console.error('Tabulation or refresh failed:', error);
          });
        }
      } else {
        // No clusters, but still set teams if we got them
        if (allTeamsForJudge && allTeamsForJudge.length > 0) {
          const processedTeams = allTeamsForJudge.map((t: any) => ({
            ...t,
            advanced_to_championship: t.advanced_to_championship ?? false
          }));
          setTeams(processedTeams);
      } else {
        setTeams([]);
        }
        isInitialLoadRef.current = false;
        setHasLoaded(true);
      }
    } catch (error: any) {
      console.error('Error fetching teams/clusters for judge:', error);
      setTeams([]);
      isInitialLoadRef.current = false;
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    const handlePageHide = () => {
      clearCluster();
      clearJudge();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [clearCluster, clearJudge]);


  const StatCard = ({ value, label }: { value: number | string; label: string }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.grey[200]}`,
        background: `linear-gradient(135deg, #ffffff 0%, #fafafa 100%)`,
        boxShadow: `0 2px 8px rgba(76, 175, 80, 0.08)`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: `0 4px 16px rgba(76, 175, 80, 0.12)`,
          transform: 'translateY(-1px)',
        },
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, position: 'relative' }}>
        <Box sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: theme.palette.success.light,
          opacity: 0.1,
        }} />
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: theme.palette.success.dark, lineHeight: 1, mb: 0.5 }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

 
  try {
    return (
      <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
        {(role?.user_type === 1 || role?.user_type === 2) && (
          <Container
            maxWidth="lg"
            sx={{
              px: { xs: 1, sm: 2 },
              mt: { xs: 1, sm: 2 },
            }}
          >
            <Button
              onClick={() => navigate(-1)}
              startIcon={<ArrowBackIcon />}
              sx={{
                textTransform: "none",
                color: theme.palette.success.dark,
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                fontWeight: 500,
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: "8px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(76, 175, 80, 0.08)",
                  transform: "translateX(-2px)",
                },
              }}
            >
              Back to Admin Dashboard
            </Button>
          </Container>
        )}
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        {mapClusterToTeamError ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Typography variant="h6" color="error">
              Error loading judge dashboard. Please refresh the page.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              opacity: hasLoaded ? 1 : 0,
              transition: hasLoaded ? `opacity ${isInitialLoadRef.current ? '0.6s' : '0.1s'} ease-in` : 'none',
              pointerEvents: hasLoaded ? 'auto' : 'none',
            }}
          >
            <Stack spacing={1} sx={{ mb: 2, mt: 2 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 400, 
                  color: theme.palette.success.main,
                  fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
                  fontFamily: '"DM Serif Display", "Georgia", serif',
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
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
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard value={teams.length} label="Teams Assigned" />
              </Grid>
            </Grid>

            {/* Table Section */}
            <Box
              sx={{
                border: `1px solid ${theme.palette.grey[300]}`,
                borderRadius: 3,
                backgroundColor: "#fff",
              }}
            >
              <Box sx={{ px: 3, py: 1.5 , backgroundColor:" rgba(46, 125, 50, 0.06)"}}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Team Overview
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ px: 3, pb: 2 }}>
                {teams.length > 0 ? (
                  <JudgeDashboardTable teams={teams} currentCluster={currentCluster} />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    {/* Only show back button for admin (user_type 1) or organizer (user_type 2) */}
                    {(role?.user_type === 1 || role?.user_type === 2) && (
                      <Button
                        onClick={() => navigate(-1)}
                        startIcon={<ArrowBackIcon />}
                        sx={{
                          textTransform: "none",
                          color: theme.palette.success.dark,
                          fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                          fontWeight: 500,
                          px: { xs: 1.5, sm: 2 },
                          py: { xs: 0.75, sm: 1 },
                          borderRadius: "8px",
                          mb: 3,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "rgba(76, 175, 80, 0.08)",
                            transform: "translateX(-2px)",
                          },
                        }}
                      >
                        Back
                      </Button>
                    )}
                    <Typography variant="h6" color="text.secondary">
                      No teams available for this judge.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Please contact the organizer if you believe this is an error.
                    </Typography>
                  </Box>
                )}
              </Box>
              </Box>
            </Box>
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
