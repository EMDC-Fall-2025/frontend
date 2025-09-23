import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
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
  contestId?: number;
}

export default function ContestResultsTable({ rows, contestId }: ContestResultsTableProps) {
  const navigate = useNavigate();
  const [teamFeedbackStatus, setTeamFeedbackStatus] = useState<{ [key: number]: boolean }>({});

  // Check feedback status for all teams
  useEffect(() => {
    if (!contestId) return;

    const checkFeedbackForTeams = async () => {
      const feedbackStatus: { [key: number]: boolean } = {};
      
      for (const row of rows) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `/api/scoreSheet/checkFeedback/${row.id}/?contestid=${contestId}`,
            {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          feedbackStatus[row.id] = response.data.has_comments;
        } catch (error) {
          console.error(`Error checking feedback for team ${row.id}:`, error);
          feedbackStatus[row.id] = false;
        }
      }
      
      setTeamFeedbackStatus(feedbackStatus);
    };

    checkFeedbackForTeams();
  }, [rows, contestId]);
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
            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
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
              <TableCell>
                {teamFeedbackStatus[row.id] && (
                  <Button 
                    onClick={() => navigate(`/feedback/${row.id}/${contestId || ''}`)}
                    variant="outlined"
                    size="small"
                  >
                    View Feedback
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}