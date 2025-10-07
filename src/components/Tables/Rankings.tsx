import { Button, Box, Checkbox, Collapse, IconButton, Input, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, alpha, Chip } from "@mui/material";
import  { useEffect, useState } from "react";
import theme from "../../theme";
import { TriangleIcon, Trophy} from "lucide-react";
import { useAuthStore } from "../../store/primary_stores/authStore";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Rankings component for displaying team rankings by cluster
const Ranking = () => {
    const navigate = useNavigate();
    const [selectedTeams, setSelectedTeams] = useState<number[]>([])
    const [openCluster, setOpenCluster] = useState<Set<number>>(new Set())
    const { isAuthenticated, role, token } = useAuthStore()

    const [contests, setContests] = useState<any[]>([])
    const [clusters, setClusters] = useState<any[]>([])
    const [selectedContest, setSelectedContest] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load contests for organizer
    useEffect(() => {
      const fetchContests = async () => {
        try {
          setLoading(true)
          setError(null)
          if (!isAuthenticated || !token) {
            setError('Please log in to view rankings')
            return
          }
          const organizerId = role?.user?.id
          if (!organizerId) {
            setError('Organizer ID not found')
            return
          }
          const { data } = await axios.get(`/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`, {
            headers: { Authorization: `Token ${token}` }
          })
          const contestsData = data?.Contests ?? []
          setContests(contestsData)
          if (contestsData.length > 0) setSelectedContest(contestsData[0])
          else setError('No contests found for this organizer')
        } catch (e) {
          setError('Failed to load contests')
        } finally {
          setLoading(false)
        }
      }
      if (isAuthenticated) fetchContests()
    }, [isAuthenticated, role, token])

    // Load clusters and teams for selected contest
    useEffect(() => {
      const fetchClusters = async () => {
        if (!selectedContest || !token) return
        try {
          setLoading(true)
          setError(null)
          const { data: clusterResp } = await axios.get(`/api/mapping/clusterToContest/getAllClustersByContest/${selectedContest.id}/`, {
            headers: { Authorization: `Token ${token}` }
          })
          const clusterData = (clusterResp?.Clusters ?? []).map((c: any) => ({ id: c.id, cluster_name: c.cluster_name ?? c.name, teams: [] }))
          const withTeams = await Promise.all(
            clusterData.map(async (cluster: any) => {
              try {
                const { data: teamResp } = await axios.get(`/api/mapping/clusterToTeam/getAllTeamsByCluster/${cluster.id}/`, {
                  headers: { Authorization: `Token ${token}` }
                })
                const teams = (teamResp?.Teams ?? []).map((t: any) => ({ id: t.id, team_name: t.team_name ?? t.name, school_name: t.school_name ?? 'N/A', total_score: t.total_score ?? 0 }))
                const ranked = teams
                  .sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0))
                  .map((t: any, i: number) => ({ ...t, cluster_rank: i + 1 }))

                // derive per-team status without changing ranking logic
                const teamsWithStatus = await Promise.all(
                  ranked.map(async (t: any) => {
                    try {
                      const { data: s } = await axios.get(`/api/mapping/scoreSheet/allSubmittedForTeam/${t.id}/`, {
                        headers: { Authorization: `Token ${token}` }
                      })
                      const total = t.total_score ?? 0
                      const status = (s?.allSubmitted && total > 0)
                        ? 'completed'
                        : ((s?.submittedCount > 0 || total > 0) ? 'in_progress' : 'not_started')
                      return { ...t, status }
                    } catch {
                      return { ...t, status: 'not_started' as const }
                    }
                  })
                )

                return { ...cluster, teams: teamsWithStatus }
              } catch {
                return { ...cluster, teams: [] }
              }
            })
          )
          setClusters(withTeams)
        } catch (e) {
          setError('Failed to load contest data')
        } finally {
          setLoading(false)
        }
      }
      fetchClusters()
    }, [selectedContest, token])

    // autoselect
    useEffect(() => {
      if (!selectedContest && contests.length > 0) {
        setSelectedContest(contests[0])
      }
    }, [contests, selectedContest])


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

    return (
      <Box sx={{ maxWidth: 900,  px: 2 , mb: 4, mt: 3}}>
        {/* contest selection */}
        {contests.length > 0 && (
          <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.grey[200]}` }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
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
                    px: 3,
                    py: 1
                  }}
                >
                  {contest.contest_name|| contest.name}
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
            p: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.grey[200]}`,
            bgcolor: "white",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "right", justifyContent: "space-between" }}>
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                Selected Teams
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {selectedTeams.length}
                </Typography>
            </Box>
            <Box sx={{ color: theme.palette.grey[400] }}>
                <Trophy size={24} />
            </Box>
            </Box>
            </Paper>
       
        {/*  spacing between stats card and clusters */}
        <Box sx={{ mb: 3 }} />
  
        {clusters.map((cluster) => {
          const isOpen = openCluster.has(cluster.id)
          return (
            <TableContainer
                key={cluster.id}
                component={Paper}
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.grey[200]}`,
                    overflow: "hidden",
                    mb: 2,
                }}
                >
        <Table>
    {/* Cluster header row */}
    <TableRow sx={{ bgcolor: theme.palette.grey[200], borderBottom: `1px solid ${theme.palette.divider}`, mt:3 }} onClick={() => toggleCluster(cluster.id)}>
      <TableCell colSpan={5} sx={{ py: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => {e.stopPropagation();toggleCluster(cluster.id) } }
              sx={{
                mr: 1,
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 150ms",
              }}
            >
              <TriangleIcon color={theme.palette.success.main} fill="none" size={16} strokeWidth={2} />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 16 }}>
              {cluster.cluster_name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Teams</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{cluster.teams?.length?? 0}</Typography>
          </Box>
        </Box>
      </TableCell>
    </TableRow>

    {/* Collapsible content row */}
    <TableRow>
      <TableCell colSpan={5} sx={{ p: 0 }}>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 700,
                    bgcolor: (t) => alpha(t.palette.success.main, 0.04),
                    borderBottomColor: "grey.300",
                    fontSize: "0.95rem",
                    py: 1.25,
                  },
                }}
              >
                <TableCell />
                <TableCell>Rank</TableCell>
                <TableCell>Team Name</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Total Score</TableCell>
                <TableCell>Status</TableCell>
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
                      "& .MuiTableCell-root": { fontSize: "0.95rem", py: 1.25 },
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        color="success"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => handleSelect(team.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {(team.cluster_rank ?? 0) <= 4 && (
                          <Trophy
                            size={18}
                            color={theme.palette.success.main}
                            fill={theme.palette.success.main}
                          />
                        )}
                        <Typography>#{team.cluster_rank ?? 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{team.team_name}</TableCell>
                    <TableCell>{team.school_name }</TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
        
                      }}
                    >
                      {team.total_score ?? 0}
                    </TableCell>
                    <TableCell>
                      {team.status === 'completed' ? (
                        <Chip size="small" label="Completed" color="success" sx={{ fontWeight: 600 }} />
                      ) : team.status === 'in_progress' ? (
                        <Chip size="small" label="In Progress" color="warning" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip size="small" label="Not Started" color="default" sx={{ bgcolor: theme.palette.grey[300], fontWeight: 600 }} />
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
                        }}
                      >
                        View Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Collapse>
      </TableCell>
    </TableRow>
  </Table>
</TableContainer>
          )
        })}
        <Button
          variant="contained"
          size="large"
          disabled={selectedTeams.length === 0}
          onClick={() => {
            // TODO: Add championship advancement logic here
          }}
          sx={{
            bgcolor: selectedTeams.length === 0 ? theme.palette.grey[400] : theme.palette.success.main,
            "&:hover": {
              bgcolor: selectedTeams.length === 0 ? theme.palette.grey[400] : theme.palette.success.dark,
            },
            color: "#fff",
            textTransform: "none",
            borderRadius: 2,
            mt: 2,
            px: 4,
            py: 1.5,
          }}
        >
          Advance to Championship         </Button>
      </Box>
      
    )
  }
  
  export default Ranking