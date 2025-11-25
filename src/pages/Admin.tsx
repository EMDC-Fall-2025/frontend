import React, { useState, useRef, useEffect } from "react";

// ==============================
// Store Hooks
// ==============================
import useContestStore from "../store/primary_stores/contestStore";
import useOrganizerStore from "../store/primary_stores/organizerStore";

// ==============================
// UI Libraries
// ==============================
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Stack,
  Tab,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useNavigate } from "react-router-dom";

// ==============================
// Icons & Theme
// ==============================
import AddIcon from "@mui/icons-material/Add";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CampaignIcon from "@mui/icons-material/Campaign";
import GroupIcon from "@mui/icons-material/Group";
import EmailIcon from "@mui/icons-material/Email";
import theme from "../theme";

// ==============================
// Local Components
// ==============================
import OrganizerModal from "../components/Modals/OrganizerModal";
import ContestModal from "../components/Modals/ContestModal";
import AdminContestTable from "../components/Tables/AdminContestTable";
import AdminOrganizerTable from "../components/Tables/AdminOrganizerTable";
import ContestOverviewTable from "../components/Tables/ContestOverview";

// ==============================
// Component: Admin
// Admin dashboard to manage contests, organizers, and view contest overview.
// ==============================
export default function Admin() {
  // ------------------------------
  // Local UI State
  // ------------------------------
  const [value, setValue] = useState("1"); // active tab
  const [contestModal, setContestModal] = useState(false);
  const [organizerModal, setOrganizerModal] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isInitialLoadRef = useRef(true);

  const navigate = useNavigate();

  // ------------------------------
  // Store State
  // ------------------------------
  const { allContests, isLoadingContest } = useContestStore();
  const { allOrganizers, isLoadingOrganizer } = useOrganizerStore();
  // const { role } = useAuthStore(); // imported but currently not used in this component

  // ==============================
  // Data Loading & Initialization
  // ==============================
  useEffect(() => {
    const needsContests = allContests.length === 0;
    const needsOrganizers = allOrganizers.length === 0;

    // If both contests and organizers are already loaded, mark as loaded and skip fetch
    if (!needsContests && !needsOrganizers) {
      setHasLoaded(true);
      isInitialLoadRef.current = false;
      return;
    }

    // Fetch missing contests/organizers in parallel
    Promise.all([
      needsContests
        ? useContestStore.getState().fetchAllContests()
        : Promise.resolve(),
      needsOrganizers
        ? useOrganizerStore.getState().fetchAllOrganizers()
        : Promise.resolve(),
    ]).then(() => {
      setHasLoaded(true);
      isInitialLoadRef.current = false;
    });
  }, [allContests.length, allOrganizers.length]); // keep dependencies on lengths only to avoid unnecessary re-runs

  // ==============================
  // Event Handlers
  // ==============================
  const handleChange = (_e: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  // ==============================
  // Reusable UI: StatCard
  // Displays a numeric value with a label (e.g., contest count, organizer count).
  // ==============================
  const StatCard = ({
    value,
    label,
  }: {
    value: number | string;
    label: string;
  }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.grey[200]}`,
        background: `linear-gradient(135deg, #ffffff 0%, #fafafa 100%)`,
        boxShadow: `0 2px 8px rgba(76, 175, 80, 0.08)`,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: `0 4px 16px rgba(76, 175, 80, 0.12)`,
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: theme.palette.success.light,
            opacity: 0.1,
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: theme.palette.success.dark,
            lineHeight: 1,
            mb: 0.5,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

  // ==============================
  // Render
  // ==============================
  return (
    <Box sx={{ pb: 8, backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ pb: 6, px: { xs: 2, sm: 3 } }}>
        {/* Fade-in wrapper for the whole dashboard once data is loaded */}
        <Box
          sx={{
            opacity: hasLoaded ? 1 : 0,
            transition: hasLoaded
              ? `opacity ${
                  isInitialLoadRef.current ? "0.6s" : "0.1s"
                } ease-in`
              : "none",
            pointerEvents: hasLoaded ? "auto" : "none",
          }}
        >
          {/* --------------------------------
              Header: Title & Subtitle
          -------------------------------- */}
          <Stack spacing={1} sx={{ mb: 2, mt: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 400,
                color: theme.palette.success.main,
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
                fontFamily: '"DM Serif Display", "Georgia", serif',
                letterSpacing: "0.02em",
                lineHeight: 1.2,
              }}
            >
              Admin Dashboard
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              Manage contests and organizers
            </Typography>
          </Stack>

          {/* --------------------------------
              Stat Summary: Contests & Organizers
          -------------------------------- */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={isLoadingContest ? "—" : allContests.length}
                label="Contests"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={isLoadingOrganizer ? "—" : allOrganizers.length}
                label="Organizers"
              />
            </Grid>
          </Grid>

          {/* --------------------------------
              Primary Actions (Create / Navigate)
          -------------------------------- */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2, flexWrap: "wrap" }}
            useFlexGap
          >
            {/* Create Contest */}
            <Button
              onClick={() => setContestModal(true)}
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: { xs: 2, sm: 2 },
                py: { xs: 1, sm: 1 },
                bgcolor: theme.palette.success.main,
                "&:hover": { bgcolor: theme.palette.success.dark },
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Create Contest
            </Button>

          <Button
            onClick={() => setOrganizerModal(true)}
            variant="outlined"
            startIcon={<PersonAddAlt1Icon />}
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 2, sm: 2 },
              py: { xs: 1, sm: 1 },
              borderColor: theme.palette.success.main,
              color: theme.palette.success.main,
              "&:hover": {
                borderColor: theme.palette.success.dark,
                backgroundColor: "rgba(46,125,50,0.06)",
              },
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              width: { xs: "100%", sm: "auto" }
            }}
          >
            Create Organizer
          </Button>

          <Button
            onClick={() => navigate("/awards")}
            variant="outlined"
            startIcon={<EmojiEventsIcon />}
            size="small"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: { xs: 2, sm: 2 },
              py: { xs: 1, sm: 1 },
              borderColor: theme.palette.success.main,
              color: theme.palette.success.main,
              "&:hover": {
                borderColor: theme.palette.success.dark,
                backgroundColor: "rgba(46,125,50,0.06)",
              },
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              width: { xs: "100%", sm: "auto" }
            }}
          >
            Create Award
          </Button>

        </Stack>

        {/* Tabs */}
        <TabContext value={value}>
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
                "& .MuiTabs-indicator": { height: 3, backgroundColor: theme.palette.success.main },
                "& .MuiTabs-scrollButtons": {
                  color: theme.palette.success.main,
                },
              }}
            >
              <Tab
                iconPosition="start"
                icon={<CampaignIcon />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>Contests</span>
                  </Stack>
                }
                value="1"
              />
              <Tab iconPosition="start" icon={<GroupIcon />} label="Manage Organizers" value="2" />
              <Tab iconPosition="start" icon={<EmojiEventsIcon />} label="Contest Overview" value="3" />
            </TabList>
          </Box>

            {/* --------------------------------
                Tab Panel: Contests
            -------------------------------- */}
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
                <AdminContestTable />
              </Box>
            </TabPanel>

            {/* --------------------------------
                Tab Panel: Organizers
            -------------------------------- */}
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
                  Manage Organizers
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ px: 3, pb: 3 }}>
                <AdminOrganizerTable />
              </Box>
            </TabPanel>

            {/* --------------------------------
                Tab Panel: Contest Overview
            -------------------------------- */}
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
                  Contest Overview
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ px: 3, pb: 3 }}>
                <ContestOverviewTable />
              </Box>
            </TabPanel>
          </TabContext>
        </Box>
      </Container>

      {/* ==============================
          Modals (Create Organizer / Contest)
      ============================== */}
      <OrganizerModal
        open={organizerModal}
        handleClose={() => setOrganizerModal(false)}
        mode={"new"}
      />
      <ContestModal open={contestModal} handleClose={() => setContestModal(false)} mode={"new"} />
    </Box>
  );
}
