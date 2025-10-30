import {
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Tab,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import theme from "../theme";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import OrganizerJudgesTable from "../components/Tables/OrganizerJudgesTable";
import JudgeModal from "../components/Modals/JudgeModal";
import OrganizerTeamsTable from "../components/Tables/OrganizerTeamsTable";
import ClusterModal from "../components/Modals/ClusterModal";
import TeamModal from "../components/Modals/TeamModal";
import AssignJudgeToContestModal from "../components/Modals/AssignJudgeToContestModal";
import { useContestStore } from "../store/primary_stores/contestStore";
import { useMapClusterToContestStore } from "../store/map_stores/mapClusterToContestStore";
import useContestJudgeStore from "../store/map_stores/mapContestToJudgeStore";
import { useMapClusterJudgeStore } from "../store/map_stores/mapClusterToJudgeStore";
import { useJudgeStore } from "../store/primary_stores/judgeStore";
import { useMapCoachToTeamStore } from "../store/map_stores/mapCoachToTeamStore";
import useMapClusterTeamStore from "../store/map_stores/mapClusterToTeamStore";
import { useAuthStore } from "../store/primary_stores/authStore";

/**
 * ManageContest Component
 * 
 * Main page for managing contest details including judges, teams, and clusters.
 * Provides tabbed interface for different management functions.
 */
export default function ManageContest() {
  const { contestId } = useParams();
  const parsedContestId = contestId ? parseInt(contestId, 10) : 0;
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tab state management - persists active tab across page reloads
  const [value, setValue] = useState(
    () => localStorage.getItem("activeTab") || "1"
  );
  // Modal state management for different creation/editing operations
  const [openJudgeModal, setOpenJudgeModal] = useState(false);
  const [openClusterModal, setOpenClusterModal] = useState(false);
  const [openTeamModal, setOpenTeamModal] = useState(false);
  const [openAssignJudgeModal, setOpenAssignJudgeModal] = useState(false);

  const { role } = useAuthStore();

  // Contest data management
  const { contest, fetchContestById, clearContest, isLoadingContest } =
    useContestStore();
  // Judge data management for the contest
  const {
    getAllJudgesByContestId,
    clearJudges
  } = useContestJudgeStore();
  // Cluster data management for the contest
  const {
    clusters,
    fetchClustersByContestId,
    clearClusters,
  } = useMapClusterToContestStore();
  // Team data management organized by clusters
  const {
    getTeamsByClusterId,
    teamsByClusterId,
    clearTeamsByClusterId,
  } = useMapClusterTeamStore();
  // Judge-cluster mapping for organizing judges by clusters
  const {

    fetchJudgesByClusterId,
    judgesByClusterId,
    clearJudgesByClusterId,
    clearJudgeClusters,
  } = useMapClusterJudgeStore();
  // Judge operations and score sheet management
  const {
    clearSubmissionStatus,
  } = useJudgeStore();
  // Coach data management for teams
  const { fetchCoachesByTeams, clearCoachesByTeams } =
    useMapCoachToTeamStore();

  // Load all contest-related data on component mount - OPTIMIZED VERSION
  useEffect(() => {
    const loadAllData = async () => {
      if (parsedContestId) {
        // Load contest details, judges, and clusters in parallel for faster loading
        await Promise.all([
          fetchContestById(parsedContestId),
          getAllJudgesByContestId(parsedContestId),
          fetchClustersByContestId(parsedContestId)
        ]);
      }
    };

    loadAllData();
    
    return () => {
      clearContest();
      clearJudges();
      clearClusters();
    };
  }, [parsedContestId]);

  // Load teams for each cluster when clusters are available - OPTIMIZED VERSION
  useEffect(() => {
    const loadTeams = async () => {
      if (clusters && clusters.length > 0) {
        // Load teams for all clusters in parallel instead of sequentially
        const teamPromises = clusters.map(cluster => getTeamsByClusterId(cluster.id));
        await Promise.all(teamPromises);
      }
    };

    if (clusters.length > 0) {
      loadTeams();
    }
    
    return () => {
      clearTeamsByClusterId();
    };
  }, [clusters.length]);

  // Load judges for each cluster when clusters are available - OPTIMIZED VERSION
  useEffect(() => {
    const loadJudges = async () => {
      if (clusters && clusters.length > 0) {
        // Load judges for all clusters in parallel instead of sequentially
        const judgePromises = clusters.map(cluster => fetchJudgesByClusterId(cluster.id));
        await Promise.all(judgePromises);
      }
    };

    if (clusters.length > 0) {
      loadJudges();
    }
    
    return () => {
      clearJudgesByClusterId();
    };
  }, [clusters.length]);

  // Load coaches when teams are available 
  useEffect(() => {
    const loadCoaches = async () => {
      if (clusters && clusters.length > 0) {
        // Collect all teams from all clusters and load coaches in parallel
        const allTeams = clusters.reduce((acc, cluster) => {
          const teams = teamsByClusterId[cluster.id];
          return teams ? [...acc, ...teams] : acc;
        }, [] as any[]);

        if (allTeams.length > 0) {
          await fetchCoachesByTeams(allTeams);
        }
      }
    };

    const hasTeams = clusters.some(cluster => 
      teamsByClusterId[cluster.id]?.length > 0
    );

    if (hasTeams) {
      loadCoaches();
    }
    
    return () => {
      clearCoachesByTeams();
    };
  }, [clusters.length, Object.keys(teamsByClusterId).length]);


  useEffect(() => {
    const handlePageHide = () => {
      clearClusters();
      clearContest();
      clearJudges();
      clearJudgesByClusterId();
      clearSubmissionStatus();
      clearTeamsByClusterId();
      clearJudgeClusters();
      clearCoachesByTeams();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  const hasClusters = clusters.length > 0;
  const hasTeams = clusters.some(
    (cluster) => teamsByClusterId[cluster.id]?.length > 0
  );


  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    localStorage.setItem("activeTab", newValue);
  };


  return isLoadingContest ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <CircularProgress />
    </Box>
  ) : (
  <>
    {/* Back to Dashboard */}
    {role?.user_type === 2 && (
      <Link href="/organizer" sx={{ textDecoration: "none" }}>
        <Typography
          variant="body2"
          sx={{
            m: 2,
            color: theme.palette.primary.main,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {"<"} Back to Dashboard
        </Typography>
      </Link>
    )}
    {role?.user_type === 1 && (
      <Link href="/admin" sx={{ textDecoration: "none" }}>
        <Typography
          variant="body2"
          sx={{
            m: 2,
            color: theme.palette.primary.main,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {"<"} Back to Dashboard
        </Typography>
      </Link>
    )}

    {/* Page Title */}
    <Typography variant="h4" 
    sx={{ fontWeight: 700, m: 5,color: theme.palette.primary.main}}>
      Manage {contest?.name}
      </Typography>
    

    {/* Main Container */}
    <Container
      sx={{
        maxWidth: 1200,
        width: "100%",
        mx: "auto",
        my: 2,
        p: 3,
        bgcolor: theme.palette.background.paper,
        borderRadius: 3,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Action Buttons */}
{!contest?.is_open && (
  <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
    <Button
      variant="contained"
      onClick={() => setOpenJudgeModal(true)}
      disabled={!hasClusters || !hasTeams}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        px: 4.5,
        fontWeight: 600,
        bgcolor: theme.palette.success.main,
        color: theme.palette.common.white,
        "&:hover": { bgcolor: theme.palette.success.dark },
        "&.Mui-disabled": {
          bgcolor: theme.palette.action.disabledBackground,
          color: theme.palette.action.disabled,
        },
      }}
    >
      Create Judge
    </Button>

    <Button
      variant="outlined"
      onClick={() => setOpenClusterModal(true)}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        px: 4.5,
        fontWeight: 600,
        borderColor: theme.palette.success.main,
        color: theme.palette.success.main,
        "&:hover": {
          borderColor: theme.palette.success.dark,
          backgroundColor: "rgba(46,125,50,0.06)", // success.main @ ~6%
        },
      }}
    >
      Create Cluster
    </Button>

    <Button
      variant="outlined"
      onClick={() => setOpenTeamModal(true)}
      disabled={!hasClusters}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        px: 4.5,
        fontWeight: 600,
        borderColor: theme.palette.success.main,
        color: theme.palette.success.main,
        "&:hover": {
          borderColor: theme.palette.success.dark,
          backgroundColor: "rgba(46,125,50,0.06)",
        },
        "&.Mui-disabled": {
          borderColor: theme.palette.action.disabledBackground,
          color: theme.palette.action.disabled,
        },
      }}
    >
      Create Team
    </Button>

    <Button
      variant="outlined"
      onClick={() => {
        setOpenAssignJudgeModal(true);
      }}
      disabled={!hasClusters}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        px: 4.5,
        fontWeight: 600,
        borderColor: theme.palette.success.main,
        color: theme.palette.success.main,
        "&:hover": {
          borderColor: theme.palette.success.dark,
          backgroundColor: "rgba(46,125,50,0.06)",
        },
        "&.Mui-disabled": {
          borderColor: theme.palette.action.disabledBackground,
          color: theme.palette.action.disabled,
        },
      }}
    >
      Assign Judge to Contest
    </Button>
  </Box>
)}


      {/* Tabs */}
      <TabContext value={value}>
        <Box
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <TabList
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{
              style: {
                backgroundColor: theme.palette.primary.main,
                height: 3,
                borderRadius: 2,
              },
            }}
            sx={{
              "& .MuiTabs-scrollButtons": {
                color: theme.palette.primary.main,
              },
            }}
          >
            <Tab
              label="Judges"
              value="1"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                "&.Mui-selected": { color: theme.palette.primary.main },
              }}
            />
            <Tab
              label="Teams"
              value="2"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                "&.Mui-selected": { color: theme.palette.primary.main },
              }}
            />
          </TabList>
        </Box>

        {/* Judges Tab */}
        <TabPanel
          value="1"
          sx={{
            bgcolor: "#f9f9f9",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            border: `1px solid ${theme.palette.divider}`,
            borderTop: "none",
          }}
        >
          <OrganizerJudgesTable
          key={refreshTrigger}
            clusters={clusters}
            judgesByClusterId={judgesByClusterId}
            contestid={parsedContestId}
          />
        </TabPanel>

        {/* Teams Tab */}
        <TabPanel
          value="2"
          sx={{
            bgcolor: theme.palette.common.white,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            border: `1px solid ${theme.palette.divider}`,
            borderTop: "none",
          }}
        >
          <OrganizerTeamsTable
            clusters={clusters}
            contestId={parsedContestId ?? 0}
          />
        </TabPanel>
      </TabContext>
    </Container>

    {/* Modals */}
    <JudgeModal
      open={openJudgeModal}
      handleClose={() => setOpenJudgeModal(false)}
      mode="new"
      clusters={clusters}
      contestid={parsedContestId}
      onSuccess={async () => {
        // Refresh all data after successful judge creation in parallel
        await Promise.all([
          getAllJudgesByContestId(parsedContestId),
          fetchClustersByContestId(parsedContestId)
        ]);
        
        // Refresh judges for all clusters in parallel
        if (clusters && clusters.length > 0) {
          const judgePromises = clusters.map(cluster => fetchJudgesByClusterId(cluster.id));
          await Promise.all(judgePromises);
        }
      }}
    />
    <ClusterModal
      open={openClusterModal}
      handleClose={() => setOpenClusterModal(false)}
      mode="new"
      contestid={parsedContestId}
    />
    <TeamModal
      open={openTeamModal}
      handleClose={() => setOpenTeamModal(false)}
      mode="new"
      clusters={clusters}
      contestId={parsedContestId}
    />
    <AssignJudgeToContestModal
      open={openAssignJudgeModal}
      handleClose={() => {
        setOpenAssignJudgeModal(false);
      }}
      onSuccess={async () => {
        try {
          // Refresh judges and clusters in parallel after successful assignment
          await Promise.all([
            getAllJudgesByContestId(parsedContestId),
            fetchClustersByContestId(parsedContestId)
          ]);
          
          // Refresh judges for each cluster in parallel to update judgesByClusterId
          if (clusters && clusters.length > 0) {
            const judgePromises = clusters.map(async (cluster) => {
              try {
                await fetchJudgesByClusterId(cluster.id);
              } catch (error) {
                console.error(`Error fetching judges for cluster ${cluster.id}:`, error);
              }
            });
            await Promise.all(judgePromises);
          }
          
          // Trigger a refresh of the UI components
          setRefreshTrigger(prev => prev + 1);
          setOpenAssignJudgeModal(false);
        } catch (error) {
          console.error('Error refreshing data after judge assignment:', error);
          // Still close the modal even if refresh fails
          setOpenAssignJudgeModal(false);
        }
      }}
    />
  </>
);
}
