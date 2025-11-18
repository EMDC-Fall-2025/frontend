import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import theme from "../../theme";
// FILE OVERVIEW: table component for results page

interface ContestResultsRow {
  id: number;
  team_name: string;
  school_name: string;
  team_rank: number;
  total_score: number;
  awards: string;
}

interface ContestResultsTableProps {
  rows: ContestResultsRow[];
}

export default function ContestResultsTable({ rows }: ContestResultsTableProps) {
  return (
    <TableContainer 
      component={Paper} 
      elevation={0} 
      sx={{ 
        width: "100%", 
        borderRadius: "16px",
        overflow: "hidden",
        // 3D card effect for results table
        background: "linear-gradient(145deg, #f9f9f9 0%, #ffffff 40%, #f3f7ff 100%)",
        boxShadow: `
          0 18px 45px rgba(15, 52, 96, 0.18),
          0 8px 20px rgba(15, 52, 96, 0.12),
          0 1px 0 rgba(255, 255, 255, 0.9) inset
        `,
        border: `1px solid ${theme.palette.grey[200]}`,
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.7)",
          pointerEvents: "none",
        },
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
