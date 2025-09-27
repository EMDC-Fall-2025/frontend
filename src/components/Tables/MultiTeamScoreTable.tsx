/**
 * MultiTeamScoreTable Component
 *
 * Goal
 * ----
 * Judges can enter scores/comments for multiple teams in one screen,
 * save drafts, and submit all at once. UI is aligned to the modern
 * green/white theme used across the app.
 *
 * What to know
 * ------------
 * - Rows = questions/criteria; columns (after the second column) = teams.
 * - Row 9 is a text comment field; other rows are numeric with bounds.
 * - Uses Zustand store (useScoreSheetStore) for fetching/saving/submitting.
 * - Expand/Collapse reveals detailed scoring criteria (Jr/Sr aware on Q4).
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
  sheetType: number; // Which sheet definition to load (presentation, machine design, etc.)
  title: string;     // Page H1
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
  // Tracks expand/collapse state per question row (by question.id)
  const [openRows, setOpenRows] = React.useState<{ [key: number]: boolean }>({});

  // ---- Store wiring: fetch, update, submit, and error state ----
  const {
    multipleScoreSheets,           // Array of sheets keyed by teamId (fetched)
    fetchMultipleScoreSheets,      // Fetch sheets for teams/judge/sheetType
    updateMultipleScores,          // Save (draft) updates
    submitMultipleScoreSheets,     // Final submit
    scoreSheetError,               // Error text from store actions (if any)
  } = useScoreSheetStore();

  // Only render teams that have a sheet record (prevents empty columns)
  const filteredTeams = React.useMemo(() => {
    if (!multipleScoreSheets) return [];
    return teams.filter(team =>
      multipleScoreSheets.some(sheet => sheet.teamId === team.id)
    );
  }, [teams, multipleScoreSheets]);

  // Confirmation modal state for "Submit All"
  const [openAreYouSure, setOpenAreYouSure] = useState(false);

  const navigate = useNavigate();

  // Toggle a single question row open/closed
  const handleToggle = (id: number) => {
    setOpenRows((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  // Open all question rows (useful for quick scanning)
  const handleExpandAllRows = () => {
    const expanded = questions.reduce((acc, q) => ({ ...acc, [q.id]: true }), {});
    setOpenRows(expanded);
  };

  // Collapse all question rows (tidy view)
  const handleCollapseAllRows = () => {
    const closed = questions.reduce((acc, q) => ({ ...acc, [q.id]: false }), {});
    setOpenRows(closed);
  };

  // Local form state:
  // formData[teamId][questionId] = number | string | undefined
  // - Questions 1..8 are numeric (undefined = not filled)
  // - Question 9 is comment (string | undefined)
  const [formData, setFormData] = useState<{
    [teamId: number]: {
      [questionId: number]: number | string | undefined;
    };
  }>({});

  // Fetch sheets when teams/judge/sheetType are known
  useEffect(() => {
    if (teams.length > 0 && judgeId) {
      const teamIds = teams.map(team => team.id);
      fetchMultipleScoreSheets(teamIds, judgeId, sheetType);
    }
  }, [teams, judgeId, fetchMultipleScoreSheets, sheetType]);

  // Hydrate formData from fetched sheets (and ensure every filtered team has an object)
  useEffect(() => {
    if (multipleScoreSheets && multipleScoreSheets.length > 0) {
      const newFormData: {
        [teamId: number]: {
          [questionId: number]: number | string | undefined;
        };
      } = {};

      // Copy existing sheet values per team
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
          9: sheet.field9, // comments
        };
      });

      // Ensure every filtered team has an entry (prevents uncontrolled inputs)
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

  // Update a single cell (teamId x questionId)
  const handleScoreChange = (teamId: number, questionId: number, value: number | string | undefined) => {
    setFormData(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [questionId]: value,
      }
    }));
  };

  // Save as draft (does not mark as submitted)
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
          field9: formData[team.id][9]?.toString(), // normalize comments to string
        });
      }
    }

    if (updatedSheets.length > 0) await updateMultipleScores(updatedSheets);
  };

  // Validation: all required numeric fields (1..8) must be filled (non-empty, non-zero)
  // Comment (9) is optional.
  const allFieldsFilled = () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return false;

    for (const team of filteredTeams) {
      const data = formData[team.id];
      if (!data) return false;

      const complete = Object.keys(data).every(key => {
        const id = Number(key);
        // Allow Q9 (comments) to be empty
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
      {/* Back link to Judging Dashboard (uses success color for consistency) */}
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
      <Typography variant="h1" sx={{ ml: "2%", mr: 5, mt: 4, mb: 2, fontWeight: "bold" }}>
        {title}
      </Typography>

      {/* Main container: white background + subtle border to match modern theme */}
      <Container
        component="form"
        sx={{
          width: "auto",
          p: 3,
          bgcolor: "#fff",
          borderRadius: 3,
          border: `1px solid ${theme.palette.grey[300]}`,
          ml: "2%",
          mr: 1,
          mb: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Action buttons (Save, Expand, Collapse) */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          {/* Save Draft for all teams */}
          <Button
            variant="contained"
            onClick={handleSaveScoreSheets}
            sx={{
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
              color: "#fff",
              minWidth: 200,
              height: 44,
              textTransform: "none",
              borderRadius: 2,
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
              minWidth: 200,
              height: 44,
              textTransform: "none",
              borderRadius: 2,
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
              minWidth: 200,
              height: 44,
              textTransform: "none",
              borderRadius: 2,
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
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '50px' }}></TableCell>
                <TableCell sx={{ width: '35%' }}>Criteria</TableCell>
                {/* Dynamically render team columns */}
                {filteredTeams.map(team => (
                  <TableCell key={team.id} align="center">
                    <Typography variant="subtitle1">{team.name}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {/* One expandable row per question */}
              {questions.map((question) => (
                <React.Fragment key={question.id}>
                  {/* Row header: click anywhere on row (except inputs) to toggle */}
                  <TableRow onClick={() => handleToggle(question.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <IconButton aria-label="expand row" size="small">
                        {openRows[question.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>

                    {/* Question text (bold for scan-ability) */}
                    <TableCell component="th" scope="row" sx={{ pl: 2, textAlign: "left", pr: 2, fontWeight: "bold" }}>
                      {question.questionText}
                    </TableCell>

                    {/* Render a cell per team for this question */}
                    {filteredTeams.map(team => (
                      <TableCell key={team.id} align="center">
                        {question.id !== 9 ? (
                          // Numeric score input (bounded by low/high points)
                          <>
                            <TextField
                              onClick={(e) => e.stopPropagation()} // prevent row toggle when editing
                              type="number"
                              size="small"
                              value={
                                formData[team.id] && formData[team.id][question.id] !== 0
                                  ? formData[team.id][question.id]
                                  : ""
                              }
                              // Prevent accidental scroll increments on number inputs
                              onWheel={(e) => {
                                const inputElement = e.target as HTMLInputElement;
                                inputElement.blur();
                              }}
                              // Validate bounds; clear value if outside range
                              onChange={(e) => {
                                let value = e.target.value;

                                if (value !== undefined) {
                                  if (value === "") {
                                    value = "";
                                  } else if (Number(value) < question.lowPoints) {
                                    value = "";
                                  } else if (Number(value) > question.highPoints) {
                                    value = "";
                                  }
                                }

                                handleScoreChange(team.id, question.id, value === "" ? undefined : Number(value));
                              }}
                              // Disable arrow key step to avoid accidental changes
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
                              sx={{ width: "75px" }}
                            />

                            {/* Inline completion indicator (red X = missing, green check = filled) */}
                            {formData[team.id] && (
                              <Box sx={{ display: "inline", ml: 1 }}>
                                {formData[team.id][question.id] === undefined || 
                                 formData[team.id][question.id] === "" || 
                                 formData[team.id][question.id] === 0 ? (
                                  <CloseIcon fontSize="small" sx={{ color: "red" }} />
                                ) : (
                                  <CheckIcon fontSize="small" sx={{ color: "green" }} />
                                )}
                              </Box>
                            )}
                          </>
                        ) : (
                          // Q9: Free-text comments per team
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
                            sx={{ width: "90%" }}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Expanded details: criteria boxes (light grey) */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={filteredTeams.length + 2}>
                      <Collapse in={openRows[question.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {question.questionText} - Scoring Criteria
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              gap: 3,
                              flexDirection: "row",
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
                                    p: 1.5,
                                    borderRadius: 2,
                                    flex: 1,
                                    minWidth: "250px",
                                  }}
                                >
                                  <Typography sx={{ mt: 1, fontWeight: 800, fontSize: "12pt" }}>
                                    {question.criteria1Points}
                                  </Typography>

                                  {/* Optional Jr/Sr text (question 4 only) */}
                                  {seperateJrAndSr && question.id === 4 ? (
                                    <>
                                      <Typography sx={{ fontSize: "12pt", fontWeight: 800, mb: 1 }}>
                                        Jr. Div.
                                      </Typography>
                                      <Typography>{question.criteria1Junior}</Typography>

                                      <Typography sx={{ fontSize: "12pt", fontWeight: 800, mb: 1, mt: 1 }}>
                                        Sr. Div.
                                      </Typography>
                                      <Typography>{question.criteria1Senior}</Typography>
                                    </>
                                  ) : (
                                    <Typography>{question.criteria1}</Typography>
                                  )}
                                </Box>

                                {/* Criteria 2 */}
                                <Box
                                  sx={{
                                    bgcolor: theme.palette.grey[50],
                                    border: `1px solid ${theme.palette.grey[200]}`,
                                    p: 1.5,
                                    borderRadius: 2,
                                    flex: 1,
                                    minWidth: "250px",
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
                                    p: 1.5,
                                    borderRadius: 2,
                                    flex: 1,
                                    minWidth: "250px",
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
            mt: 3,
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
            color: "#fff",
            minWidth: 200,
            height: 44,
            textTransform: "none",
            borderRadius: 2,
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
