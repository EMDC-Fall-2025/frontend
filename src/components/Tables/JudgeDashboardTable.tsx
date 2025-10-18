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
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
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
  
  // State to store contest names for each team
  const [teamContestMap, setTeamContestMap] = React.useState<{[teamId: number]: string}>({});

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

  // Fetch contest information for each team
  useEffect(() => {
    if (teams && teams.length > 0) {
      const fetchContestForTeams = async () => {
        const contestMap: {[teamId: number]: string} = {};
        
        for (const team of teams) {
          try {
            // Get contest for this team
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/mapping/contestToTeam/getContestByTeam/${team.id}/`, {
              headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.Contest) {
                contestMap[team.id] = data.Contest.name;
              }
            } else {
              console.error(`Failed to fetch contest for team ${team.id}:`, response.status);
            }
          } catch (error) {
            console.error(`Error fetching contest for team ${team.id}:`, error);
          }
        }
        
        setTeamContestMap(contestMap);
      };
      
      fetchContestForTeams();
    }
  }, [teams]);

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

  // Check if a scoresheet exists for the given judge, team, and sheet type
  const hasScoresheet = (
    judgeId: number,
    teamId: number,
    sheetType: number
  ) => {
    const key = `${teamId}-${judgeId}-${sheetType}`;
    return !!mappings[key];
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
  const handleMultiTeamScore = () => {
    // Handle multi-team scoring
    setOpenMultiDialog(true);
  };
  const handleCancelMulti = () => setOpenMultiDialog(false);

  // NEW: confirm multi-team selection → route
  const handleConfirmMulti = () => {
    if (!judge || !contest?.id) return;

    // keep slugs consistent with your routes
    const typePath = multiType === "machine-design" ? "machinedesign" : multiType;
    const route = `/multi-team-${typePath}-score/${judge.id}/${contest.id}/`;
    
    // Navigate to scoring page
    navigate(route);
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
      // Handle error silently
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

    // Only render if scoresheet exists for this judge, team, and type
    if (!judge || !hasScoresheet(judge.id, team.id, type)) {
      return null;
    }

    return (
      <>
        {!getIsSubmitted(judge?.id, team.id, type) ? (
          <Button
            variant="contained"
            onClick={() => navigate(`/${url}/${judge.id}/${team.id}/`)}
            sx={{
              mb: { xs: 0.5, sm: 1 },
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 1.5, sm: 2.25 },
              py: { xs: 0.5, sm: 0.75 },
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              fontWeight: 600,
              minWidth: { xs: "auto", sm: "auto" },
            }}
          >
            {buttonText}
          </Button>
        ) : (
          <Button
            variant="contained"
            sx={{
              mb: { xs: 0.5, sm: 1 },
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 1.5, sm: 2.25 },
              py: { xs: 0.5, sm: 0.75 },
              bgcolor: theme.palette.grey[500],
              "&:hover": { bgcolor: theme.palette.grey[600] },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              fontWeight: 600,
              minWidth: { xs: "auto", sm: "auto" },
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
    );
  }

  if (isLoadingMapScoreSheet) {
    return <CircularProgress />;
  }

  return (
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
        <Box sx={{ 
          display: "flex", 
          gap: { xs: 1, sm: 1.5 }, 
          flexWrap: "wrap", 
          mb: { xs: 1.5, sm: 2 },
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" }
        }}>
          <Button
            variant="contained"
            onClick={handleExpandAll}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1, sm: 1.25 },
              bgcolor: theme.palette.success.main,
              color: theme.palette.common.white,
              "&:hover": { bgcolor: theme.palette.success.dark },
              width: { xs: "100%", sm: 220 },
              height: { xs: 40, sm: 44 },
              fontSize: { xs: "0.9rem", sm: "1rem" },
              fontWeight: 600,
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
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1, sm: 1.25 },
              bgcolor: theme.palette.success.main,
              color: theme.palette.common.white,
              "&:hover": { bgcolor: theme.palette.success.dark },
              width: { xs: "100%", sm: 220 },
              height: { xs: 40, sm: 44 },
              fontSize: { xs: "0.9rem", sm: "1rem" },
              fontWeight: 600,
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
              tableLayout: "auto",
              width: "100%",
              "& .MuiTableCell-root": { 
                fontSize: { xs: "0.8rem", sm: "0.95rem" }, 
                py: { xs: 0.75, sm: 1.25 },
                px: { xs: 0.75, sm: 1.5 }
              },
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
                        pl: { xs: 1, sm: 2 },
                        textAlign: "left",
                        mr: 1,
                        fontWeight: 600,
                        fontFamily: t.typography.h1.fontFamily,
                        width: { xs: "60%", sm: "50%", md: "45%" }, // Use more of the available width
                        minWidth: { xs: 200, sm: 250, md: 300 },
                        verticalAlign: "top",
                        alignItems: "flex-start"
                      })}
                    >
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: { xs: 0.5, sm: 1 },
                        flexWrap: { xs: "wrap", sm: "nowrap" },
                        width: "100%",
                        justifyContent: { xs: "flex-start", sm: "flex-start" }
                      }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: "0.85rem", sm: "1rem" },
                            flex: { xs: "1 1 100%", sm: "0 0 auto" },
                            minWidth: 0,
                            textAlign: "left"
                          }}
                        >
                          {team.team_name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.grey[600], 
                            ml: { xs: 0.5, sm: 1 },
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            flex: { xs: "1 1 100%", sm: "0 0 auto" },
                            minWidth: 0,
                            textAlign: "left"
                          }}
                        >
                          ({team.school_name || 'N/A'})
                        </Typography>
                        {teamContestMap[team.id] && (
                          <Box sx={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: { xs: 0.25, sm: 0.5 }, 
                            ml: { xs: 0.5, sm: 1 }, 
                            flexShrink: 0,
                            minWidth: 0,
                            flex: { xs: "1 1 100%", sm: "0 0 auto" }
                          }}>
                            <EmojiEventsIcon 
                              sx={{ 
                                fontSize: { xs: 14, sm: 16 }, 
                                color: theme.palette.success.main,
                                opacity: 0.8 
                              }} 
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.success.main,
                                fontWeight: 500,
                                opacity: 0.8,
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                whiteSpace: "nowrap",
                                maxWidth: { xs: "200px", sm: "300px", md: "400px" },
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                flex: 1,
                                textAlign: "left"
                              }}
                              title={teamContestMap[team.id]} // Show full name on hover
                            >
                              {teamContestMap[team.id]}
                            </Typography>
                          </Box>
                        )}
                      </Box>
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
                            px: { xs: 1.5, sm: 2 },
                            py: { xs: 1.5, sm: 2 },
                          }}
                        >
                          <Box sx={{ 
                            display: "flex", 
                            flexWrap: "wrap", 
                            gap: { xs: 0.5, sm: 1 },
                            flexDirection: { xs: "column", sm: "row" }
                          }}>
                            {/* Journal - not tied to contest.is_open */}
                            <ScoreSheetButton
                              team={team}
                              type={2}
                              url="journal-score"
                              buttonText="Journal"
                            />

                            {/* Presentation */}
                            <ScoreSheetButton
                              team={team}
                              type={1}
                              url="presentation-score"
                              buttonText="Presentation"
                            />

                            {/* Machine Design */}
                            <ScoreSheetButton
                              team={team}
                              type={3}
                              url="machine-score"
                              buttonText="Machine Design and Operation"
                            />

                            {/* Redesign - tied to contest.is_open */}
                            {contest?.is_open && (
                              <ScoreSheetButton
                                team={team}
                                type={6}
                                url="redesign-score"
                                buttonText="Redesign"
                              />
                            )}

                            {/* Championship - tied to contest.is_open */}
                            {contest?.is_open && (
                              <ScoreSheetButton
                                team={team}
                                type={7}
                                url="championship-score"
                                buttonText="Championship"
                              />
                            )}

                            {/* Run Penalties - not tied to contest.is_open */}
                            <ScoreSheetButton
                              team={team}
                              type={4}
                              url="run-penalties"
                              buttonText="Run Penalties"
                            />

                            {/* General Penalties - not tied to contest.is_open */}
                            <ScoreSheetButton
                              team={team}
                              type={5}
                              url="general-penalties"
                              buttonText="General Penalties"
                            />
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
      />

      {/* NEW: multi-team dialog (kept simple, matches theme) */}
      <Dialog open={openMultiDialog} onClose={handleCancelMulti}>
        <DialogTitle>Score Multiple Teams</DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <FormControl component="fieldset" sx={{ mt: { xs: 0.5, sm: 1 } }}>
            <FormLabel 
              component="legend" 
              sx={{ 
                fontSize: { xs: "1rem", sm: "1.25rem" },
                fontWeight: 600,
                mb: { xs: 1, sm: 1.5 }
              }}
            >
              Select sheet type
            </FormLabel>
            <RadioGroup
              value={multiType}
              onChange={(e) => setMultiType(e.target.value as any)}
              sx={{ gap: { xs: 0.5, sm: 1 } }}
            >
              <FormControlLabel 
                value="presentation" 
                control={<Radio />} 
                label="Presentation" 
                sx={{ 
                  "& .MuiFormControlLabel-label": { 
                    fontSize: { xs: "0.9rem", sm: "1rem" } 
                  } 
                }}
              />
              <FormControlLabel 
                value="journal" 
                control={<Radio />} 
                label="Journal" 
                sx={{ 
                  "& .MuiFormControlLabel-label": { 
                    fontSize: { xs: "0.9rem", sm: "1rem" } 
                  } 
                }}
              />
              <FormControlLabel 
                value="machine-design" 
                control={<Radio />} 
                label="Machine Design" 
                sx={{ 
                  "& .MuiFormControlLabel-label": { 
                    fontSize: { xs: "0.9rem", sm: "1rem" } 
                  } 
                }}
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 1.5, sm: 2 },
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 1.5 }
        }}>
          <Button 
            onClick={handleCancelMulti} 
            sx={{ 
              textTransform: "none",
              fontSize: { xs: "0.9rem", sm: "1rem" },
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.25 }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmMulti}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 2, sm: 2.25 },
              py: { xs: 1, sm: 1.25 },
              bgcolor: theme.palette.success.main,
              "&:hover": { bgcolor: theme.palette.success.dark },
              fontSize: { xs: "0.9rem", sm: "1rem" },
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