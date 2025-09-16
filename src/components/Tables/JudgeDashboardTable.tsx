import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Button,
  Box,
  Collapse,
  IconButton,
  CircularProgress,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useJudgeStore } from "../../store/primary_stores/judgeStore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMapScoreSheetStore } from "../../store/map_stores/mapScoreSheetStore";
import AreYouSureModal from "../Modals/AreYouSureModal";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import theme from "../../theme";
import useMapContestJudgeStore from "../../store/map_stores/mapContestToJudgeStore";
import { Team } from "../../types";

interface IJudgeDashboardProps {
  teams: Team[];
}

export default function JudgeDashboardTable(props: IJudgeDashboardProps) {
  const { teams } = props;

  const navigate = useNavigate();

  const { judge, clearJudge } = useJudgeStore();

  const {
    mappings,
    fetchScoreSheetsByJudge,
    isLoadingMapScoreSheet,
    clearMappings,
  } = useMapScoreSheetStore();

  const { getContestByJudgeId, contest } = useMapContestJudgeStore();

  const { editScoreSheetField, scoreSheetError } = useScoreSheetStore();

  const [openRows, setOpenRows] = React.useState<{ [key: number]: boolean }>(
    {}
  );

  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [currentScoreSheetId, setCurrentScoreSheetId] = useState(-1);
  const [currentTeam, setCurrentTeam] = useState(-1);
  const [currentSheetType, setCurrentSheetType] = useState(-1);

  // NEW: multi-team scoring dialog state
  const [openMultiDialog, setOpenMultiDialog] = useState(false);
  const [multiType, setMultiType] = useState<
    "presentation" | "journal" | "machine-design"
  >("presentation");

  const handleToggle = (teamId: number) => {
    setOpenRows((prevState) => ({
      ...prevState,
      [teamId]: !prevState[teamId],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded = teams.reduce((acc, team) => {
      acc[team.id] = true;
      return acc;
    }, {} as { [key: number]: boolean });
    setOpenRows(allExpanded);
  };

  useEffect(() => {
    if (judge) {
      fetchScoreSheetsByJudge(judge.id);
      getContestByJudgeId(judge.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judge]);

  useEffect(() => {
    const handlePageHide = () => {
      clearMappings();
      clearJudge();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [clearMappings, clearJudge]);

  const getIsSubmitted = (
    judgeId: number,
    teamId: number,
    sheetType: number
  ) => {
    const key = `${teamId}-${judgeId}-${sheetType}`;
    const data = mappings[key] || null;
    return !!data?.scoresheet?.isSubmitted;
  };

  const getTotal = (judgeId: number, teamId: number, sheetType: number) => {
    const key = `${teamId}-${judgeId}-${sheetType}`;
    const data = mappings[key] || null;
    return data?.total;
  };

  const getScoreSheetId = (
    judgeId: number,
    teamId: number,
    sheetType: number
  ) => {
    const key = `${teamId}-${judgeId}-${sheetType}`;
    const data = mappings[key] || null;
    return data?.scoresheet?.id;
  };

  // NEW: open/close multi-team dialog
  const handleMultiTeamScore = () => setOpenMultiDialog(true);
  const handleCancelMulti = () => setOpenMultiDialog(false);

  // NEW: confirm multi-team selection → route
  const handleConfirmMulti = () => {
    if (!judge || !contest?.id) return;

    // keep slugs consistent with your routes
    const typePath = multiType === "machine-design" ? "machinedesign" : multiType;

    navigate(`/multi-team-${typePath}-score/${judge.id}/${contest.id}/`);
    setOpenMultiDialog(false);
  };

  const handleUnsubmitSheet = async () => {
    try {
      await editScoreSheetField(currentScoreSheetId, "isSubmitted", false);
      setOpenAreYouSure(false);

      switch (currentSheetType) {
        case 1:
          navigate(`/presentation-score/${judge?.id}/${currentTeam}`);
          break;
        case 2:
          navigate(`/journal-score/${judge?.id}/${currentTeam}`);
          break;
        case 3:
          navigate(`/machine-score/${judge?.id}/${currentTeam}`);
          break;
        case 4:
          navigate(`/run-penalties/${judge?.id}/${currentTeam}`);
          break;
        case 5:
          navigate(`/general-penalties/${judge?.id}/${currentTeam}`);
          break;
        case 6:
          navigate(`/redesign-score/${judge?.id}/${currentTeam}`);
          break;
        case 7:
          navigate(`/championship-score/${judge?.id}/${currentTeam}`);
          break;
        default:
          break;
      }
    } catch {
      // noop – error is surfaced by scoreSheetError in the modal
    }
  };

  const handleOpenAreYouSure = (
    scoreSheetId: number | undefined,
    teamId: number,
    sheetType: number
  ) => {
    if (scoreSheetId) {
      setCurrentScoreSheetId(scoreSheetId);
      setCurrentTeam(teamId);
      setCurrentSheetType(sheetType);
      setOpenAreYouSure(true);
    }
  };

  function ScoreSheetButton(props: {
    team: Team;
    type: number;
    url: string;
    buttonText: string;
  }) {
    const { team, type, url, buttonText } = props;

    return (
      judge && (
        <>
          {!getIsSubmitted(judge?.id, team.id, type) ? (
            <Button
              variant="contained"
              onClick={() => navigate(`/${url}/${judge.id}/${team.id}/`)}
              sx={{
                mb: 1,
                textTransform: "none",
                borderRadius: 2,
                px: 2.25,
                bgcolor: theme.palette.success.main,
                "&:hover": { bgcolor: theme.palette.success.dark },
              }}
            >
              {buttonText}
            </Button>
          ) : (
            <Button
              variant="contained"
              sx={{
                mb: 1,
                textTransform: "none",
                borderRadius: 2,
                px: 2.25,
                bgcolor: theme.palette.grey[500],
                "&:hover": { bgcolor: theme.palette.grey[600] },
              }}
              onClick={() =>
                handleOpenAreYouSure(
                  getScoreSheetId(judge?.id, team.id, type),
                  team.id,
                  type
                )
              }
            >
              {buttonText} {getTotal(judge?.id, team.id, type)}
            </Button>
          )}
        </>
      )
    );
  }

  return isLoadingMapScoreSheet ? (
    <CircularProgress />
  ) : (
    <>
      <Container
        sx={{
          width: "auto",
          height: "auto",
          p: 3,
          bgcolor: "#ffffffff",
          ml: "2%",
          mr: 1,
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 1px 2px rgba(16,24,40,.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          <Button
            variant="contained"
            onClick={handleExpandAll}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              bgcolor: theme.palette.success.main,
              color: theme.palette.common.white,
              "&:hover": { bgcolor: theme.palette.success.dark },
              width: 220,
              height: 44,
            }}
          >
            Expand All Teams
          </Button>

          {/* NEW: Score Multiple Teams – styled to match your success button theme */}
          <Button
            variant="contained"
            onClick={handleMultiTeamScore}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.5,
              bgcolor: theme.palette.success.main,
              color: theme.palette.common.white,
              "&:hover": { bgcolor: theme.palette.success.dark },
              width: 220,
              height: 44,
            }}
            disabled={!contest?.id} // prevent bad route if contest not loaded
          >
            Score Multiple Teams
          </Button>
        </Box>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: 3,
            border: `1px solid ${theme.palette.grey[300]}`,
            backgroundColor: "#fff",
            overflow: "hidden",
          }}
        >
          <Table
            sx={{
              tableLayout: "fixed",
              "& .MuiTableCell-root": { fontSize: "0.95rem", py: 1.25 },
            }}
          >
            <TableBody>
              {teams.map((team: Team) => (
                <React.Fragment key={team.id}>
                  <TableRow
                    onClick={() => handleToggle(team.id)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "rgba(46,125,50,0.06)" },
                      borderBottom: `1px solid ${theme.palette.grey[200]}`,
                    }}
                  >
                    <TableCell sx={{ width: 56 }}>
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        sx={{
                          color: openRows[team.id]
                            ? theme.palette.success.main
                            : "inherit",
                        }}
                      >
                        {openRows[team.id] ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>

                    <TableCell
                      component="th"
                      scope="row"
                      sx={(t) => ({
                        pl: 2,
                        textAlign: "left",
                        mr: 1,
                        fontWeight: 600,
                        fontFamily: t.typography.h1.fontFamily,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      })}
                    >
                      {team.team_name}
                    </TableCell>

                    {team.judge_disqualified && team.organizer_disqualified && (
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          pl: 2,
                          textAlign: "left",
                          mr: 1,
                          color: theme.palette.error.main,
                          fontWeight: 600,
                        }}
                      >
                        Disqualified
                      </TableCell>
                    )}
                  </TableRow>

                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={openRows[team.id]} timeout="auto" unmountOnExit>
                        <Box
                          sx={{
                            borderTop: `1px dashed ${theme.palette.grey[200]}`,
                            backgroundColor: theme.palette.grey[50],
                            px: 2,
                            py: 2,
                          }}
                        >
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {/* keep original gating: journal not tied to contest.is_open in your current UI */}
                            {judge?.journal && (
                              <ScoreSheetButton
                                team={team}
                                type={2}
                                url="journal-score"
                                buttonText="Journal"
                              />
                            )}

                            {judge?.presentation && contest?.is_open && (
                              <ScoreSheetButton
                                team={team}
                                type={1}
                                url="presentation-score"
                                buttonText="Presentation"
                              />
                            )}

                            {judge?.mdo && contest?.is_open && (
                              <ScoreSheetButton
                                team={team}
                                type={3}
                                url="machine-score"
                                buttonText="Machine Design and Operation"
                              />
                            )}

                            {/* NEW: Redesign & Championship (follow your feature flags & is_open gating) */}
                            {judge?.redesign && contest?.is_open && (
                              <ScoreSheetButton
                                team={team}
                                type={6}
                                url="redesign-score"
                                buttonText="Redesign"
                              />
                            )}

                            {judge?.championship && contest?.is_open && (
                              <ScoreSheetButton
                                team={team}
                                type={7}
                                url="championship-score"
                                buttonText="Championship"
                              />
                            )}

                            {judge?.runpenalties && (
                              <ScoreSheetButton
                                team={team}
                                type={4}
                                url="run-penalties"
                                buttonText="Run Penalties"
                              />
                            )}

                            {judge?.otherpenalties && (
                              <ScoreSheetButton
                                team={team}
                                type={5}
                                url="general-penalties"
                                buttonText="General Penalties"
                              />
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
      </Container>

      {/* existing unsubmit modal */}
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to unsubmit this score sheet?"
        handleSubmit={handleUnsubmitSheet}
        error={scoreSheetError}
      />

      {/* NEW: multi-team dialog (kept simple, matches theme) */}
      <Dialog open={openMultiDialog} onClose={handleCancelMulti}>
        <DialogTitle>Score Multiple Teams</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl component="fieldset" sx={{ mt: 1 }}>
            <FormLabel component="legend">Select sheet type</FormLabel>
            <RadioGroup
              value={multiType}
              onChange={(e) => setMultiType(e.target.value as any)}
            >
              <FormControlLabel value="presentation" control={<Radio />} label="Presentation" />
              <FormControlLabel value="journal" control={<Radio />} label="Journal" />
              <FormControlLabel value="machine-design" control={<Radio />} label="Machine Design" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelMulti} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmMulti}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2.25,
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
            }}
            disabled={!contest?.id}
          >
            Go
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
