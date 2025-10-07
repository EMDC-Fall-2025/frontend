// src/pages/MasterScoresheet.tsx
import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import theme from "../theme";
import { useNavigate } from "react-router-dom";

// This type describes what each row of the table should look like
// So every result/team should have these properties
export type ResultRow = {
  id: string | number;
  team: string;
  journalScore: number;
  presentationScore: number;
  machineScore: number;
  penalties: number;
  totalScore: number;
  rank: number;
};

type Props = {
  results?: ResultRow[];
  loading?: boolean;
  onEditTeamScore?: (row: ResultRow) => void;
  onExportCsv?: (rows: ResultRow[]) => void;
};

// Sample data just for now - will be replaced later with actual data from backend
const SAMPLE: ResultRow[] = [
  {
    id: 1,
    team: "Team Alpha",
    journalScore: 85,
    presentationScore: 90,
    machineScore: 88,
    penalties: -5,
    totalScore: 258,
    rank: 1,
  },
  {
    id: 2,
    team: "Team Beta",
    journalScore: 82,
    presentationScore: 85,
    machineScore: 86,
    penalties: 0,
    totalScore: 253,
    rank: 2,
  },
  {
    id: 3,
    team: "Team Gamma",
    journalScore: 80,
    presentationScore: 88,
    machineScore: 84,
    penalties: -3,
    totalScore: 249,
    rank: 3,
  },
  {
    id: 4,
    team: "Team Delta",
    journalScore: 78,
    presentationScore: 82,
    machineScore: 80,
    penalties: -2,
    totalScore: 238,
    rank: 4,
  },
  {
    id: 5,
    team: "Team Epsilon",
    journalScore: 75,
    presentationScore: 80,
    machineScore: 78,
    penalties: 0,
    totalScore: 233,
    rank: 5,
  },
];

// This is the main component that shows the whole page
export default function MasterScoresheet({
  results,
  loading = false,
  onEditTeamScore,
  onExportCsv,
}: Props) {
  const navigate = useNavigate();
  const rows = results ?? SAMPLE;

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "total">("rank");
  const [error] = useState<string | null>(null);

  // This handles the small dialog pop-up when we click "View"
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<ResultRow | null>(null);

  // Filtered and sorted rows
  const filteredAndSortedRows = useMemo(() => {
    let filtered = rows.filter((r) =>
      r.team.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortBy === "rank") return a.rank - b.rank;
      return b.totalScore - a.totalScore;
    });
  }, [rows, searchTerm, sortBy]);

  // When "View" is clicked it opens the dialog and shows that team's data
  const handleView = (row: ResultRow) => {
    setViewRow(row);
    setOpenView(true);
  };

  // "Edit" button is not still functional yet
  const handleEdit = (row: ResultRow) => {
    if (onEditTeamScore) onEditTeamScore(row);
    else alert(`Open edit team score form for ${row.team}`);
  };

  // Refresh the page
  const handleRefresh = () => {
    window.location.reload();
  };

  // Export to CSV
  const handleExport = () => {
    if (onExportCsv) return onExportCsv(filteredAndSortedRows);

    const header = [
      "Team",
      "Journal Score",
      "Presentation Score",
      "Machine Design and Operation Score",
      "Penalties",
      "Total Score",
      "Rank",
    ];
    const csv = [
      header.join(","),
      ...filteredAndSortedRows.map((r) =>
        [
          r.team,
          r.journalScore,
          r.presentationScore,
          r.machineScore,
          r.penalties,
          r.totalScore,
          r.rank,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "master-scoresheet.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get rank color based on position
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          color: "#FFD700",
          bg: "rgba(255, 215, 0, 0.15)",
        };
      case 2:
        return {
          color: "#C0C0C0",
          bg: "rgba(192, 192, 192, 0.2)",
        };
      case 3:
        return {
          color: "#CD7F32",
          bg: "rgba(205, 127, 50, 0.15)",
        };
      default:
        return {
          color: theme.palette.success.dark,
          bg: "rgba(46,125,50,0.12)",
        };
    }
  };

  const border = `1px solid ${theme.palette.grey[300]}`;

  return (
    <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="xl" sx={{ pb: 6 }}>
        {/* Back link */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 3, mb: 1 }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ color: theme.palette.success.main }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Link
            component="button"
            underline="none"
            color="success.main"
            onClick={() => navigate(-1)}
            sx={{ fontSize: 14, "&:hover": { color: "success.dark" } }}
          >
            Back to Dashboard
          </Link>
        </Stack>

        {/* Title */}
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: theme.palette.success.main }}
          >
            Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredAndSortedRows.length} team(s) found
          </Typography>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search and Filter Controls */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              size="small"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as "rank" | "total")}
              >
                <MenuItem value="rank">Rank</MenuItem>
                <MenuItem value="total">Total Score</MenuItem>
              </Select>
            </FormControl>
            <Button
              onClick={handleRefresh}
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{ textTransform: "none" }}
            >
              Refresh
            </Button>
          </Stack>
        </Paper>

        {/* Table container with Admin-like chrome */}
        <Box
          sx={{
            border: border,
            borderRadius: 3,
            backgroundColor: "#fff",
            overflow: "hidden",
          }}
        >
          {/* Header row above table: actions */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 3, py: 2 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Master Scoresheet
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                onClick={handleExport}
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2,
                  borderColor: theme.palette.success.main,
                  color: theme.palette.success.main,
                  "&:hover": {
                    borderColor: theme.palette.success.dark,
                    backgroundColor: "rgba(46,125,50,0.06)",
                  },
                }}
              >
                Export CSV
              </Button>
            </Stack>
          </Stack>
          <Divider />

          <Box sx={{ p: 0 }}>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                maxHeight: 600,
                overflowY: "auto",
              }}
            >
              <Table size="small" aria-label="master-scoresheet" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                    >
                      Team
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                    >
                      Journal Score
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                    >
                      Presentation Score
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                    >
                      Machine Design and Operation Score
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                    >
                      Penalties
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                    >
                      Total Score
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                    >
                      Rank
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                    >
                      Score Breakdown
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "text.secondary",
                        backgroundColor: "#eee",
                      }}
                      align="right"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        align="center"
                        sx={{ py: 6, color: "text.secondary" }}
                      >
                        Loading results…
                      </TableCell>
                    </TableRow>
                  ) : filteredAndSortedRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        align="center"
                        sx={{ py: 6, color: "text.secondary" }}
                      >
                        {searchTerm
                          ? `No teams found matching "${searchTerm}"`
                          : "No results available yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedRows.map((r) => {
                      const rankColor = getRankColor(r.rank);
                      return (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {r.team}
                          </TableCell>
                          <TableCell>{r.journalScore}</TableCell>
                          <TableCell>{r.presentationScore}</TableCell>
                          <TableCell>{r.machineScore}</TableCell>
                          <TableCell
                            sx={{
                              color: r.penalties < 0 ? "error.main" : "inherit",
                              fontWeight: r.penalties < 0 ? 600 : 400,
                            }}
                          >
                            {r.penalties}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {r.totalScore}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`#${r.rank}`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                color: rankColor.color,
                                backgroundColor: rankColor.bg,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleView(r)}
                              sx={{
                                textTransform: "none",
                                borderRadius: 2,
                                borderColor: theme.palette.grey[300],
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="inherit"
                              onClick={() => handleEdit(r)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Container>

      {/* View breakdown dialog - ENHANCED */}
      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Score Breakdown — {viewRow?.team}
        </DialogTitle>
        <DialogContent dividers>
          {viewRow ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Component Scores
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Journal Score:</Typography>
                    <Typography fontWeight={600}>
                      {viewRow.journalScore}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Presentation Score:</Typography>
                    <Typography fontWeight={600}>
                      {viewRow.presentationScore}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Machine Design & Operation:</Typography>
                    <Typography fontWeight={600}>
                      {viewRow.machineScore}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="error">Penalties:</Typography>
                    <Typography fontWeight={600} color="error">
                      {viewRow.penalties}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6">Total Score:</Typography>
                  <Typography
                    variant="h6"
                    color="success.main"
                    fontWeight={700}
                  >
                    {viewRow.totalScore}
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mt: 1 }}
                >
                  <Typography variant="h6">Rank:</Typography>
                  <Chip
                    label={`#${viewRow.rank}`}
                    color={viewRow.rank <= 3 ? "success" : "default"}
                    sx={{ fontWeight: 700, fontSize: 16 }}
                  />
                </Box>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)} variant="contained" color="success">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}