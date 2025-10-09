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
    editScoreSheet
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
        sx={{ textDecoration: "none" }}
        style={{ cursor: "pointer" }}
      >
        <Typography variant="body2" sx={{ m: 2 }}>
          {"<"} Back to Judging Dashboard{" "}
        </Typography>
      </Link>
      <Typography variant="h1" sx={{ ml: "2%", mr: 5, mt: 4, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ ml: "2%", mr: 5, mb: 4 }}>
        {teamName}
      </Typography>
      <Container
        component="form"
        sx={{
          width: "90vw",
          height: "auto",
          padding: 3,
          bgcolor: theme.palette.secondary.light,
          ml: "2%",
          mr: 1,
          mb: 3,
          borderRadius: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          onClick={handleSaveScoreSheet}
          sx={{
            mb: 2,
            bgcolor: theme.palette.secondary.main,
            color: theme.palette.primary.main,
            width: 200,
            height: 45,
          }}
        >
          Save
        </Button>
        <Button
          variant="contained"
          onClick={expandIncompleteRows}
          sx={{
            mb: 2,
            bgcolor: theme.palette.secondary.main,
            color: theme.palette.primary.main,
            width: 200,
            height: 45,
          }}
        >
          Expand Incomplete Rows
        </Button>
        <Button
          variant="contained"
          onClick={handleCollapseAllRows}
          sx={{
            mb: 2,
            bgcolor: theme.palette.secondary.main,
            color: theme.palette.primary.main,
            width: 200,
            height: 45,
          }}
        >
          Collapse All
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              {questions.map((question) => (
                <React.Fragment key={question.id}>
                  <TableRow onClick={() => handleToggle(question.id)}>
                    <TableCell>
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
                      sx={{ pl: 2, textAlign: "left", mr: 1 }}
                    >
                      {question.questionText}
                    </TableCell>
                    <TableCell align="right" scope="row">
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
                              <Box
                                sx={{
                                  bgcolor: theme.palette.secondary.light,
                                  padding: 1,
                                  borderRadius: 3,
                                  width: "95%",
                                  height: "100%",
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
                              <Box
                                sx={{
                                  bgcolor: theme.palette.secondary.light,
                                  padding: 1,
                                  borderRadius: 3,
                                  width: "95%",
                                  height: "100%",
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
                              <Box
                                sx={{
                                  bgcolor: theme.palette.secondary.light,
                                  padding: 1,
                                  borderRadius: 3,
                                  width: "95%",
                                  height: "100%",
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
        <Button
          variant="contained"
          onClick={() => setOpenAreYouSure(true)}
          disabled={!allFieldsFilled()}
          sx={{
            mt: 3,
            bgcolor: theme.palette.secondary.main,
            color: theme.palette.primary.main,
            width: 200,
            height: 45,
          }}
        >
          Submit
        </Button>
        <AreYouSureModal
          open={openAreYouSure}
          handleClose={() => setOpenAreYouSure(false)}
          title="Are you sure you want to submit?"
          handleSubmit={handleSubmit}
        />
      </Container>
    </>
  );
  
}