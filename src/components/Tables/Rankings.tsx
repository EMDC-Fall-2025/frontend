import {
  Button,
  Box,
  Checkbox,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  Chip,
  Skeleton,
} from "@mui/material";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import theme from "../../theme";
import { TriangleIcon, Trophy } from "lucide-react";
import { useAuthStore } from "../../store/primary_stores/authStore";
import { useRankingsStore } from "../../store/primary_stores/rankingsStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { onDataChange, DataChangeEvent } from "../../utils/dataChangeEvents";

// =========================
// Cluster Row (memoized)
// =========================

interface ClusterRowProps {
  cluster: any;
  isOpen: boolean;
  selectedTeams: number[];
  selectedContest: any;
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
  onNavigate: (path: string, state: any) => void;
}

const ClusterRow = memo(function ClusterRow({
  cluster,
  isOpen,
  selectedTeams,
  selectedContest,
  onToggle,
  onSelect,
  onNavigate,
}: ClusterRowProps) {
  const teams = cluster.teams ?? [];

        return (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.grey[200]}`,
              mb: 2,
              maxWidth: "100%",
              width: "100%",
        overflow: "hidden",
            }}
          >
      {/* Cluster Header */}
            <Box
              sx={{
                bgcolor: theme.palette.grey[200],
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 },
          cursor: "pointer",
              }}
        onClick={() => onToggle(cluster.id)}
            >
        <Box
          sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "nowrap",
                gap: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
              flex: 1,
            }}
          >
                  <IconButton
                    size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(cluster.id);
              }}
                    sx={{
                      mr: 1,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 150ms",
                      p: { xs: 0.5, sm: 1 },
                flexShrink: 0,
              }}
            >
              <TriangleIcon
                color={theme.palette.success.main}
                fill="none"
                size={16}
                strokeWidth={2}
              />
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
                flex: 1,
                    }}
                  >
                    {cluster.cluster_name}
                  </Typography>
                </Box>

          <Box
            sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.25,
                  flexShrink: 0,
              ml: 0.5,
            }}
          >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.6rem", sm: "0.7rem" },
                whiteSpace: "nowrap",
                    }}
                  >
                    Teams
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.7rem", sm: "1.1rem" },
                whiteSpace: "nowrap",
                    }}
                  >
              {teams.length}
                  </Typography>
                </Box>
              </Box>
            </Box>

      {/* Cluster Table */}
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
              {teams.map((team: any) => (
                        <TableRow
                          key={team.id}
                          sx={{
                    "&:hover": {
                      backgroundColor: "rgba(46,125,50,0.06)",
                    },
                            borderBottom: `1px solid ${theme.palette.grey[200]}`,
                            "& .MuiTableCell-root": {
                              fontSize: { xs: "0.7rem", sm: "0.95rem" },
                              py: { xs: 0.5, sm: 1.25 },
                      px: { xs: 0.25, sm: 1 },
                            },
                          }}
                        >
                          <TableCell align="center">
                            <Checkbox
                              color="success"
                              checked={selectedTeams.includes(team.id)}
                      onChange={() => onSelect(team.id)}
                              size="small"
                            />
                          </TableCell>

                          <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                              {(team.cluster_rank ?? 0) <= 4 && (
                                <Trophy
                                  size={16}
                                  color={theme.palette.success.main}
                                  fill={theme.palette.success.main}
                                />
                              )}
                      <Typography
                        sx={{
                          fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        }}
                      >
                        #{team.cluster_rank ?? "N/A"}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell align="left">
                    <Typography
                      sx={{
                              fontSize: { xs: "0.7rem", sm: "0.875rem" },
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                        maxWidth: { xs: "100px", sm: "200px" },
                      }}
                    >
                              {team.team_name}
                            </Typography>
                          </TableCell>

                          <TableCell align="left">
                    <Typography
                      sx={{
                              fontSize: { xs: "0.7rem", sm: "0.875rem" },
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                        maxWidth: { xs: "100px", sm: "200px" },
                      }}
                    >
                              {team.school_name}
                            </Typography>
                          </TableCell>

                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: 600,
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                            }}
                          >
                            {team.total_score ?? 0}
                          </TableCell>

                          <TableCell align="center">
                    {team.status === "completed" ? (
                              <Chip
                                size="small"
                                label="Completed"
                                color="success"
                                sx={{
                                  fontWeight: 600,
                          fontSize: { xs: "0.55rem", sm: "0.75rem" },
                                }}
                              />
                    ) : team.status === "in_progress" ? (
                              <Chip
                                size="small"
                                label="In Progress"
                                color="warning"
                                sx={{
                                  fontWeight: 600,
                          fontSize: { xs: "0.55rem", sm: "0.75rem" },
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
                          fontSize: { xs: "0.55rem", sm: "0.75rem" },
                                }}
                              />
                            )}
                          </TableCell>

                          <TableCell align="right">
                            <Button
                              variant="contained"
                              size="small"
                      onClick={() => {
                        // Set flag in sessionStorage to indicate navigation from Rankings
                        sessionStorage.setItem('fromRankings', 'true');
                        onNavigate(`/results/${selectedContest?.id}`, {
                          state: { teamId: team.id, clusterId: cluster.id },
                        });
                      }}
                              sx={{
                                bgcolor: theme.palette.success.main,
                        "&:hover": {
                          bgcolor: theme.palette.success.dark,
                        },
                                color: "#fff",
                                textTransform: "none",
                                borderRadius: 2,
                                fontSize: { xs: "0.55rem", sm: "0.75rem" },
                                px: { xs: 0.75, sm: 2 },
                                py: { xs: 0.25, sm: 0.5 },
                        minWidth: { xs: "auto", sm: "auto" },
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
  );
});

// =========================
// Rankings Component
// =========================

const Ranking = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();
  const { advanceToChampionship, undoChampionshipAdvancement } =
    useRankingsStore();

  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [openCluster, setOpenCluster] = useState<Set<number>>(new Set());

  const [contests, setContests] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedContest, setSelectedContest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevent duplicate toasts / duplicate requests when action buttons are clicked multiple times
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  // Simple in-memory cache for clusters per contest
  const cacheRef = useRef<
    Map<number, { timestamp: number; clusters: any[] }>
  >(new Map());

  // =========================
  // Load contests for organizer
  // =========================
  useEffect(() => {
    const fetchContests = async () => {
      try {
        if (!isAuthenticated) {
          console.error("Please log in to view rankings");
          return;
        }

        // Only organizers
        if (role?.user_type !== 2) {
          console.error("User is not an organizer");
          return;
        }

        const organizerId = role?.user?.id;
        if (!organizerId) {
          console.error("Organizer ID not found");
          return;
        }

        const { data } = await api.get(
          `/api/mapping/contestToOrganizer/getByOrganizer/${organizerId}/`
        );
        const contestsData = data?.Contests ?? [];
        setContests(contestsData);

        if (contestsData.length > 0) {
          setSelectedContest((prev:any) => prev ?? contestsData[0]);
        } else {
          console.warn("No contests found for this organizer");
        }
      } catch (e: any) {
        const errorMessage =
          e?.response?.data?.detail ||
          e?.message ||
          "Failed to load contests";
        console.error("Failed to load contests:", errorMessage);
        if (e?.response?.status === 403) {
          console.error(
            "Permission denied: You do not have access to this organizer's contests"
          );
        }
      }
    };

    if (isAuthenticated && role?.user_type === 2) {
      fetchContests();
    }
  }, [isAuthenticated, role]);

  // =========================
  // Fetch clusters + teams
  // =========================
  const fetchClusters = useCallback(
    async (forceRefresh = false) => {
      if (!selectedContest) return;

      const contestId = selectedContest.id;

      // Try cache first for instant render
      if (!forceRefresh) {
        const cached = cacheRef.current.get(contestId);
        if (cached && Array.isArray(cached.clusters)) {
          setClusters(cached.clusters);
          setIsLoading(false);

          // Fresh cache (< 5 min), skip refresh
          if (Date.now() - cached.timestamp < 300_000) {
            return;
          }
        }
      }

      setIsLoading(true);
      try {
        const { data: clusterResp } = await api.get(
          `/api/mapping/clusterToContest/getAllClustersByContest/${contestId}/`
        );

        const clusterData = (clusterResp?.Clusters ?? []).map((c: any) => ({
          id: c.id,
          cluster_name: c.cluster_name ?? c.name,
          cluster_type: c.cluster_type,
          teams: [],
          _statusFetched: false,
        }));

        const withTeams = await Promise.all(
          clusterData.map(async (cluster: any) => {
            try {
              const { data: teamResp } = await api.get(
                `/api/mapping/clusterToTeam/getAllTeamsByCluster/${cluster.id}/`
              );

              const teams = (teamResp?.Teams ?? []).map((t: any) => {
                const baseTotal =
                  cluster.cluster_type === "preliminary"
                    ? t.preliminary_total_score ?? 0
                    : t.total_score ?? 0;

                return {
                  id: t.id,
                  team_name: t.team_name ?? t.name,
                  school_name: t.school_name ?? "N/A",
                  total_score: baseTotal,
                  advanced_to_championship:
                    t.advanced_to_championship ?? false,
                };
              });

              // Sort & rank once here
              const ranked = teams
                .sort(
                  (a: any, b: any) =>
                    (b.total_score ?? 0) - (a.total_score ?? 0)
                )
                .map((t: any, i: number) => ({
                  ...t,
                  cluster_rank: i + 1,
                }));

              // Initial status (more detailed status loaded on expand)
              const teamsWithStatus = ranked.map((t: any) => ({
                ...t,
                status:
                  (t.total_score ?? 0) > 0 ? "in_progress" : "not_started",
              }));

              return { ...cluster, teams: teamsWithStatus };
            } catch {
              return { ...cluster, teams: [] };
            }
          })
        );

        setClusters(withTeams);
        setIsLoading(false);

        cacheRef.current.set(contestId, {
          timestamp: Date.now(),
          clusters: withTeams,
        });
      } catch (e) {
        console.error("Failed to load contest data:", e);
        setIsLoading(false);
      }
    },
    [selectedContest]
  );

  // Load clusters when contest changes + subscribe to refresh events
  useEffect(() => {
    if (!selectedContest) return;

    fetchClusters();

    const handleDataChange = async (event: DataChangeEvent) => {
      if (
        (event.type === "team" &&
          (event.contestId === selectedContest?.id || !event.contestId)) ||
        (event.type === "cluster" &&
          (event.contestId === selectedContest?.id || !event.contestId)) ||
        event.type === "championship"
      ) {
        await fetchClusters(true);
      }
    };

    const unsubscribeDataChange = onDataChange(handleDataChange);

    // Lightweight periodic refresh (fallback)
    const interval = setInterval(() => {
      fetchClusters(true);
    }, 20000);

    return () => {
      clearInterval(interval);
      unsubscribeDataChange();
    };
  }, [selectedContest, fetchClusters]);

  // =========================
  // Fetch per-team status when cluster opens
  // =========================
  useEffect(() => {
    if (openCluster.size === 0 || clusters.length === 0) return;

    const fetchStatusForCluster = async (clusterId: number) => {
      const idx = clusters.findIndex((c: any) => c.id === clusterId);
      if (idx === -1) return;

      const cluster = clusters[idx];
      if (cluster._statusFetched) return;

      try {
        const updatedTeams = await Promise.all(
          (cluster.teams ?? []).map(async (t: any) => {
            try {
              const { data: s } = await api.get(
                `/api/mapping/scoreSheet/allSubmittedForTeam/${t.id}/`
              );
              const total = t.total_score ?? 0;
              const status =
                s?.allSubmitted && total > 0
                  ? "completed"
                  : s?.submittedCount > 0 || total > 0
                  ? "in_progress"
                  : "not_started";

              return { ...t, status };
            } catch {
              return { ...t, status: "not_started" as const };
            }
          })
        );

        setClusters((prev) => {
          const next = [...prev];
          next[idx] = {
            ...cluster,
            teams: updatedTeams,
            _statusFetched: true,
          };
          return next;
        });

        // Mirror into cache
        if (selectedContest?.id) {
          const cached = cacheRef.current.get(selectedContest.id);
          if (cached) {
            const cloned = cached.clusters.map((c: any) =>
              c.id === clusterId
                ? { ...c, teams: updatedTeams, _statusFetched: true }
                : c
            );
            cacheRef.current.set(selectedContest.id, {
              timestamp: cached.timestamp,
              clusters: cloned,
            });
          }
        }
      } catch {
        // ignore status fetch errors
      }
    };

    openCluster.forEach((clusterId) => {
      const cluster = clusters.find((c: any) => c.id === clusterId);
      if (cluster && !cluster._statusFetched) {
        fetchStatusForCluster(clusterId);
      }
    });
  }, [openCluster, clusters, selectedContest?.id]);

  // =========================
  // Championship state (memoized)
  // =========================
  const championshipState = useMemo(() => {
    if (!selectedContest || clusters.length === 0) {
      return {
        hasAdvanced: false,
        hasAdvancedTeams: false,
        hasChampionshipClusters: false,
      };
    }

    const hasAdvancedTeams = clusters.some((cluster) =>
      (cluster.teams ?? []).some(
        (team: any) => team.advanced_to_championship === true
      )
    );

    const hasChampionshipClusters = clusters.some((cluster) => {
      const name = cluster.cluster_name?.toLowerCase() || "";
      const type = cluster.cluster_type;
      const isChampionship =
        type === "championship" || name.includes("championship");
      const isRedesign = type === "redesign" || name.includes("redesign");
      return isChampionship || isRedesign;
    });

    return {
      hasAdvanced: hasAdvancedTeams || hasChampionshipClusters,
      hasAdvancedTeams,
      hasChampionshipClusters,
    };
  }, [clusters, selectedContest]);

  // =========================
  // Callbacks (stable)
  // =========================
  const toggleCluster = useCallback((id: number) => {
    setOpenCluster((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((teamId: number) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  }, []);

  const handleNavigate = useCallback(
    (path: string, state: any) => {
      navigate(path, { state });
    },
    [navigate]
  );

  const handleAdvanceToChampionship = useCallback(async () => {
    if (!selectedContest || selectedTeams.length === 0) {
      console.error("No contest selected or no teams selected");
      return;
    }

    // Guard: avoid duplicate requests / toasts if user clicks repeatedly
    if (isAdvancing) return;
    setIsAdvancing(true);

    const toastId = "advance-championship";
    toast.loading("Advancing teams to championship...", { id: toastId });

    try {
      await advanceToChampionship(selectedContest.id, selectedTeams);
      toast.success(`Successfully advanced ${selectedTeams.length} teams!`, {
        id: toastId,
      });
      setSelectedTeams([]);
      await fetchClusters(true);
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Failed to advance to championship";
      toast.error(errorMessage, { id: toastId });
      console.error("Error advancing to championship:", error);
    } finally {
      setIsAdvancing(false);
    }
  }, [
    selectedContest,
    selectedTeams,
    advanceToChampionship,
    fetchClusters,
    isAdvancing,
  ]);

  const handleUndoChampionshipAdvancement = useCallback(async () => {
    if (!selectedContest) {
      console.error("No contest selected");
      return;
    }

    // Guard: avoid duplicate requests / toasts if user clicks repeatedly
    if (isUndoing) return;
    setIsUndoing(true);

    const toastId = "undo-championship";
    toast.loading("Undoing championship advancement...", { id: toastId });

    try {
      await undoChampionshipAdvancement(selectedContest.id);
      toast.success("Successfully undone championship advancement!", {
        id: toastId,
      });

      await fetchClusters(true);

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("championshipUndone", {
            detail: { contestId: selectedContest.id },
          })
        );
      }, 100);
    } catch (error) {
      toast.error("Failed to undo championship advancement", { id: toastId });
      console.error("Error undoing championship advancement:", error);
    } finally {
      setIsUndoing(false);
    }
  }, [
    selectedContest,
    undoChampionshipAdvancement,
    fetchClusters,
    isUndoing,
  ]);

  // =========================
  // Render
  // =========================

  return (
    <Box sx={{ maxWidth: 900, px: { xs: 1, sm: 2 }, mb: 4, mt: 3 }}>
      {/* Contest selection */}
      {contests.length > 0 && (
        <Paper
          elevation={1}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.grey[200]}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            Select Contest
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {contests.map((contest) => {
              const isActive = selectedContest?.id === contest.id;
              return (
                <Button
                  key={contest.id}
                  variant={isActive ? "contained" : "outlined"}
                  onClick={() => setSelectedContest(contest)}
                  sx={{
                    bgcolor: isActive
                      ? theme.palette.success.main
                      : "transparent",
                    color: isActive
                      ? "white"
                      : theme.palette.success.main,
                    borderColor: theme.palette.success.main,
                    "&:hover": {
                      bgcolor: isActive
                        ? theme.palette.success.dark
                        : theme.palette.success.light,
                      color: "white",
                    },
                    textTransform: "none",
                    borderRadius: 2,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 0.5, sm: 1 },
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  {contest.contest_name || contest.name}
                </Button>
              );
      })}
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mb: 0.5,
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
              }}
            >
              Selected Teams
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.success.main,
                fontSize: { xs: "1.5rem", sm: "2.125rem" },
              }}
            >
              {selectedTeams.length}
            </Typography>
          </Box>

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            <Box sx={{ color: theme.palette.grey[400] }}>
              <Trophy size={20} />
            </Box>

            {selectedContest && (
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {championshipState.hasAdvanced && (
                  <Button
                    variant="contained"
                    onClick={handleUndoChampionshipAdvancement}
                    disabled={isUndoing}
                    sx={{
                      bgcolor: theme.palette.error.main,
                      "&:hover": {
                        bgcolor: theme.palette.error.dark,
                      },
                      color: "white",
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.5, sm: 1 },
                    }}
                  >
                    Undo Championship
                  </Button>
                )}

                {selectedTeams.length > 0 && (
                  <Button
                    variant="contained"
                    onClick={handleAdvanceToChampionship}
                    disabled={isAdvancing}
                    sx={{
                      bgcolor: theme.palette.success.main,
                      "&:hover": {
                        bgcolor: theme.palette.success.dark,
                      },
                      color: "white",
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.5, sm: 1 },
                    }}
                  >
                    Advance to Championship
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Spacing */}
      <Box sx={{ mb: 3 }} />

      {/* Loading skeletons */}
      {isLoading && clusters.length === 0 ? (
        <>
          {[1, 2, 3].map((i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.grey[200]}`,
                mb: 2,
                p: 2,
              }}
            >
              <Skeleton
                variant="text"
                width="60%"
                height={32}
                sx={{ mb: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width="100%"
                height={200}
              />
            </Paper>
          ))}
        </>
      ) : (
        clusters.map((cluster) => (
          <ClusterRow
            key={cluster.id}
            cluster={cluster}
            isOpen={openCluster.has(cluster.id)}
            selectedTeams={selectedTeams}
            selectedContest={selectedContest}
            onToggle={toggleCluster}
            onSelect={handleSelect}
            onNavigate={handleNavigate}
          />
        ))
      )}
    </Box>
  );
};

export default Ranking;
