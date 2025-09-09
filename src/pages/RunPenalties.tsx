import {
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  Table,
  TableBody,
  TableContainer,
  Typography,
  Box,
  Stack,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useParams, useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/primary_stores/teamStore";
import theme from "../theme";
import useMapScoreSheetStore from "../store/map_stores/mapScoreSheetStore";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import AreYouSureModal from "../components/Modals/AreYouSureModal";
import { runPenaltiesQuestions } from "../data/runPenaltiesQuestions";
import { ScoreSheet } from "../types";
import PenaltyCategory from "../components/PenaltyCategory";

export default function Penalties() {
  // Stores & routing
  const { role } = useAuthStore();
  const { judgeId, teamId } = useParams();
  const { team, fetchTeamById } = useTeamStore();
  const { scoreSheetId, fetchScoreSheetId } = useMapScoreSheetStore();
  const {
    scoreSheet,
    fetchScoreSheetById,
    isLoadingScoreSheet,
    updateScores,
    editScoreSheet,
    scoreSheetError,
  } = useScoreSheetStore();
  const navigate = useNavigate();

  // Parse ids from route
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;
  const parsedTeamId = teamId ? parseInt(teamId, 10) : null;

  // Local UI state (open/close penalty sections)
  const [openMachineOperationRound1, setOpenMachineOperationRound1] =
    useState(false);
  const [openMachineOperationRound2, setOpenMachineOperationRound2] =
    useState(false);

  // Confirm submit modal
  const [openAreYouSure, setOpenAreYouSure] = useState(false);

  // Penalty inputs state (keeps counts/checkbox states per question)
  const [penaltyState, setPenaltyState] = useState<{
    [key: number]: number | string;
  }>([...Array(17)].reduce((acc, _, i) => ({ ...acc, [i + 1]: 0 }), {}));

  // If a judge opens a link for a different judge, redirect them to their own sheet
  useEffect(() => {
    if (role?.user_type === 3 && parsedJudgeId !== role.user.id) {
      navigate(`/penalties/${role.user.id}/${parsedTeamId}/`);
    }
  }, [parsedJudgeId]);

  // Fetch team info for subtitle
  useEffect(() => {
    if (parsedTeamId) {
      fetchTeamById(parsedTeamId);
    }
  }, [parsedTeamId, fetchTeamById]);

  // Fetch mapping to get scoreSheetId for this judge+team (sheetType 4 = run penalties)
  useEffect(() => {
    if (parsedJudgeId && parsedTeamId) {
      fetchScoreSheetId(parsedJudgeId, parsedTeamId, 4);
    }
  }, [parsedTeamId, parsedJudgeId, fetchScoreSheetId]);

  // Load the full score sheet once we know the id
  useEffect(() => {
    if (scoreSheetId) {
      fetchScoreSheetById(scoreSheetId);
    }
  }, [scoreSheetId, fetchScoreSheetById]);

  // Populate local state from scoreSheet.
  // NOTE: fields are point values, so to get occurrences we divide by the per-occurrence point value.
  useEffect(() => {
    if (scoreSheet) {
      const newPenaltyState: { [key: number]: number | string } = {};
      for (let i = 1; i <= 17; i++) {
        const question = runPenaltiesQuestions.find((q) => q.id === i);

        if (question) {
          const fieldValue = Number(
            scoreSheet[question.field as keyof ScoreSheet]
          );
          const pointValue = question.pointValue;
          if (i === 9) {
            newPenaltyState[i] = ""; // comments row
          } else if (pointValue != undefined) {
            newPenaltyState[i] = fieldValue === 0 ? 0 : fieldValue / pointValue;
          }
        } else {
          if (i === 9) {
            newPenaltyState[i] = "";
          } else {
            newPenaltyState[i] = 0;
          }
        }
      }
      setPenaltyState(newPenaltyState);
    } else {
      setPenaltyState({});
    }
  }, [scoreSheet, parsedJudgeId, parsedTeamId]);

  /**
   * Convert current penaltyState (occurrence counts) into scored fields for persistence.
   */
  const calculatePenalties = () => {
    return runPenaltiesQuestions.reduce((acc, question) => {
      const fieldValue = penaltyState[question.id];

      if (question.id === 9) {
        acc[question.field] = "";
      } else if (fieldValue !== undefined) {
        acc[question.field] = Number(fieldValue) * question.pointValue;
      }

      return acc;
    }, {} as Record<string, number | string>);
  };

  /**
   * Save as draft (no submission)
   */
  const handleSavePenalties = async () => {
    if (scoreSheet) {
      const penalties = calculatePenalties();
      await updateScores({
        id: scoreSheet.id,
        ...penalties,
      });
    }
  };

  /**
   * Final submit and navigate back
   */
  const handleSubmitPenalties = async () => {
    try {
      if (scoreSheet) {
        const penalties = calculatePenalties();
        await editScoreSheet({
          id: scoreSheet.id,
          sheetType: scoreSheet.sheetType,
          isSubmitted: true,
          ...penalties,
        });
      }
      setOpenAreYouSure(false);
      navigate(-1);
    } catch (error) {
      console.error(error);
    }
  };

  // Simple handlers for checkbox / increment / decrement controls
  function handleCheckboxChange(field: number) {
    setPenaltyState((prevState) => ({
      ...prevState,
      [field]: prevState[field] === 1 ? 0 : 1,
    }));
  }

  function handleIncrement(field: number, upperBound: number) {
    setPenaltyState((prevState: any) => ({
      ...prevState,
      [field]: Math.min(prevState[field] + 1, upperBound),
    }));
  }

  function handleDecrement(field: number, lowerBound: number) {
    setPenaltyState((prevState: any) => ({
      ...prevState,
      [field]: Math.max(prevState[field] - 1, lowerBound),
    }));
  }

  // Split questions into two categories (Run 1, Run 2)
  const runOneQuestions = runPenaltiesQuestions.filter(
    (penalty) => penalty.penaltyType === "Machine Operation Run 1"
  );
  const runTwoQuestions = runPenaltiesQuestions.filter(
    (penalty) => penalty.penaltyType === "Machine Operation Run 2"
  );

  // Loading state
  return isLoadingScoreSheet ? (
    <CircularProgress />
  ) : (
    // Page background & spacing to match Admin/Public look
    <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Back link (green) */}
        <Link
          onClick={() => navigate(-1)}
          sx={{
            textDecoration: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            color: theme.palette.success.main,
            "&:hover": { color: theme.palette.success.dark },
            mb: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {"<"} Back to Judging Dashboard{" "}
          </Typography>
        </Link>

        {/* Card wrapper for title + help text + table + actions */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.grey[300]}`,
            backgroundColor: "#fff",
          }}
        >
          {/* Title/Subtitle block */}
          <Stack spacing={1} sx={{ px: 3, py: 3 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: theme.palette.success.main }}
            >
              Run Penalties
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {team?.team_name ? `Team: ${team.team_name}` : "Loading team..."}
            </Typography>
          </Stack>

          <Divider />

          {/* Helper text + Save button */}
          <Stack spacing={1.25} direction={{ xs: "column", sm: "row" }} sx={{ px: 3, py: 2 }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
            <Box>
              <Typography variant="body2" color="text.secondary">
                *Only enter a penalty if it occurred.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                *Counters adjust the number of occurrences.
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleSavePenalties}
              sx={{
                bgcolor: theme.palette.success.main,
                "&:hover": { bgcolor: theme.palette.success.dark },
                color: "#fff",
                minWidth: 160,
                height: 42,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Save
            </Button>
          </Stack>

          {/* Penalties table (kept structure; only styled wrapper) */}
          <Box sx={{ px: 3, pb: 3 }}>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.grey[200]}`,
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <Table
                sx={{
                  "& td, & th": { borderColor: theme.palette.grey[200] },
                }}
              >
                <TableBody>
                  <PenaltyCategory
                    isOpen={openMachineOperationRound1}
                    toggleOpen={() =>
                      setOpenMachineOperationRound1(!openMachineOperationRound1)
                    }
                    categoryTitle="Machine Operation Penalties Run 1"
                    fields={runOneQuestions.map((penalty) => ({
                      fieldId: penalty.id,
                      text: penalty.questionText,
                      points: penalty.pointText,
                      disabled: false,
                      isIncrement: penalty.isIncrement,
                      incrementLowerBound: penalty.incrementLowerBound,
                      incrementUpperBound: penalty.incrementUpperBound,
                      yesOrNo: penalty.yesOrNo,
                    }))}
                    penaltyState={penaltyState}
                    onCheckboxChange={handleCheckboxChange}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                  />

                  <PenaltyCategory
                    isOpen={openMachineOperationRound2}
                    toggleOpen={() =>
                      setOpenMachineOperationRound2(!openMachineOperationRound2)
                    }
                    categoryTitle="Machine Operation Penalties Run 2"
                    fields={runTwoQuestions.map((penalty) => ({
                      fieldId: penalty.id,
                      text: penalty.questionText,
                      points: penalty.pointText,
                      disabled: false,
                      isIncrement: penalty.isIncrement,
                      incrementLowerBound: penalty.incrementLowerBound,
                      incrementUpperBound: penalty.incrementUpperBound,
                      yesOrNo: penalty.yesOrNo,
                    }))}
                    penaltyState={penaltyState}
                    onCheckboxChange={handleCheckboxChange}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                  />
                </TableBody>
              </Table>
            </TableContainer>

            {/* Submit button + modal */}
            <Button
              variant="contained"
              sx={{
                mt: 3,
                bgcolor: theme.palette.success.main,
                "&:hover": { bgcolor: theme.palette.success.dark },
                color: "#fff",
                minWidth: 200,
                height: 45,
                textTransform: "none",
                borderRadius: 2,
              }}
              onClick={() => setOpenAreYouSure(true)}
            >
              Submit
            </Button>

            <AreYouSureModal
              open={openAreYouSure}
              handleClose={() => setOpenAreYouSure(false)}
              title="Are you sure you want to submit?"
              handleSubmit={() => handleSubmitPenalties()}
              error={scoreSheetError}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
