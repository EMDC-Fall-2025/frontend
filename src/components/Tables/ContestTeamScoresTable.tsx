import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import theme from "../../theme";

interface Team {
  id: number;
  team_name: string;
  school_name?: string;
  team_rank?: number;
  total_score?: number;
}

interface ContestResultsTableProps {
  teams: Team[];
  coachNames: { [key: number]: string };
  teamAwards: { [key: number]: string };
}

export default function ContestResultsTable({ teams, coachNames, teamAwards }: ContestResultsTableProps) {
  return (
    <TableContainer component={Paper} elevation={3} sx={{ width: "100%", borderRadius: 2 }}>
      <Table>
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
          {teams.map((team) => (
            <TableRow key={team.id} sx={{ "&:nth-of-type(odd)": { bgcolor: theme.palette.action.hover } }}>
              <TableCell>{team.team_name}</TableCell>
              <TableCell>{team.school_name || "NA"}</TableCell>
              <TableCell>{coachNames[team.id] || "N/A"}</TableCell>
              <TableCell>{team.team_rank || 0}</TableCell>
              <TableCell>{team.total_score}</TableCell>
              <TableCell>{teamAwards[team.id] || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}