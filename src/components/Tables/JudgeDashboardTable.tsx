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
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Alert,
  Skeleton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useJudgeStore } from "../../store/primary_stores/judgeStore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useMapScoreSheetStore } from "../../store/map_stores/mapScoreSheetStore";
import AreYouSureModal from "../Modals/AreYouSureModal";
import { useScoreSheetStore } from "../../store/primary_stores/scoreSheetStore";
import theme from "../../theme";
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
  const { judge } = useJudgeStore();
  const { mappings, fetchScoreSheetsByJudge } = useMapScoreSheetStore();
  const { contestsForTeams } = useMapContestToTeamStore();
  const { editScoreSheetField, multipleScoreSheets } = useScoreSheetStore();
  const { role } = useAuthStore();

  // Role helpers
  const isOrganizerOrAdmin = role?.user_type === 1 || role?.user_type === 2;
  const isJudge = role?.user_type === 3;

  // Judge is expected to be provided by the store (set in parent Judging.tsx).

  const isPreliminarySheet = (sheetType: number) => sheetType >= 1 && sheetType <= 5;

  const hasTeamAdvancedToChampionship = (team: Team | undefined) =>
    team?.advanced_to_championship === true;

  const isPreliminaryScoresheet = (team: Team, sheetType: number) => {
  return (
    isJudge &&
    isPreliminarySheet(sheetType) &&
    hasTeamAdvancedToChampionship(team)
  );
};

const isScoresheetEditable = (team: Team, sheetType: number) => {
    // Admin / organizer → full access
    if (isOrganizerOrAdmin) {
      return true;
    }

    // Judges: lock preliminary sheets once the team has advanced to championship
    if (isJudge && isPreliminarySheet(sheetType) && hasTeamAdvancedToChampionship(team)) {
      return false;
    }

    // Otherwise editable
    return true;
  };

  // Hide teams whose contest has ended (closed & tabulated) for all roles on the judge dashboard.
  const visibleTeams: Team[] = useMemo(() => {
    if (!teams || teams.length === 0) return [];

    return teams.filter((team) => {
      const contestForTeam = contestsForTeams[team.id] as Contest | undefined;

      // If we don't yet know the contest for this team, keep it visible
      if (!contestForTeam) return true;

      // Hide teams for contests that have ended (closed & tabulated)
      if (contestForTeam.is_open === false && contestForTeam.is_tabulated === true) {
        return false;
      }

      return true;
    });
  }, [teams, contestsForTeams, isOrganizerOrAdmin]);

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

  const hasOnlyPreliminaryScoresheets = useCallback((teamId: number) => {
    const isInChampionshipOrRedesignCluster = currentCluster && (
      currentCluster.cluster_type === 'championship' ||
      currentCluster.cluster_type === 'redesign' ||
      currentCluster.cluster_name?.toLowerCase().includes('championship') ||
      currentCluster.cluster_name?.toLowerCase().includes('redesign')
    );
    
    // Only apply grey styling if we're in a championship/redesign cluster
    if (!isInChampionshipOrRedesignCluster) {
      return false; // No grey styling in preliminary clusters
    }

    const teamInChampionshipCluster = teams.some(team =>
      team.id === teamId && team.advanced_to_championship === true
    );

    if (teamInChampionshipCluster) {
      const hasChampionshipScoresheets = judge && (
        hasScoresheet(judge.id, teamId, 6) ||
        hasScoresheet(judge.id, teamId, 7)
      );

      if (hasChampionshipScoresheets) {
        const hasIncompleteChampionshipScoresheets = judge && (
          (hasScoresheet(judge.id, teamId, 6) && !getIsSubmitted(judge.id, teamId, 6)) ||
          (hasScoresheet(judge.id, teamId, 7) && !getIsSubmitted(judge.id, teamId, 7))
        );

        return !hasIncompleteChampionshipScoresheets;
      } else {
        // No championship scoresheets yet, check if all preliminary are completed
        const allPreliminaryCompleted = checkAllPreliminaryScoresheetsCompleted(teamId);
        return allPreliminaryCompleted; // Grey if all preliminary are completed
      }
    }
    
    return false; // Default: no grey styling
  }, [currentCluster, teams, judge, hasScoresheet, getIsSubmitted]);

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

  const handleConfirmSheetType = () => {
    if (!judge || !selectedContest?.id) return;

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
    
    navigate(route);
    setOpenSheetTypeDialog(false);
    setSelectedContest(null);
  };

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

    if (type === 7) {
      const inChampionshipCluster =
        currentCluster &&
        (currentCluster.cluster_type === 'championship' ||
          currentCluster.cluster_name?.toLowerCase().includes('championship'));
      if (team.advanced_to_championship !== true && !inChampionshipCluster) {
      return null;
      }
    }

    if (!judge || !hasScoresheet(judge.id, team.id, type)) {
      return null;
    }

    const isPreliminary = isPreliminaryScoresheet(team, type);
    const isEditable = isScoresheetEditable(team, type);
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
            disabled={!isEditable}
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
              "&:disabled": {
                bgcolor: theme.palette.grey[400],
                color: theme.palette.grey[600],
                cursor: "not-allowed",
              },
              fontSize: { xs: "0.65rem", sm: "0.875rem" },
              fontWeight: 600,
              minWidth: { xs: "100px", sm: "auto" },
              maxWidth: { xs: "150px", sm: "none" },
              width: { xs: "100%", sm: "auto" },
              opacity: isPreliminary ? 0.6 : 1,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isEditable) return;
              handleOpenAreYouSure(
                getScoreSheetId(judge?.id, team.id, type),
                team.id,
                type
              );
            }}
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
            disabled={!judge?.id}
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
              {visibleTeams.map((team: Team) => {
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
                        {contestsForTeams[team.id] ? (
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
                                title={contestsForTeams[team.id]?.name}
                            >
                              {contestsForTeams[team.id]?.name}
                            </Typography>
                            </Box>
                        ) : (
                          <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: 0.5, sm: 1 },
                            ml: { xs: 0.5, sm: 1 },
                            flexShrink: 0,
                            minWidth: 0,
                            flex: { xs: "1 1 100%", sm: "0 0 auto" },
                          }}>
                            <Skeleton variant="text" width={120} height={16} sx={{ my: 0.5 }} />
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
                                     <Alert severity="info">No contest information available.</Alert>
                                   </Box>
                                 );
                               }

                               if (!hasContestStarted(teamContest)) {
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
      <Dialog
        open={openContestDialog}
        onClose={handleCancelContestDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          textAlign: "center",
          "& .MuiDialog-paper": {
            borderRadius: { xs: "16px", sm: "24px" },
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.12),
              0 4px 16px rgba(76, 175, 80, 0.08),
              0 0 0 1px rgba(76, 175, 80, 0.05)
            `,
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
          }
        }}
        TransitionProps={{
          timeout: 300,
        }}
      >
        <Box
          sx={{
            position: "relative",
            padding: { xs: "20px 16px", sm: "24px 20px" },
            background: "linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(76, 175, 80, 0.01) 100%)",
            borderBottom: "1px solid rgba(76, 175, 80, 0.1)",
          }}
        >
          <IconButton
            aria-label="close"
            onClick={handleCancelContestDialog}
            sx={{
              position: "absolute",
              right: { xs: "8px", sm: "12px" },
              top: { xs: "8px", sm: "12px" },
              color: theme.palette.grey[600],
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
              transition: "all 0.2s ease",
              "&:hover": {
                color: theme.palette.success.main,
                transform: "rotate(90deg)",
                backgroundColor: "rgba(76, 175, 80, 0.08)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            sx={{
              fontFamily: '"DM Serif Display", "Georgia", serif',
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              fontWeight: 400,
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              color: theme.palette.success.dark,
              textShadow: "0 2px 8px rgba(76, 175, 80, 0.2)",
              textAlign: "center",
              padding: { xs: "0 40px", sm: "0 48px" },
            }}
          >
            Select Contest
          </Typography>
        </Box>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: { xs: "20px 16px", sm: "28px 24px" },
            "&.MuiDialogContent-root": {
              paddingTop: { xs: "16px", sm: "20px" },
            }
          }}
        >
          {allContests.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, width: '100%', maxWidth: '400px' }}>
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
        <DialogActions
          sx={{
            padding: { xs: "16px 20px", sm: "20px 24px" },
            borderTop: "1px solid rgba(76, 175, 80, 0.1)",
            background: "linear-gradient(135deg, rgba(76, 175, 80, 0.01) 0%, rgba(76, 175, 80, 0.02) 100%)",
            justifyContent: "center",
          }}
        >
          <Button
            onClick={handleCancelContestDialog}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.9rem", sm: "1rem" },
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.25 },
              borderRadius: "8px",
              color: theme.palette.grey[600],
              "&:hover": {
                color: theme.palette.success.main,
                backgroundColor: "rgba(76, 175, 80, 0.08)",
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sheet Type Selection Dialog */}
      <Dialog
        open={openSheetTypeDialog}
        onClose={handleCancelSheetTypeDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          textAlign: "center",
          "& .MuiDialog-paper": {
            borderRadius: { xs: "16px", sm: "24px" },
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.12),
              0 4px 16px rgba(76, 175, 80, 0.08),
              0 0 0 1px rgba(76, 175, 80, 0.05)
            `,
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
          }
        }}
        TransitionProps={{
          timeout: 300,
        }}
      >
        <Box
          sx={{
            position: "relative",
            padding: { xs: "20px 16px", sm: "24px 20px" },
            background: "linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(76, 175, 80, 0.01) 100%)",
            borderBottom: "1px solid rgba(76, 175, 80, 0.1)",
          }}
        >
          <IconButton
            aria-label="close"
            onClick={handleCancelSheetTypeDialog}
            sx={{
              position: "absolute",
              right: { xs: "8px", sm: "12px" },
              top: { xs: "8px", sm: "12px" },
              color: theme.palette.grey[600],
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
              transition: "all 0.2s ease",
              "&:hover": {
                color: theme.palette.success.main,
                transform: "rotate(90deg)",
                backgroundColor: "rgba(76, 175, 80, 0.08)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            sx={{
              fontFamily: '"DM Serif Display", "Georgia", serif',
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              fontWeight: 400,
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              color: theme.palette.success.dark,
              textShadow: "0 2px 8px rgba(76, 175, 80, 0.2)",
              textAlign: "center",
              padding: { xs: "0 40px", sm: "0 48px" },
            }}
          >
            Select Sheet Type
          </Typography>
        </Box>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: { xs: "20px 16px", sm: "28px 24px" },
            "&.MuiDialogContent-root": {
              paddingTop: { xs: "16px", sm: "20px" },
            }
          }}
        >
          <FormControl component="fieldset" sx={{ mt: { xs: 0.5, sm: 1 }, width: "100%", maxWidth: "400px" }}>
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
        <DialogActions
          sx={{
            padding: { xs: "16px 20px", sm: "20px 24px" },
            borderTop: "1px solid rgba(76, 175, 80, 0.1)",
            background: "linear-gradient(135deg, rgba(76, 175, 80, 0.01) 0%, rgba(76, 175, 80, 0.02) 100%)",
            justifyContent: "center",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 1.5 }
          }}
        >
          <Button
            onClick={handleCancelSheetTypeDialog}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.9rem", sm: "1rem" },
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.25 },
              borderRadius: "8px",
              color: theme.palette.grey[600],
              "&:hover": {
                color: theme.palette.success.main,
                backgroundColor: "rgba(76, 175, 80, 0.08)",
              },
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