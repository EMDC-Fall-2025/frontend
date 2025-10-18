import { Button, Box, Checkbox, Collapse, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, alpha, Chip, CircularProgress } from "@mui/material";
import  { useEffect, useState } from "react";
import theme from "../../theme";
import { TriangleIcon, Trophy} from "lucide-react";
import { useAuthStore } from "../../store/primary_stores/authStore";
import { useRankingsStore } from "../../store/primary_stores/rankingsStore";
import { useNavigate } from "react-router-dom";

// Extended cluster type for rankings
interface ClusterWithTeams {
  id: number;
  cluster_name: string;
  teams: TeamWithStatus[];
}

interface TeamWithStatus {
  id: number;
  team_name: string;
  school_name: string;
  total_score: number;
  cluster_rank: number;
  status: 'completed' | 'in_progress' | 'not_started';
}

// Rankings component for displaying team rankings by cluster
const Ranking = () => {
    const navigate = useNavigate();
    const [selectedTeams, setSelectedTeams] = useState<number[]>([])
    const [openCluster, setOpenCluster] = useState<Set<number>>(new Set())
    const { isAuthenticated, role } = useAuthStore()
    
    const { 
      contests, 
      clusters, 
      selectedContest, 
      isLoadingRankings, 
      rankingsError,
      fetchContestsForOrganizer,
      fetchClustersWithTeamsForContest,
      setSelectedContest
    } = useRankingsStore()

    // Load contests for organizer
    useEffect(() => {
      const loadContests = async () => {
        try {
          if (!isAuthenticated) {
            console.error('Please log in to view rankings')
            return
          }
          const organizerId = role?.user?.id
          if (!organizerId) {
            console.error('Organizer ID not found')
            return
          }
          await fetchContestsForOrganizer(organizerId)
        } catch (e) {
          console.error('Failed to load contests:', e)
        }
      }
      if (isAuthenticated) loadContests()
    }, [isAuthenticated, role, fetchContestsForOrganizer])

    // Load clusters and teams for selected contest
    useEffect(() => {
      const loadClusters = async () => {
        if (!selectedContest) return
        try {
          await fetchClustersWithTeamsForContest(selectedContest.id)
        } catch (e) {
          console.error('Failed to load contest data:', e)
        }
      }
      loadClusters()
    }, [selectedContest, fetchClustersWithTeamsForContest])

    // autoselect
    useEffect(() => {
      if (!selectedContest && contests.length > 0) {
        setSelectedContest(contests[0])
      }
    }, [contests, selectedContest, setSelectedContest])



    const toggleCluster = (id: number) => {
      setOpenCluster((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    }

    const handleSelect = (teamId: number) => {
      setSelectedTeams((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
    }

    // Show loading state
    if (isLoadingRankings) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      )
    }

    // Show error state
    if (rankingsError) {
      return (
        <Box sx={{ maxWidth: 900, px: { xs: 1, sm: 2 }, mb: 4, mt: 3 }}>
          <Typography color="error" variant="h6">
            Error: {rankingsError}
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ maxWidth: 900, px: { xs: 1, sm: 2 }, mb: 4, mt: 3 }}>
        {/* contest selection */}
        {contests.length > 0 && (
          <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.grey[200]}` }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                fontWeight: 600,
                fontSize: { xs: "1rem", sm: "1.25rem" }
              }}
            >
              Select Contest
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {contests.map((contest) => (
                <Button
                  key={contest.id}
                  variant={selectedContest?.id === contest.id ? "contained" : "outlined"}
                  onClick={() => setSelectedContest(contest)}
                  sx={{
                    bgcolor: selectedContest?.id === contest.id ? theme.palette.success.main : 'transparent',
                    color: selectedContest?.id === contest.id ? 'white' : theme.palette.success.main,
                    borderColor: theme.palette.success.main,
                    '&:hover': {
                      bgcolor: selectedContest?.id === contest.id ? theme.palette.success.dark : theme.palette.success.light,
                      color: 'white'
                    },
                    textTransform: 'none',
                    borderRadius: 2,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 0.5, sm: 1 },
                    fontSize: { xs: "0.75rem", sm: "0.875rem" }
                  }}
                >
                  {contest.name}
                </Button>
              ))}
            </Box>
          </Paper>
        )}
        {/* Stats Card */}
        <Paper
            elevation={1}
            sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            border: `1px solid ${theme.palette.grey[200]}`,
            bgcolor: "white",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "right", justifyContent: "space-between" }}>
            <Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 0.5,
                    fontSize: { xs: "0.7rem", sm: "0.75rem" }
                  }}
                >
                Selected Teams
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    color: theme.palette.success.main,
                    fontSize: { xs: "1.5rem", sm: "2.125rem" }
                  }}
                >
                {selectedTeams.length}
                </Typography>
            </Box>
            <Box sx={{ color: theme.palette.grey[400] }}>
                <Trophy size={20} />
            </Box>
            </Box>
            </Paper>
       
        {/*  spacing between stats card and clusters */}
        <Box sx={{ mb: 3 }} />
  
        {(clusters as ClusterWithTeams[]).map((cluster) => {
          const isOpen = openCluster.has(cluster.id)
          return (
            <Paper
                key={cluster.id}
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.grey[200]}`,
                    mb: 2,
                    maxWidth: "100%",
                    width: "100%",
                    overflow: "hidden"
                }}
                >
        {/* Fixed Cluster Header - Not Scrollable */}
        <Box 
          sx={{ 
            bgcolor: theme.palette.grey[200], 
            borderBottom: `1px solid ${theme.palette.divider}`, 
            py: { xs: 1, sm: 1.5 }, 
            px: { xs: 1, sm: 2 },
            cursor: "pointer"
          }} 
          onClick={() => toggleCluster(cluster.id)}
        >
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            flexWrap: "nowrap", 
            gap: 1,
            minWidth: 0  // Allow flex items to shrink
          }}>
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1, 
              minWidth: 0,
              flex: 1  // Take available space
            }}>
              <IconButton
                size="small"
                onClick={(e) => {e.stopPropagation();toggleCluster(cluster.id) } }
                sx={{
                  mr: 1,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms",
                  p: { xs: 0.5, sm: 1 },
                  flexShrink: 0  // Don't shrink the button
                }}
              >
                <TriangleIcon color={theme.palette.success.main} fill="none" size={16} strokeWidth={2} />
              </IconButton>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: "0.7rem", sm: "0.9rem" },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                  flex: 1  // Allow text to shrink
                }}
              >
                {cluster.cluster_name}
              </Typography>
            </Box>
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 0.25,
              flexShrink: 0,  // Don't shrink the team count
              ml: 0.5
            }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: "0.6rem", sm: "0.7rem" },
                  whiteSpace: "nowrap"
                }}
              >
                Teams
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: "0.7rem", sm: "1.1rem" },
                  whiteSpace: "nowrap"
                }}
              >
                {cluster.teams?.length?? 0}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Scrollable Table Content */}
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <TableContainer sx={{ overflow: "auto", maxWidth: "100%" }}>
            <Table sx={{ minWidth: { xs: 400, sm: 650 } }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 700,
                    bgcolor: (t) => alpha(t.palette.success.main, 0.04),
                    borderBottomColor: "grey.300",
                    fontSize: { xs: "0.65rem", sm: "0.95rem" },
                    py: { xs: 0.5, sm: 1.25 },
                    px: { xs: 0.25, sm: 1 },
                  },
                }}
              >
                <TableCell align="center">Select</TableCell>
                <TableCell align="center">Rank</TableCell>
                <TableCell align="left">Team Name</TableCell>
                <TableCell align="left">School</TableCell>
                <TableCell align="center">Total Score</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                {/* asscending for rank */}
                {(cluster.teams ?? [])
                  .sort((a: any, b: any) => (a.cluster_rank || 0) - (b.cluster_rank || 0))
                .map((team: any) => (
                  <TableRow
                    key={team.id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(46,125,50,0.06)" },
                      borderBottom: `1px solid ${theme.palette.grey[200]}`,
                      "& .MuiTableCell-root": { 
                        fontSize: { xs: "0.7rem", sm: "0.95rem" }, 
                        py: { xs: 0.5, sm: 1.25 },
                        px: { xs: 0.25, sm: 1 }
                      },
                    }}
                  >
                    <TableCell align="center">
                      <Checkbox
                        color="success"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => handleSelect(team.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                        {(team.cluster_rank ?? 0) <= 4 && (
                          <Trophy
                            size={16}
                            color={theme.palette.success.main}
                            fill={theme.palette.success.main}
                          />
                        )}
                        <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                          #{team.cluster_rank ?? 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="left">
                      <Typography sx={{ 
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: { xs: "100px", sm: "200px" }
                      }}>
                        {team.team_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="left">
                      <Typography sx={{ 
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: { xs: "100px", sm: "200px" }
                      }}>
                        {team.school_name}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "0.7rem", sm: "0.875rem" }
                      }}
                    >
                      {team.total_score ?? 0}
                    </TableCell>
                    <TableCell align="center">
                      {team.status === 'completed' ? (
                        <Chip 
                          size="small" 
                          label="Completed" 
                          color="success" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: "0.55rem", sm: "0.75rem" }
                          }} 
                        />
                      ) : team.status === 'in_progress' ? (
                        <Chip 
                          size="small" 
                          label="In Progress" 
                          color="warning" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: "0.55rem", sm: "0.75rem" }
                          }} 
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label="Not Started" 
                          color="default" 
                          sx={{ 
                            bgcolor: theme.palette.grey[300], 
                            fontWeight: 600,
                            fontSize: { xs: "0.55rem", sm: "0.75rem" }
                          }} 
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/results/${selectedContest?.id}`, {
                          state: { teamId: team.id, clusterId: cluster.id }
                        })}
                        sx={{
                          bgcolor: theme.palette.success.main,
                          "&:hover": { bgcolor: theme.palette.success.dark },
                          color: "#fff",
                          textTransform: "none",
                          borderRadius: 2,
                          fontSize: { xs: "0.55rem", sm: "0.75rem" },
                          px: { xs: 0.75, sm: 2 },
                          py: { xs: 0.25, sm: 0.5 },
                          minWidth: { xs: "auto", sm: "auto" }
                        }}
                      >
                        View Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          </TableContainer>
        </Collapse>
      </Paper>
          )
        })}
      </Box>
    )
}

export default Ranking