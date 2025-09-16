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
  teams: { id: number, name: string }[];
  questions: any[];
  seperateJrAndSr: boolean;
  judgeId: number | null;
};

export default function MultiTeamScoreSheet({
  sheetType,
  title,
  teams,
  questions,
  judgeId,
  seperateJrAndSr,
}: IMultiTeamScoreSheetProps) {
  const [openRows, setOpenRows] = React.useState<{ [key: number]: boolean }>({});
  const {
    multipleScoreSheets,
    fetchMultipleScoreSheets,
    updateMultipleScores,
    submitMultipleScoreSheets,
    scoreSheetError,
  } = useScoreSheetStore();

  const filteredTeams = React.useMemo(() => {
    if (!multipleScoreSheets) return [];
    return teams.filter(team =>
      multipleScoreSheets.some(sheet => sheet.teamId === team.id)
    );
  }, [teams, multipleScoreSheets]);

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
  

  const [formData, setFormData] = useState<{
    [teamId: number]: {
      [questionId: number]: number | string | undefined;
    };
  }>({});

  useEffect(() => {
    if (teams.length > 0 && judgeId) {
      const teamIds = teams.map(team => team.id);
      fetchMultipleScoreSheets(teamIds, judgeId, sheetType);
    }
  }, [teams, judgeId, fetchMultipleScoreSheets, sheetType]);

  useEffect(() => {
    if (multipleScoreSheets && multipleScoreSheets.length > 0) {
      const newFormData: {
        [teamId: number]: {
          [questionId: number]: number | string | undefined;
        };
      } = {};

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

  // ... The rest of the component logic (rendering table, handlers, etc.)


  const handleScoreChange = (teamId: number, questionId: number, value: number | string | undefined) => {
    setFormData(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [questionId]: value,
      }
    }));
  };

  const handleSaveScoreSheets = async () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return;
    const updatedSheets = [];
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

  const allFieldsFilled = () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return false;
    for (const team of filteredTeams) {
      const data = formData[team.id];
      if (!data) return false;
      const complete = Object.keys(data).every(key => {
        const id = Number(key);
        return id === 9 || (data[id] !== undefined && data[id] !== "" && data[id] !== 0);
      });
      if (!complete) return false;
    }
    return true;
  };

  const handleCollapseAllRows = () => {
    const closed = questions.reduce((acc, q) => ({ ...acc, [q.id]: false }), {});
    setOpenRows(closed);
  };

  const handleSubmit = async () => {
    if (!multipleScoreSheets || multipleScoreSheets.length === 0) return;
    const updatedSheets = [];
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
    navigate(-1);
  };


  return (
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
      <Container
        component="form"
        sx={{
          width: "95vw",
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
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleSaveScoreSheets}
            sx={{
              bgcolor: theme.palette.secondary.main,
              color: theme.palette.primary.main,
              width: 200,
              height: 45,
            }}
          >
            Save All
          </Button>
          <Button
            variant="contained"
            onClick={handleExpandAllRows} 
            sx={{
              bgcolor: theme.palette.secondary.main,
              color: theme.palette.primary.main,
              width: 200,
              height: 45,
            }}
          >
            Expand Rows
          </Button>
          <Button
            variant="contained"
            onClick={handleCollapseAllRows}
            sx={{
              bgcolor: theme.palette.secondary.main,
              color: theme.palette.primary.main,
              width: 200,
              height: 45,
            }}
          >
            Collapse All
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '50px' }}></TableCell>
                <TableCell sx={{ width: '35%' }}>Criteria</TableCell>
                {filteredTeams.map(team => (
                  <TableCell key={team.id} align="center">
                    <Typography variant="subtitle1">{team.name}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map((question) => (
                <React.Fragment key={question.id}>
                  <TableRow onClick={() => handleToggle(question.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <IconButton aria-label="expand row" size="small">
                        {openRows[question.id] ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row" sx={{ pl: 2, textAlign: "left" }}>
                      {question.questionText}
                    </TableCell>
                    {filteredTeams.map(team => (
                      <TableCell key={team.id} align="center">
                        {question.id !== 9 ? (
                          <>
                            <TextField
                              onClick={(e) => e.stopPropagation()}
                              type="number"
                              size="small"
                              value={
                                formData[team.id] && formData[team.id][question.id] !== 0
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
                                    value = "";
                                  } else if (Number(value) < question.lowPoints) {
                                    value = "";
                                  } else if (Number(value) > question.highPoints) {
                                    value = "";
                                  }
                                }

                                handleScoreChange(team.id, question.id, value === "" ? undefined : Number(value));
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
                              sx={{ width: "75px" }}
                            />
                            {formData[team.id] && (
                              <Box sx={{ display: "inline", ml: 1 }}>
                                {formData[team.id][question.id] === undefined || formData[team.id][question.id] === "" ? (
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
                            sx={{ width: "90%" }}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
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
                            {question.id !== 9 && (
                              <>
                                <Box
                                  sx={{
                                    bgcolor: theme.palette.secondary.light,
                                    padding: 2,
                                    borderRadius: 3,
                                    flex: 1,
                                    minWidth: "250px",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      mt: 1,
                                      fontWeight: 800,
                                      fontSize: "12pt",
                                    }}
                                  >
                                    {question.criteria1Points}
                                  </Typography>
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
                                <Box
                                  sx={{
                                    bgcolor: theme.palette.secondary.light,
                                    padding: 2,
                                    borderRadius: 3,
                                    flex: 1,
                                    minWidth: "250px",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      mt: 1,
                                      fontWeight: 800,
                                      fontSize: "12pt",
                                    }}
                                  >
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
                                <Box
                                  sx={{
                                    bgcolor: theme.palette.secondary.light,
                                    padding: 2,
                                    borderRadius: 3,
                                    flex: 1,
                                    minWidth: "250px",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      mt: 1,
                                      fontWeight: 800,
                                      fontSize: "12pt",
                                    }}
                                  >
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
          Submit All
        </Button>
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