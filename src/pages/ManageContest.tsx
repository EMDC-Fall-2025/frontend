import {
  Box,
  Button,
  Container,
  Link,
  Tab,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
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
import { useMapCoachToTeamStore } from "../store/map_stores/mapCoachToTeamStore";
import useMapClusterTeamStore from "../store/map_stores/mapClusterToTeamStore";
import { useAuthStore } from "../store/primary_stores/authStore";

/**
 * ManageContest Component
 * 
 * Main page for managing contest details including judges, teams, and clusters.
 */
export default function ManageContest() {
  const { contestId } = useParams();
  const parsedContestId = contestId ? parseInt(contestId, 10) : 0;

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
  const { contest, fetchContestById } = useContestStore();
  
  const { getAllJudgesByContestId } = useContestJudgeStore();

  const { clusters, fetchClustersByContestId } = useMapClusterToContestStore();

  const { getTeamsByClusterId, teamsByClusterId } = useMapClusterTeamStore();
  // Judge-cluster mapping for organizing judges by clusters
  const { fetchJudgesByClusterId, judgesByClusterId } = useMapClusterJudgeStore();
  // Coach data management for teams
  const { fetchCoachesByTeams } = useMapCoachToTeamStore();

  const clusterIds = useMemo(
    () => clusters.map(c => c.id).sort((a, b) => a - b).join(','),
    [clusters]
  );

  // Load initial contest data in parallel on mount
  useEffect(() => {
    if (!parsedContestId) return;

    Promise.all([
      fetchContestById(parsedContestId),
      getAllJudgesByContestId(parsedContestId),
      fetchClustersByContestId(parsedContestId)
    ]).catch(console.error);
    
   
  }, [parsedContestId]);

  // Load teams and judges for clusters in parallel once clusters are available
  // Skip if already loaded to avoid redundant fetches
  useEffect(() => {
    if (!clusters.length) return;

    Promise.all([
      ...clusters
        .filter(c => !(teamsByClusterId[c.id]?.length > 0))
        .map(c => getTeamsByClusterId(c.id)),
      ...clusters
        .filter(c => !(judgesByClusterId[c.id]?.length > 0))
        .map(c => fetchJudgesByClusterId(c.id))
    ]).catch(console.error);
    
  
  }, [clusterIds]);

  // Load coaches when teams become available 
  const allTeams = useMemo(() => {
    return clusters.flatMap(c => teamsByClusterId[c.id] ?? []);
  }, [clusterIds, teamsByClusterId]);

  // Don't fetch coaches until Teams tab is open
  const isTeamsTab = value === "2";

  useEffect(() => {
    if (!isTeamsTab || allTeams.length === 0) return;
    fetchCoachesByTeams(allTeams).catch(console.error);
    
  }, [isTeamsTab, allTeams.length]);



  const hasClusters = clusters.length > 0;
  const hasTeams = clusters.some(
    (cluster) => teamsByClusterId[cluster.id]?.length > 0
  );


  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    localStorage.setItem("activeTab", newValue);
  };


  return (
  <>
    {/* Back to Dashboard */}
    {role?.user_type === 2 && (
      <Link component={RouterLink} to="/organizer" sx={{ textDecoration: "none" }}>
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
      <Link component={RouterLink} to="/admin" sx={{ textDecoration: "none" }}>
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
          backgroundColor: "rgba(46,125,50,0.06)", 
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
          {isTeamsTab && (
            <OrganizerTeamsTable
              clusters={clusters}
              contestId={parsedContestId ?? 0}
            />
          )}
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
