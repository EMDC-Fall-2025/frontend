import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import useContestStore from "../store/primary_stores/contestStore";
import { useTeamStore } from "../store/primary_stores/teamStore";
import theme from "../theme";

export default function FeedbackTest() {
  const { allContests, fetchAllContests } = useContestStore();
  const { teams, fetchAllTeams } = useTeamStore();
  
  const [selectedContestId, setSelectedContestId] = useState<number | "">("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllContests();
    fetchAllTeams();
  }, []);

  const fetchTeamFeedback = async () => {
    if (!selectedTeamId || !selectedContestId) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/scoreSheet/getDetails/${selectedTeamId}/?contestid=${selectedContestId}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFeedbackData(data);
    } catch (error: any) {
      setError(error.message || "Error fetching feedback data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamComments = async () => {
    if (!selectedTeamId || !selectedContestId) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/tabulation/getScoresheetCommentsByTeamId/?teamid=${selectedTeamId}&contestid=${selectedContestId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFeedbackData(data);
    } catch (error: any) {
      setError(error.message || "Error fetching comments data");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTeam = teams.find(team => team.id === selectedTeamId);
  const selectedContest = allContests.find(contest => contest.id === selectedContestId);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main, mb: 1 }}>
            Feedback Control Test
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Test how feedback display settings affect what teams see in results
          </Typography>
        </Box>

        {/* Selection Controls */}
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Select Contest and Team
              </Typography>
              
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Contest</InputLabel>
                  <Select
                    value={selectedContestId}
                    onChange={(e) => setSelectedContestId(e.target.value as number)}
                    label="Contest"
                  >
                    {allContests.map((contest) => (
                      <MenuItem key={contest.id} value={contest.id}>
                        {contest.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Team</InputLabel>
                  <Select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value as number)}
                    label="Team"
                  >
                    {teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.team_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={fetchTeamFeedback}
                  disabled={!selectedTeamId || !selectedContestId || isLoading}
                  sx={{ 
                    textTransform: "none",
                    bgcolor: theme.palette.success.main,
                    "&:hover": { bgcolor: theme.palette.success.dark }
                  }}
                >
                  Get Score Sheet Details
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchTeamComments}
                  disabled={!selectedTeamId || !selectedContestId || isLoading}
                  sx={{ textTransform: "none" }}
                >
                  Get Comments Only
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Results Display */}
        {feedbackData && !isLoading && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Feedback Data for {selectedTeam?.team_name} in {selectedContest?.name}
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                <pre style={{ 
                  backgroundColor: "#f5f5f5", 
                  padding: "16px", 
                  borderRadius: "8px",
                  fontSize: "12px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {JSON.stringify(feedbackData, null, 2)}
                </pre>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              How to Test
            </Typography>
            <Typography variant="body2" color="text.secondary">
              1. Go to Admin → Feedback Control tab<br/>
              2. Select a contest and configure which feedback types to show/hide<br/>
              3. Save the settings<br/>
              4. Come back here and select the same contest and a team<br/>
              5. Click "Get Comments Only" to see filtered feedback<br/>
              6. The response will only include comments for enabled feedback types
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
