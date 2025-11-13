import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Collapse,
  IconButton,
  Container,
  Typography,
  Button,
  Checkbox,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import theme from "../../theme";
import { useNavigate } from "react-router-dom";
import AreYouSureModal from "../Modals/AreYouSureModal";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import { useMapScoreSheetStore } from "../../store/map_stores/mapScoreSheetStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type PenaltyQuestion = {
  id: number;
  field: string;
  questionText: string;
  pointValue: number;
  penaltyType: string;
  isIncrement: boolean;
  yesOrNo: string | undefined;
  pointText: string;
  incrementLowerBound: number | undefined;
  incrementUpperBound: number | undefined;
};

type IMultiTeamPenaltyTableProps = {
  sheetType: number;
  title: string;
  teams: { id: number; name: string }[];
  penalties: PenaltyQuestion[];
  judgeId: number | null;
  contestId: number;
};

export default function MultiTeamPenaltyTable({
  sheetType,
  title,
  penalties,
  judgeId,

}: IMultiTeamPenaltyTableProps) {
  // Tracks expand/collapse state per penalty category
  const [openRows, setOpenRows] = React.useState<{ [key: string]: boolean }>({});

  // Store wiring
  const {
    multipleScoreSheets,
    //fetchMultipleScoreSheets,
    updateMultipleScores,
    submitMultipleScoreSheets,
    isLoadingScoreSheet
  } = useScoreSheetStore();
  
  // Mapping store to refresh judge dashboard after updates
  const { fetchScoreSheetsByJudge } = useMapScoreSheetStore();

  // Only render teams that have a sheet record
  const filteredTeams = React.useMemo(() => {
  if (!multipleScoreSheets || multipleScoreSheets.length === 0) return [];
  
  // Build teams list directly from multipleScoreSheets
  return multipleScoreSheets.map((sheet) => ({
    id: sheet.teamId,
    name: (sheet as any).teamName || `Team ${sheet.teamId}`
  }));
}, [multipleScoreSheets]);

  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const navigate = useNavigate();

  // Toggle a penalty category open/closed
  const handleToggle = (category: string) => {
    setOpenRows((prevState) => ({
      ...prevState,
      [category]: !prevState[category],
    }));
  };

  // Expand all categories
  const handleExpandAllRows = () => {
    const categories = [...new Set(penalties.map((p) => p.penaltyType))];
    const expanded = categories.reduce((acc, cat) => ({ ...acc, [cat]: true }), {});
    setOpenRows(expanded);
  };

  // Collapse all categories
  const handleCollapseAllRows = () => {
    const categories = [...new Set(penalties.map((p) => p.penaltyType))];
    const closed = categories.reduce((acc, cat) => ({ ...acc, [cat]: false }), {});
    setOpenRows(closed);
  };

  // Local form state: penaltyState[teamId][penaltyId] = count (0 or higher)
  // For checkboxes: 0 = unchecked, 1 = checked
  // For counters: 0, 1, 2, 3... (number of occurrences)
  const [penaltyState, setPenaltyState] = useState<{
    [teamId: number]: {
      [penaltyId: number]: number;
    };
  }>({});

  
  // This useEffect is kept for backwards compatibility but the parent handles fetching

  // Hydrate penaltyState from fetched sheets
  // Backend stores: field value = count × pointValue
  // So to get count: divide by pointValue
  useEffect(() => {
    if (multipleScoreSheets && multipleScoreSheets.length > 0) {
      const newPenaltyState: {
        [teamId: number]: {
          [penaltyId: number]: number;
        };
      } = {};

      multipleScoreSheets.forEach((sheet) => {
        if (!sheet || sheet.teamId === undefined) return;

        newPenaltyState[sheet.teamId] = {};

        penalties.forEach((penalty) => {
          const fieldValue = Number(sheet[penalty.field as keyof typeof sheet] || 0);
          // Calculate count from stored value
          const count = fieldValue === 0 ? 0 : Math.abs(fieldValue) / penalty.pointValue;
          newPenaltyState[sheet.teamId][penalty.id] = count;
        });
      });

      // Ensure every filtered team has an entry
      filteredTeams.forEach((team) => {
        if (!newPenaltyState[team.id]) {
          newPenaltyState[team.id] = {};
          penalties.forEach((penalty) => {
            newPenaltyState[team.id][penalty.id] = 0;
          });
        }
      });

      setPenaltyState(newPenaltyState);
    }
  }, [multipleScoreSheets, filteredTeams, penalties]);

  // Handle checkbox toggle (0 or 1)
  const handleCheckboxChange = (teamId: number, penaltyId: number) => {
    setPenaltyState((prev) => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [penaltyId]: prev[teamId]?.[penaltyId] === 1 ? 0 : 1,
      },
    }));
  };

  // Handle increment (with upper bound)
  const handleIncrement = (teamId: number, penaltyId: number, upperBound: number) => {
    setPenaltyState((prev) => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [penaltyId]: Math.min((prev[teamId]?.[penaltyId] || 0) + 1, upperBound),
      },
    }));
  };

  // Handle decrement (with lower bound)
  const handleDecrement = (teamId: number, penaltyId: number, lowerBound: number) => {
    setPenaltyState((prev) => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [penaltyId]: Math.max((prev[teamId]?.[penaltyId] || 0) - 1, lowerBound),
      },
    }));
  };

  // Calculate penalty values: count × pointValue
  // Store as NEGATIVE values (penalties deduct points)
  const calculatePenaltyValues = () => {
    const penaltyValues: {
      [teamId: number]: { [field: string]: number };
    } = {};

    filteredTeams.forEach((team) => {
      penaltyValues[team.id] = {};

      penalties.forEach((penalty) => {
        const count = penaltyState[team.id]?.[penalty.id] || 0;
        // Penalties are negative, so multiply by -1
        penaltyValues[team.id][penalty.field] = count * penalty.pointValue * -1;
      });
    });

    return penaltyValues;
  };

  // Save as draft
  const handleSaveScoreSheets = async () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return;

    const penaltyValues = calculatePenaltyValues();
    const updatedSheets: any[] = [];

    filteredTeams.forEach((team) => {
      const sheet = multipleScoreSheets.find((s) => s.teamId === team.id);
      if (sheet) {
        updatedSheets.push({
          id: sheet.id,
          ...penaltyValues[team.id],
        });
      }
    });

    if (updatedSheets.length > 0) {
      await updateMultipleScores(updatedSheets);
      toast.success("Scores saved successfully!");
      
      // Refresh mappings in judge dashboard instantly (non-blocking)
      if (judgeId) {
        fetchScoreSheetsByJudge(judgeId).catch(() => {
          // Silently fail - updates already saved
        });
      }
    }
  };

  // Final submit
  const handleSubmit = async () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return;

    const penaltyValues = calculatePenaltyValues();
    const updatedSheets: any[] = [];

    filteredTeams.forEach((team) => {
      const sheet = multipleScoreSheets.find((s) => s.teamId === team.id);
      if (sheet) {
        updatedSheets.push({
          id: sheet.id,
          sheetType,
          isSubmitted: true,
          ...penaltyValues[team.id],
        });
      }
    });

    if (updatedSheets.length > 0) {
      await submitMultipleScoreSheets(updatedSheets);
      
      // Refresh mappings in judge dashboard instantly before navigating (non-blocking)
      if (judgeId) {
        fetchScoreSheetsByJudge(judgeId).catch(() => {
          // Silently fail - updates already saved
        });
      }
    }
    setOpenAreYouSure(false);
    navigate(-1);
  };

  // Group penalties by category
  const penaltiesByCategory = React.useMemo(() => {
    const grouped: { [category: string]: PenaltyQuestion[] } = {};
    penalties.forEach((penalty) => {
      if (!grouped[penalty.penaltyType]) {
        grouped[penalty.penaltyType] = [];
      }
      grouped[penalty.penaltyType].push(penalty);
    });
    return grouped;
  }, [penalties]);

  // Show loading state
  if (isLoadingScoreSheet) {
    return (
      <>
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 1, sm: 2 },
            mt: { xs: 1, sm: 2 },
            mb: 1,
          }}
        >
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: "none",
              color: theme.palette.success.dark,
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              fontWeight: 500,
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              borderRadius: "8px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(76, 175, 80, 0.08)",
                transform: "translateX(-2px)",
              },
            }}
          >
            Back to Judging Dashboard
          </Button>
        </Container>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            mt: 4,
          }}
        >
          <Typography variant="h6">Loading penalty sheets...</Typography>
        </Box>
      </>
    );
  }

  // Show empty state if no teams
  if (!filteredTeams || filteredTeams.length === 0) {
    return (
      <>
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 1, sm: 2 },
            mt: { xs: 1, sm: 2 },
            mb: 1,
          }}
        >
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: "none",
              color: theme.palette.success.dark,
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              fontWeight: 500,
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              borderRadius: "8px",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(76, 175, 80, 0.08)",
                transform: "translateX(-2px)",
              },
            }}
          >
            Back to Judging Dashboard
          </Button>
        </Container>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No scoresheets available for this judge and sheet type.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please ensure scoresheets have been created for the teams in this judge's cluster.
            </Typography>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      {/* Navigation back to judging dashboard - aligned with navbar */}
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 1, sm: 2 },
          mt: { xs: 1, sm: 2 },
          mb: 1,
        }}
      >
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{
            textTransform: "none",
            color: theme.palette.success.dark,
            fontSize: { xs: "0.875rem", sm: "0.9375rem" },
            fontWeight: 500,
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: "8px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(76, 175, 80, 0.08)",
              transform: "translateX(-2px)",
            },
          }}
        >
          Back to Judging Dashboard
        </Button>
      </Container>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* Page title */}
        <Typography 
          variant="h1" 
          sx={{ 
            mt: { xs: 2, sm: 4 }, 
            mb: { xs: 1.5, sm: 2 }, 
            fontWeight: "bold",
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
            textAlign: "center",
          }}
        >
          {title}
        </Typography>

        <Container
          component="form"
          sx={{
            width: "auto",
            maxWidth: { xs: "100%", sm: "95%", md: "90%" },
            p: { xs: 2, sm: 3 },
            bgcolor: "#fff",
            borderRadius: 3,
            border: `1px solid ${theme.palette.grey[300]}`,
            mb: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
        {/* Instructions */}
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            *Only mark penalty if it occurred
          </Typography>
          <Typography variant="body2" color="text.secondary">
            *Use checkboxes for yes/no penalties, counters for occurrences
          </Typography>
        </Box>

        {/* Action buttons */}
        <Box sx={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: { xs: 1, sm: 1.5 }, 
          mb: { xs: 1.5, sm: 2 },
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          width: "100%"
        }}>
          <Button
            variant="contained"
            onClick={handleSaveScoreSheets}
            sx={{
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
              color: "#fff",
              minWidth: { xs: "100%", sm: 200 },
              height: { xs: 40, sm: 44 },
              textTransform: "none",
              borderRadius: 2,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              fontWeight: 600,
            }}
          >
            Save All
          </Button>

          <Button
            variant="contained"
            onClick={handleExpandAllRows}
            sx={{
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
              color: "#fff",
              minWidth: { xs: "100%", sm: 200 },
              height: { xs: 40, sm: 44 },
              textTransform: "none",
              borderRadius: 2,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              fontWeight: 600,
            }}
          >
            Expand Categories
          </Button>

          <Button
            variant="contained"
            onClick={handleCollapseAllRows}
            sx={{
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
              color: "#fff",
              minWidth: { xs: "100%", sm: 200 },
              height: { xs: 40, sm: 44 },
              textTransform: "none",
              borderRadius: 2,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              fontWeight: 600,
            }}
          >
            Collapse All
          </Button>
        </Box>

        {/* Penalty table */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.grey[200]}`,
            overflow: { xs: "auto", sm: "hidden" },
            width: "100%",
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#c1c1c1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#a8a8a8",
            },
          }}
        >
          <Table sx={{
            minWidth: { xs: "600px", sm: "auto" },
            "& .MuiTableCell-root": {
              fontSize: { xs: "0.75rem", sm: "0.9375rem" },
              py: { xs: 0.75, sm: 1.25 },
              px: { xs: 0.5, sm: 1 }
            }
          }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  width: { xs: '40px', sm: '50px' },
                  minWidth: { xs: '40px', sm: '50px' }
                }}></TableCell>
                <TableCell sx={{ 
                  width: { xs: '30%', sm: '35%' },
                  minWidth: { xs: '200px', sm: '250px' }
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontSize: { xs: "0.75rem", sm: "0.9375rem" },
                      fontWeight: 600
                    }}
                  >
                    Penalty
                  </Typography>
                </TableCell>
                <TableCell sx={{ 
                  width: { xs: '15%', sm: '15%' },
                  minWidth: { xs: '100px', sm: '120px' }
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontSize: { xs: "0.75rem", sm: "0.9375rem" },
                      fontWeight: 600
                    }}
                  >
                    Points
                  </Typography>
                </TableCell>
                {filteredTeams.map((team) => (
                  <TableCell 
                    key={team.id} 
                    align="center"
                    sx={{
                      minWidth: { xs: '120px', sm: '150px' }
                    }}
                  >
                    <Typography 
                      variant="subtitle1"
                      sx={{
                        fontSize: { xs: "0.75rem", sm: "0.9375rem" },
                        fontWeight: 600,
                      }}
                    >
                      {team.name}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {Object.entries(penaltiesByCategory)
                .filter(([category, categoryPenalties]) => categoryPenalties.length > 0 && category !== "")
                .map(([category, categoryPenalties]) => (
                <React.Fragment key={category}>
                  {/* Category header row */}
                  <TableRow
                    onClick={() => handleToggle(category)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: theme.palette.grey[100],
                      "&:hover": { bgcolor: theme.palette.grey[200] },
                    }}
                  >
                    <TableCell>
                      <IconButton aria-label="expand category" size="small">
                        {openRows[category] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell colSpan={2 + filteredTeams.length} sx={{ cursor: "pointer" }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: "0.75rem", sm: "0.9375rem" },
                          cursor: "pointer"
                        }}
                      >
                        {category}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* Penalty rows for this category */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3 + filteredTeams.length}>
                      <Collapse in={openRows[category]} timeout="auto" unmountOnExit>
                        <Table size="small">
                          <TableBody>
                            {categoryPenalties.map((penalty) => (
                              <TableRow key={penalty.id}>
                                <TableCell sx={{ 
                                  width: { xs: '40px', sm: '50px' },
                                  minWidth: { xs: '40px', sm: '50px' }
                                }}></TableCell>
                                <TableCell sx={{ 
                                  width: { xs: '30%', sm: '35%' },
                                  minWidth: { xs: '200px', sm: '250px' }
                                }}>
                                  <Typography sx={{ 
                                    fontSize: { xs: "0.75rem", sm: "0.9375rem" },
                                    fontWeight: 400,
                                    cursor: "default"
                                  }}>
                                    {penalty.questionText}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ 
                                  width: { xs: '15%', sm: '15%' },
                                  minWidth: { xs: '100px', sm: '120px' }
                                }}>
                                  <Typography sx={{ 
                                    fontSize: { xs: "0.75rem", sm: "0.9375rem" },
                                    fontWeight: 400,
                                    cursor: "default"
                                  }}>
                                    {penalty.pointText}
                                  </Typography>
                                </TableCell>

                                {filteredTeams.map((team) => (
                                  <TableCell key={team.id} align="center">
                                    {penalty.isIncrement ? (
                                      // Counter for occurrence-based penalties
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleDecrement(
                                              team.id,
                                              penalty.id,
                                              penalty.incrementLowerBound || 0
                                            )
                                          }
                                          sx={{
                                            bgcolor: theme.palette.grey[200],
                                            "&:hover": { bgcolor: theme.palette.grey[300] },
                                          }}
                                        >
                                          <RemoveIcon fontSize="small" />
                                        </IconButton>

                                        <Typography sx={{ 
                                          minWidth: "30px", 
                                          textAlign: "center", 
                                          fontWeight: 600,
                                          fontSize: { xs: "0.75rem", sm: "0.9375rem" },
                                          cursor: "default"
                                        }}>
                                          {penaltyState[team.id]?.[penalty.id] || 0}
                                        </Typography>

                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleIncrement(
                                              team.id,
                                              penalty.id,
                                              penalty.incrementUpperBound || 1000
                                            )
                                          }
                                          sx={{
                                            bgcolor: theme.palette.grey[200],
                                            "&:hover": { bgcolor: theme.palette.grey[300] },
                                          }}
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    ) : (
                                      // Checkbox for yes/no penalties
                                      <Checkbox
                                        checked={penaltyState[team.id]?.[penalty.id] === 1}
                                        onChange={() => handleCheckboxChange(team.id, penalty.id)}
                                        sx={{
                                          color: theme.palette.grey[400],
                                          "&.Mui-checked": {
                                            color: theme.palette.error.main,
                                          },
                                        }}
                                      />
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Submit button */}
        <Button
          variant="contained"
          onClick={() => setOpenAreYouSure(true)}
          sx={{
            mt: { xs: 2, sm: 3 },
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
            color: "#fff",
            minWidth: { xs: "100%", sm: 200 },
            height: { xs: 40, sm: 44 },
            textTransform: "none",
            borderRadius: 2,
            fontSize: { xs: "0.9rem", sm: "1rem" },
            fontWeight: 600,
          }}
        >
          Submit All
        </Button>

        <AreYouSureModal
          open={openAreYouSure}
          handleClose={() => setOpenAreYouSure(false)}
          title="Are you sure you want to submit penalties for all teams?"
          handleSubmit={() => handleSubmit()}
        />
        </Container>
      </Box>
    </>
  );
}