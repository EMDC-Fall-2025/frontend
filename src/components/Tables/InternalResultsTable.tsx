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

const bgGold = (t: any) => alpha(GOLD, 0.18);
const bgSilver = (t: any) => alpha(SILVER, 0.18);
const bgBronze = (t: any) => alpha(BRONZE, 0.18);

export default function InternalResultsTable() {
  const { teamsByContest } = useMapContestToTeamStore();
  const navigate = useNavigate();

  const rows = (teamsByContest ?? []) as any[];

  return (
    <Container maxWidth={false} sx={{ px: 0, py: 0 }}>
<<<<<<< HEAD
      <TableContainer 
        component={Paper} 
        elevation={2} 
        sx={{ 
          borderRadius: 1,
          overflow: "auto",
          maxWidth: "100%"
=======
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
>>>>>>> 97eaa17b60e37f4ff7ee11532929f821c6fa153d
        }}
      >
        <Table
          size="small"
<<<<<<< HEAD
          sx={{ 
            tableLayout: "fixed", 
            width: "100%",
            minWidth: { xs: 600, sm: 800 }
=======
          sx={{
            // Force a wide natural width so mobile uses horizontal scroll instead of squeezing
            width: "1200px",
            minWidth: "1200px",
            tableLayout: "fixed",
>>>>>>> 97eaa17b60e37f4ff7ee11532929f821c6fa153d
          }}
          aria-label="contest results"
        >
          <TableHead>
            <TableRow sx={{ bgcolor: (t) => alpha(t.palette.success.main, 0.08) }}>
<<<<<<< HEAD
              {COLS.map((c) => (
                <TableCell
                  key={c.key}
                  align={c.align}
                  sx={{
                    width: c.width,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    fontSize: { xs: "0.7rem", sm: "0.875rem" },
                    py: { xs: 0.5, sm: 1 },
                    px: { xs: 0.25, sm: 1 },
                    ...(c.key === "penalties" && { color: "error.main" }),
                    ...(c.key === "total" && { color: "common.white", bgcolor: "success.main" }),
                  }}
                >
                  {c.label}
                </TableCell>
              ))}
=======
              {COLS.map((c) => {
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

                      // ✅ Fix overflow only for penalties headers (allow wrap)
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
>>>>>>> 97eaa17b60e37f4ff7ee11532929f821c6fa153d
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((team: any, idx: number) => {
              const rank = team.team_rank ?? null;
              const is1 = rank === 1;
              const is2 = rank === 2;
              const is3 = rank === 3;

              let rowBg: any = idx % 2 ? "grey.50" : "background.paper";
              let borderColor: string | undefined;

              if (is1) {
                rowBg = (t: any) => bgGold(t);
                borderColor = GOLD;
              }
              if (is2) {
                rowBg = (t: any) => bgSilver(t);
                borderColor = SILVER;
              }
              if (is3) {
                rowBg = (t: any) => bgBronze(t);
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
<<<<<<< HEAD
                  {/* Rank + medal */}
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 900, 
                      color: borderColor ?? "text.primary",
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
                    {rank ?? "—"} {is1 ? "🏆" : is2 ? "🥈" : is3 ? "🥉" : null}
                  </TableCell>

                  {/* Team */}
                  <TableCell 
                    sx={{ 
                      overflow: "hidden", 
                      textOverflow: "ellipsis",
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
                    <Typography 
                      fontWeight={700}
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                    >
                      {team.team_name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.disabled"
                      sx={{ fontSize: { xs: "0.6rem", sm: "0.75rem" } }}
                    >
=======
                  <TableCell align="center" sx={{ fontWeight: 900, color: borderColor ?? "text.primary" }}>
                    {rank ?? "—"} {is1 ? "🏆" : is2 ? "🥈" : is3 ? "🥉" : null}
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight={700}>{team.team_name}</Typography>
                    <Typography variant="caption" color="text.disabled">
>>>>>>> 97eaa17b60e37f4ff7ee11532929f821c6fa153d
                      ID: {team.id}
                    </Typography>
                  </TableCell>

<<<<<<< HEAD
                  {/* School */}
                  <TableCell 
                    sx={{ 
                      overflow: "hidden", 
                      textOverflow: "ellipsis",
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                    >
                      {school}
                    </Typography>
                  </TableCell>

                  {/* Scores */}
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600, 
                      color: "success.dark",
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
                    {team.journal_score}
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600, 
                      color: "success.dark",
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
                    {team.presentation_score}
                  </TableCell>
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 600, 
                      color: "success.dark",
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
                    {team.machinedesign_score}
                  </TableCell>

                  {/* Penalties */}
                  <TableCell 
                    align="center" 
                    sx={{ 
                      fontWeight: 800, 
                      color: "error.main",
                      fontSize: { xs: "0.7rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.25, sm: 1 }
                    }}
                  >
=======
                  <TableCell>
                    <Typography variant="body2">{school}</Typography>
                  </TableCell>

                  <TableCell align="center">{team.journal_score}</TableCell>
                  <TableCell align="center">{team.presentation_score}</TableCell>
                  <TableCell align="center">{team.machinedesign_score}</TableCell>

                  {/* New columns */}
                  <TableCell align="center" sx={{ color: "error.main", fontWeight: 600 }}>
                    -{Number(team.general_penalties ?? 0).toFixed(1)}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "error.main", fontWeight: 600 }}>
                    -{Number(team.run_penalties ?? 0).toFixed(1)}
                  </TableCell>

                  {/* Existing penalties */}
                  <TableCell align="center" sx={{ color: "error.main", fontWeight: 800 }}>
>>>>>>> 97eaa17b60e37f4ff7ee11532929f821c6fa153d
                    -{Number(team.penalties_score).toFixed(1)}
                  </TableCell>

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
                    {Number(team.total_score).toFixed(1)}
                  </TableCell>

<<<<<<< HEAD
                  {/* Details */}
                  <TableCell 
                    align="center"
                    sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 0.25, sm: 1 } }}
                  >
=======
                  <TableCell align="center">
>>>>>>> 97eaa17b60e37f4ff7ee11532929f821c6fa153d
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => navigate(`/score-breakdown/${team.id}`)}
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
<<<<<<< HEAD
            
=======
>>>>>>> 97eaa17b60e37f4ff7ee11532929f821c6fa153d
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
