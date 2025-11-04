import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import theme from "../../theme";
// FILE OVERVIEW: table component for results page

interface ContestResultsRow {
  id: number;
  team_name: string;
  school_name: string;
  team_rank: number;
  total_score: number;
  coachName: string;
  awards: string;
}

interface ContestResultsTableProps {
  rows: ContestResultsRow[];
}

export default function ContestResultsTable({ rows }: ContestResultsTableProps) {
  return (
    <TableContainer component={Paper} elevation={3} sx={{ width: "100%", borderRadius: 2 }}>
      <Table
        sx={{
          "& th:first-of-type, & td:first-of-type": {
            pl: 1,
          },
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Team Name</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>School</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Coach</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Rank</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Score</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Awards</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, index) => {
            let rowClass = "";
            if (index === 0) rowClass = "sparkle-gold"; // 🥇 gold shimmer
            else if (index === 1) rowClass = "sparkle-silver"; // 🥈 silver shimmer
            else if (index === 2) rowClass = "sparkle-bronze"; // 🥉 bronze shimmer

            return (
              <TableRow
                key={row.id}
                className={rowClass}
                sx={{
                  transition: "opacity 0.3s ease",
                  "&:hover": { opacity: 0.9 },
                }}
              >
                <TableCell>{row.team_name}</TableCell>
                <TableCell>{row.school_name || "N/A"}</TableCell>
                <TableCell>{row.coachName || "N/A"}</TableCell>
                <TableCell>{row.team_rank || 0}</TableCell>
                <TableCell>{row.total_score}</TableCell>
                <TableCell>{row.awards || "N/A"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>

      </Table>
    </TableContainer>
  );
}
