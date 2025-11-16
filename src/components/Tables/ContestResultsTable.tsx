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
    <TableContainer 
      component={Paper} 
      elevation={2} 
      sx={{ 
        width: "100%", 
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <Table
        sx={{
          "& th:first-of-type, & td:first-of-type": {
            pl: { xs: 2, sm: 3 },
          },
          "& th:last-of-type, & td:last-of-type": {
            pr: { xs: 2, sm: 3 },
          },
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
            <TableCell sx={{ color: "white", fontWeight: 600, fontSize: { xs: "0.875rem", sm: "0.9375rem" } }}>Team Name</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 600, fontSize: { xs: "0.875rem", sm: "0.9375rem" } }}>School</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 600, fontSize: { xs: "0.875rem", sm: "0.9375rem" } }}>Coach</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 600, fontSize: { xs: "0.875rem", sm: "0.9375rem" } }} align="center">Rank</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 600, fontSize: { xs: "0.875rem", sm: "0.9375rem" } }} align="center">Score</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 600, fontSize: { xs: "0.875rem", sm: "0.9375rem" } }}>Awards</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, index) => {
            let rowClass = "";
            if (index === 0) rowClass = "sparkle-gold";
            else if (index === 1) rowClass = "sparkle-silver";
            else if (index === 2) rowClass = "sparkle-bronze";
            return (
              <TableRow
                key={row.id}
                className={rowClass}
                sx={{
                  transition: "all 0.2s ease",
                  "&:hover": { 
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                  "& td": {
                    fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                    py: { xs: 1.25, sm: 1.5 },
                  },
                }}
              >
                <TableCell sx={{ fontWeight: 500 }}>{row.team_name}</TableCell>
                <TableCell>{row.school_name || "N/A"}</TableCell>
                <TableCell>{row.coachName || "N/A"}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{row.team_rank || 0}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{row.total_score}</TableCell>
                <TableCell>{row.awards || "N/A"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>

      </Table>
    </TableContainer>
  );
}
