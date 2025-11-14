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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useMapContestToTeamStore } from "../../store/map_stores/mapContestToTeamStore";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";
import { useEffect, useMemo } from "react";

// NOTE: Per request, business logic is UNCHANGED. Only UI/interactivity tweaks for mobile & UX.

const COLS = [
  { key: "rank", label: "Rank", width: "5%", align: "center" as const },
  { key: "team", label: "Team", width: "16%", align: "left" as const },
  { key: "school", label: "School", width: "16%", align: "left" as const },
  { key: "journal", label: "Journal", width: "8%", align: "center" as const },
  { key: "presentation", label: "Present.", width: "8%", align: "center" as const },
  { key: "machine", label: "Machine", width: "9%", align: "center" as const },
  { key: "general_penalties", label: "Gen. Penalties", width: "8%", align: "center" as const },
  { key: "run_penalties", label: "Run Penalties", width: "8%", align: "center" as const },
  { key: "penalties", label: "Penalties", width: "7%", align: "center" as const },
  { key: "total", label: "Total", width: "8%", align: "center" as const },
  { key: "details", label: "Details", width: "7%", align: "center" as const },
];

const GOLD = "#D4AF37";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

const bgGold = () => alpha(GOLD, 0.18);
const bgSilver = () => alpha(SILVER, 0.18);
const bgBronze = () => alpha(BRONZE, 0.18);

export default function InternalResultsTable({ contestId, resultType='preliminary' }: { contestId?: number; resultType?: 'preliminary' | 'championship' | 'redesign'; }) {
  const { teamsByContest } = useMapContestToTeamStore();
  // Use selectors to subscribe to team updates
  const clusters = useMapClusterTeamStore((state) => state.clusters);
  const teamsByClusterId = useMapClusterTeamStore((state) => state.teamsByClusterId);
  const fetchClustersByContestId = useMapClusterTeamStore((state) => state.fetchClustersByContestId);
  const fetchTeamsByClusterId = useMapClusterTeamStore((state) => state.fetchTeamsByClusterId);
  const navigate = useNavigate();
  

  const rows = (teamsByContest ?? []) as any[];

  // Fetch clusters when contestId is available
  useEffect(() => {
    if (contestId) {
      fetchClustersByContestId(contestId);
    }
  }, [contestId, fetchClustersByContestId]);

  // Fetch teams for each cluster when clusters are available
  useEffect(() => {
    if (clusters && clusters.length > 0 && contestId) {
      clusters.forEach((cluster: any) => {
        // Only fetch if we don't already have teams for this cluster
        if (!teamsByClusterId[cluster.id]) {
          fetchTeamsByClusterId(cluster.id);
        }
      });
    }
  }, [clusters, contestId, fetchTeamsByClusterId, teamsByClusterId]);

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
  
  
  // Filter and sort rows based on result type
  const filteredRows = useMemo(() => {
    if (resultType === 'preliminary') {
      // Preliminary: ALL teams in the contest, sorted by preliminary_total_score descending
      const sorted = [...rows].sort((a, b) => (b.preliminary_total_score || 0) - (a.preliminary_total_score || 0));
      return sorted;
    } else if (resultType === 'championship') {
      // Championship: ONLY teams explicitly advanced to championship (advanced_to_championship === true)
      return rows
        .filter(team => team.advanced_to_championship === true)
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    } else if (resultType === 'redesign') {
      // Redesign: Teams NOT advanced to championship (advanced_to_championship !== true, including null/undefined)
      return rows
        .filter(team => team.advanced_to_championship !== true)
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    }
    return rows;
  }, [rows, resultType]);

  // UI-only: make rows clickable for the same navigation as the VIEW button
  const handleView = (teamId: number) => {
    if (resultType === 'preliminary') {
      navigate(`/score-breakdown/${teamId}`);
    } else if (resultType === 'championship') {
      navigate(`/championship-score-breakdown/${teamId}`);
    } else if (resultType === 'redesign') {
      navigate(`/redesign-score-breakdown/${teamId}`);
    }
  };
 
  return (
    <Container maxWidth={false} sx={{ px: 0, py: 0, width: "100%" }}>
      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: 1,
          width: "100%",
          // Only enable horizontal scroll on small/medium screens, no scroll on large screens
          overflowX: { xs: "auto", sm: "auto", lg: "visible" },
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: { xs: 'thin', lg: 'none' },
          '&::-webkit-scrollbar': { 
            height: { xs: 8, lg: 0 },
            display: { xs: 'block', lg: 'none' } // Hide scrollbar on larger screens
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: (t) => alpha(t.palette.text.primary, 0.3),
            borderRadius: 8,
          },
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            // Responsive width: fixed on mobile/tablet, 100% on larger screens
            width: { xs: "1200px", lg: "100%" },
            minWidth: { xs: "1200px", lg: "auto" },
            maxWidth: "100%",
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
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleCols.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {resultType === 'championship' 
                      ? 'No teams have advanced to championship yet.'
                      : resultType === 'redesign'
                      ? 'No redesign teams available.'
                      : 'No teams found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((team: any, idx: number) => {
              // Rank is based on position in the sorted array (1-based)
              const rank = idx + 1;
              
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
                  role="button"
                  tabIndex={0}
                  onClick={() => handleView(team.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleView(team.id); }}
                  sx={{
                    bgcolor: rowBg,
                    borderTop: borderColor ? `3px solid ${borderColor}` : undefined,
                    borderBottom: borderColor ? `3px solid ${borderColor}` : undefined,
                    cursor: 'pointer',
                    transition: 'background-color 120ms ease',
                    outline: 'none',
                    '&:focus-visible': { boxShadow: (t) => `0 0 0 2px ${alpha(t.palette.primary.main, 0.4)}` },
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

                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => {
                        handleView(team.id);
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
            })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}