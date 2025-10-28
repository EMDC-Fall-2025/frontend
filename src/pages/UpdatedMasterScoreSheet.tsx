// jspdf(pdf creation library) and jspdf-autotable(plugin for tables in jspdf)s
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  
  // Export to PDF functionality
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Engineering Machine Design Contest", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.text("Master Scoresheet", 105, 30, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 40, { align: "center" });
    
    // Prepare table data
    const tableHeaders = [
      "Rank",
      "Team Name",
      "Journal",
      "Presentation", 
      "Machine Design",
      "Penalties",
      "Total Score"
    ];
    
    const tableData = filteredAndSortedRows.map(row => [
      row.rank.toString(),
      row.team,
      row.journalScore.toString(),
      row.presentationScore.toString(),
      row.machineScore.toString(),
      row.penalties.toString(),
      row.totalScore.toString()
    ]);
    
    // Generate table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 50,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [46, 125, 50], // Green theme color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // Rank
        1: { halign: 'left', cellWidth: 40 },   // Team Name
        2: { halign: 'center', cellWidth: 20 }, // Journal
        3: { halign: 'center', cellWidth: 25 }, // Presentation
        4: { halign: 'center', cellWidth: 25 }, // Machine Design
        5: { halign: 'center', cellWidth: 20 }, // Penalties
        6: { halign: 'center', cellWidth: 25 }, // Total Score
      },
      didParseCell: function(data) {
        // Highlight top 3 ranks with special colors
        if (data.section === 'body' && data.column.index === 0) {
          const rank = parseInt(data.cell.text[0]);
          if (rank === 1) {
            data.cell.styles.fillColor = [255, 215, 0]; // Gold
            data.cell.styles.textColor = [0, 0, 0];
          } else if (rank === 2) {
            data.cell.styles.fillColor = [192, 192, 192]; // Silver
            data.cell.styles.textColor = [0, 0, 0];
          } else if (rank === 3) {
            data.cell.styles.fillColor = [205, 127, 50]; // Bronze
            data.cell.styles.textColor = [0, 0, 0];
          }
        }
        
        // Highlight negative penalties in red
        if (data.section === 'body' && data.column.index === 5) {
          const penalty = parseInt(data.cell.text[0]);
          if (penalty < 0) {
            data.cell.styles.textColor = [220, 53, 69]; // Red
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: "right" }
      );
    }
    
    // Save the PDF
    doc.save(`master-scoresheet-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  // Get rank color based on position
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return theme.palette.warning.main; // Gold
      case 2:
        return theme.palette.grey[500]; // Silver
      case 3:
        return theme.palette.warning.dark; // Bronze
      default:
        return theme.palette.text.secondary;
    }
  };
  
  const border = `1px solid ${theme.palette.grey[300]}`;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        {/* Header with back button */}
        <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
          <Link
            onClick={() => navigate(-1)}
            sx={{
              textDecoration: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              color: theme.palette.success.main,
              "&:hover": { color: theme.palette.success.dark },
            }}
          >
            <ArrowBackIcon sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Back
            </Typography>
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
                onClick={handleExportPDF}
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
                Export PDF
              </Button>
            </Stack>
          </Stack>
          
          <Divider />
          
          {/* The actual scores table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "rgba(46,125,50,0.06)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Team</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Journal
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Presentation
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Machine Design
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Penalties
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Total
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(46,125,50,0.04)" },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={`#${row.rank}`}
                        size="small"
                        sx={{
                          backgroundColor: getRankColor(row.rank),
                          color: row.rank <= 3 ? "white" : "inherit",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.team}</TableCell>
                    <TableCell align="center">{row.journalScore}</TableCell>
                    <TableCell align="center">{row.presentationScore}</TableCell>
                    <TableCell align="center">{row.machineScore}</TableCell>
                    <TableCell align="center">
                      <Typography
                        color={row.penalties < 0 ? "error" : "inherit"}
                        sx={{ fontWeight: row.penalties < 0 ? 600 : 400 }}
                      >
                        {row.penalties}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontWeight: 700 }}>
                        {row.totalScore}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          onClick={() => handleView(row)}
                          sx={{
                            color: theme.palette.primary.main,
                            "&:hover": { backgroundColor: "rgba(25,118,210,0.1)" },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(row)}
                          sx={{
                            color: theme.palette.warning.main,
                            "&:hover": { backgroundColor: "rgba(255,193,7,0.1)" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      
      {/* View Dialog */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Team Details</DialogTitle>
        <DialogContent>
          {viewRow && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="h6">{viewRow.team}</Typography>
              <Divider />
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Journal Score:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{viewRow.journalScore}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Presentation Score:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{viewRow.presentationScore}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Machine Design Score:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{viewRow.machineScore}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Penalties:</Typography>
                  <Typography 
                    sx={{ 
                      fontWeight: 600,
                      color: viewRow.penalties < 0 ? "error.main" : "inherit"
                    }}
                  >
                    {viewRow.penalties}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 700 }}>Total Score:</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {viewRow.totalScore}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 700 }}>Rank:</Typography>
                  <Chip
                    label={`#${viewRow.rank}`}
                    size="small"
                    sx={{
                      backgroundColor: getRankColor(viewRow.rank),
                      color: viewRow.rank <= 3 ? "white" : "inherit",
                      fontWeight: 600,
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}