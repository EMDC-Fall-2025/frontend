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
import { useMapContestToTeamStore } from "../../store/map_stores/mapContestToTeamStore";
import { useAuthStore } from "../../store/primary_stores/authStore";
import { Team, Contest } from "../../types";
import { api } from "../../lib/api";

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
  const { contestsForTeams, fetchContestsByTeams } = useMapContestToTeamStore();

  // Function to determine if a scoresheet is from preliminary round (should be greyed out)
  const isPreliminaryScoresheet = (_teamId: number, sheetType: number) => {
    // Check if we're in a championship or redesign cluster
    const isInChampionshipOrRedesignCluster = currentCluster && (
      currentCluster.cluster_type === 'championship' || 
      currentCluster.cluster_type === 'redesign' ||
      // Fallback: check by name for existing clusters 
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

  // Use store's cached contest data instead of local state for persistence
  // teamContestMap is now derived from the store
  

  const [openRows, setOpenRows] = React.useState<{ [key: number]: boolean }>(
    {}
  );

  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [currentScoreSheetId, setCurrentScoreSheetId] = useState(-1);
  const [currentTeam, setCurrentTeam] = useState(-1);
  const [currentSheetType, setCurrentSheetType] = useState(-1);

  // multi-team scoring dialog state
  const [openContestDialog, setOpenContestDialog] = useState(false);
  const [openSheetTypeDialog, setOpenSheetTypeDialog] = useState(false);
  const [multiType, setMultiType] = useState<
    "presentation" | "journal" | "machine-design" | "general-penalties" | "run-penalties"
  >("presentation");
  const [allContests, setAllContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);

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
        // Fetch all scoresheets for this judge across all contests
        fetchScoreSheetsByJudge(judge.id);
        // Note: getContestByJudgeId only returns one contest, but teams come from all contests
        // This is only used for the "Score Multiple Teams" button enable/disable check
        // Teams are fetched from all clusters/contests in the parent component (Judging.tsx)
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
        // Refresh scoresheets when teams change to ensure we have scoresheets for all teams
        // This fetches ALL scoresheets for the judge across ALL contests
        fetchScoreSheetsByJudge(judge.id);
      } catch (error) {
        console.error('Error refreshing scoresheets:', error);
      }
    }

  }, [teams, judge]);

  // This uses cached data if available, otherwise fetches all at once
  const fetchContestForTeams = useCallback(async (teamsToFetch: Team[]) => {
    // Get current contestsForTeams from store to check cache
    const currentContestsForTeams = useMapContestToTeamStore.getState().contestsForTeams;
    // Check which teams don't have cached contest data
    const teamsToFetchInfo = teamsToFetch.filter(team => !currentContestsForTeams[team.id]);
    
    if (teamsToFetchInfo.length === 0) return; // All contests already cached
    
    // Fetch all contests in parallel (one API call instead of N calls)
    try {
      await fetchContestsByTeams(teamsToFetchInfo);
    } catch (error) {
      console.error('Error fetching contests for teams:', error);
    }
  }, [fetchContestsByTeams]);

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
  const handleMultiTeamScore = async () => {
    // Fetch all contests for this judge when opening dialog
    if (judge?.id) {
      try {
        const response = await api.get(`/api/mapping/contestToJudge/judge-contests/${judge.id}/`);
        const contests = response.data?.contests || [];
        setAllContests(contests);
      } catch (error) {
        console.error('Error fetching contests for judge:', error);
        setAllContests([]);
      }
    }
    setOpenContestDialog(true);
  };
  
  const handleCancelContestDialog = () => {
    setOpenContestDialog(false);
    setSelectedContest(null);
  };
  
  const handleSelectContest = (contest: Contest) => {
    if (!hasContestStarted(contest)) return; // Only allow selection of started contests
    setSelectedContest(contest);
    setOpenContestDialog(false);
    setOpenSheetTypeDialog(true);
  };
  
  const handleCancelSheetTypeDialog = () => {
    setOpenSheetTypeDialog(false);
    setSelectedContest(null);
  };

  // confirm multi-team selection → route
  const handleConfirmSheetType = () => {
    if (!judge || !selectedContest?.id) return;

    //Handle routing based on selection
    let route = "";
    switch (multiType) {
      case "presentation":
        route = `/multi-team-presentation-score/${judge.id}/${selectedContest.id}/`;
        break;
      case "journal":
        route = `/multi-team-journal-score/${judge.id}/${selectedContest.id}/`;
        break;
      case "machine-design":
        route = `/multi-team-machinedesign-score/${judge.id}/${selectedContest.id}/`;
        break;
      case "general-penalties":
        route = `/multi-team-general-penalties/${judge.id}/${selectedContest.id}/`;
        break;
      case "run-penalties":
        route = `/multi-team-run-penalties/${judge.id}/${selectedContest.id}/`;
        break;
      default:
        return; 
    }
    
    // Navigate to scoring page
    navigate(route);
    setOpenSheetTypeDialog(false);
    setSelectedContest(null);
  };

  // Check if contest has started (is open)
  const hasContestStarted = (contest: Contest): boolean => {
    return contest.is_open === true;
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
    // Note: Teams are displayed regardless of whether they have scoresheets
    // This component only renders the button if a scoresheet exists
    if (!judge || !hasScoresheet(judge.id, team.id, type)) {
      return null;
    }

    // Check if this is a preliminary scoresheet (should be greyed out)
    const isPreliminary = isPreliminaryScoresheet(team.id, type);
    const isEditable = isScoresheetEditable(team.id, type);
    const isSubmitted = getIsSubmitted(judge?.id, team.id, type);


    return (
      <>
        {!isSubmitted ? (
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
            {isPreliminary ? `${buttonText} (Preliminary)` : buttonText} {getTotal(judge?.id, team.id, type)}

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
            // Disable button if no contest is available OR if we have teams but no open contests
            // Note: contest here is only one contest, but judge may be in multiple contests
            // The button will work for any contest the judge is in (handled in handleMultiTeamScore)
            disabled={!contest?.id || (!contest?.is_open && teams.length > 0)} 
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
                        {contestsForTeams[team.id] && (
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
                              title={contestsForTeams[team.id]?.name} // Show full name on hover
                            >
                              {contestsForTeams[team.id]?.name}
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
                              const teamContest = contestsForTeams[team.id];

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

      {/* Contest Selection Dialog */}
      <Dialog open={openContestDialog} onClose={handleCancelContestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Select Contest</DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          {allContests.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {allContests.map((contest) => {
                const hasStarted = hasContestStarted(contest);
                return (
                  <Button
                    key={contest.id}
                    variant={hasStarted ? "outlined" : "outlined"}
                    onClick={() => handleSelectContest(contest)}
                    disabled={!hasStarted}
                    sx={{
                      bgcolor: hasStarted ? 'transparent' : 'transparent',
                      color: hasStarted 
                        ? theme.palette.success.main 
                        : theme.palette.grey[500],
                      borderColor: hasStarted 
                        ? theme.palette.success.main 
                        : theme.palette.grey[400],
                      '&:hover': {
                        bgcolor: hasStarted 
                          ? theme.palette.success.light
                          : 'transparent',
                        color: hasStarted ? 'white' : theme.palette.grey[500],
                      },
                      '&:disabled': {
                        borderColor: theme.palette.grey[400],
                        color: theme.palette.grey[500],
                      },
                      textTransform: 'none',
                      borderRadius: 2,
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                    }}
                  >
                    {contest.name || `Contest ${contest.id}`}
                    {!hasStarted && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          ml: 1, 
                          fontSize: "0.75rem",
                          opacity: 0.7
                        }}
                      >
                        (Not Started)
                      </Typography>
                    )}
                  </Button>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No contests available for this judge.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 1.5, sm: 2 },
        }}>
          <Button 
            onClick={handleCancelContestDialog} 
            sx={{ 
              textTransform: "none",
              fontSize: { xs: "0.9rem", sm: "1rem" },
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.25 }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sheet Type Selection Dialog */}
      <Dialog open={openSheetTypeDialog} onClose={handleCancelSheetTypeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Select Sheet Type</DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <FormControl component="fieldset" sx={{ mt: { xs: 0.5, sm: 1 }, width: "100%" }}>
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
              <FormControlLabel 
                value="general-penalties"
                control={<Radio />} 
                label="General Penalties" 
                sx={{ 
                  "& .MuiFormControlLabel-label": { 
                    fontSize: { xs: "0.9rem", sm: "1rem" } 
                  } 
                }}
              />
              <FormControlLabel 
                value="run-penalties" 
                control={<Radio />} 
                label="Run Penalties" 
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
            onClick={handleCancelSheetTypeDialog} 
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
            onClick={handleConfirmSheetType}
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
          >
            Go
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default JudgeDashboardTable