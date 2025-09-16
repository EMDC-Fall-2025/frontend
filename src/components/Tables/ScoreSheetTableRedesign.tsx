/**
 * ScoreSheetTableRedesign Component
 * 
 * This component has been updated to match the modern theme used throughout the application:
 * - Container: White background with subtle border instead of colored background
 * - Buttons: Green success theme instead of secondary theme
 * - Criteria boxes: Light grey background instead of dark secondary
 * - Typography: Bold titles for better readability
 * - Styling: Consistent with other modern components in the app
 */
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

type IScoreSheetTableProps = {
  sheetType: number;
  title: string;
  teamName: string;
  questions: any[];
  teamId: number | null;
  judgeId: number | null;
};

export default function ScoreSheetTableRedesign({
  sheetType,
  title,
  teamName,
  questions,
  teamId,
  judgeId,
}: IScoreSheetTableProps) {
  const [openRows, setOpenRows] = React.useState<{ [key: number]: boolean }>(
    {}
  );
  const { scoreSheetId, fetchScoreSheetId } = useMapScoreSheetStore();
  const {
    scoreSheet,
    fetchScoreSheetById,
    isLoadingScoreSheet,
    updateScores,
    editScoreSheet,
    scoreSheetError,
  } = useScoreSheetStore();
  const [openAreYouSure, setOpenAreYouSure] = useState(false);

  const navigate = useNavigate();

  const handleToggle = (id: number) => {
    setOpenRows((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  useEffect(() => {
    if (teamId && judgeId) {
      fetchScoreSheetId(judgeId, teamId, sheetType);
    }
  }, [teamId, judgeId, fetchScoreSheetId]);

  useEffect(() => {
    if (scoreSheetId) {
      fetchScoreSheetById(scoreSheetId);
    }
  }, [scoreSheetId, fetchScoreSheetById]);

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
  });

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
        8: scoreSheet.field9,
      });
    } else {
      setFormData({});
    }
  }, [scoreSheet, judgeId, teamId]);

  const handleScoreChange = (
    questionId: number,
    value: number | string | undefined
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      [questionId]: value,
    }));
  };

  const handleSaveScoreSheet = () => {
    if (scoreSheet) {
      updateScores({
        id: scoreSheet.id,
        field1: formData[1],
        field2: formData[2],
        field3: formData[3],
        field4: formData[4],
        field5: formData[5],
        field6: formData[6],
        field7: formData[7],
        field8: formData[8]?.toString(),
      });
    }
  };

  const allFieldsFilled = () => {
    const allFilled = Object.keys(formData).every((key) => {
      const fieldId = Number(key);
      if (fieldId === 8) {
        return true;
      }

      const isFilled =
        formData[fieldId] !== undefined &&
        formData[fieldId] !== 0 &&
        formData[fieldId] !== "";

      return isFilled;
    });
    return allFilled;
  };

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

  const handleCollapseAllRows = () => {
    const updatedOpenRows = questions.reduce((acc, question) => {
      acc[question.id] = false; // Collapse each row
      return acc;
    }, {} as { [key: number]: boolean });
    setOpenRows(updatedOpenRows);
  };

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
          field8: formData[8]?.toString(),
        });
      }
      setOpenAreYouSure(false);
      navigate(-1);
    } catch {}
  };

  return isLoadingScoreSheet ? (
    <CircularProgress />
  ) : (
    <>
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
      {/* Main page title - made bold for better visibility */}
      <Typography variant="h1" sx={{ ml: "2%", mr: 5, mt: 4, mb: 2, fontWeight: "bold" }}>
        {title}
      </Typography>
      {/* Team name subtitle - made bold for consistency */}
      <Typography variant="body1" sx={{ ml: "2%", mr: 5, mb: 4, fontWeight: "bold" }}>
        {teamName}
      </Typography>
      {/* Main form container - updated to use modern theme with white background and subtle border */}
      <Container
        component="form"
        sx={{
          width: "auto",                                    // Flexible width instead of fixed 90vw
          p: 3,                                            // Consistent padding
          bgcolor: "#fff",                                 // Clean white background 
          borderRadius: 3,                               
          border: `1px solid ${theme.palette.grey[300]}`, // Subtle border for definition
          ml: "2%",
          mr: 1,
          mb: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Action buttons container - updated to use modern green theme and better layout */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          {/* Save button - updated to use success theme instead of secondary */}
          <Button
            variant="contained"
            onClick={handleSaveScoreSheet}
            sx={{
              bgcolor: theme.palette.success.main,   
              "&:hover": { bgcolor: theme.palette.success.dark }, // Hover effect
              color: "#fff",                            
            }}
          >
            Save
          </Button>
          {/* Expand incomplete rows button - helps judges find unfilled sections */}
          <Button
            variant="contained"
            onClick={expandIncompleteRows}
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
            Expand Incomplete Rows
          </Button>
          {/* Collapse all rows button - helps judges organize their view */}
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
        {/* Scoring table container - updated to use Paper with modern styling */}
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,                              // Modern border radius
            border: `1px solid ${theme.palette.grey[200]}`, // Subtle border
            overflow: "hidden",                           // Clean edges
          }}
        >
          <Table sx={{ tableLayout: "auto" }}>
            <TableBody>
              {questions.map((question) => (
                <React.Fragment key={question.id}>
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
                    {/* Question text - made bold for better readability */}
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ pl: 2, textAlign: "left", pr: 2, fontWeight: "bold" }}
                    >
                      {question.questionText}
                    </TableCell>
                    <TableCell align="right" scope="row" sx={{ width: 56 }}>
                      {question.id !== 8 && (
                        <>
                          {formData[question.id] == 0 ? (
                            <CloseIcon sx={{ color: "red" }} />
                          ) : (
                            <CheckIcon sx={{ color: "green" }} />
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={openRows[question.id]} timeout="auto" unmountOnExit>
                        <Box
                          sx={{
                            mt: 2,
                            mb: 2,
                            display: "flex",
                            gap: 3,
                            flexDirection: {
                              md: "row",
                              sm: "column",
                              xs: "column",
                            },
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {question.id !== 8 ? (
                            <>
                              {/* Criteria 1 box - updated to use light grey background instead of dark secondary */}
                              <Box
                                sx={{
                                  bgcolor: theme.palette.grey[50],         // Very light grey (was secondary.light)
                                  border: `1px solid ${theme.palette.grey[200]}`, // Subtle border for definition
                                  p: 1.5,                                 // Better padding (was 1)
                                  borderRadius: 2,                         // Smaller radius (was 3)
                                  flex: 1,                                 // Better flex layout (was width: 95%)
                                }}
                              >
                                <Typography>{question.criteria1}</Typography>
                                <Typography
                                  sx={{
                                    mt: 1,
                                    fontWeight: 800,
                                    fontSize: "12pt",
                                  }}
                                >
                                  {question.criteria1Points}
                                </Typography>
                              </Box>
                              {/* Criteria 2 box - same styling as criteria 1 for consistency */}
                              <Box
                                sx={{
                                  bgcolor: theme.palette.grey[50],
                                  border: `1px solid ${theme.palette.grey[200]}`,
                                  p: 1.5,
                                  borderRadius: 2,
                                  flex: 1,
                                }}
                              >
                                <Typography>{question.criteria2}</Typography>
                                <Typography
                                  sx={{
                                    mt: 1,
                                    fontWeight: 800,
                                    fontSize: "12pt",
                                  }}
                                >
                                  {question.criteria2Points}
                                </Typography>
                              </Box>
                              {/* Criteria 3 box - same styling as other criteria for consistency */}
                              <Box
                                sx={{
                                  bgcolor: theme.palette.grey[50],
                                  border: `1px solid ${theme.palette.grey[200]}`,
                                  p: 1.5,
                                  borderRadius: 2,
                                  flex: 1,
                                }}
                              >
                                <Typography>{question.criteria3}</Typography>
                                <Typography
                                  sx={{
                                    mt: 1,
                                    fontWeight: 800,
                                    fontSize: "12pt",
                                  }}
                                >
                                  {question.criteria3Points}
                                </Typography>
                              </Box>
                              <TextField
                                id={`score-${question.id}`}
                                label="Score"
                                type="number"
                                value={
                                  formData[question.id] !== 0
                                    ? formData[question.id]
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
                                      value = "";
                                    } else if (value < question.lowPoints) {
                                      value = "";
                                    } else if (value > question.highPoints) {
                                      value = "";
                                    }
                                  }
  
                                  handleScoreChange(question.id, value);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
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
                                sx={{ minWidth: "75px" }}
                              />
                            </>
                          ) : (
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
                                  e.target.value ? String(e.target.value) : undefined
                                )
                              }
                              sx={{ width: "90%" }}
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
        {/* Final submit button - updated to use success theme and modern styling */}
        <Button
          variant="contained"
          onClick={() => setOpenAreYouSure(true)}
          disabled={!allFieldsFilled()}
          sx={{
            mt: 3,
            bgcolor: theme.palette.success.main,        // Green theme 
            "&:hover": { bgcolor: theme.palette.success.dark }, // Hover effect
            color: "#fff",                              // White text 
            minWidth: 200,                          
            textTransform: "none",                     // No uppercase transformation
            borderRadius: 2,                           // Modern border radius
          }}
        >
          Submit
        </Button>
        <AreYouSureModal
          open={openAreYouSure}
          handleClose={() => setOpenAreYouSure(false)}
          title="Are you sure you want to submit?"
          handleSubmit={handleSubmit}
          error={scoreSheetError}
        />
      </Container>
    </>
  );
  
}
