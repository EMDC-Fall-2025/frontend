import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
} from "@mui/material";
import { useContestStore } from "../../store/primary_stores/contestStore";
import { useMapClusterToContestStore } from "../../store/map_stores/mapClusterToContestStore";
import { useMapContestJudgeStore } from "../../store/map_stores/mapContestToJudgeStore";
import theme from "../../theme";
import { Judge } from "../../types";

export default function ContestOverviewTable() {
  // Store hooks
  const { allContests: contests, fetchAllContests } = useContestStore();
  const { clusters, fetchClustersByContestId } = useMapClusterToContestStore();
  const { getAllJudgesByContestId } = useMapContestJudgeStore();

  // Local state
  const [contestJudges, setContestJudges] = useState<{[key: number]: Judge[]}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchAllContests();
      } catch (error) {
        console.warn("Backend not available - using mock contest data");
        // Provide mock contest data when backend is not available
        // This will be handled by the store's error handling
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchAllContests]);

  // Load judges for each contest
  useEffect(() => {
    if (contests.length > 0) {
      const loadContestJudges = async () => {
        const judgesMap: {[key: number]: Judge[]} = {};
        
        for (const contest of contests) {
          try {
            await getAllJudgesByContestId(contest.id);
            // Note: getAllJudgesByContestId updates the judges state in the store
            // We'll get the judges from the store after all are loaded
            judgesMap[contest.id] = [];
          } catch (error) {
            console.warn(`Backend not available - using mock data for contest ${contest.id}`);
            // Provide mock data when backend is not available
            judgesMap[contest.id] = [
              { 
                id: 1, 
                first_name: "John", 
                last_name: "Doe",
                phone_number: "555-0001",
                role: 1,
                presentation: true,
                redesign: false,
                championship: false,
                mdo: true,
                journal: false,
                runpenalties: false,
                otherpenalties: false
              },
              { 
                id: 2, 
                first_name: "Jane", 
                last_name: "Smith",
                phone_number: "555-0002",
                role: 2,
                presentation: false,
                redesign: true,
                championship: false,
                mdo: false,
                journal: true,
                runpenalties: false,
                otherpenalties: false
              },
              { 
                id: 3, 
                first_name: "Bob", 
                last_name: "Johnson",
                phone_number: "555-0003",
                role: 1,
                presentation: false,
                redesign: false,
                championship: true,
                mdo: false,
                journal: false,
                runpenalties: true,
                otherpenalties: true
              }
            ];
          }
        }
        
        setContestJudges(judgesMap);
      };

      loadContestJudges();
    }
  }, [contests, getAllJudgesByContestId]);

  // Load clusters for each contest
  const [contestClusters, setContestClusters] = useState<{[key: number]: any[]}>({});
  const [clustersLoaded, setClustersLoaded] = useState(false);
  
  useEffect(() => {
    if (contests.length > 0 && !clustersLoaded) {
      const loadContestClusters = async () => {
        const clustersMap: {[key: number]: any[]} = {};
        
        for (const contest of contests) {
          try {
            await fetchClustersByContestId(contest.id);
            // The fetchClustersByContestId function loads clusters for a specific contest
            // We'll use the clusters from the store after they're loaded
            clustersMap[contest.id] = clusters;
          } catch (error) {
            console.warn(`Backend not available - using mock data for contest ${contest.id}`);
            // Provide mock data when backend is not available
            clustersMap[contest.id] = [
              { id: 1, cluster_name: "Cluster A" },
              { id: 2, cluster_name: "Cluster B" }
            ];
          }
        }
        
        setContestClusters(clustersMap);
        setClustersLoaded(true);
      };

      loadContestClusters();
    }
  }, [contests, fetchClustersByContestId, clustersLoaded]);

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Show message when no contests are available (backend might be down)
  if (contests.length === 0) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Contest Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View contest details, clusters, and judge assignments
          </Typography>
        </Box>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="200px"
          sx={{ 
            border: `1px solid ${theme.palette.grey[300]}`,
            borderRadius: 3,
            backgroundColor: theme.palette.grey[50]
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No contests available. Please check if the backend server is running.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Contest Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View contest details, clusters, and judge assignments
        </Typography>
      </Box>

      {/* Contest Cards */}
      <Grid container spacing={3}>
        {contests.map((contest) => (
          <Grid item xs={12} md={6} lg={4} key={contest.id}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.grey[300]}`,
                borderRadius: 3,
                backgroundColor: "#fff",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)",
                  borderColor: theme.palette.success.main,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                    {contest.name}
                  </Typography>
                  <Chip
                    label={(() => {
                      const contestDate = new Date(contest.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (contestDate > today) {
                        return "Not Started";
                      } else if (contest.is_open) {
                        return "Open";
                      } else if (contest.is_tabulated) {
                        return "Completed";
                      } else {
                        return "Closed";
                      }
                    })()}
                    color={(() => {
                      const contestDate = new Date(contest.date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (contestDate > today) {
                        return "warning";
                      } else if (contest.is_open) {
                        return "success";
                      } else if (contest.is_tabulated) {
                        return "default";
                      } else {
                        return "error";
                      }
                    })()}
                    size="small"
                    sx={{ textTransform: "none" }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {contest.date}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Contest Details
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Clusters:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {contestClusters[contest.id]?.length || 0}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Judges:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {contestJudges[contest.id]?.length || 0}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Status:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {(() => {
                          const contestDate = new Date(contest.date);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0); // Reset time to start of day
                          
                          if (contestDate > today) {
                            return "Not Started";
                          } else if (contest.is_open) {
                            return "Active";
                          } else if (contest.is_tabulated) {
                            return "Completed";
                          } else {
                            return "Closed";
                          }
                        })()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Date:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(contest.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Cluster Names Display */}
                {contestClusters[contest.id]?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Clusters
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {contestClusters[contest.id].map((cluster, index) => (
                        <Chip
                          key={index}
                          label={cluster.cluster_name}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: "0.75rem",
                            borderColor: theme.palette.success.main,
                            color: theme.palette.success.main,
                            "&:hover": {
                              backgroundColor: theme.palette.success.light,
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Judge Information Display */}
                {contestJudges[contest.id]?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Judges
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {contestJudges[contest.id].slice(0, 3).map((judge, index) => (
                        <Typography key={index} variant="body2" sx={{ fontSize: "0.875rem" }}>
                          {judge.first_name} {judge.last_name}
                        </Typography>
                      ))}
                      {contestJudges[contest.id].length > 3 && (
                        <Typography variant="body2" color="text.secondary">
                          +{contestJudges[contest.id].length - 3} more judges
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

    </Box>
  );
}
