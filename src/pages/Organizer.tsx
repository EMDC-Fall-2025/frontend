// Organizer.tsx

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Divider,
  Stack,
  Card,
  CardContent,
  Grid,
  Button,
} from "@mui/material";
import theme from "../theme";
import OrganizerContestTable from "../components/Tables/OrganizerContestTable";
import  ContestOverviewTable from "../components/Tables/ContestOverview";
import { useAuthStore } from "../store/primary_stores/authStore";
import useMapContestOrganizerStore from "../store/map_stores/mapContestToOrganizerStore";
import useMapScoreSheetStore from "../store/map_stores/mapScoreSheetStore";

// icons
import CampaignIcon from "@mui/icons-material/Campaign";
import HistoryIcon from "@mui/icons-material/History";
import GavelIcon from "@mui/icons-material/Gavel";
import Ranking from "../components/Tables/Rankings";
import { AwardIcon, Trophy } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { AddIcCallOutlined, Event, EventAvailable } from "@mui/icons-material";

export default function Organizer() {
  const [value, setValue] = useState("1");
  const { fetchContestsByOrganizerId, contests } = useMapContestOrganizerStore();
  const { allSheetsSubmittedForContests } = useMapScoreSheetStore();
  const { role } = useAuthStore();
  const navigate = useNavigate()

  const organizerId = role ? role.user.id : null;

  useEffect(() => {
    if (organizerId) {
      fetchContestsByOrganizerId(organizerId);
    }
  }, [organizerId, fetchContestsByOrganizerId]);

  useEffect(() => {
    if (contests.length > 0) {
      allSheetsSubmittedForContests(contests);
    }
  }, [contests]);

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

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
          sx={{ fontWeight: 700, color: theme.palette.success.main, lineHeight: 1, mb: 0.5 }}
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
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Heading */}
        <Stack spacing={1} sx={{ mt: 4, mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ 
              fontWeight: 800, 
              color: theme.palette.success.main,
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" }
            }}
          >
            Organizer Dashboard
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            {role?.user?.first_name} {role?.user?.last_name}
          </Typography>
        </Stack>

        {/* Stat Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard value={contests.length} label="Total Contests" />
          </Grid>
        </Grid>
        <Button
          onClick={() => navigate('/organizerAwards/')}
          variant="contained"
          startIcon={<AwardIcon />}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1, sm: 1.5 },
            mb: 2,
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
            fontSize: { xs: "0.875rem", sm: "1rem" },
            width: { xs: "100%", sm: "auto" }
          }}
        >
          Assign Awards
        </Button>

        {/* Tab Section */}
        <TabContext value={value}>
          {/* Tab Header (styled like a white card top) */}
          <Box
            sx={{
              border: `1px solid ${theme.palette.grey[300]}`,
              borderBottom: 0,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              backgroundColor: "#fff",
              px: 2,
            }}
          >
            <TabList
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 56,
                  minWidth: { xs: "auto", sm: 160 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  px: { xs: 1, sm: 2 },
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  backgroundColor: theme.palette.success.main,
                },
                "& .MuiTabs-scrollButtons": {
                  color: theme.palette.success.main,
                },
              }}
            >
              <Tab
                value="1"
                iconPosition="start"
                icon={<CampaignIcon />}
                label="Current Contests"
              />
              <Tab
                value="2"
                iconPosition="start"
                icon={<HistoryIcon />}
                label="Past Contests"
              />
              <Tab
                value="3"
                iconPosition="start"
                icon={<GavelIcon />}
                label="Contest Overview"
              />
              <Tab
                value="4"
                iconPosition="start"
                icon={<Trophy />}
                label="Team Rankings"
              />
            </TabList>
          </Box>

          {/* Panel 1: Current Contests */}
          <TabPanel
            value="1"
            sx={{
              p: 0,
              border: `1px solid ${theme.palette.grey[300]}`,
              borderTop: 0,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: "#fff",
            }}
          >
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Contest Management
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 3, pb: 3 }}>
              <OrganizerContestTable type="current" organizers={[]} />
            </Box>
          </TabPanel>

          {/* Panel 2: Past Contests */}
          <TabPanel
            value="2"
            sx={{
              p: 0,
              border: `1px solid ${theme.palette.grey[300]}`,
              borderTop: 0,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: "#fff",
            }}
          >
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Contest Management
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 3, pb: 3 }}>
              <OrganizerContestTable type="past" organizers={[]} />
            </Box>
          </TabPanel>

          {/* Panel 3: Contest Management */}
          <TabPanel
            value="3"
            sx={{
              p: 0,
              border: `1px solid ${theme.palette.grey[300]}`,
              borderTop: 0,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: "#fff",
            }}
          >
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Overall stats 
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 3, pb: 3 }}>
              <ContestOverviewTable contests={contests} />
            </Box>
          </TabPanel>

          {/* Team Rankings */}
          <TabPanel
            value="4"
            sx={{
              p: 0,
              border: `1px solid ${theme.palette.grey[300]}`,
              borderTop: 0,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              backgroundColor: "#fff",
            }}
          >
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Team Rankings
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ px: 3, pb: 3 }}>
              <Ranking />
            </Box>
          </TabPanel>
        </TabContext>
      </Container>

    </Box>
  );
}
