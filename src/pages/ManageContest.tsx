import {
  Box,
  Button,
  Container,
  Tab,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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

  // Contest data management - use selector to subscribe to contest updates
  const contest = useContestStore((state) => state.contest);
  const fetchContestById = useContestStore((state) => state.fetchContestById);
  
  const { getAllJudgesByContestId } = useContestJudgeStore();

  const { clusters, fetchClustersByContestId } = useMapClusterToContestStore();

  const { fetchTeamsByClusterId, teamsByClusterId } = useMapClusterTeamStore();
  // Judge-cluster mapping for organizing judges by clusters
  const { fetchJudgesByClusterId, judgesByClusterId } = useMapClusterJudgeStore();
  // Coach data management for teams
  const { fetchCoachesByTeams } = useMapCoachToTeamStore();

  const clusterIds = useMemo(
    () => clusters.map(c => c.id).sort((a, b) => a - b).join(','),
    [clusters]
  );

  useEffect(() => {
    if (!parsedContestId) return;

    Promise.all([
      fetchContestById(parsedContestId),
      getAllJudgesByContestId(parsedContestId),
      fetchClustersByContestId(parsedContestId)
    ]).catch(console.error);
  }, [parsedContestId]);

  useEffect(() => {
    if (!clusters.length) return;

    const clustersToFetchTeams = clusters.filter(c => !(teamsByClusterId[c.id]?.length > 0));
    const clustersToFetchJudges = clusters.filter(c => !(judgesByClusterId[c.id]?.length > 0));

    if (clustersToFetchTeams.length === 0 && clustersToFetchJudges.length === 0) return;

    Promise.all([
      ...clustersToFetchTeams.map(c => fetchTeamsByClusterId(c.id)),
      ...clustersToFetchJudges.map(c => fetchJudgesByClusterId(c.id))
    ]).catch(console.error);
  }, [clusterIds]);

  // Load coaches when teams become available 
  const allTeams = useMemo(() => {
    return clusters.flatMap(c => teamsByClusterId[c.id] ?? []);
  }, [clusterIds, teamsByClusterId]);

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
    <Box sx={{ mb: 2, mt: { xs: 2, sm: 3 }, ml: { xs: 2, sm: 3 } }}>
      {role?.user_type === 2 && (
        <Button
          component={RouterLink}
          to="/organizer"
          startIcon={<ArrowBackIcon />}
          sx={{
            textTransform: "none",
            color: theme.palette.success.dark,
            fontSize: { xs: "0.875rem", sm: "0.9375rem" },
            fontWeight: 500,
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: "8px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(76, 175, 80, 0.08)",
              transform: "translateX(-2px)",
            },
          }}
        >
          Back to Dashboard
        </Button>
      )}
      {role?.user_type === 1 && (
        <Button
          component={RouterLink}
          to="/admin"
          startIcon={<ArrowBackIcon />}
          sx={{
            textTransform: "none",
            color: theme.palette.success.dark,
            fontSize: { xs: "0.875rem", sm: "0.9375rem" },
            fontWeight: 500,
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.75, sm: 1 },
            borderRadius: "8px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(76, 175, 80, 0.08)",
              transform: "translateX(-2px)",
            },
          }}
        >
          Back to Dashboard
        </Button>
      )}
    </Box>

    {/* Page Title */}
    <Typography 
      variant="h4" 
      sx={{ 
        fontWeight: 400,
        m: 5,
        color: theme.palette.primary.main,
        fontFamily: '"DM Serif Display", "Georgia", serif',
        fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
        letterSpacing: "0.02em",
        lineHeight: 1.2,
      }}
    >
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
        contain: "layout style",
        overflowAnchor: "none",
        position: "relative",
        isolation: "isolate",
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
            overflowAnchor: "none",
            position: "relative",
            minHeight: 200,
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
            overflowAnchor: "none",
            position: "relative",
            minHeight: 200,
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
        // Refresh judges after creating/editing
        if (parsedContestId) {
          await getAllJudgesByContestId(parsedContestId, true);
          // Refresh judges for all clusters
          if (clusters.length > 0) {
            await Promise.all(
              clusters.map(cluster => fetchJudgesByClusterId(cluster.id, true))
            );
          }
        }
        setOpenJudgeModal(false);
      }}
    />
    <ClusterModal
      open={openClusterModal}
      handleClose={() => setOpenClusterModal(false)}
      mode="new"
      contestid={parsedContestId}
      onSuccess={() => {
        if (parsedContestId) {
          fetchClustersByContestId(parsedContestId).catch(console.error);
        }
        setOpenClusterModal(false);
      }}
    />
    <TeamModal
      open={openTeamModal}
      handleClose={() => setOpenTeamModal(false)}
      mode="new"
      clusters={clusters}
      contestId={parsedContestId}
      onSuccess={() => {
        if (clusters.length > 0) {
          Promise.all(
            clusters.map(cluster => fetchTeamsByClusterId(cluster.id))
          ).catch(console.error);
        }
        setOpenTeamModal(false);
      }}
    />
    <AssignJudgeToContestModal
      open={openAssignJudgeModal}
      contestId={parsedContestId}
      handleClose={() => {
        setOpenAssignJudgeModal(false);
      }}
      onSuccess={async () => {
        // Refresh judges after assigning to contest
        if (parsedContestId) {
          // Refresh all contest judges
          await getAllJudgesByContestId(parsedContestId, true);
          // Refresh judges for all clusters in the contest
          if (clusters.length > 0) {
            await Promise.all(
              clusters.map(cluster => fetchJudgesByClusterId(cluster.id, true))
            );
          }
        }
        setOpenAssignJudgeModal(false);
      }}
    />
  </>
);
}
