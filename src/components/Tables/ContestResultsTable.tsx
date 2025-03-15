import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import theme from "../../theme";
// FILE OVERVIEW: table component for results page

// Define the structure of a row
interface ContestResultsRow {
  id: number;
  team_name: string;
  team_rank: number;
  total_score: number;
  coachName: string;
  awards: string;
}

// Define the props for table
interface ContestResultsTableProps {
  rows: ContestResultsRow[]; 
}

export default function ContestResultsTable({ rows }: ContestResultsTableProps) {
  return (
    <TableContainer component={Paper} elevation={3} sx={{ width: "100%", borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: theme.palette.primary.main }}>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Team Name</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Coach</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Rank</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Score</TableCell>
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Awards</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} sx={{ "&:nth-of-type(odd)": { bgcolor: theme.palette.action.hover } }}>
              <TableCell>{row.team_name}</TableCell>
              <TableCell>{row.coachName || "N/A"}</TableCell>
              <TableCell>{row.team_rank || 0}</TableCell>
              <TableCell>{row.total_score}</TableCell>
              <TableCell>{row.awards || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}