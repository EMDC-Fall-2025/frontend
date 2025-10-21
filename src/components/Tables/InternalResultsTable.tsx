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

// % widths so the table fills the row
const COLS = [
  { key: "rank",        label: "Rank",      width: "6%",  align: "center" as const },
  { key: "team",        label: "Team",      width: "20%", align: "left"   as const },
  { key: "school",      label: "School",    width: "20%", align: "left"   as const },
  { key: "journal",     label: "Journal",   width: "9%",  align: "center" as const },
  { key: "presentation",label: "Present.",  width: "9%",  align: "center" as const },
  { key: "machine",     label: "Machine",   width: "12%", align: "center" as const },
  { key: "penalties",   label: "Penalties", width: "8%",  align: "center" as const },
  { key: "total",       label: "Total",     width: "8%",  align: "center" as const },
  { key: "details",     label: "Details",   width: "8%",  align: "center" as const },
];

const GOLD   = "#D4AF37";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

const bgGold   = (t: any) => alpha(GOLD,   0.18);
const bgSilver = (t: any) => alpha(SILVER, 0.18);
const bgBronze = (t: any) => alpha(BRONZE, 0.18);

export default function InternalResultsTable() {
  const { teamsByContest } = useMapContestToTeamStore();
  const navigate = useNavigate();

  const rows = (teamsByContest ?? []) as any[];

  return (
    <Container maxWidth={false} sx={{ px: 0, py: 0 }}>
      <TableContainer 
        component={Paper} 
        elevation={2} 
        sx={{ 
          borderRadius: 1,
          overflow: "auto",
          maxWidth: "100%"
        }}
      >
        <Table
          size="small"
          sx={{ 
            tableLayout: "fixed", 
            width: "100%",
            minWidth: { xs: 600, sm: 800 }
          }}
          aria-label="contest results"
        >
          <TableHead>
            <TableRow sx={{ bgcolor: (t) => alpha(t.palette.success.main, 0.08) }}>
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

              if (is1) { rowBg = (t: any) => bgGold(t);   borderColor = GOLD; }
              if (is2) { rowBg = (t: any) => bgSilver(t); borderColor = SILVER; }
              if (is3) { rowBg = (t: any) => bgBronze(t); borderColor = BRONZE; }

              const school: string = team.school ?? team.school_name ?? "—";

              return (
                <TableRow
                  key={team.id}
                  hover
                  sx={{
                    bgcolor: rowBg,
                    borderTop:    borderColor ? `3px solid ${borderColor}` : undefined,
                    borderBottom: borderColor ? `3px solid ${borderColor}` : undefined,
                  }}
                >
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
                      ID: {team.id}
                    </Typography>
                  </TableCell>

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
                    -{Number(team.penalties_score).toFixed(1)}
                  </TableCell>

                  {/* Total */}
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

                  {/* Details */}
                  <TableCell 
                    align="center"
                    sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 0.25, sm: 1 } }}
                  >
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
            
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
