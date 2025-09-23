import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Team } from "../../types";

interface ICoachTeamScoresTable {
  team: Team;
  contestId?: number;
}

export default function CoachTeamScoresTable(props: ICoachTeamScoresTable) {
  const { team, contestId } = props;
  const navigate = useNavigate();
  return (
    <TableContainer component={Box}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableBody>
          <TableRow>
            <TableCell align="center">Rank</TableCell>
            <TableCell align="center">Journal</TableCell>
            <TableCell align="center">Presentation</TableCell>
            <TableCell align="center">Machine Design & Operation</TableCell>
            <TableCell align="center">Penalties</TableCell>
            <TableCell align="center">Total Score</TableCell>
            <TableCell align="center">Score Breakdown</TableCell>
          </TableRow>
          <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
            {team.team_rank ? (
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {team.team_rank}
              </TableCell>
            ) : (
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                0
              </TableCell>
            )}
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              {team.journal_score}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              {team.presentation_score}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              {team.machinedesign_score}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              {team.penalties_score}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              {team.total_score}
            </TableCell>
            <TableCell align="center">
            <Button onClick={() => navigate(`/score-breakdown/${team.id}/${contestId || ''}`)}>
              View Score Breakdown
            </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
