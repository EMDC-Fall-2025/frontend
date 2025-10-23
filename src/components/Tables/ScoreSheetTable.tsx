import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
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
  Divider, // optional separator for a cleaner card look
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import theme from "../../theme";
import { useNavigate } from "react-router-dom";
import { useMapScoreSheetStore } from "../../store/map_stores/mapScoreSheetStore";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import AreYouSureModal from "../Modals/AreYouSureModal";

/**
 * Props that control which sheet to load and how to render it
 */
type IScoreSheetTableProps = {
  sheetType: number;            // which sheet (e.g., presentation = 1)
  title: string;                // page title
  teamName: string;             // for the subtitle
  questions: any[];             // list of question configs for this sheet
  seperateJrAndSr: boolean;     // whether to show separate Jr/Sr criteria text for question 4
  teamId: number | null;        // which team is being scored
  judgeId: number | null;       // which judge is scoring
};

export default function ScoreSheetTable({
  sheetType,
  title,
  teamName,
  questions,
  teamId,
  judgeId,
  seperateJrAndSr,
}: IScoreSheetTableProps) {
  // Track which rows are expanded (questionId -> open/closed)
  const [openRows, setOpenRows] = React.useState<{ [key: number]: boolean }>({});

  // Store hooks for retrieving the score sheet mapping and data
  const { scoreSheetId, fetchScoreSheetId } = useMapScoreSheetStore();
  const {
    scoreSheet,
    fetchScoreSheetById,
    isLoadingScoreSheet,
    updateScores,
    editScoreSheet,
    scoreSheetError,
    clearScoreSheet,
  } = useScoreSheetStore();

  // Confirm-submit modal
  const [openAreYouSure, setOpenAreYouSure] = useState(false);

  const navigate = useNavigate();

  /**
   * Toggle a question row open/closed
   */
  const handleToggle = (id: number) => {
    setOpenRows((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  /**
   * On mount / when team/judge change:
   * ask server for the corresponding scoreSheetId for this judge+team+sheetType
   */
  useEffect(() => {
    if (teamId && judgeId) {
      // Clear the current scoresheet to prevent showing old data
      clearScoreSheet();
      fetchScoreSheetId(judgeId, teamId, sheetType);
    }
  }, [teamId, judgeId, fetchScoreSheetId]);

  /**
   * When we learn the scoreSheetId:
   * fetch the full score sheet object containing existing values
   */
  useEffect(() => {
    if (scoreSheetId) {
      fetchScoreSheetById(scoreSheetId);
    }
  }, [scoreSheetId, fetchScoreSheetById]);

  /**
   * Local form state: keyed by question.id.
   * field1..field9 map to questions 1..9.
   * 1-8 are numeric scores, 9 is free-text comments.
   */
  const [formData, setFormData] = useState<{
    [key: number]: number | string | undefined;
  }>({
    1: undefined,
    2: undefined,
    3: undefined,
    4: undefined,
    5: undefined,
    6: undefined,
    7: undefined,
    8: undefined,
    9: undefined,
  });

  /**
   * When scoreSheet loads, populate formData from it.
   * If no sheet yet, clear the form.
   */
  useEffect(() => {
    if (scoreSheet) {
      setFormData({
        1: scoreSheet.field1,
        2: scoreSheet.field2,
        3: scoreSheet.field3,
        4: scoreSheet.field4,
        5: scoreSheet.field5,
        6: scoreSheet.field6,
        7: scoreSheet.field7,
        8: scoreSheet.field8,
        9: scoreSheet.field9,
      });
    } else {
      setFormData({});
    }
  }, [scoreSheet, judgeId, teamId]);

  /**
   * Update a single question's value in local form state
   */
  const handleScoreChange = (
    questionId: number,
    value: number | string | undefined
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      [questionId]: value,
    }));
  };

  /**
   * Save current formData (draft) without submitting
   */
  const handleSaveScoreSheet = () => {
    if (scoreSheet) {
      // Prepare data with proper handling of undefined/null values
      const scoreData = {
        id: scoreSheet.id,
        field1: formData[1] !== undefined ? formData[1] : undefined,
        field2: formData[2] !== undefined ? formData[2] : undefined,
        field3: formData[3] !== undefined ? formData[3] : undefined,
        field4: formData[4] !== undefined ? formData[4] : undefined,
        field5: formData[5] !== undefined ? formData[5] : undefined,
        field6: formData[6] !== undefined ? formData[6] : undefined,
        field7: formData[7] !== undefined ? formData[7] : undefined,
        field8: formData[8] !== undefined ? formData[8] : undefined,
        field9: formData[9] !== undefined ? formData[9]?.toString() : undefined, // comments stored as string
      };
      
      // Save score sheet data
      updateScores(scoreData);
    }
  };

  /**
   * Check if all required score fields (1..8) are filled.
   * field 9 (comments) is optional
   */
  const allFieldsFilled = () => {
    const allFilled = Object.keys(formData).every((key) => {
      const fieldId = Number(key);
      if (fieldId === 9) return true; // skip comments
      const isFilled =
        formData[fieldId] !== undefined &&
        formData[fieldId] !== 0 &&
        formData[fieldId] !== "";
      return isFilled;
    });
    return allFilled;
  };

  /**
   * Find which questions are incomplete (undefined/empty/0)
   * Used to expand only those rows
   */
  const getIncompleteRows = () => {
    return questions
      .filter(
        (question) =>
          formData[question.id] === undefined ||
          formData[question.id] === "" ||
          formData[question.id] === 0
      )
      .map((question) => question.id);
  };

  /**
   * Expand all incomplete rows to prompt the judge to fill them
   */
  const expandIncompleteRows = () => {
    const incompleteRows = getIncompleteRows();
    const updatedOpenRows = incompleteRows.reduce(
      (acc, id) => ({
        ...acc,
        [id]: true,
      }),
      {}
    );
    setOpenRows(updatedOpenRows);
  };

  /**
   * Collapse every row
   */
  const handleCollapseAllRows = () => {
    const updatedOpenRows = questions.reduce((acc, question) => {
      acc[question.id] = false; // Collapse each row
      return acc;
    }, {} as { [key: number]: boolean });
    setOpenRows(updatedOpenRows);
  };

  /**
   * Submit the sheet (finalize). Navigates back after success.
   */
  const handleSubmit = async () => {
    try {
      if (scoreSheet) {
        await editScoreSheet({
          id: scoreSheet.id,
          isSubmitted: true,
          sheetType: sheetType,
          field1: formData[1],
          field2: formData[2],
          field3: formData[3],
          field4: formData[4],
          field5: formData[5],
          field6: formData[6],
          field7: formData[7],
          field8: formData[8],
          field9: formData[9]?.toString(),
        });
      }
      setOpenAreYouSure(false);
      navigate(-1); // back to previous page
    } catch {}
  };

  // Show a spinner while the sheet is loading
  return isLoadingScoreSheet ? (
    <CircularProgress />
  ) : (
    <>
      {/* Back link to the judging dashboard */}
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

      {/* Page title + team name (subtitle) */}
      <Typography
        variant="h4"
        sx={{
          ml: "2%",
          mr: 5,
          mt: 3,
          mb: 0.5,
          fontWeight: 800,
          color: theme.palette.success.main,
        }}
      >
        {title}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" sx={{ ml: "2%", mr: 5, mb: 2 }}>
        {teamName}
      </Typography>

      {/* Main card container for actions + table */}
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
        }}
      >
        {/* Actions: save, expand incomplete, collapse all */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleSaveScoreSheet}
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
            Save
          </Button>
          <Button
            variant="outlined"
            onClick={expandIncompleteRows}
            sx={{
              borderColor: theme.palette.success.main,
              color: theme.palette.success.main,
              "&:hover": {
                borderColor: theme.palette.success.dark,
                bgcolor: "rgba(46,125,50,0.06)",
              },
              minWidth: 200,
              height: 44,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Expand Incomplete Rows
          </Button>
          <Button
            variant="outlined"
            onClick={handleCollapseAllRows}
            sx={{
              borderColor: theme.palette.grey[400],
              color: theme.palette.text.primary,
              "&:hover": { borderColor: theme.palette.grey[600], bgcolor: theme.palette.grey[50] },
              minWidth: 200,
              height: 44,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Collapse All
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Scoring table: each question row can be expanded to show criteria + input */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.grey[200]}`,
            overflow: "hidden",
          }}
        >
          <Table
            sx={{
              "& .MuiTableRow-root": { transition: "background-color 120ms ease" },
              "& tr:hover td": {
                backgroundColor: "rgba(46,125,50,0.04)",
              },
              "& td, & th": { borderColor: theme.palette.grey[200] },
            }}
          >
            <TableBody>
              {questions.map((question) => (
                <React.Fragment key={question.id}>
                  {/* Summary row: shows question text and status icon */}
                  <TableRow onClick={() => handleToggle(question.id)} sx={{ cursor: "pointer" }}>
                    <TableCell sx={{ width: 56 }}>
                      <IconButton aria-label="expand row" size="small">
                        {openRows[question.id] ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ pl: 2, textAlign: "left", pr: 2, fontWeight: 600 }}
                    >
                      {question.questionText}
                    </TableCell>
                    <TableCell align="right" scope="row" sx={{ width: 56 }}>
                      {/* For questions 1..8 show a check/close icon; question 9 is comments */}
                      {question.id != 9 &&
                        (formData[question.id] === undefined || formData[question.id] === 0 || formData[question.id] === "" || formData[question.id] === null ? (
                          <CloseIcon sx={{ color: theme.palette.error.main }} />
                        ) : (
                          <CheckIcon sx={{ color: theme.palette.success.main }} />
                        ))}
                    </TableCell>
                  </TableRow>

                  {/* Details row: criteria cards + score input (or comments for Q9) */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={openRows[question.id]} timeout="auto" unmountOnExit>
                        <Box
                          sx={{
                            mt: 2,
                            mb: 2,
                            display: "flex",
                            gap: 2,
                            flexDirection: { md: "row", sm: "column", xs: "column" },
                            width: "100%",
                            alignItems: "stretch",
                            justifyContent: "center",
                            px: { xs: 1, sm: 2 },
                          }}
                        >
                          {question.id !== 9 ? (
                            <>
                              {/* Criteria 1 card */}
                              <Box
                                sx={{
                                  bgcolor: theme.palette.grey[50],
                                  border: `1px solid ${theme.palette.grey[200]}`,
                                  p: 1.5,
                                  borderRadius: 2,
                                  flex: 1,
                                }}
                              >
                                {seperateJrAndSr && question.id == 4 ? (
                                  <>
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>
                                      Jr. Div.
                                    </Typography>
                                    <Typography>{question.criteria1Junior}</Typography>
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, my: 0.5 }}>
                                      Sr. Div.
                                    </Typography>
                                    <Typography>{question.criteria1Senior}</Typography>
                                  </>
                                ) : (
                                  <Typography>{question.criteria1}</Typography>
                                )}
                                <Typography sx={{ mt: 1, fontWeight: 800, fontSize: 12 }}>
                                  {question.criteria1Points}
                                </Typography>
                              </Box>

                              {/* Criteria 2 card */}
                              <Box
                                sx={{
                                  bgcolor: theme.palette.grey[50],
                                  border: `1px solid ${theme.palette.grey[200]}`,
                                  p: 1.5,
                                  borderRadius: 2,
                                  flex: 1,
                                }}
                              >
                                {seperateJrAndSr && question.id == 4 ? (
                                  <>
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>
                                      Jr. Div.
                                    </Typography>
                                    <Typography>{question.criteria2Junior}</Typography>
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, my: 0.5 }}>
                                      Sr. Div.
                                    </Typography>
                                    <Typography>{question.criteria2Senior}</Typography>
                                  </>
                                ) : (
                                  <Typography>{question.criteria2}</Typography>
                                )}
                                <Typography sx={{ mt: 1, fontWeight: 800, fontSize: 12 }}>
                                  {question.criteria2Points}
                                </Typography>
                              </Box>

                              {/* Criteria 3 card */}
                              <Box
                                sx={{
                                  bgcolor: theme.palette.grey[50],
                                  border: `1px solid ${theme.palette.grey[200]}`,
                                  p: 1.5,
                                  borderRadius: 2,
                                  flex: 1,
                                }}
                              >
                                {seperateJrAndSr && question.id == 4 ? (
                                  <>
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>
                                      Jr. Div.
                                    </Typography>
                                    <Typography>{question.criteria3Junior}</Typography>
                                    <Typography sx={{ fontSize: 12, fontWeight: 800, my: 0.5 }}>
                                      Sr. Div.
                                    </Typography>
                                    <Typography>{question.criteria3Senior}</Typography>
                                  </>
                                ) : (
                                  <Typography>{question.criteria3}</Typography>
                                )}
                                <Typography sx={{ mt: 1, fontWeight: 800, fontSize: 12 }}>
                                  {question.criteria3Points}
                                </Typography>
                              </Box>

                              {/* Numeric score input for Q1..Q8 */}
                              <Box sx={{ 
                                display: "flex", 
                                alignItems: "flex-start", 
                                justifyContent: "center",
                                minWidth: { xs: "100px", sm: "120px" },
                                maxWidth: { xs: "120px", sm: "140px" },
                                mx: { xs: 1, sm: 2 }
                              }}>
                                <TextField
                                  id="outlined-number"
                                  label="Score"
                                  type="number"
                                  value={
                                    formData[question.id] !== undefined && 
                                    formData[question.id] !== null && 
                                    formData[question.id] !== "" &&
                                    formData[question.id] !== 0
                                      ? formData[question.id]
                                      : ""
                                  }
                                  // avoid accidental value change from mouse wheel
                                  onWheel={(e) => {
                                    const inputElement =
                                      e.target as HTMLInputElement;
                                    inputElement.blur();
                                  }}
                                  onChange={(e) => {
                                    // enforce allowed range: [lowPoints, highPoints] or empty
                                    let value: any = e.target.value;

                                    if (value !== undefined) {
                                      if (value === "") {
                                        value = undefined; // Clear the field
                                      } else if (Number(value) < question.lowPoints) {
                                        value = undefined; // Clear if below range
                                      } else if (Number(value) > question.highPoints) {
                                        value = undefined; // Clear if above range
                                      } else {
                                        value = Number(value); // Convert to number if valid
                                      }
                                    }

                                    handleScoreChange(question.id, value);
                                  }}
                                  onKeyDown={(e) => {
                                    // block up/down arrows to prevent accidental changes
                                    if (
                                      e.key === "ArrowUp" ||
                                      e.key === "ArrowDown"
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  slotProps={{
                                    inputLabel: {
                                      shrink: true,
                                    },
                                    htmlInput: {
                                      min: question.lowPoints,
                                      max: question.highPoints,
                                      step: 0.5,
                                    },
                                  }}
                                  helperText={`Allowed: ${question.lowPoints} – ${question.highPoints}`}
                                  sx={{
                                    width: "100%",
                                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                                      borderColor: theme.palette.success.main,
                                    },
                                    "& label.Mui-focused": {
                                      color: theme.palette.success.main,
                                    },
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: 2,
                                    },
                                    "& .MuiFormHelperText-root": {
                                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                      mt: 0.5,
                                      mx: 0
                                    }
                                  }}
                                />
                              </Box>
                            </>
                          ) : (
                            // Free-text comments for Q9
                            <TextField
                              id="outlined-multiline-flexible"
                              label="Enter Comments"
                              multiline
                              maxRows={4}
                              value={
                                formData[question.id] !== undefined
                                  ? formData[question.id]
                                  : ""
                              }
                              onChange={(e) =>
                                handleScoreChange(
                                  question.id,
                                  e.target.value
                                    ? String(e.target.value)
                                    : undefined
                                )
                              }
                              sx={{
                                width: "90%",
                                "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                                  borderColor: theme.palette.success.main,
                                },
                                "& label.Mui-focused": {
                                  color: theme.palette.success.main,
                                },
                              }}
                            />
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Final submit (opens confirmation modal). Disabled until all required fields are filled. */}
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
          Submit
        </Button>

        {/* Confirmation modal; shows error if any returned from the store */}
        <AreYouSureModal
          open={openAreYouSure}
          handleClose={() => setOpenAreYouSure(false)}
          title="Are you sure you want to submit?"
          handleSubmit={() => handleSubmit()}
      
        ></AreYouSureModal>
      </Container>
    </>
  );
}
