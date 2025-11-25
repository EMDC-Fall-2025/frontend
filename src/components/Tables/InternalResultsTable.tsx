// ==============================
// Component: InternalResultsTable
// Comprehensive results table with tabbed views for preliminary, championship, and redesign results.
// Features medal styling, clickable rows, cluster information, and responsive design.
// ==============================

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

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

import { useMapContestToTeamStore } from "../../store/map_stores/mapContestToTeamStore";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";

// Table column definitions with responsive widths
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

// Medal colors for top 3 rankings
const GOLD = "#D4AF37";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

const bgGold = () => alpha(GOLD, 0.18);
const bgSilver = () => alpha(SILVER, 0.18);
const bgBronze = () => alpha(BRONZE, 0.18);

// ==============================
// Theme Config
// ==============================
export type ThemeType = "green" | "brown" | "black";

const THEME_MAP: Record<
  ThemeType,
  {
    cardBg: string;
    primary: string;
    primaryDark: string;
    soft: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    shadow: string;
    hover: string;
    evenRow: string;
    oddRow: string;
  }
> = {
  green: {
    cardBg: "#FFFFFF",
    primary: "#166534",
    primaryDark: "#064E3B",
    soft: "#E6F4EA",
    border: "#E5E7EB",
    textPrimary: "#0B1120",
    textMuted: "#6B7280",
    shadow: "rgba(15, 23, 42, 0.08)",
    hover: "#ECFDF3",
    evenRow: "#FFFFFF",
    oddRow: "#FAFAFA",
  },
  brown: {
    cardBg: "#FFFFFF",
    primary: "#8B4513",
    primaryDark: "#654321",
    soft: "#F5E6D3",
    border: "#D4C4B0",
    textPrimary: "#3E2723",
    textMuted: "#6D4C41",
    shadow: "rgba(62, 39, 35, 0.08)",
    hover: "#F5E6D3",
    evenRow: "#FFFFFF",
    oddRow: "#FAF8F5",
  },
  black: {
    cardBg: "#1F2933",
    primary: "#111827",
    primaryDark: "#000000",
    soft: "#374151",
    border: "#4B5563",
    textPrimary: "#F9FAFB",
    textMuted: "#9CA3AF",
    shadow: "rgba(0, 0, 0, 0.35)",
    hover: "#111827",
    evenRow: "#111827",
    oddRow: "#020617",
  },
};

// ==============================
// Types & Interfaces
// ==============================
interface InternalResultsTableProps {
  contestId?: number;
  resultType?: "preliminary" | "championship" | "redesign";
  // ✅ theme is passed in from parent, shared by ALL tables
  theme?: ThemeType;
}

export default function InternalResultsTable({
  contestId,
  resultType = "preliminary",
  theme = "green",
}: InternalResultsTableProps) {
  const navigate = useNavigate();

  const { teamsByContest } = useMapContestToTeamStore();
  const clusters = useMapClusterTeamStore((state) => state.clusters);
  const teamsByClusterId = useMapClusterTeamStore((state) => state.teamsByClusterId);
  const fetchClustersByContestId = useMapClusterTeamStore(
    (state) => state.fetchClustersByContestId
  );
  const fetchTeamsByClusterId = useMapClusterTeamStore(
    (state) => state.fetchTeamsByClusterId
  );

  const rows = (teamsByContest ?? []) as any[];

  const colors = THEME_MAP[theme];

  // ==============================
  // Data Loading & Effects
  // ==============================
  useEffect(() => {
    if (contestId) {
      fetchClustersByContestId(contestId);
    }
  }, [contestId, fetchClustersByContestId]);

  useEffect(() => {
    if (clusters && clusters.length > 0 && contestId) {
      clusters.forEach((cluster: any) => {
        if (!teamsByClusterId[cluster.id]) {
          fetchTeamsByClusterId(cluster.id);
        }
      });
    }
  }, [clusters, contestId, fetchTeamsByClusterId, teamsByClusterId]);

  // ==============================
  // Computed Values
  // ==============================
  const clusterNameByTeamId = useMemo(() => {
    const mapping: { [teamId: number]: string } = {};

    clusters.forEach((cluster: any) => {
      if (cluster.cluster_type === "preliminary") {
        const teams = teamsByClusterId[cluster.id] || [];
        teams.forEach((team: any) => {
          mapping[team.id] = cluster.cluster_name;
        });
      }
    });

    return mapping;
  }, [clusters, teamsByClusterId]);

  const visibleCols = useMemo(() => {
    if (resultType !== "redesign") return COLS;
    const keep = new Set(["rank", "team", "school", "total", "details"]);
    return COLS.filter((c) => keep.has(c.key));
  }, [resultType]);

  const filteredRows = useMemo(() => {
    if (resultType === "preliminary") {
      const sorted = [...rows].sort(
        (a, b) =>
          (b.preliminary_total_score || 0) - (a.preliminary_total_score || 0)
      );
      return sorted;
    } else if (resultType === "championship") {
      return rows
        .filter((team) => team.advanced_to_championship === true)
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    } else if (resultType === "redesign") {
      return rows
        .filter((team) => team.advanced_to_championship !== true)
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    }
    return rows;
  }, [rows, resultType]);

  // ==============================
  // Event Handlers
  // ==============================
  const handleView = (teamId: number) => {
    if (resultType === "preliminary") {
      navigate(`/score-breakdown/${teamId}`);
    } else if (resultType === "championship") {
      navigate(`/championship-score-breakdown/${teamId}`);
    } else if (resultType === "redesign") {
      navigate(`/redesign-score-breakdown/${teamId}`);
    }
  };

  // ==============================
  // Render
  // ==============================
  return (
    <Container maxWidth={false} sx={{ px: 0, py: 0, width: "100%" }}>
      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: 1,
          width: "100%",
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 14px 30px ${colors.shadow}`,
          overflowX: { xs: "auto", sm: "auto", lg: "visible" },
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: { xs: "thin", lg: "none" },
          "&::-webkit-scrollbar": {
            height: { xs: 8, lg: 0 },
            display: { xs: "block", lg: "none" },
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: alpha(colors.primary, 0.3),
            borderRadius: 8,
          },
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            width: { xs: "1200px", lg: "100%" },
            minWidth: { xs: "1200px", lg: "auto" },
            maxWidth: "100%",
            tableLayout: "fixed",
          }}
          aria-label="contest results"
        >
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(colors.primary, 0.08) }}>
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

                      ...(!isPenaltyHeader && { whiteSpace: "nowrap" }),

                      ...(c.key === "penalties" && { color: "error.main" }),
                      ...(c.key === "total" && {
                        color: "common.white",
                        bgcolor: colors.primary,
                      }),
                      ...(c.key !== "penalties" &&
                        c.key !== "total" && {
                          color: colors.primaryDark,
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
                <TableCell
                  colSpan={visibleCols.length}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography
                    variant="body1"
                    sx={{ color: colors.textMuted }}
                  >
                    {resultType === "championship"
                      ? "No teams have advanced to championship yet."
                      : resultType === "redesign"
                      ? "No redesign teams available."
                      : "No teams found."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((team: any, idx: number) => {
                const rank = idx + 1;

                const is1 = rank === 1;
                const is2 = rank === 2;
                const is3 = rank === 3;

                let rowBg: any = idx % 2 ? colors.oddRow : colors.evenRow;
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

                const school: string =
                  team.school ?? team.school_name ?? "—";

                return (
                  <TableRow
                    key={team.id}
                    hover
                    role="button"
                    tabIndex={0}
                    onClick={() => handleView(team.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleView(team.id);
                    }}
                    sx={{
                      bgcolor: rowBg,
                      borderTop: borderColor
                        ? `3px solid ${borderColor}`
                        : undefined,
                      borderBottom: borderColor
                        ? `3px solid ${borderColor}`
                        : undefined,
                      cursor: "pointer",
                      transition: "background-color 120ms ease",
                      outline: "none",
                      "&:hover": {
                        bgcolor: colors.hover,
                      },
                      "&:focus-visible": {
                        boxShadow: `0 0 0 2px ${alpha(
                          colors.primary,
                          0.4
                        )}`,
                      },
                    }}
                  >
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 900,
                        color: borderColor ?? colors.textPrimary,
                      }}
                    >
                      {rank ?? "—"}{" "}
                      {is1 ? "🏆" : is2 ? "🥈" : is3 ? "🥉" : null}
                    </TableCell>

                    <TableCell>
                      <Typography
                        fontWeight={700}
                        sx={{ color: colors.textPrimary }}
                      >
                        {team.team_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: colors.textMuted }}
                      >
                        {clusterNameByTeamId[team.id] || `ID: ${team.id}`}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ color: colors.textPrimary }}
                      >
                        {school}
                      </Typography>
                    </TableCell>

                    {resultType !== "redesign" && (
                      <>
                        <TableCell align="center" sx={{ color: colors.textPrimary }}>
                          {resultType === "preliminary"
                            ? team.preliminary_journal_score
                            : resultType === "championship"
                            ? team.preliminary_journal_score
                            : 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.textPrimary }}>
                          {resultType === "preliminary"
                            ? team.preliminary_presentation_score
                            : resultType === "championship"
                            ? team.championship_presentation_score ?? 0
                            : 0}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.textPrimary }}>
                          {resultType === "preliminary"
                            ? team.preliminary_machinedesign_score
                            : resultType === "championship"
                            ? team.championship_machinedesign_score ?? 0
                            : 0}
                        </TableCell>
                      </>
                    )}

                    {resultType !== "redesign" && (
                      <>
                        {/* General Penalties */}
                        <TableCell
                          align="center"
                          sx={{ color: "error.main", fontWeight: 600 }}
                        >
                          -
                          {Number(
                            resultType === "preliminary"
                              ? team.preliminary_penalties_score ?? 0
                              : resultType === "championship"
                              ? team.championship_general_penalties_score ??
                                0
                              : 0
                          ).toFixed(1)}
                        </TableCell>
                        {/* Run Penalties */}
                        <TableCell
                          align="center"
                          sx={{ color: "error.main", fontWeight: 600 }}
                        >
                          -
                          {Number(
                            resultType === "preliminary"
                              ? team.penalties_score ?? 0
                              : resultType === "championship"
                              ? team.championship_run_penalties_score ?? 0
                              : 0
                          ).toFixed(1)}
                        </TableCell>
                        {/* Total Penalties */}
                        <TableCell
                          align="center"
                          sx={{ color: "error.main", fontWeight: 800 }}
                        >
                          -
                          {Number(
                            resultType === "preliminary"
                              ? (team.preliminary_penalties_score ?? 0) +
                                (team.penalties_score ?? 0)
                              : resultType === "championship"
                              ? (team.championship_general_penalties_score ??
                                  0) +
                                (team.championship_run_penalties_score ?? 0)
                              : 0
                          ).toFixed(1)}
                        </TableCell>
                      </>
                    )}

                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 900,
                        color: "common.white",
                        bgcolor: is1
                          ? GOLD
                          : is2
                          ? SILVER
                          : is3
                          ? BRONZE
                          : colors.primary,
                        fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        py: { xs: 0.5, sm: 1 },
                        px: { xs: 0.25, sm: 1 },
                      }}
                    >
                      {resultType === "preliminary"
                        ? Number(
                            team.preliminary_total_score || 0
                          ).toFixed(1)
                        : resultType === "championship"
                        ? Number(
                            (team.preliminary_journal_score || 0) +
                              (team.championship_presentation_score || 0) +
                              (team.championship_machinedesign_score || 0) -
                              (team.championship_penalties_score || 0)
                          ).toFixed(1)
                        : Number(
                            (team.total_score ?? team.redesign_score) || 0
                          ).toFixed(1)}
                    </TableCell>

                    <TableCell
                      align="center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          handleView(team.id);
                        }}
                        sx={{
                          fontSize: { xs: "0.6rem", sm: "0.75rem" },
                          px: { xs: 1, sm: 2 },
                          py: { xs: 0.25, sm: 0.5 },
                          borderColor: colors.primary,
                          color: colors.primary,
                          fontWeight: 600,
                          "&:hover": {
                            borderColor: colors.primaryDark,
                            backgroundColor: colors.soft,
                          },
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
