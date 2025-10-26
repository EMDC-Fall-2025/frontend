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

export default function ManageContest() {
  const { contestId } = useParams();
  const parsedContestId = contestId ? parseInt(contestId, 10) : 0;

  // UI state
  const [value, setValue] = useState(
    () => localStorage.getItem("activeTab") || "1"
  );
  const [openJudgeModal, setOpenJudgeModal] = useState(false);
  const [openClusterModal, setOpenClusterModal] = useState(false);
  const [openTeamModal, setOpenTeamModal] = useState(false);
  const [openAssignJudgeModal, setOpenAssignJudgeModal] = useState(false);

  const { role } = useAuthStore();

  // Stores
  const { contest, fetchContestById, clearContest, isLoadingContest } =
    useContestStore();
  const { getAllJudgesByContestId, clearJudges } = useContestJudgeStore();
  const { clusters, fetchClustersByContestId, clearClusters } =
    useMapClusterToContestStore();
  const { getTeamsByClusterId, teamsByClusterId, clearTeamsByClusterId } =
    useMapClusterTeamStore();
  const {
    fetchJudgesByClusterId,
    judgesByClusterId,
    clearJudgesByClusterId,
    clearJudgeClusters,
  } = useMapClusterJudgeStore();
  const { clearSubmissionStatus } = useJudgeStore();
  const { fetchCoachesByTeams, clearCoachesByTeams, isLoadingMapCoachToTeam } =
    useMapCoachToTeamStore();

  // Load contest data
  useEffect(() => {
    const loadAllData = async () => {
      if (parsedContestId) {
        await fetchContestById(parsedContestId);
        await Promise.all([
          getAllJudgesByContestId(parsedContestId),
          fetchClustersByContestId(parsedContestId),
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

  // Load teams by cluster
  useEffect(() => {
    const loadTeams = async () => {
      if (clusters.length > 0) {
        for (const cluster of clusters) {
          await getTeamsByClusterId(cluster.id);
        }
      }
    };
    if (clusters.length > 0) loadTeams();
    return () => clearTeamsByClusterId();
  }, [clusters.length]);

  // Load judges by cluster
  useEffect(() => {
    const loadJudges = async () => {
      if (clusters.length > 0) {
        for (const cluster of clusters) {
          await fetchJudgesByClusterId(cluster.id);
        }
      }
    };
    if (clusters.length > 0) loadJudges();
    return () => clearJudgesByClusterId();
  }, [clusters.length]);

  // Load coaches for teams
  useEffect(() => {
    const loadCoaches = async () => {
      for (const cluster of clusters) {
        const teams = teamsByClusterId[cluster.id];
        if (teams && teams.length > 0) {
          await fetchCoachesByTeams(teams);
        }
      }
    };
    const hasTeams = clusters.some(
      (cluster) => teamsByClusterId[cluster.id]?.length > 0
    );
    if (hasTeams) loadCoaches();
    return () => clearCoachesByTeams();
  }, [clusters.length, Object.keys(teamsByClusterId).length]);

  // Cleanup on page hide
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
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  const hasClusters = clusters.length > 0;
  const hasTeams = clusters.some(
    (cluster) => teamsByClusterId[cluster.id]?.length > 0
  );

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    localStorage.setItem("activeTab", newValue);
  };

  // Loading spinner
  if (isLoadingContest || isLoadingMapCoachToTeam) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
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

      {/* Title */}
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, m: 5, color: theme.palette.primary.main }}
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
              }}
            >
              Create Team
            </Button>

            <Button
              variant="outlined"
              onClick={() => setOpenAssignJudgeModal(true)}
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

          <TabPanel value="1">
            <OrganizerJudgesTable
              clusters={clusters}
              judgesByClusterId={judgesByClusterId}
              contestid={parsedContestId}
            />
          </TabPanel>

          <TabPanel value="2">
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
        onSuccess={() => {
          getAllJudgesByContestId(parsedContestId);
          fetchClustersByContestId(parsedContestId);
          clusters.forEach((cluster) => fetchJudgesByClusterId(cluster.id));
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
        handleClose={() => setOpenAssignJudgeModal(false)}
        onSuccess={() => {
          getAllJudgesByContestId(parsedContestId);
          setOpenAssignJudgeModal(false);
        }}
      />
    </>
  );
}
