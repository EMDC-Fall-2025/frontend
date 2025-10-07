/*import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import theme from "../theme";

interface Contest {
  id: number;
  name: string;
  date: string;
}

export default function MasterScorePage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("2025");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/contest/getAll/")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch contests");
        return res.json();
      })
      .then((data) => {
        setContests(data.Contests || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg">
        {/* Back to Dashboard *//*}
        <Button variant="contained" onClick={() => navigate("/organizer/")} sx={{ m: 1 }}>
            Back To Organizer Dashboard
        </Button>

        {/* Title *//*}
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: theme.palette.success.main }}
          >
            MASTER SCORE SHEET
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View and manage all contests
          </Typography>
        </Stack>

        {/* Year filter *//*}
        <Box sx={{ mb: 3 }}>
          <Select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            sx={{
              minWidth: 140,
              borderRadius: 2,
              backgroundColor: "#fff",
              "& .MuiSelect-select": { py: 1.2 }
            }}
          >
            <MenuItem value="2025">2025</MenuItem>
            <MenuItem value="2024">2024</MenuItem>
            <MenuItem value="2023">2023</MenuItem>
          </Select>
        </Box>

        {/* Loading / Error *//*}
        {loading && <Typography>Loading...</Typography>}
        {error && <Typography color="error">Error: {error}</Typography>}

        {/* Contest Table *//*}
        {!loading && !error && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.grey[300]}`,
              overflow: "hidden"
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.primary.light }}>
                    <TableCell
                      sx={{ fontWeight: 700, color: theme.palette.primary.dark }}
                    >
                      Contest Name
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: theme.palette.primary.dark }}
                    >
                      Date
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contests.map((contest) => (
                    <TableRow
                      key={contest.id}
                      sx={{
                        "&:hover": { backgroundColor: theme.palette.grey[100] }
                      }}
                    >
                      <TableCell>{contest.name}</TableCell>
                      <TableCell>{contest.date}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          onClick={() =>
                            navigate(`/organizer/master-score/${contest.id}`)
                          }
                          sx={{
                            borderRadius: 2,
                            backgroundColor: theme.palette.primary.main,
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": {
                              backgroundColor: theme.palette.primary.dark
                            }
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
*/