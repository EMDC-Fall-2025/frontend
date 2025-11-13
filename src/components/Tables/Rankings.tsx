import { Button, Box, Checkbox, Collapse, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, alpha, Chip } from "@mui/material";
import { useEffect, useState, useCallback, useRef } from "react";
import theme from "../../theme";
import { TriangleIcon, Trophy } from "lucide-react";
import { useAuthStore } from "../../store/primary_stores/authStore";
import { useRankingsStore } from "../../store/primary_stores/rankingsStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";

// Rankings component for displaying team rankings by cluster
const Ranking = () => {
  const navigate = useNavigate();
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [openCluster, setOpenCluster] = useState<Set<number>>(new Set())
  const { isAuthenticated, role } = useAuthStore()

  const [contests, setContests] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])
  const [selectedContest, setSelectedContest] = useState<any>(null)
  const cacheRef = useRef<Map<number, { timestamp: number; clusters: any[] }>>(new Map())

  const { advanceToChampionship, undoChampionshipAdvancement } = useRankingsStore()

  // Load contests for organizer
  useEffect(() => {
    const fetchContests = async () => {
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
        const { data } = await api.get(`/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`)
        const contestsData = data?.Contests ?? []
        setContests(contestsData)
        if (contestsData.length > 0) setSelectedContest(contestsData[0])
        else console.error('No contests found for this organizer')
      } catch (e) {
        console.error('Failed to load contests:', e)
      }
    }
    if (isAuthenticated) fetchContests()
  }, [isAuthenticated, role])

  // Extract fetch function so it can be called after advancement
  const fetchClusters = useCallback(async (forceRefresh = false) => {
    if (!selectedContest) return
    try {
      // 1) Try cache first (only if not forcing refresh)
      if (!forceRefresh) {
        const cached = cacheRef.current.get(selectedContest.id)
        if (cached && Date.now() - cached.timestamp < 60_000 && Array.isArray(cached.clusters)) {
          setClusters(cached.clusters)
          return
        }
      }

      // 2) Fetch fresh data from API 
      const { data: clusterResp } = await api.get(`/api/mapping/clusterToContest/getAllClustersByContest/${selectedContest.id}/`)
      const clusterData = (clusterResp?.Clusters ?? []).map((c: any) => ({ id: c.id, cluster_name: c.cluster_name ?? c.name, cluster_type: c.cluster_type, teams: [], _statusFetched: false }))
      const withTeams = await Promise.all(
        clusterData.map(async (cluster: any) => {
          try {
            const { data: teamResp } = await api.get(`/api/mapping/clusterToTeam/getAllTeamsByCluster/${cluster.id}/`)
            const teams = (teamResp?.Teams ?? []).map((t: any) => ({
              id: t.id,
              team_name: t.team_name ?? t.name,
              school_name: t.school_name ?? 'N/A',
              total_score: cluster.cluster_type === 'preliminary' ? (t.preliminary_total_score ?? 0) : (t.total_score ?? 0),
              advanced_to_championship: t.advanced_to_championship ?? false
            }))
            const ranked = teams
              .sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0))
              .map((t: any, i: number) => ({ ...t, cluster_rank: i + 1 }))
            // defer status fetching until cluster expand to avoid N API calls upfront
            const teamsWithInitialStatus = ranked.map((t: any) => ({
              ...t,
              status: (t.total_score ?? 0) > 0 ? 'in_progress' : 'not_started'
            }))

            return { ...cluster, teams: teamsWithInitialStatus }
          } catch {
            return { ...cluster, teams: [] }
          }
        })
      )
      setClusters(withTeams)

      // 2) Save fresh data to cache
      cacheRef.current.set(selectedContest.id, { timestamp: Date.now(), clusters: withTeams })
    } catch (e) {
      console.error('Failed to load contest data:', e)
    }
  }, [selectedContest])

  // Load clusters and teams for selected contest
  useEffect(() => {
    fetchClusters()

    // Auto-refresh every 20 seconds
    const interval = setInterval(() => {
      fetchClusters(true) // Force refresh 
    }, 20000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchClusters])

  // Fetch per-team submission status (only once per cluster)
  useEffect(() => {
    const fetchStatusForCluster = async (clusterId: number) => {
      const idx = clusters.findIndex((c: any) => c.id === clusterId)
      if (idx === -1) return
      const cluster = clusters[idx]
      if (cluster._statusFetched) return
      try {
        const updatedTeams = await Promise.all(
          (cluster.teams ?? []).map(async (t: any) => {
            try {
              const { data: s } = await api.get(`/api/mapping/scoreSheet/allSubmittedForTeam/${t.id}/`)
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
        const next = clusters.slice()
        next[idx] = { ...cluster, teams: updatedTeams, _statusFetched: true }
        setClusters(next)
        // Update cache with enriched status data
        if (selectedContest?.id) {
          const cached = cacheRef.current.get(selectedContest.id)
          if (cached) {
            const cloned = cached.clusters.map((c: any) =>
              c.id === clusterId ? { ...c, teams: updatedTeams, _statusFetched: true } : c
            )
            cacheRef.current.set(selectedContest.id, { timestamp: cached.timestamp, clusters: cloned })
          }
        }
      } catch {
        // ignore status fetch errors
      }
    }


    openCluster.forEach((clusterId) => {
      fetchStatusForCluster(clusterId)
    })
  }, [openCluster, clusters])

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

  const handleAdvanceToChampionship = async () => {
    if (!selectedContest || selectedTeams.length === 0) {
      console.error('No contest selected or no teams selected')
      return
    }

    const tId = toast.loading('Advancing teams to championship...')

    try {
      // Call the championship advancement API
      await advanceToChampionship(selectedContest.id, selectedTeams)

      toast.success(`Successfully advanced ${selectedTeams.length} teams!`, { id: tId })
      setSelectedTeams([]) // Clear selection

      // Force refresh clusters to show new championship/redesign clusters
      await fetchClusters(true)
    } catch (error: any) {
      // Dismiss loading toast and show error
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to advance to championship'
      toast.error(errorMessage, { id: tId })
      console.error('Error advancing to championship:', error)
    }
  }

  const handleUndoChampionshipAdvancement = async () => {
    if (!selectedContest) {
      console.error('No contest selected')
      return
    }

    try {
      const tId = toast.loading('Undoing championship advancement...')
      // Call the undo championship advancement API
      await undoChampionshipAdvancement(selectedContest.id)
      toast.success('Successfully undone championship advancement!', { id: tId })

      // Force refresh clusters to reflect undone advancement
      await fetchClusters(true)
    } catch (error) {
      toast.error('Failed to undo championship advancement')
      console.error('Error undoing championship advancement:', error)
      alert('Error undoing championship advancement. Please try again.')
    }
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
                {contest.contest_name || contest.name}
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
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ color: theme.palette.grey[400] }}>
              <Trophy size={20} />
            </Box>
            {selectedContest && (
              <>
                {(() => {
                  const hasAdvancedTeams = clusters.some(cluster => {
                    return cluster.teams && cluster.teams.some((team: any) => {
                      return team.advanced_to_championship === true;
                    });
                  });

                  const hasChampionshipClusters = clusters.some(cluster => {
                    const isChampionship = cluster.cluster_type === 'championship' ||
                      cluster.cluster_name?.toLowerCase().includes('championship');
                    const isRedesign = cluster.cluster_type === 'redesign' ||
                      cluster.cluster_name?.toLowerCase().includes('redesign');
                    return isChampionship || isRedesign;
                  });

                  const hasAdvanced = hasAdvancedTeams || hasChampionshipClusters;

                  return (
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      {hasAdvanced && (
                        <Button
                          variant="contained"
                          onClick={() => handleUndoChampionshipAdvancement()}
                          sx={{
                            bgcolor: theme.palette.error.main,
                            "&:hover": { bgcolor: theme.palette.error.dark },
                            color: "white",
                            textTransform: "none",
                            borderRadius: 2,
                            fontSize: { xs: "0.7rem", sm: "0.875rem" },
                            px: { xs: 1.5, sm: 2 },
                            py: { xs: 0.5, sm: 1 }
                          }}
                        >
                          Undo Championship
                        </Button>
                      )}
                      {selectedTeams.length > 0 && (
                        <Button
                          variant="contained"
                          onClick={() => {
                            handleAdvanceToChampionship()
                          }}
                          sx={{
                            bgcolor: theme.palette.success.main,
                            "&:hover": { bgcolor: theme.palette.success.dark },
                            color: "white",
                            textTransform: "none",
                            borderRadius: 2,
                            fontSize: { xs: "0.7rem", sm: "0.875rem" },
                            px: { xs: 1.5, sm: 2 },
                            py: { xs: 0.5, sm: 1 }
                          }}
                        >
                          Advance to Championship
                        </Button>
                      )}
                    </Box>
                  );
                })()}
              </>
            )}
          </Box>
        </Box>
      </Paper>

      {/*  spacing between stats card and clusters */}
      <Box sx={{ mb: 3 }} />

      {clusters.map((cluster) => {
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
                    onClick={(e) => { e.stopPropagation(); toggleCluster(cluster.id) }}
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
                  flexShrink: 0,
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
                    {cluster.teams?.length ?? 0}
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