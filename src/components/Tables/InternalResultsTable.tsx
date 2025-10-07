import {
  Box,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import theme from "../../theme";
import { useMapContestToTeamStore } from "../../store/map_stores/mapContestToTeamStore";
import { useNavigate } from "react-router-dom";

export default function InternalResultsTable() {
  const { teamsByContest } = useMapContestToTeamStore();
  const navigate = useNavigate();
  function createData(
    id: number,
    team_name: string,
    school_name: string,
    journal_score: number,
    presentation_score: number,
    machinedesign_score: number,
    penalties_score: number,
    total_score: number,
    team_rank: number | null,
    score_breakdown: any
  ) {
    return {
      id,
      team_name,
      school_name,
      journal_score,
      presentation_score,
      machinedesign_score,
      penalties_score,
      total_score,
      team_rank,
      score_breakdown,
    };
  }

  const rows = teamsByContest.map((team) =>
    createData(
      team.id,
      team.team_name,
      team.school_name || 'MNSU',
      team.journal_score,
      team.presentation_score,
      team.machinedesign_score,
      team.penalties_score,
      team.total_score,
      team.team_rank,
      <Button onClick={() => navigate(`/score-breakdown/${team.id}`)}>
        View Score Breakdown
      </Button>
    )
  );

  return (
    <Container
      sx={{
        width: "100vw",
        height: "auto",
        position: "absolute",
        padding: 3,
        bgcolor: `${theme.palette.secondary.light}`,
        ml: 5,
        borderRadius: 5,
      }}
    >
      <TableContainer
        component={Box}
        sx={{ bgcolor: "white", borderRadius: 2 }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="center">Team</TableCell>
              <TableCell align="center">School</TableCell>
              <TableCell align="center">Journal Score</TableCell>
              <TableCell align="center">Presentation Score</TableCell>
              <TableCell align="center">
                Machine Design and Operation Score
              </TableCell>
              <TableCell align="center">Penalties</TableCell>
              <TableCell align="center">Total Score</TableCell>
              <TableCell align="center">Rank</TableCell>
              <TableCell align="center">Score Breakdown</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row" align="center">
                  {row.team_name}
                </TableCell>
                <TableCell align="center">{row.school_name}</TableCell>
                <TableCell align="center">{row.journal_score}</TableCell>
                <TableCell align="center">{row.presentation_score}</TableCell>
                <TableCell align="center">{row.machinedesign_score}</TableCell>
                <TableCell align="center">{row.penalties_score}</TableCell>
                <TableCell align="center">{row.total_score}</TableCell>
                <TableCell align="center">{row.team_rank}</TableCell>
                <TableCell align="center">{row.score_breakdown}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
