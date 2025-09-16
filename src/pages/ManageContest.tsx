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

  const [value, setValue] = useState(
    () => localStorage.getItem("activeTab") || "1"
  );
  const [openJudgeModal, setOpenJudgeModal] = useState(false);
  const [openClusterModal, setOpenClusterModal] = useState(false);
  const [openTeamModal, setOpenTeamModal] = useState(false);

  const { role } = useAuthStore();

  const { contest, fetchContestById, clearContest, isLoadingContest } =
    useContestStore();
  const {
    judges,
    getAllJudgesByContestId,
    clearJudges,
    isLoadingMapContestJudge,
  } = useContestJudgeStore();
  const {
    clusters,
    fetchClustersByContestId,
    clearClusters,
    isLoadingMapClusterContest,
  } = useMapClusterToContestStore();
  const {
    getTeamsByClusterId,
    teamsByClusterId,
    clearTeamsByClusterId,
    isLoadingMapClusterToTeam,
  } = useMapClusterTeamStore();
  const {
    fetchClustersForJudges,
    fetchJudgesByClusterId,
    judgesByClusterId,
    clearJudgesByClusterId,
    clearJudgeClusters,
    isLoadingMapClusterJudge,
  } = useMapClusterJudgeStore();
  const {
    checkAllScoreSheetsSubmitted,
    clearSubmissionStatus,
    isLoadingJudge,
  } = useJudgeStore();
  const { fetchCoachesByTeams, clearCoachesByTeams, isLoadingMapCoachToTeam } =
    useMapCoachToTeamStore();

  useEffect(() => {
    const loadContestData = async () => {
      if (parsedContestId) {
        await fetchContestById(parsedContestId);
        await getAllJudgesByContestId(parsedContestId);
        await fetchClustersByContestId(parsedContestId);
      }
    };

    loadContestData();
    return () => {
      clearContest();
      clearJudges();
      clearClusters();
    };
  }, [parsedContestId]);

  useEffect(() => {
    const fetchTeams = async () => {
      if (clusters && clusters.length > 0) {
        for (const cluster of clusters) {
          await getTeamsByClusterId(cluster.id);
          await fetchJudgesByClusterId(cluster.id);
        }
      }
    };

    fetchTeams();
    return () => {
      clearTeamsByClusterId();
      clearJudgesByClusterId();
    };
  }, [clusters, getTeamsByClusterId, fetchJudgesByClusterId]);

  useEffect(() => {
    const fetchCoaches = async () => {
      if (clusters && clusters.length > 0) {
        for (const cluster of clusters) {
          const teams = teamsByClusterId[cluster.id];
          if (teams && teams.length > 0) {
            await fetchCoachesByTeams(teams);
          }
        }
      }
    };

    fetchCoaches();
    return () => {
      clearCoachesByTeams();
    };
  }, [clusters, teamsByClusterId]);

  useEffect(() => {
    const fetchClustersAndSubmissionStatus = async () => {
      if (judges.length > 0) {
        fetchClustersForJudges(judges);
        checkAllScoreSheetsSubmitted(judges);
      }
    };
    fetchClustersAndSubmissionStatus();
    return () => {
      clearSubmissionStatus();
      clearJudgeClusters();
    };
  }, [judges]);

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

  return isLoadingContest ||
  isLoadingJudge ||
  isLoadingMapClusterContest ||
  isLoadingMapClusterJudge ||
  isLoadingMapClusterToTeam ||
  isLoadingMapCoachToTeam ||
  isLoadingMapContestJudge ? (
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
            TabIndicatorProps={{
              style: {
                backgroundColor: theme.palette.primary.main,
                height: 3,
                borderRadius: 2,
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
  </>
);
}
