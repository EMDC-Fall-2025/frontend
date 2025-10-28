import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Container,
  IconButton,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  Stack,    // for tidy header layout
  Divider,  // visual separator between header and content
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useParams, useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/primary_stores/teamStore";
import theme from "../theme";
import React from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import useMapScoreSheetStore from "../store/map_stores/mapScoreSheetStore";
import { useScoreSheetStore } from "../store/primary_stores/scoreSheetStore";
import AreYouSureModal from "../components/Modals/AreYouSureModal";
import { generalPenaltiesQuestions } from "../data/generalPenaltiesQuestions";
import PenaltyCategory from "../components/PenaltyCategory";
import { ScoreSheet } from "../types";
import { useJudgeStore } from "../store/primary_stores/judgeStore";

export default function GeneralPenalties() {
  // --- Stores, routing, params ---
  const { role } = useAuthStore();
  const { judgeId, teamId } = useParams();
  const { team, fetchTeamById } = useTeamStore();
  const { fetchScoreSheetWithData } = useMapScoreSheetStore();
  const {
    scoreSheet,
    isLoadingScoreSheet,
    updateScores,
    submitScoreSheet,
    setScoreSheet,
  } = useScoreSheetStore();
  const { judgeDisqualifyTeam } = useJudgeStore();
  const navigate = useNavigate();

  // Parse route ids once for convenience
  const parsedJudgeId = judgeId ? parseInt(judgeId, 10) : null;
  const parsedTeamId = teamId ? parseInt(teamId, 10) : null;

  // --- Local UI state (expand/collapse sections) ---
  const [openPresentation, setOpenPresentation] = useState(false);
  const [openJournal, setOpenJournal] = useState(false);
  const [openMachineSpecifications, setOpenMachineSpecifications] = useState(false);
  const [openDisqualifications, setOpenDisqualifications] = useState(false);

  // --- Modals ---
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [openConfirmDisqualification, setOpenConfirmDisqualification] = useState(false);

  // Penalty form state: count/yes-no per question (1..7)
  const [penaltyState, setPenaltyState] = useState<{ [key: number]: number }>(
    Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i + 1, 0]))
  );

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

  // Load scoresheet data in one optimized call (sheetType 5 = general penalties)
  useEffect(() => {
    if (parsedJudgeId && parsedTeamId) {
      fetchScoreSheetWithData(parsedJudgeId, parsedTeamId, 5)
        .then((scoresheetData) => {
          setScoreSheet(scoresheetData);
        })
        .catch((error) => {
          console.error('Error fetching general penalties scoresheet:', error);
        });
    }
  }, [parsedTeamId, parsedJudgeId, fetchScoreSheetWithData, setScoreSheet]);

  // Populate local penalty state from the scoreSheet.
  // NOTE: Stored fields are total points; we display counts, so divide by per-occurrence point value.
  useEffect(() => {
    if (scoreSheet) {
      const newPenaltyState: { [key: number]: number } = {};

      generalPenaltiesQuestions.forEach((question) => {
        const fieldValue = Number(scoreSheet[question.field as keyof ScoreSheet]);
        const pointValue = question.pointValue;
        newPenaltyState[question.id] = fieldValue === 0 ? 0 : fieldValue / pointValue;
      });

      setPenaltyState(newPenaltyState);
    } else {
      setPenaltyState({});
    }
  }, [scoreSheet]);

  // Convert current counts to scored fields (points) before save/submit
  const calculatePenalties = () => {
    return generalPenaltiesQuestions.reduce((acc, question) => {
      const fieldValue = penaltyState[question.id];
      if (fieldValue !== undefined) {
        acc[question.field] = fieldValue * question.pointValue;
      }
      return acc;
    }, {} as Record<string, number>);
  };

  // Save as draft (no submission)
  const handleSavePenalties = async () => {
    if (scoreSheet) {
      const penalties = calculatePenalties();
      await updateScores({ id: scoreSheet.id, ...penalties });
    }
  };

  // Submit final and go back
  const handleSubmitPenalties = async () => {
    try {
      if (scoreSheet) {
        const penalties = calculatePenalties();
        await submitScoreSheet({
          id: scoreSheet.id,
          sheetType: scoreSheet.sheetType,
          isSubmitted: true,
          ...penalties,
        });
      }
      setOpenAreYouSure(false);
      
      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        navigate(-1);
      }, 100);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit penalties. Please try again.");
      setOpenAreYouSure(false);
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

  // Disqualification flow: mark team and submit penalties
  async function handleDisqualify() {
    if (parsedTeamId) {
      await judgeDisqualifyTeam(parsedTeamId, true);
      fetchTeamById(parsedTeamId);
      handleSubmitPenalties();
    }
  }

  // Group questions by category for tidy sections
  const journalPenalties = generalPenaltiesQuestions.filter((p) => p.penaltyType === "Journal");
  const presentationPenalties = generalPenaltiesQuestions.filter((p) => p.penaltyType === "Presentation");
  const machineSpecificationPenalties = generalPenaltiesQuestions.filter((p) => p.penaltyType === "Machine Specification");

  // Loading state: keep original behavior
  return isLoadingScoreSheet ? (
    <CircularProgress />
  ) : (
    // Page background and spacing (aligns with Admin/Public pages)
    <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Back link styled with green accent */}
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

        {/* Card wrapper: title, subtitle, helper text, actions, and table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.grey[300]}`,
            backgroundColor: "#fff",
          }}
        >
          {/* Title + Team */}
          <Stack spacing={1} sx={{ px: 3, py: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
              General Penalties
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {team?.team_name ? `Team: ${team.team_name}` : "Loading team..."}
            </Typography>
          </Stack>

          <Divider />

          {/* Helper text and Save action */}
          <Stack
            spacing={1.25}
            direction={{ xs: "column", sm: "row" }}
            sx={{ px: 3, py: 2 }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
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

          {/* Main content: categories table + disqualification section + submit */}
          <Box sx={{ px: 3, pb: 3 }}>
            {/* Bordered, rounded table container for categories */}
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
                  {/* Journal Penalties */}
                  <PenaltyCategory
                    isOpen={openJournal}
                    toggleOpen={() => setOpenJournal(!openJournal)}
                    categoryTitle="Journal Penalties"
                    fields={journalPenalties.map((penalty) => ({
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

                  {/* Presentation Penalties (note: some mutually exclusive options) */}
                  <PenaltyCategory
                    isOpen={openPresentation}
                    toggleOpen={() => setOpenPresentation(!openPresentation)}
                    categoryTitle="Presentation Penalties"
                    fields={presentationPenalties.map((penalty) => ({
                      fieldId: penalty.id,
                      text: penalty.questionText,
                      points: penalty.pointText,
                      disabled:
                        (penalty.id == 2 && penaltyState[3] == 1) ||
                        (penalty.id == 3 && penaltyState[2] == 1),
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

                  {/* Machine Specification Penalties */}
                  <PenaltyCategory
                    isOpen={openMachineSpecifications}
                    toggleOpen={() => setOpenMachineSpecifications(!openMachineSpecifications)}
                    categoryTitle="Machine Specification Penalties"
                    fields={machineSpecificationPenalties.map((penalty) => ({
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

                  {/* Disqualification section (collapsible) */}
                  <React.Fragment>
                    <TableRow
                      sx={{
                        "& > *": { borderBottom: "unset" },
                        transition: "background-color 120ms ease",
                        cursor: "pointer",
                        "&:hover td": { backgroundColor: "rgba(46,125,50,0.04)" },
                      }}
                      onClick={() => setOpenDisqualifications(!openDisqualifications)}
                    >
                      <TableCell sx={{ width: 56 }}>
                        <IconButton aria-label="expand row" size="small">
                          {openDisqualifications ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        <Typography sx={{ fontWeight: 600 }}>Disqualification</Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={openDisqualifications} timeout="auto" unmountOnExit>
                          <Box sx={{ pt: 1, pb: 1, pl: 0.75, pr: 0.75, flexDirection: "column" }}>
                            {/* Reasons list */}
                            <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                              <Typography component="li" sx={{ mb: 1.5 }}>
                                Corporate logos without written permission. If permission to use a logo is granted, a
                                written letter of permission must be provided and be kept with the machine.
                              </Typography>
                              <Typography component="li" sx={{ mb: 1.5 }}>
                                Safety issues as deemed by the Judging Committee.
                              </Typography>
                              <Typography component="li" sx={{ mb: 1.5 }}>
                                Use of live animals, hazardous material (toxic, noxious, dangerous), explosives, or flames.
                              </Typography>
                              <Typography component="li" sx={{ mb: 1.5 }}>
                                Use of profane, indecent or lewd expressions, offensive symbols, graphics, or language.
                              </Typography>
                              <Typography component="li" sx={{ mb: 1.5 }}>
                                Any device requiring a combustion engine.
                              </Typography>
                              <Typography component="li" sx={{ mb: 1.5 }}>
                                Unsafe machine or intentionally causing loose/flying objects to go outside set boundaries of the machine.
                              </Typography>
                              <Typography component="li">
                                Damaging another team’s machine.
                              </Typography>
                            </Box>
                          </Box>

                          {/* Disqualify action */}
                          <Box sx={{ display: "flex", justifyContent: "center", mb: 2, mt: 1 }}>
                            <Button
                              variant="contained"
                              onClick={() => setOpenConfirmDisqualification(true)}
                              sx={{
                                bgcolor: theme.palette.error.main,
                                "&:hover": { bgcolor: theme.palette.error.dark },
                                color: "#fff",
                                textTransform: "none",
                                borderRadius: 2,
                              }}
                            >
                              Disqualify Team
                            </Button>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Submit controls */}
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

            {/* Confirmation modals */}
            <AreYouSureModal
              open={openAreYouSure}
              handleClose={() => setOpenAreYouSure(false)}
              title="Are you sure you want to submit?"
              handleSubmit={() => handleSubmitPenalties()}
            />

            <AreYouSureModal
              open={openConfirmDisqualification}
              handleClose={() => setOpenConfirmDisqualification(false)}
              title={`Are you sure you want to disqualify ${team?.team_name}?`}
              handleSubmit={() => handleDisqualify()}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
