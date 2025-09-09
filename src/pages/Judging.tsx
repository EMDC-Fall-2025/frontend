// Judging.tsx
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/primary_stores/authStore";
import { useJudgeStore } from "../store/primary_stores/judgeStore";
import { useEffect, useState } from "react";
import { useMapClusterJudgeStore } from "../store/map_stores/mapClusterToJudgeStore";
import useClusterTeamStore from "../store/map_stores/mapClusterToTeamStore";
import JudgeDashboardTable from "../components/Tables/JudgeDashboardTable";
import theme from "../theme";
import { Team } from "../types";

export default function Judging() {
  const navigate = useNavigate();
  const { role } = useAuthStore();

  const { judgeId } = useParams();
  const judgeIdNumber = judgeId ? parseInt(judgeId, 10) : null;
  const { judge, fetchJudgeById, clearJudge } = useJudgeStore();
  const { fetchClusterByJudgeId, cluster, clearCluster } = useMapClusterJudgeStore();
  const {
    getTeamsByClusterId,
    teamsByClusterId,
    mapClusterToTeamError,
    clearClusterTeamMappings,
    clearTeamsByClusterId,
  } = useClusterTeamStore();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (judgeIdNumber) {
      fetchJudgeById(judgeIdNumber);
      fetchClusterByJudgeId(judgeIdNumber);
    }
  }, [judgeIdNumber]);

  useEffect(() => {
    if (cluster) {
      getTeamsByClusterId(cluster.id);
    }
  }, [cluster]);

  useEffect(() => {
    if (teamsByClusterId && cluster?.id) {
      setTeams(teamsByClusterId[cluster.id] || []);
    }
  }, [teamsByClusterId, cluster]);

  useEffect(() => {
    const handlePageHide = () => {
      clearCluster();
      clearClusterTeamMappings();
      clearTeamsByClusterId();
      clearJudge();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  const StatCard = ({ value, label }: { value: number | string; label: string }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.grey[300]}`,
        backgroundColor: "#fff",
      }}
    >
      <CardContent sx={{ py: 3, px: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: theme.palette.success.dark, lineHeight: 1, mb: 0.5 }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg">
        {mapClusterToTeamError ? (
          <CircularProgress />
        ) : (
          <>
            <Stack spacing={1} sx={{ mb: 3, mt: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                Judge Dashboard
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {judge?.first_name} {judge?.last_name}
              </Typography>
            </Stack>

            {/* Stat Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard value={teams.length} label="Teams Assigned" />
              </Grid>
              {/* Add more stat cards if needed */}
            </Grid>

            {/* Table Section */}
            <Box
              sx={{
                border: `1px solid ${theme.palette.grey[300]}`,
                borderRadius: 3,
                backgroundColor: "#fff",
              }}
            >
              <Box sx={{ px: 3, py: 2 , backgroundColor:" rgba(46, 125, 50, 0.06)"}}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Team Overview
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ px: 3, pb: 3 }}>
                {teams.length > 0 ? (
                  <JudgeDashboardTable teams={teams} />
                ) : (
                  <Typography>No teams available for this cluster.</Typography>
                )}
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
