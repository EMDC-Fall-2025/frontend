import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useContestStore } from "../../store/primary_stores/contestStore";
import { useMapContestOrganizerStore } from "../../store/map_stores/mapContestToOrganizerStore";
import { useMapContestJudgeStore } from "../../store/map_stores/mapContestToJudgeStore";
import { useMapClusterToContestStore } from "../../store/map_stores/mapClusterToContestStore";
import { useAuthStore } from "../../store/primary_stores/authStore";
import theme from "../../theme";
import { Contest } from "../../types";

interface ContestOverviewTableProps {
  contests?: Contest[]; 
}

export default function ContestOverviewTable({ contests: propContests }: ContestOverviewTableProps = {}) {
  const { allContests, fetchAllContests } = useContestStore();
  const { contests: organizerContests, fetchContestsByOrganizerId } = useMapContestOrganizerStore();
  const { contest: judgeContest, getContestByJudgeId, contestJudges, fetchJudgesForMultipleContests } = useMapContestJudgeStore();
  const { contestClusters, fetchClustersForMultipleContests } = useMapClusterToContestStore();
  const { role } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [openJudgeDialog, setOpenJudgeDialog] = useState<number | null>(null);

  // Determine which contests to display based on user role
  // Organizers see only their assigned contests, judges see their assigned contest, admins see all contests
  const contests = propContests || (
    role?.user_type === 2 ? organizerContests : 
    role?.user_type === 3 ? (judgeContest ? [judgeContest] : []) : 
    allContests
  );

  // Load contest data based on user role
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (role?.user_type === 2 && role?.user?.id) {
          // For organizers, fetch only their assigned contests
          await fetchContestsByOrganizerId(role.user.id);
        } else if (role?.user_type === 3 && role?.user?.id) {
          // For judges, fetch their assigned contest
          await getContestByJudgeId(role.user.id);
        } else {
          // For admins, fetch all available contests
          await fetchAllContests();
        }
      } catch (error) {
        console.warn("Backend not available");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchAllContests, fetchContestsByOrganizerId, getContestByJudgeId, role]);

  // Fetch judges for each contest to display accurate judge counts
  useEffect(() => {
    if (contests.length > 0) {
      const loadContestJudges = async () => {
        try {
          const contestIds = contests.map(contest => contest.id);
          await fetchJudgesForMultipleContests(contestIds);
        } catch (error) {
          console.warn("Failed to fetch judges for contests");
        }
      };

      loadContestJudges();
    }
  }, [contests, fetchJudgesForMultipleContests]);

  // Fetch clusters for each contest to display accurate cluster information
  useEffect(() => {
    if (contests.length > 0) {
      const loadContestClusters = async () => {
        try {
          const contestIds = contests.map(contest => contest.id);
          await fetchClustersForMultipleContests(contestIds);
        } catch (error) {
          console.warn("Failed to fetch clusters for contests");
        }
      };

      loadContestClusters();
    }
  }, [contests, fetchClustersForMultipleContests]);

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (contests.length === 0) {
    return (
      <Box>
        <Box sx={{ mb: 3}}>
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
            No contests available. 
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      {/* Page header with title and description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Contest Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View contest details, clusters, and judge assignments
        </Typography>
      </Box>

      {/* Grid layout for contest cards */}
      <Grid container spacing={3}>
        {contests.map((contest) => (
          <Grid item xs={12} md={6} lg={4} key={contest.id}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.grey[200]}`,
                borderRadius: 4,
                backgroundColor: "#fff",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                "&:hover": {
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)",
                  transform: "translateY(-4px) scale(1.02)",
                  borderColor: theme.palette.success.main,
                  "&::before": {
                    opacity: 1,
                  },
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                  opacity: 0,
                  transition: "opacity 0.3s ease",
                },
              }}
            >
              <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
                {/* Contest header with name and status */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.grey[800],
                      fontSize: "1.1rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {contest.name}
                  </Typography>
                  {/* Status indicator chip */}
                  <Chip
                    label={contest.is_open ? "Open" : "Not Open"}
                    color={contest.is_open ? "success" : "error"}
                    size="small"
                    sx={{ 
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: "0.65rem",
                      height: "24px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {contest.date}
                </Typography>

                {/* Contest statistics section with key metrics */}
                <Box sx={{ mb: 3, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 2, border: `1px solid ${theme.palette.grey[100]}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.grey[700] }}>
                    Contest Details
                  </Typography>
                  
                  {/* Grid layout for contest metrics */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, backgroundColor: "#fff", borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>Clusters:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {contestClusters[contest.id]?.length || 0}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, backgroundColor: "#fff", borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>Judges:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                        {contestJudges[contest.id]?.length || 0}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, backgroundColor: "#fff", borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>Status:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem", color: contest.is_open ? theme.palette.success.main : theme.palette.error.main }}>
                        {contest.is_open ? "Open" : "Not Open"}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, backgroundColor: "#fff", borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>Date:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.grey[600] }}>
                        {new Date(contest.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Display assigned clusters as chips */}
                {contestClusters[contest.id]?.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.grey[700] }}>
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
                            fontWeight: 600,
                            borderColor: theme.palette.success.main,
                            color: theme.palette.success.main,
                            backgroundColor: theme.palette.success.light + "20",
                            "&:hover": {
                              backgroundColor: theme.palette.success.light,
                              transform: "scale(1.05)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Display assigned judges as chips */}
                {contestJudges[contest.id]?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: theme.palette.grey[700] }}>
                      Judges
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {contestJudges[contest.id].slice(0, 4).map((judge, index) => (
                        <Chip
                          key={index}
                          label={`${judge.first_name} ${judge.last_name}`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main,
                            backgroundColor: theme.palette.primary.light + "20",
                            "&:hover": {
                              backgroundColor: theme.palette.primary.light,
                              transform: "scale(1.05)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        />
                      ))}
                      {contestJudges[contest.id].length > 4 && (
                        <Chip
                          label={`+${contestJudges[contest.id].length - 4} more`}
                          size="small"
                          variant="outlined"
                          onClick={() => setOpenJudgeDialog(contest.id)}
                          sx={{ 
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderColor: theme.palette.grey[400],
                            color: theme.palette.grey[600],
                            backgroundColor: theme.palette.grey[100],
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: theme.palette.grey[200],
                              transform: "scale(1.05)",
                              borderColor: theme.palette.primary.main,
                              color: theme.palette.primary.main,
                            },
                            transition: "all 0.2s ease",
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog to show all judges */}
      {openJudgeDialog !== null && contestJudges[openJudgeDialog] && (
        <Dialog
          open={openJudgeDialog !== null}
          onClose={() => setOpenJudgeDialog(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: "1.25rem",
              borderBottom: `1px solid ${theme.palette.grey[200]}`,
              pb: 2,
            }}
          >
            All Judges
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 400,
                mt: 0.5,
                fontSize: "0.875rem",
              }}
            >
              {contestJudges[openJudgeDialog].length} judge{contestJudges[openJudgeDialog].length !== 1 ? "s" : ""} assigned
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <List sx={{ p: 0 }}>
              {contestJudges[openJudgeDialog].map((judge, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: index % 2 === 0 ? theme.palette.grey[50] : "#fff",
                    border: `1px solid ${theme.palette.grey[200]}`,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.light + "10",
                      borderColor: theme.palette.primary.main,
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemText
                    primary={`${judge.first_name} ${judge.last_name}`}
                    secondary={judge.email || ""}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      color: theme.palette.grey[800],
                      fontSize: "0.95rem",
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.85rem",
                      color: theme.palette.text.secondary,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.grey[200]}` }}>
            <Button
              onClick={() => setOpenJudgeDialog(null)}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
