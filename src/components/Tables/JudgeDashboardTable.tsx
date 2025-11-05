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
  Alert,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useJudgeStore } from "../../store/primary_stores/judgeStore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useMapScoreSheetStore } from "../../store/map_stores/mapScoreSheetStore";
import AreYouSureModal from "../Modals/AreYouSureModal";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import theme from "../../theme";
import useMapContestJudgeStore from "../../store/map_stores/mapContestToJudgeStore";
import { useAuthStore } from "../../store/primary_stores/authStore";
import { Team, Contest } from "../../types";

interface IJudgeDashboardProps {
  teams: Team[];
  currentCluster?: any;
}

const JudgeDashboardTable = React.memo(function JudgeDashboardTable(props: IJudgeDashboardProps) {
  const { teams, currentCluster } = props;

  const navigate = useNavigate();
  
  // Store hooks
  const { judge, clearJudge } = useJudgeStore();
  const {
    mappings,
    fetchScoreSheetsByJudge,
    clearMappings,
  } = useMapScoreSheetStore();
  const { contest, getContestByJudgeId } = useMapContestJudgeStore();
  const { editScoreSheetField, multipleScoreSheets } = useScoreSheetStore();

  // Function to determine if a scoresheet is from preliminary round (should be greyed out)
  const isPreliminaryScoresheet = (_teamId: number, sheetType: number) => {
    // Check if we're in a championship or redesign cluster
    const isInChampionshipOrRedesignCluster = currentCluster && (
      currentCluster.cluster_type === 'championship' || 
      currentCluster.cluster_type === 'redesign' ||
      // Fallback: check by name for existing clusters (transition period)
      currentCluster.cluster_name?.toLowerCase().includes('championship') ||
      currentCluster.cluster_name?.toLowerCase().includes('redesign')
    );
    
    // Only apply grey styling if we're in a championship/redesign cluster
    if (!isInChampionshipOrRedesignCluster) {
      return false; // No grey styling in preliminary clusters
    }
    
    // In championship/redesign clusters, preliminary scoresheets (1-5) should be greyed out
    const isPreliminary = sheetType <= 5;
    
    return isPreliminary; // Preliminary scoresheets (1-5) should be greyed out for judges in championship/redesign clusters
  };

  // Function to determine if a scoresheet should be editable
  const isScoresheetEditable = (teamId: number, sheetType: number) => {
    // If user is organizer/admin, they can edit all scoresheets
    if (isOrganizerOrAdmin()) {
      return true;
    }
    
    // If user is judge, they can only edit non-preliminary scoresheets
    // But if contest info is not available, allow editing (fallback behavior)
    if (!contest) {
      console.warn('Contest info not available, allowing editing as fallback');
      return true;
    }
    
    return !isPreliminaryScoresheet(teamId, sheetType);
  };

  const getIsSubmitted = useCallback((
    judgeId: number,
    teamId: number,
    sheetType: number
  ) => {
    const key = `${teamId}-${judgeId}-${sheetType}`;
    const data = mappings[key] || null;
    return !!data?.scoresheet?.isSubmitted;
  }, [mappings]);

  // Check if a scoresheet exists for the given judge, team, and sheet type
  const hasScoresheet = useCallback((
    judgeId: number,
    teamId: number,
    sheetType: number
  ) => {
    const key = `${teamId}-${judgeId}-${sheetType}`;
    return !!mappings[key];
  }, [mappings]);

  const checkAllPreliminaryScoresheetsCompleted = (teamId: number) => {
    if (!judge) return false;
    
    
    // Check if all preliminary scoresheets (1-5) are completed
    const preliminaryTypes = [1, 2, 3, 4, 5]; // runpenalties, otherpenalties, presentation, journal, mdo
    let allCompleted = true;
    
    for (const sheetType of preliminaryTypes) {
      if (hasScoresheet(judge.id, teamId, sheetType)) {
        // Check if this scoresheet is completed (has been submitted)
        const scoresheet = multipleScoreSheets?.find(sheet => 
          sheet.teamId === teamId && 
          sheet.judgeId === judge.id && 
          sheet.sheetType === sheetType
        );
        
        if (scoresheet && !scoresheet.isSubmitted) {
          allCompleted = false;
          break;
        }
      }
    }
    
    return allCompleted;
  };

  // Function to determine if a team has only preliminary scoresheets (should grey out header)
  const hasOnlyPreliminaryScoresheets = useCallback((teamId: number) => {
    // Check if we're in a championship or redesign cluster
    const isInChampionshipOrRedesignCluster = currentCluster && (
      currentCluster.cluster_type === 'championship' || 
      currentCluster.cluster_type === 'redesign' ||
      // Fallback: check by name for existing clusters (transition period)
      currentCluster.cluster_name?.toLowerCase().includes('championship') ||
      currentCluster.cluster_name?.toLowerCase().includes('redesign')
    );
    
    // Only apply grey styling if we're in a championship/redesign cluster
    if (!isInChampionshipOrRedesignCluster) {
      return false; // No grey styling in preliminary clusters
    }
    
    // After advancement, check if this team is in a championship/redesign cluster
    const teamInChampionshipCluster = teams.some(team => 
      team.id === teamId && team.advanced_to_championship === true
    );
    
    if (teamInChampionshipCluster) {
      // Check if team has any championship (7) or redesign (6) scoresheets
      const hasChampionshipScoresheets = judge && (
        hasScoresheet(judge.id, teamId, 6) || // redesign
        hasScoresheet(judge.id, teamId, 7)    // championship
      );
      
      // If team has championship scoresheets, check if any non-preliminary scoresheets are not completed
      if (hasChampionshipScoresheets) {
        // Check if any championship/redesign scoresheets are not completed
        const hasIncompleteChampionshipScoresheets = judge && (
          (hasScoresheet(judge.id, teamId, 6) && !getIsSubmitted(judge.id, teamId, 6)) || // redesign not submitted
          (hasScoresheet(judge.id, teamId, 7) && !getIsSubmitted(judge.id, teamId, 7))    // championship not submitted
        );
        
        // Return false (white header) if there are incomplete championship scoresheets
        return !hasIncompleteChampionshipScoresheets;
      } else {
        // No championship scoresheets yet, check if all preliminary are completed
        const allPreliminaryCompleted = checkAllPreliminaryScoresheetsCompleted(teamId);
        return allPreliminaryCompleted; // Grey if all preliminary are completed
      }
    }
    
    return false; // Default: no grey styling
  }, [currentCluster, teams, judge, hasScoresheet, getIsSubmitted]);


  // Function to check if current user is organizer/admin (can edit preliminary scoresheets)
  const isOrganizerOrAdmin = () => {
    // Import auth store to check user role
    const { role } = useAuthStore();
    
    // Check if user is admin (user_type: 1) or organizer (user_type: 2)
    return role?.user_type === 1 || role?.user_type === 2;
  };

  const [teamContestMap, setTeamContestMap] = React.useState<{[teamId: number]: Contest | null}>({});
  

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
    if (judge && judge.id) {
      try {
        fetchScoreSheetsByJudge(judge.id);
        getContestByJudgeId(judge.id, true).catch(error => {
          console.warn('Contest info not available for judge:', error);
        });
      } catch (error) {
        console.error('Error fetching judge data:', error);
      }
    }
  }, [judge]);

  useEffect(() => {
    if (judge && judge.id && teams && teams.length > 0) {
      try {
        fetchScoreSheetsByJudge(judge.id);
      } catch (error) {
        console.error('Error refreshing scoresheets:', error);
      }
    }

  }, [teams]);

  const fetchContestForTeams = useCallback(async (teamsToFetch: Team[]) => {
    const contestMap: {[teamId: number]: Contest | null} = {};
    const teamsToFetchInfo = teamsToFetch.filter(team => !teamContestMap[team.id]);
    
    if (teamsToFetchInfo.length === 0) return;
    
    for (const team of teamsToFetchInfo) {
      try {
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
            contestMap[team.id] = data.Contest;
          }
        } else {
          console.error(`Failed to fetch contest for team ${team.id}:`, response.status);
          contestMap[team.id] = null;
        }
      } catch (error) {
        console.error(`Error fetching contest for team ${team.id}:`, error);
        contestMap[team.id] = null;
      }
    }
    
    if (Object.keys(contestMap).length > 0) {
      setTeamContestMap(prev => ({ ...prev, ...contestMap }));
    }
  }, [teamContestMap]);

  useEffect(() => {
    if (teams && teams.length > 0) {
      fetchContestForTeams(teams);
    }
  }, [teams, fetchContestForTeams]);

  useEffect(() => {
    const handlePageHide = () => {
      clearMappings();
      clearJudge();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [clearMappings, clearJudge]);


  const getTotal = useCallback((judgeId: number, teamId: number, sheetType: number) => {
    const key = `${teamId}-${judgeId}-${sheetType}`;
    const data = mappings[key] || null;
    return data?.total;
  }, [mappings]);

  const getScoreSheetId = useCallback((
    judgeId: number,
    teamId: number,
    sheetType: number
  ) => {
    const key = `${teamId}-${judgeId}-${sheetType}`;
    const data = mappings[key] || null;
    return data?.scoresheet?.id;
  }, [mappings]);

  // open/close multi-team dialog
  const handleMultiTeamScore = () => {
    // Handle multi-team scoring
    setOpenMultiDialog(true);
  };
  const handleCancelMulti = () => setOpenMultiDialog(false);

  // confirm multi-team selection → route
  const handleConfirmMulti = () => {
    if (!judge || !contest?.id) return;

    
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

    // Check if this is a preliminary scoresheet (should be greyed out)
    const isPreliminary = isPreliminaryScoresheet(team.id, type);
    const isEditable = isScoresheetEditable(team.id, type);

    return (
      <>
        {!getIsSubmitted(judge?.id, team.id, type) ? (
          <Button
            variant="contained"
            onClick={() => isEditable ? navigate(`/${url}/${judge.id}/${team.id}/`) : null}
            disabled={!isEditable}
            sx={{
              mb: { xs: 0.5, sm: 1 },
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 0.75, sm: 2.25 },
              py: { xs: 0.4, sm: 0.75 },
              bgcolor: isPreliminary ? theme.palette.grey[400] : theme.palette.success.main,
              color: isPreliminary ? theme.palette.grey[600] : "white",
              "&:hover": { 
                bgcolor: isPreliminary ? theme.palette.grey[400] : theme.palette.success.dark 
              },
              "&:disabled": {
                bgcolor: theme.palette.grey[400],
                color: theme.palette.grey[600],
              },
              fontSize: { xs: "0.65rem", sm: "0.875rem" },
              fontWeight: 600,
              minWidth: { xs: "100px", sm: "auto" },
              maxWidth: { xs: "150px", sm: "none" },
              width: { xs: "100%", sm: "auto" },
              opacity: isPreliminary ? 0.6 : 1,
            }}
          >
            {isPreliminary ? `${buttonText} (Preliminary)` : buttonText}
          </Button>
        ) : (
          <Button
            variant="contained"
            sx={{
              mb: { xs: 0.5, sm: 1 },
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 0.75, sm: 2.25 },
              py: { xs: 0.4, sm: 0.75 },
              bgcolor: isPreliminary ? theme.palette.grey[400] : theme.palette.grey[500],
              color: isPreliminary ? theme.palette.grey[600] : "white",
              "&:hover": { 
                bgcolor: isPreliminary ? theme.palette.grey[400] : theme.palette.grey[600] 
              },
              fontSize: { xs: "0.65rem", sm: "0.875rem" },
              fontWeight: 600,
              minWidth: { xs: "100px", sm: "auto" },
              maxWidth: { xs: "150px", sm: "none" },
              width: { xs: "100%", sm: "auto" },
              opacity: isPreliminary ? 0.6 : 1,
            }}
            onClick={() =>
              handleOpenAreYouSure(
                getScoreSheetId(judge?.id, team.id, type),
                team.id,
                type
              )
            }
          >
            {isPreliminary ? `${buttonText} (Preliminary)` : buttonText} {getTotal(judge?.id, team.id, type)}
          </Button>
        )}
      </>
    );
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

          {/*  Score Multiple Teams */}
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
            disabled={!contest?.id} 
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
              {teams.map((team: Team) => {
                const isPreliminaryTeam = hasOnlyPreliminaryScoresheets(team.id);
                return (
                <React.Fragment key={team.id}>
                  <TableRow
                    onClick={() => handleToggle(team.id)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: isPreliminaryTeam ? "rgba(0,0,0,0.01)" : "rgba(46,125,50,0.06)" },
                      borderBottom: `1px solid ${theme.palette.grey[200]}`,
                      backgroundColor: isPreliminaryTeam ? theme.palette.grey[100] : "inherit",
                      opacity: isPreliminaryTeam ? 0.7 : 1,
                      "& .MuiTableCell-root": {
                        color: isPreliminaryTeam ? theme.palette.grey[600] : "inherit"
                      }
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
                        width: { xs: "60%", sm: "50%", md: "45%" }, 
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
                              title={teamContestMap[team.id]?.name} // Show full name on hover
                            >
                              {teamContestMap[team.id]?.name}
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
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: { xs: "center", sm: "flex-start" },
                            alignItems: { xs: "center", sm: "flex-start" }
                          }}>
                            {(() => {
                              const teamContest = teamContestMap[team.id];

                              if (!teamContest) {
                                return (
                                  <Box sx={{ width: "100%", mb: 1 }}>
                                    <Alert severity="info">Loading contest information...</Alert>
                                  </Box>
                                );
                              }

                              if (teamContest.is_open !== true) {
                                return (
                                  <Box sx={{ width: "100%", mb: 1 }}>
                                    <Alert severity="info">Contest has not started yet.</Alert>
                                  </Box>
                                );
                              }

                              return (
                                <>
                                  <ScoreSheetButton
                                    team={team}
                                    type={2}
                                    url="journal-score"
                                    buttonText="Journal"
                                  />
                                  <ScoreSheetButton
                                    team={team}
                                    type={1}
                                    url="presentation-score"
                                    buttonText="Presentation"
                                  />
                                  <ScoreSheetButton
                                    team={team}
                                    type={3}
                                    url="machine-score"
                                    buttonText="Machine Design and Operation"
                                  />
                                  <ScoreSheetButton
                                    team={team}
                                    type={6}
                                    url="redesign-score"
                                    buttonText="Redesign"
                                  />
                                  <ScoreSheetButton
                                    team={team}
                                    type={7}
                                    url="championship-score"
                                    buttonText="Championship"
                                  />
                                  <ScoreSheetButton
                                    team={team}
                                    type={4}
                                    url="run-penalties"
                                    buttonText="Run Penalties"
                                  />
                                  <ScoreSheetButton
                                    team={team}
                                    type={5}
                                    url="general-penalties"
                                    buttonText="General Penalties"
                                  />
                                </>
                              );
                            })()}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
                );
              })}
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

      {/*  multi-team dialog  */}
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
});

export default JudgeDashboardTable