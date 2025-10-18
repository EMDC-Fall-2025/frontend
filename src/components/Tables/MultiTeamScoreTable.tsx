/**
 * MultiTeamScoreTable Component
 * 
 * Allows judges to score multiple teams simultaneously with expandable criteria sections.
 * Supports draft saving and final submission for all teams at once.
 */

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
  TextField,
  Button,
  Link,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import theme from "../../theme";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import AreYouSureModal from "../Modals/AreYouSureModal";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import { useEffect, useState } from "react";

type IMultiTeamScoreSheetProps = {
  sheetType: number; 
  title: string;   
  teams: { id: number, name: string }[]; // Teams visible to this judge
  questions: any[];  // Question configs (id, text, low/high points, criteria text)
  seperateJrAndSr: boolean; // If true, show Jr/Sr copy in criteria for Q4
  judgeId: number | null;   // Current judge (required to fetch sheets)
};

export default function MultiTeamScoreSheet({
  sheetType,
  title,
  teams,
  questions,
  judgeId,
  seperateJrAndSr,
}: IMultiTeamScoreSheetProps) {
  // Tracks expand/collapse state per question row
  const [openRows, setOpenRows] = React.useState<{ [key: number]: boolean }>({});

  // Score sheet store for data management
  const {
    multipleScoreSheets,
    fetchMultipleScoreSheets,
    updateMultipleScores,
    submitMultipleScoreSheets,
    scoreSheetError,
  } = useScoreSheetStore();

  // Filter teams that have score sheets available
  const filteredTeams = React.useMemo(() => {
    if (!multipleScoreSheets) return [];
    return teams.filter(team =>
      multipleScoreSheets.some(sheet => sheet.teamId === team.id)
    );
  }, [teams, multipleScoreSheets]);

  // Show message if no score sheets are available
  if (multipleScoreSheets && multipleScoreSheets.length === 0) {
    return (
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
    );
  }

 
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const navigate = useNavigate();


  const handleToggle = (id: number) => {
    setOpenRows((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };


  const handleExpandAllRows = () => {
    const expanded = questions.reduce((acc, q) => ({ ...acc, [q.id]: true }), {});
    setOpenRows(expanded);
  };


  const handleCollapseAllRows = () => {
    const closed = questions.reduce((acc, q) => ({ ...acc, [q.id]: false }), {});
    setOpenRows(closed);
  };

  // Form data state: teamId -> questionId -> value
  const [formData, setFormData] = useState<{
    [teamId: number]: {
      [questionId: number]: number | string | undefined;
    };
  }>({});

  // Fetch score sheets when component mounts
  useEffect(() => {
    if (teams.length > 0 && judgeId) {
      const teamIds = teams.map(team => team.id);
      fetchMultipleScoreSheets(teamIds, judgeId, sheetType);
    }
  }, [teams, judgeId, fetchMultipleScoreSheets, sheetType]);

  // Initialize form data from fetched score sheets
  useEffect(() => {
    if (multipleScoreSheets && multipleScoreSheets.length > 0) {
      const newFormData: {
        [teamId: number]: {
          [questionId: number]: number | string | undefined;
        };
      } = {};

      // Load existing values from score sheets
      multipleScoreSheets.forEach(sheet => {
        if (!sheet || sheet.teamId === undefined) return;

        newFormData[sheet.teamId] = {
          1: sheet.field1,
          2: sheet.field2,
          3: sheet.field3,
          4: sheet.field4,
          5: sheet.field5,
          6: sheet.field6,
          7: sheet.field7,
          8: sheet.field8,
          9: sheet.field9,
        };
      });

      // Initialize empty data for teams without sheets
      filteredTeams.forEach(team => {
        if (!newFormData[team.id]) {
          newFormData[team.id] = {
            1: undefined,
            2: undefined,
            3: undefined,
            4: undefined,
            5: undefined,
            6: undefined,
            7: undefined,
            8: undefined,
            9: undefined,
          };
        }
      });

      setFormData(newFormData);
    }
  }, [multipleScoreSheets, filteredTeams]);

  // Update individual score/comment value
  const handleScoreChange = (teamId: number, questionId: number, value: number | string | undefined) => {
    setFormData(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [questionId]: value,
      }
    }));
  };

  // Save current form data as draft
  const handleSaveScoreSheets = async () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return;

    const updatedSheets: Array<{
      id: number;
      field1?: number | string;
      field2?: number | string;
      field3?: number | string;
      field4?: number | string;
      field5?: number | string;
      field6?: number | string;
      field7?: number | string;
      field8?: number | string;
      field9?: string;
    }> = [];

    for (const team of filteredTeams) {
      const sheet = multipleScoreSheets.find(s => s.teamId === team.id);
      if (sheet && formData[team.id]) {
        updatedSheets.push({
          id: sheet.id,
          field1: formData[team.id][1],
          field2: formData[team.id][2],
          field3: formData[team.id][3],
          field4: formData[team.id][4],
          field5: formData[team.id][5],
          field6: formData[team.id][6],
          field7: formData[team.id][7],
          field8: formData[team.id][8],
          field9: formData[team.id][9]?.toString(),
        });
      }
    }

    if (updatedSheets.length > 0) await updateMultipleScores(updatedSheets);
  };

  // Validate that all required fields are completed
  const allFieldsFilled = () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return false;

    for (const team of filteredTeams) {
      const data = formData[team.id];
      if (!data) return false;

      const complete = Object.keys(data).every(key => {
        const id = Number(key);
        // Comments (Q9) are optional
        return id === 9 || (data[id] !== undefined && data[id] !== "" && data[id] !== 0);
      });

      if (!complete) return false;
    }

    return true;
  };

  // Final submit: marks sheets as submitted and navigates back
  const handleSubmit = async () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return;

    const updatedSheets: Array<any> = [];

    for (const team of filteredTeams) {
      const sheet = multipleScoreSheets.find(s => s.teamId === team.id);
      if (sheet && formData[team.id]) {
        updatedSheets.push({
          id: sheet.id,
          sheetType,
          isSubmitted: true,
          field1: formData[team.id][1],
          field2: formData[team.id][2],
          field3: formData[team.id][3],
          field4: formData[team.id][4],
          field5: formData[team.id][5],
          field6: formData[team.id][6],
          field7: formData[team.id][7],
          field8: formData[team.id][8],
          field9: formData[team.id][9]?.toString(),
        });
      }
    }

    if (updatedSheets.length > 0) await submitMultipleScoreSheets(updatedSheets);
    setOpenAreYouSure(false);
    navigate(-1); // Return to previous screen after submit
  };

  return (
    <>
      {/* Navigation back to judging dashboard */}
      <Link
        onClick={() => navigate(-1)}
        sx={{
          textDecoration: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          ml: "2%",
          mt: 2,
          color: theme.palette.success.main,
          "&:hover": { color: theme.palette.success.dark },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {"<"} Back to Judging Dashboard{" "}
        </Typography>
      </Link>

      {/* Page title */}
      <Typography 
        variant="h1" 
        sx={{ 
          ml: { xs: "2%", sm: "2%" }, 
          mr: { xs: 2, sm: 5 }, 
          mt: { xs: 2, sm: 4 }, 
          mb: { xs: 1.5, sm: 2 }, 
          fontWeight: "bold",
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" }
        }}
      >
        {title}
      </Typography>

      {/* Main form container */}
      <Container
        component="form"
        sx={{
          width: "auto",
          p: { xs: 2, sm: 3 },
          bgcolor: "#fff",
          borderRadius: 3,
          border: `1px solid ${theme.palette.grey[300]}`,
          ml: { xs: "2%", sm: "2%" },
          mr: { xs: 1, sm: 1 },
          mb: { xs: 2, sm: 3 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Action buttons for form management */}
        <Box sx={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: { xs: 1, sm: 1.5 }, 
          mb: { xs: 1.5, sm: 2 },
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          width: "100%"
        }}>
          {/* Save draft button */}
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

          {/* Expand all rows to show criteria */}
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
            Expand Rows
          </Button>

          {/* Collapse all rows */}
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

        {/* Scoring table (Paper wrapper gives the subtle edge + border) */}
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
              fontSize: { xs: "0.8rem", sm: "0.95rem" },
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
                      fontSize: { xs: "0.8rem", sm: "1rem" },
                      fontWeight: 600
                    }}
                  >
                    Criteria
                  </Typography>
                </TableCell>
                {/* Team name columns */}
                {filteredTeams.map(team => (
                  <TableCell 
                    key={team.id} 
                    align="center"
                    sx={{ 
                      minWidth: { xs: '80px', sm: '100px' },
                      maxWidth: { xs: '120px', sm: '150px' }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontSize: { xs: "0.75rem", sm: "0.9rem" },
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                      title={team.name}
                    >
                      {team.name}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {/* Expandable rows for each question */}
              {questions.map((question) => (
                <React.Fragment key={question.id}>
                  {/* Question header row */}
                  <TableRow onClick={() => handleToggle(question.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <IconButton aria-label="expand row" size="small">
                        {openRows[question.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>

                    {/* Question text */}
                    <TableCell 
                      component="th" 
                      scope="row" 
                      sx={{ 
                        pl: { xs: 1, sm: 2 }, 
                        textAlign: "left", 
                        pr: { xs: 1, sm: 2 }, 
                        fontWeight: "bold",
                        fontSize: { xs: "0.8rem", sm: "0.95rem" },
                        minWidth: { xs: '200px', sm: '250px' }
                      }}
                    >
                      <Typography 
                        sx={{ 
                          fontSize: { xs: "0.8rem", sm: "0.95rem" },
                          fontWeight: 600,
                          lineHeight: 1.3
                        }}
                      >
                        {question.questionText}
                      </Typography>
                    </TableCell>

                    {/* Score input cells for each team */}
                    {filteredTeams.map(team => (
                      <TableCell key={team.id} align="center">
                        {question.id !== 9 ? (
                          <>
                            <TextField
                              onClick={(e) => e.stopPropagation()}
                              type="number"
                              size="small"
                              value={
                                formData[team.id] && 
                                formData[team.id][question.id] !== undefined && 
                                formData[team.id][question.id] !== null && 
                                formData[team.id][question.id] !== "" &&
                                formData[team.id][question.id] !== 0
                                  ? formData[team.id][question.id]
                                  : ""
                              }
                              onWheel={(e) => {
                                const inputElement = e.target as HTMLInputElement;
                                inputElement.blur();
                              }}
                              onChange={(e) => {
                                let value = e.target.value;

                                if (value !== undefined) {
                                  if (value === "") {
                                    value = undefined;
                                  } else if (Number(value) < question.lowPoints) {
                                    value = undefined;
                                  } else if (Number(value) > question.highPoints) {
                                    value = undefined;
                                  } else {
                                    value = Number(value);
                                  }
                                }

                                handleScoreChange(team.id, question.id, value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                  e.preventDefault();
                                }
                              }}
                              inputProps={{
                                min: question.lowPoints,
                                max: question.highPoints,
                                step: 0.5,
                              }}
                              sx={{ 
                                width: { xs: "60px", sm: "75px" },
                                '& .MuiInputBase-input': {
                                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                                  padding: { xs: '6px', sm: '8px' }
                                }
                              }}
                            />

                            {/* Completion status indicator */}
                            {formData[team.id] && (
                              <Box sx={{ display: "inline", ml: 1 }}>
                        {formData[team.id][question.id] === undefined ||
                         formData[team.id][question.id] === "" ||
                         formData[team.id][question.id] === 0 ||
                         formData[team.id][question.id] === null ? (
                                  <CloseIcon fontSize="small" sx={{ color: "red" }} />
                                ) : (
                                  <CheckIcon fontSize="small" sx={{ color: "green" }} />
                                )}
                              </Box>
                            )}
                          </>
                        ) : (
                          <TextField
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            multiline
                            placeholder="Comments"
                            value={
                              formData[team.id] && formData[team.id][question.id] !== undefined
                                ? formData[team.id][question.id]
                                : ""
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                team.id,
                                question.id,
                                e.target.value ? String(e.target.value) : undefined
                              )
                            }
                            sx={{ 
                              width: { xs: "85%", sm: "90%" },
                              '& .MuiInputBase-input': {
                                fontSize: { xs: '0.75rem', sm: '0.9rem' },
                                padding: { xs: '6px', sm: '8px' }
                              }
                            }}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Expanded details: criteria boxes (light grey) */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={filteredTeams.length + 2}>
                      <Collapse in={openRows[question.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ 
                          margin: { xs: 1, sm: 2 },
                          p: { xs: 1, sm: 1.5 }
                        }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{
                              fontSize: { xs: "1rem", sm: "1.25rem" },
                              fontWeight: 600,
                              mb: { xs: 1, sm: 1.5 }
                            }}
                          >
                            {question.questionText} - Scoring Criteria
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              gap: { xs: 1.5, sm: 3 },
                              flexDirection: { xs: "column", sm: "row" },
                              width: "100%",
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Criteria boxes are only applicable for numeric questions */}
                            {question.id !== 9 && (
                              <>
                                {/* Criteria 1 */}
                                <Box
                                  sx={{
                                    bgcolor: theme.palette.grey[50],
                                    border: `1px solid ${theme.palette.grey[200]}`,
                                    p: { xs: 1, sm: 1.5 },
                                    borderRadius: 2,
                                    flex: 1,
                                    minWidth: { xs: "200px", sm: "250px" },
                                  }}
                                >
                                  <Typography sx={{ 
                                    mt: { xs: 0.5, sm: 1 }, 
                                    fontWeight: 800, 
                                    fontSize: { xs: "10pt", sm: "12pt" } 
                                  }}>
                                    {question.criteria1Points}
                                  </Typography>

                                  {/* Optional Jr/Sr text (question 4 only) */}
                                  {seperateJrAndSr && question.id === 4 ? (
                                    <>
                                      <Typography sx={{ 
                                        fontSize: { xs: "10pt", sm: "12pt" }, 
                                        fontWeight: 800, 
                                        mb: { xs: 0.5, sm: 1 } 
                                      }}>
                                        Jr. Div.
                                      </Typography>
                                      <Typography sx={{ fontSize: { xs: "9pt", sm: "11pt" } }}>
                                        {question.criteria1Junior}
                                      </Typography>

                                      <Typography sx={{ 
                                        fontSize: { xs: "10pt", sm: "12pt" }, 
                                        fontWeight: 800, 
                                        mb: { xs: 0.5, sm: 1 }, 
                                        mt: { xs: 0.5, sm: 1 } 
                                      }}>
                                        Sr. Div.
                                      </Typography>
                                      <Typography sx={{ fontSize: { xs: "9pt", sm: "11pt" } }}>
                                        {question.criteria1Senior}
                                      </Typography>
                                    </>
                                  ) : (
                                    <Typography sx={{ fontSize: { xs: "9pt", sm: "11pt" } }}>
                                      {question.criteria1}
                                    </Typography>
                                  )}
                                </Box>

                                {/* Criteria 2 */}
                                <Box
                                  sx={{
                                    bgcolor: theme.palette.grey[50],
                                    border: `1px solid ${theme.palette.grey[200]}`,
                                    p: { xs: 1, sm: 1.5 },
                                    borderRadius: 2,
                                    flex: 1,
                                    minWidth: { xs: "200px", sm: "250px" },
                                  }}
                                >
                                  <Typography sx={{ mt: 1, fontWeight: 800, fontSize: "12pt" }}>
                                    {question.criteria2Points}
                                  </Typography>

                                  {seperateJrAndSr && question.id === 4 ? (
                                    <>
                                      <Typography sx={{ fontSize: "12pt", fontWeight: 800, mb: 1 }}>
                                        Jr. Div.
                                      </Typography>
                                      <Typography>{question.criteria2Junior}</Typography>

                                      <Typography sx={{ fontSize: "12pt", fontWeight: 800, mb: 1, mt: 1 }}>
                                        Sr. Div.
                                      </Typography>
                                      <Typography>{question.criteria2Senior}</Typography>
                                    </>
                                  ) : (
                                    <Typography>{question.criteria2}</Typography>
                                  )}
                                </Box>

                                {/* Criteria 3 */}
                                <Box
                                  sx={{
                                    bgcolor: theme.palette.grey[50],
                                    border: `1px solid ${theme.palette.grey[200]}`,
                                    p: { xs: 1, sm: 1.5 },
                                    borderRadius: 2,
                                    flex: 1,
                                    minWidth: { xs: "200px", sm: "250px" },
                                  }}
                                >
                                  <Typography sx={{ mt: 1, fontWeight: 800, fontSize: "12pt" }}>
                                    {question.criteria3Points}
                                  </Typography>

                                  {seperateJrAndSr && question.id === 4 ? (
                                    <>
                                      <Typography sx={{ fontSize: "12pt", fontWeight: 800, mb: 1 }}>
                                        Jr. Div.
                                      </Typography>
                                      <Typography>{question.criteria3Junior}</Typography>

                                      <Typography sx={{ fontSize: "12pt", fontWeight: 800, mb: 1, mt: 1 }}>
                                        Sr. Div.
                                      </Typography>
                                      <Typography>{question.criteria3Senior}</Typography>
                                    </>
                                  ) : (
                                    <Typography>{question.criteria3}</Typography>
                                  )}
                                </Box>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Final submission (disabled until all numeric fields are filled) */}
        <Button
          variant="contained"
          onClick={() => setOpenAreYouSure(true)}
          disabled={!allFieldsFilled()}
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

        {/* Confirm modal */}
        <AreYouSureModal
          open={openAreYouSure}
          handleClose={() => setOpenAreYouSure(false)}
          title="Are you sure you want to submit scores for all teams?"
          handleSubmit={() => handleSubmit()}
          error={scoreSheetError}
        />
      </Container>
    </>
  );
}
