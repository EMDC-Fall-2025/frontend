/**
 * Main judging page component.
 * Displays judge dashboard with teams and scoresheets for a specific judge.
 */
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
  Skeleton,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useJudgeStore } from "../store/primary_stores/judgeStore";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useEffect, useState, useRef } from "react";
import { useMapClusterJudgeStore } from "../store/map_stores/mapClusterToJudgeStore";
import useClusterTeamStore from "../store/map_stores/mapClusterToTeamStore";
import JudgeDashboardTable from "../components/Tables/JudgeDashboardTable";
import theme from "../theme";
import { Team, ClusterWithContest, Contest } from "../types";
import { api } from "../lib/api";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import { useContestStore } from "../store/primary_stores/contestStore";
import { onDataChange, DataChangeEvent } from "../utils/dataChangeEvents";

export default function Judging() {
  const { judgeId } = useParams();
  const judgeIdNumber = judgeId ? parseInt(judgeId, 10) : null;
  const navigate = useNavigate();
  const { role} = useAuthStore();
  const { judge, fetchJudgeById } = useJudgeStore();
  const { fetchAllClustersByJudgeId } = useMapClusterJudgeStore();
  const mapClusterToTeamError = useClusterTeamStore((state) => state.mapClusterToTeamError);
  const fetchTeamsByClusterId = useClusterTeamStore((state) => state.fetchTeamsByClusterId);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentCluster, setCurrentCluster] = useState<(ClusterWithContest & {
    hasAnyTeamAdvancedByContest?: { [key: number]: boolean };
  }) | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isInitialLoadRef = useRef(true);

  const fetchContestsByTeams = useMapContestToTeamStore((state) => state.fetchContestsByTeams);
  const clearContests = useMapContestToTeamStore((state) => state.clearContests);

  const lastLoadedJudgeIdRef = useRef<number | null>(null);

  /**
   * Loads judge data and teams.
   * - Initial load: Uses cache for teams (fast performance)
   * - Data changes: Uses forceRefresh to bypass cache (ensures accuracy)
   */
  useEffect(() => {
    if (judgeIdNumber) {
      const judgeIdChanged = lastLoadedJudgeIdRef.current !== judgeIdNumber;
      
      if (judgeIdChanged) {
      setTeams([]);
      setHasLoaded(false);
      isInitialLoadRef.current = true;
        lastLoadedJudgeIdRef.current = judgeIdNumber;

      fetchJudgeById(judgeIdNumber);
      fetchAllClustersForJudge(judgeIdNumber); 
      } else {
        
        if (!hasLoaded) {
          fetchJudgeById(judgeIdNumber);
          fetchAllClustersForJudge(judgeIdNumber); 
        } else if (teams.length > 0) {
          
        }
      }
    }
  }, [judgeIdNumber, teams.length, hasLoaded, fetchJudgeById]);



 

  /**
   * Populates contest mappings for teams whenever teams are available or updated.
   */
  useEffect(() => {
    if (teams && teams.length > 0) {
      fetchContestsByTeams(teams);
    }
    return () => {
      clearContests();
    };
  }, [teams, fetchContestsByTeams, clearContests]);

  /**
   * Listens for data changes that affect the judge dashboard.
   * Refreshes data when contests, teams, judges, or clusters are modified.
   */
  useEffect(() => {
    const handleDataChange = async (event: DataChangeEvent) => {
      if (judgeIdNumber) {
        if (event.type === 'contest' && event.action === 'delete') {
          setTeams([]);
          setHasLoaded(false);
          isInitialLoadRef.current = true;
          await fetchAllClustersForJudge(judgeIdNumber, true);
        } else if (event.type === 'team' && (event.action === 'create' || event.action === 'update' || event.action === 'delete')) {
          setTeams([]);
          setHasLoaded(false);
          isInitialLoadRef.current = true;
          // Use forceRefresh to bypass cache and get fresh team data
          await fetchAllClustersForJudge(judgeIdNumber, true);
        } else if (event.type === 'judge' && event.action === 'delete' && event.judgeId === judgeIdNumber && event.clusterId) {
          setTeams([]);
          setHasLoaded(false);
          isInitialLoadRef.current = true;
          await fetchAllClustersForJudge(judgeIdNumber, true);
        } else if (event.type === 'cluster' && (event.action === 'create' || event.action === 'update' || event.action === 'delete')) {
          setTeams([]);
          setHasLoaded(false);
          isInitialLoadRef.current = true;
          // Use forceRefresh to bypass cache and get fresh cluster/team data
          await fetchAllClustersForJudge(judgeIdNumber, true);
        }
      }
    };

    const unsubscribeDataChange = onDataChange(handleDataChange);

    const handleChampionshipUndo = async () => {
      if (judgeIdNumber) {
        setTeams([]);
        setHasLoaded(false);
        isInitialLoadRef.current = true;
        await fetchAllClustersForJudge(judgeIdNumber, true);
      }
    };

    window.addEventListener('championshipUndone', handleChampionshipUndo);

    return () => {
      unsubscribeDataChange();
      window.removeEventListener('championshipUndone', handleChampionshipUndo);
    };
  }, [judgeIdNumber, currentCluster]);

  /**
   * Fetches all clusters and teams for a judge.
   * Filters clusters to only show those from active contests.
   * Determines championship assignments and team advancement status.
   */
  const fetchAllClustersForJudge = async (judgeId: number, forceRefresh: boolean = false) => {
    try {
      const contestStore = useContestStore.getState();
      if (contestStore.allContests.length === 0) {
        contestStore.fetchAllContests().catch(() => {
          //  will show all clusters if contests aren't available
        });
      }

      const [allClusters] = await Promise.all([
        fetchAllClustersByJudgeId(judgeId, forceRefresh)
      ]);
      
      if (allClusters && allClusters.length > 0) {
        const allContests = useContestStore.getState().allContests;
        const activeContestIds = new Set(allContests.map((c: Contest) => c.id));

        const clustersToShow = allClusters.filter((cluster: ClusterWithContest) => {
          if (allContests.length === 0) {
            return true;
          }
          return !cluster.contest_id || activeContestIds.has(cluster.contest_id);
        });

        // If judge has no active clusters (e.g., only inactive redesign/championship),
        // clear any cached teams and contest data to prevent showing stale data
        if (clustersToShow.length === 0) {
          const { clearTeamsByClusterId } = useClusterTeamStore.getState();
          clearTeamsByClusterId();
          clearContests(); // Clear contest data to prevent stale contest mappings
          setTeams([]);
          setCurrentCluster(null);
          isInitialLoadRef.current = false;
          setHasLoaded(true);
          return; // Exit early - judge has no active clusters, should see nothing
        }

        /**
         * Determines if judge has championship assignment in each contest.
         * Used to disable preliminary scoresheets when judge has championship assignment.
         */
        const judgeHasChampionshipAssignmentByContest = new Map<number, boolean>();
        clustersToShow.forEach((cluster: ClusterWithContest) => {
          if (cluster.contest_id) {
            const hasChampionship = cluster.sheet_flags?.championship === true ||
              cluster.cluster_type === 'championship' ||
              cluster.cluster_name?.toLowerCase().includes('championship');
            
            const currentValue = judgeHasChampionshipAssignmentByContest.get(cluster.contest_id) || false;
            judgeHasChampionshipAssignmentByContest.set(cluster.contest_id, currentValue || hasChampionship);
          }
        });

        // Use forceRefresh only when explicitly requested (e.g., after data changes)
        // For initial loads, uses cache for faster performance
        const teamPromises = clustersToShow.map(cluster =>
          fetchTeamsByClusterId(cluster.id, forceRefresh).catch(() => [])
        );
        const teamsArrays = await Promise.all(teamPromises);
        const allTeamsForJudge = teamsArrays.flat();

        const uniqueTeams = allTeamsForJudge.filter((team, index, self) =>
          index === self.findIndex(t => t.id === team.id)
        );
        
        const processedTeams = uniqueTeams.map((t: Team) => ({
                ...t,
                advanced_to_championship: t.advanced_to_championship ?? false
              }));
      
      
        isInitialLoadRef.current = false;
        setTeams(processedTeams as unknown as Team[]);

        fetchContestsByTeams(processedTeams as unknown as Team[]).catch(() => {});

        /**
         * Fetches all teams for each contest to check if any team has advanced.
         * This is needed to disable preliminary scoresheets when any team in a contest advances.
         * Only fetch teams for contests that the judge actually has active clusters in.
         * If a judge has no active clusters (e.g., only in inactive redesign/championship clusters),
         * do not fetch any teams - they should see nothing.
         */
        const hasAnyTeamAdvancedByContest = new Map<number, boolean>();
        
        // Only fetch teams if judge has active clusters
        if (clustersToShow.length > 0) {
          const contestIds = new Set<number>();
          clustersToShow.forEach((cluster: ClusterWithContest) => {
            if (cluster.contest_id) {
              contestIds.add(cluster.contest_id);
            }
          });

          const allTeamsByContest: { [contestId: number]: Team[] } = {};
          
          await Promise.all(
            Array.from(contestIds).map(async (contestId: number) => {
              try {
                const response = await api.get<Team[]>(`/api/mapping/teamToContest/getTeamsByContest/${contestId}/`);
                allTeamsByContest[contestId] = response.data || [];
              } catch (error) {
                console.error(`[Judging] Error fetching teams for contest ${contestId}:`, error);
                allTeamsByContest[contestId] = [];
              }
            })
          );

          /**
           * Checks if any team has advanced to championship in each contest.
           * If any team has advanced, all preliminary scoresheets for all teams
           * in that contest should be disabled.
           */
          Object.keys(allTeamsByContest).forEach((contestIdStr) => {
            const contestId = parseInt(contestIdStr, 10);
            const contestTeams = allTeamsByContest[contestId] || [];
            const hasAdvanced = contestTeams.some((team: Team) => team.advanced_to_championship === true);
            hasAnyTeamAdvancedByContest.set(contestId, hasAdvanced);
          });
        }

        setHasLoaded(true);

        const currentClusterToSet: (ClusterWithContest & {
          judgeHasChampionshipByContest?: { [key: number]: boolean };
          hasAnyTeamAdvancedByContest?: { [key: number]: boolean };
        }) | null = clustersToShow[0] ? { ...clustersToShow[0] } : null;
        
        /**
         * Store championship and advancement data in cluster object for access in JudgeDashboardTable.
         * Convert Maps to plain objects since Maps don't serialize well in React props.
         */
        if (currentClusterToSet) {
          const championshipByContestObj: { [key: number]: boolean } = {};
          judgeHasChampionshipAssignmentByContest.forEach((value, key) => {
            championshipByContestObj[key] = value;
          });
          currentClusterToSet.judgeHasChampionshipByContest = championshipByContestObj;
          
          const hasAdvancedByContestObj: { [key: number]: boolean } = {};
          hasAnyTeamAdvancedByContest.forEach((value, key) => {
            hasAdvancedByContestObj[key] = value;
          });
          currentClusterToSet.hasAnyTeamAdvancedByContest = hasAdvancedByContestObj;
        }
        
        setCurrentCluster(currentClusterToSet);

        const championshipClusters = clustersToShow.filter((cluster: ClusterWithContest) =>
          cluster.cluster_type === 'championship' ||
          cluster.cluster_type === 'redesign' ||
          cluster.cluster_name?.toLowerCase().includes('championship') ||
          cluster.cluster_name?.toLowerCase().includes('redesign')
        );

        if (championshipClusters.length > 0 && processedTeams.length > 0) {
          const contestId = currentClusterToSet?.contest_id;
          if (contestId) {
          api.put(`/api/tabulation/tabulateScores/`, {
            contestid: contestId,
            }).catch((error) => {
              console.error('Tabulation failed:', error);
          });
          }
        }
      } else {
        setTeams([]);
        isInitialLoadRef.current = false;
        setHasLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching teams/clusters for judge:', error);
      setTeams([]);
      isInitialLoadRef.current = false;
      setHasLoaded(true);
    }
  };




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

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard value={teams.length} label="Teams Assigned" />
              </Grid>
            </Grid>

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
                ) : !hasLoaded ? (
                  <Box sx={{ py: 2 }}>
                    {/* Skeleton placeholders to avoid flicker while loading teams */}
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          borderBottom: `1px solid ${theme.palette.grey[200]}`,
                          py: 1.25,
                        }}
                      >
                        <Skeleton variant="circular" width={28} height={28} />
                        <Skeleton variant="text" width="30%" height={24} />
                        <Skeleton variant="text" width="20%" height={20} />
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                          <Skeleton variant="rounded" width={120} height={32} />
                          <Skeleton variant="rounded" width={120} height={32} />
                          <Skeleton variant="rounded" width={120} height={32} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
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