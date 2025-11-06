import {
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Pagination,
  Box,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useMapContestToTeamStore } from "../../store/map_stores/mapContestToTeamStore";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";
import { useEffect, useMemo, useState } from "react";

const COLS = [
  { key: "rank", label: "Rank", width: "6%", align: "center" as const },
  { key: "team", label: "Team", width: "18%", align: "left" as const },
  { key: "school", label: "School", width: "18%", align: "left" as const },
  { key: "journal", label: "Journal", width: "8%", align: "center" as const },
  { key: "presentation", label: "Present.", width: "8%", align: "center" as const },
  { key: "machine", label: "Machine", width: "10%", align: "center" as const },
  { key: "general_penalties", label: "Gen. Penalties", width: "9%", align: "center" as const },
  { key: "run_penalties", label: "Run Penalties", width: "9%", align: "center" as const },
  { key: "penalties", label: "Penalties", width: "8%", align: "center" as const },
  { key: "total", label: "Total", width: "8%", align: "center" as const },
  { key: "details", label: "Details", width: "8%", align: "center" as const },
];

const GOLD = "#D4AF37";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

const bgGold = () => alpha(GOLD, 0.18);
const bgSilver = () => alpha(SILVER, 0.18);
const bgBronze = () => alpha(BRONZE, 0.18);

export default function InternalResultsTable({ contestId, resultType='preliminary' }: { contestId?: number; resultType?: 'preliminary' | 'championship' | 'redesign'; }) {
  const { teamsByContest, fetchTeamsByContest } = useMapContestToTeamStore() as any;
  const { clusters, teamsByClusterId, fetchClustersByContestId, fetchTeamsByClusterId } = useMapClusterTeamStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  const rows = (teamsByContest ?? []) as any[];

  // 1) Try cache first for instant display
  useEffect(() => {
    if (!contestId) return;
    try {
      const key = `internalResults:contest:${contestId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && Array.isArray(cached.teams) && Date.now() - (cached.timestamp || 0) < 300000) { // 5min cache
          // Show cached data immediately
          if (cached.teams.length > 0) {
            // Update store with cached data
            const store = useMapContestToTeamStore.getState();
            if (store.teamsByContest.length === 0) {
              store.teamsByContest = cached.teams;
            }
          }
        }
      }
    } catch {}
  }, [contestId]);

  // 2) Fetch fresh data in background (non-blocking)
  useEffect(() => {
    if (contestId) {
      fetchTeamsByContest(contestId).then(() => {
        // Update cache with fresh data
        try {
          const key = `internalResults:contest:${contestId}`;
          const store = useMapContestToTeamStore.getState();
          if (store.teamsByContest.length > 0) {
            localStorage.setItem(key, JSON.stringify({ 
              timestamp: Date.now(), 
              teams: store.teamsByContest 
            }));
          }
        } catch {}
      }).catch(() => {});
    }
  }, [contestId, fetchTeamsByContest]);

  // Fetch clusters when contestId is available
  useEffect(() => {
    if (contestId) {
      fetchClustersByContestId(contestId);
    }
  }, [contestId, fetchClustersByContestId]);

  // Fetch teams for each cluster when clusters are available (only needed for preliminary mapping)
  useEffect(() => {
    if (!contestId) return;
    if (resultType !== 'preliminary') return;
    if (clusters && clusters.length > 0) {
      const missing = clusters.filter((cluster: any) => !teamsByClusterId[cluster.id]);
      if (missing.length === 0) return;
      Promise.all(missing.map((cluster: any) => fetchTeamsByClusterId(cluster.id))).catch(() => {});
    }
  }, [clusters, contestId, fetchTeamsByClusterId, teamsByClusterId, resultType]);

  // Create a mapping from team ID to cluster name (only for preliminary clusters)
  const clusterNameByTeamId = useMemo(() => {
    const mapping: { [teamId: number]: string } = {};
    
    // Iterate through each cluster, but only include preliminary type clusters
    clusters.forEach((cluster: any) => {
      // Only process clusters with type 'preliminary'
      if (cluster.cluster_type === 'preliminary') {
        const teams = teamsByClusterId[cluster.id] || [];
        // For each team in this cluster, map its ID to the cluster name
        teams.forEach((team: any) => {
          mapping[team.id] = cluster.cluster_name;
        });
      }
    });
    
    return mapping;
  }, [clusters, teamsByClusterId]);

  // For redesign, only show rank, team, school, total, details
  const visibleCols = useMemo(() => {
    if (resultType !== 'redesign') return COLS;
    const keep = new Set(["rank", "team", "school", "total", "details"]);
    return COLS.filter(c => keep.has(c.key));
  }, [resultType]);
  
  
  // Filter and sort rows based on result type (memoized)
  const filteredRows = useMemo(() => {
    if (resultType === 'preliminary') {
      return [...rows].sort((a, b) => (b.preliminary_total_score || 0) - (a.preliminary_total_score || 0));
    } else if (resultType === 'championship') {
      return [...rows]
        .filter(team => team.advanced_to_championship)
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    } else if (resultType === 'redesign') {
      return [...rows]
        .filter(team => !team.advanced_to_championship)
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    }
    return rows;
  }, [rows, resultType]);

  // Pagination
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
 



  return (
    <Container maxWidth={false} sx={{ px: 0, py: 0 }}>
      {/* Wrapper that enables smooth horizontal scroll on small screens */}
      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: 1,
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Table
          size="small"
          sx={{
            // Fill container on larger screens; allow horizontal scroll only when needed
            width: "100%",
            minWidth: 1000,
            tableLayout: "fixed",
          }}
          aria-label="contest results"
        >
          <TableHead>
            <TableRow sx={{ bgcolor: (t) => alpha(t.palette.success.main, 0.08) }}>
              {visibleCols.map((c) => {
                const isPenaltyHeader =
                  c.key === "general_penalties" || c.key === "run_penalties";

                return (
                  <TableCell
                    key={c.key}
                    align={c.align}
                    sx={{
                      width: c.width,
                      fontWeight: 800,
                      fontSize: { xs: "0.72rem", sm: "0.875rem" },
                      // add a little more height for wrapped penalty headers
                      py: { xs: isPenaltyHeader ? 1.0 : 0.6, sm: 1 },
                      px: { xs: isPenaltyHeader ? 0.5 : 0.5, sm: 1 },

                      ...(isPenaltyHeader && {
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        hyphens: "auto",
                        lineHeight: 1.15,
                        textAlign: "center",
                      }),

                      // keep others single-line
                      ...(!isPenaltyHeader && { whiteSpace: "nowrap" }),

                      // colors
                      ...(c.key === "penalties" && { color: "error.main" }),
                      ...(c.key === "total" && {
                        color: "common.white",
                        bgcolor: "success.main",
                      }),
                    }}
                  >
                    {c.label}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((team: any, idx: number) => {
              // Calculate actual rank in full filtered list
              const actualRank = filteredRows.findIndex(t => t.id === team.id) + 1;
              // Rank is based on position in full filtered list
              const rank = actualRank;
              
              const is1 = rank === 1;
              const is2 = rank === 2;
              const is3 = rank === 3;

              let rowBg: any = idx % 2 ? "grey.50" : "background.paper";
              let borderColor: string | undefined;

              if (is1) {
                rowBg = bgGold();
                borderColor = GOLD;
              }
              if (is2) {
                rowBg = bgSilver();
                borderColor = SILVER;
              }
              if (is3) {
                rowBg = bgBronze();
                borderColor = BRONZE;
              }

              const school: string = team.school ?? team.school_name ?? "—";

              return (
                <TableRow
                  key={team.id}
                  hover
                  sx={{
                    bgcolor: rowBg,
                    borderTop: borderColor ? `3px solid ${borderColor}` : undefined,
                    borderBottom: borderColor ? `3px solid ${borderColor}` : undefined,
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 900, color: borderColor ?? "text.primary" }}>
                    {rank ?? "—"} {is1 ? "🏆" : is2 ? "🥈" : is3 ? "🥉" : null}
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight={700}>{team.team_name}</Typography>
                    <Typography variant="caption" color="text.disabled">
                      {clusterNameByTeamId[team.id] || `ID: ${team.id}`}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{school}</Typography>
                  </TableCell>

                  {resultType !== 'redesign' && (
                    <>
                      <TableCell align="center">
                        {resultType === 'preliminary' ? team.preliminary_journal_score :
                         resultType === 'championship' ? team.preliminary_journal_score : 0}
                      </TableCell>
                      <TableCell align="center">
                        {resultType === 'preliminary' ? team.preliminary_presentation_score :
                         resultType === 'championship' ? (team.championship_presentation_score ?? 0) : 0}
                      </TableCell>
                      <TableCell align="center">
                        {resultType === 'preliminary' ? team.preliminary_machinedesign_score :
                         resultType === 'championship' ? (team.championship_machinedesign_score ?? 0) : 0}
                      </TableCell>
                    </>
                  )}

                  {resultType !== 'redesign' && (
                    <>
                      {/* General Penalties */}
                      <TableCell align="center" sx={{ color: "error.main", fontWeight: 600 }}>
                        -{Number(resultType === 'preliminary' ? team.preliminary_penalties_score ?? 0 :
                             resultType === 'championship' ? team.championship_general_penalties_score ?? 0 : 0).toFixed(1)}
                      </TableCell>
                      {/* Run Penalties */}
                      <TableCell align="center" sx={{ color: "error.main", fontWeight: 600 }}>
                        -{Number(resultType === 'preliminary' ? team.penalties_score ?? 0 :
                             resultType === 'championship' ? team.championship_run_penalties_score ?? 0 : 0).toFixed(1)}
                      </TableCell>
                      {/* Total Penalties */}
                      <TableCell align="center" sx={{ color: "error.main", fontWeight: 800 }}>
                        -{Number(resultType === 'preliminary' ? (team.preliminary_penalties_score ?? 0) + (team.penalties_score ?? 0) :
                             resultType === 'championship' ? (team.championship_general_penalties_score ?? 0) + (team.championship_run_penalties_score ?? 0) : 0).toFixed(1)}
                      </TableCell>
                    </>
                  )}

                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 900,
                      color: "common.white",
                      bgcolor: is1 ? GOLD : is2 ? SILVER : is3 ? BRONZE : "success.main",
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
                    {resultType === 'preliminary' ? Number(team.preliminary_total_score || 0).toFixed(1) :
                     resultType === 'championship' ? 
                       Number((team.preliminary_journal_score || 0) + 
                              (team.championship_presentation_score || 0) + 
                              (team.championship_machinedesign_score || 0) - 
                              (team.championship_penalties_score || 0)).toFixed(1) :
                     resultType === 'redesign' ? Number((team.total_score ?? team.redesign_score) || 0).toFixed(1) : 0}
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => {
                        if (resultType === 'preliminary') {
                          navigate(`/score-breakdown/${team.id}`);
                        } else if (resultType === 'championship') {
                          navigate(`/championship-score-breakdown/${team.id}`);
                        } else if (resultType === 'redesign') {
                          navigate(`/redesign-score-breakdown/${team.id}`);
                        }
                      }}
                      sx={{
                        fontSize: { xs: "0.6rem", sm: "0.75rem" },
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.25, sm: 0.5 }
                      }}
                    >
                      VIEW
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => {
              setPage(value);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Container>
  );
}
