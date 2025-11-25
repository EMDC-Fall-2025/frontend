// Organizer.tsx
// ------------------------------------------------------
// Organizer Dashboard
// - Shows contests assigned to the organizer
// - Tracks current/past contests, overview, and rankings
// - Coordinates with global preloader for smooth loading
// - Reacts to data changes (e.g., advancement, edits)
// ------------------------------------------------------

// ==============================
// Imports: MUI & React
// ==============================
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import React, { useEffect, useState, useMemo, useRef } from "react";
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

// ==============================
// Theme, Tables, Stores, Utils
// ==============================
import theme from "../theme";
import OrganizerContestTable from "../components/Tables/OrganizerContestTable";
import ContestOverviewTable from "../components/Tables/ContestOverview";
import Ranking from "../components/Tables/Rankings";

import { useAuthStore } from "../store/primary_stores/authStore";
import useMapContestOrganizerStore from "../store/map_stores/mapContestToOrganizerStore";
import useMapScoreSheetStore from "../store/map_stores/mapScoreSheetStore";
import useOrganizerStore from "../store/primary_stores/organizerStore";
import { onDataChange } from "../utils/dataChangeEvents";

// ==============================
// Icons & Routing
// ==============================
import CampaignIcon from "@mui/icons-material/Campaign";
import HistoryIcon from "@mui/icons-material/History";
import GavelIcon from "@mui/icons-material/Gavel";
import { AwardIcon, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ==============================
// Component: Organizer Dashboard
// ==============================
export default function Organizer() {
  // ------------------------------
  // Local UI State
  // ------------------------------
  const [value, setValue] = useState("1"); // Tabs: "1" = current, "2" = past, etc.
  const [hasLoaded, setHasLoaded] = useState(false);
  const isInitialLoadRef = useRef(true);

  // ------------------------------
  // Store Hooks & Global State
  // ------------------------------
  const { fetchContestsByOrganizerId, contests } =
    useMapContestOrganizerStore();
  const { allSheetsSubmittedForContests } = useMapScoreSheetStore();

  const {
    role,
    isAuthenticated
  } = useAuthStore();

  // Organizer directory (for up-to-date name)
  const allOrganizers = useOrganizerStore((state) => state.allOrganizers);
  const fetchAllOrganizers = useOrganizerStore(
    (state) => state.fetchAllOrganizers
  );

  const navigate = useNavigate();
  const organizerId = role ? role.user.id : null;

  // ==============================
  // Organizer Identity
  // Prefer organizer store values (if updated by admin)
  // ==============================
  const currentOrganizer = useMemo(() => {
    if (!organizerId) return null;
    return allOrganizers.find((org: any) => org.id === organizerId);
  }, [organizerId, allOrganizers]);

  const organizerFirstName =
    currentOrganizer?.first_name || role?.user?.first_name || "";
  const organizerLastName =
    currentOrganizer?.last_name || role?.user?.last_name || "";

  // ==============================
  // Initial Data Load
  // - Fetch contests for organizer
  // - Fetch all organizers (for names, updates)
// ==============================
  useEffect(() => {
    // Only fetch if user is authenticated and has organizer role (user_type 2)
    if (!isAuthenticated || !organizerId || role?.user_type !== 2) {
      setHasLoaded(true);
      isInitialLoadRef.current = false;
      return;
    }

    // If contests are cached, show them immediately
    const hasCachedContests = contests && contests.length > 0;
    if (hasCachedContests) {
      setHasLoaded(true);
      isInitialLoadRef.current = false;
    }

    // Refresh contests and organizers (background-safe, but ensures freshness)
    Promise.all([
      fetchContestsByOrganizerId(organizerId),
      fetchAllOrganizers(),
    ])
      .then(() => {
        setHasLoaded(true);
        isInitialLoadRef.current = false;
      })
      .catch((error) => {
        console.error("Error loading organizer data:", error);
        setHasLoaded(true);
        isInitialLoadRef.current = false;
      });
  }, [organizerId, isAuthenticated, role?.user_type]);
  // Note: fetchContestsByOrganizerId & fetchAllOrganizers intentionally
  // omitted to avoid infinite loops
  

  // ==============================
  // Contest Utilities / Memoization
  // ==============================
  const safeContests = contests ?? [];

  /**
   * Build a stable string of contest IDs to detect meaningful changes
   * and avoid calling APIs on every render.
   */
  const contestIds = useMemo(() => {
    return safeContests
      .map((c) => c.id)
      .sort()
      .join(",");
  }, [safeContests]);

  // Track previous contest IDs so we only re-check when real changes occur
  const prevContestIdsRef = useRef<string>("");

  /**
   * Check if all sheets have been submitted for the contests.
   * This fires only when the set of contests actually changes.
   */
  useEffect(() => {
    if (
      safeContests.length > 0 &&
      contestIds !== prevContestIdsRef.current
    ) {
      prevContestIdsRef.current = contestIds;
      allSheetsSubmittedForContests(safeContests).catch((error) => {
        console.error("Error checking sheets submission status:", error);
      });
    }
  }, [contestIds, safeContests.length]);

  // ==============================
  // Respond to Global Data Changes
  // - e.g., tabulations, championship advancement, contest updates
  // ==============================
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleDataChange = () => {
      // Debounce to avoid rapid re-fetches on multiple quick updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (organizerId) {
          fetchContestsByOrganizerId(organizerId).catch(console.error);
          fetchAllOrganizers().catch(console.error);
        }
      }, 300);
    };

    const unsubscribe = onDataChange(handleDataChange);
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [organizerId, fetchContestsByOrganizerId, fetchAllOrganizers]);

  // ==============================
  // Event Handlers
  // ==============================
  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: string
  ) => {
    setValue(newValue);
  };

  // ==============================
  //  StatCard
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
            color: theme.palette.success.main,
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
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Fade-in wrapper for smoother initial load */}
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
          {/* ------------------------------
              Header: Organizer Info
          ------------------------------ */}
          <Stack spacing={1} sx={{ mt: 2, mb: 2 }}>
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
              Organizer Dashboard
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              {organizerFirstName} {organizerLastName}
            </Typography>
          </Stack>

          {/* ------------------------------
              Stat Cards
          ------------------------------ */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                value={safeContests.length}
                label="Total Contests"
              />
            </Grid>
          </Grid>

          {/* ------------------------------
              Quick Action: Assign Awards
          ------------------------------ */}
          <Button
            onClick={() => navigate("/organizerAwards/")}
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
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Assign Awards
          </Button>

          {/* ==============================
              Tabbed Layout
          ============================== */}
          <TabContext value={value}>
            {/* Tab Header */}
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

            {/* ------------------------------
                Tab Panel 1: Current Contests
            ------------------------------ */}
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

            {/* ------------------------------
                Tab Panel 2: Past Contests
            ------------------------------ */}
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

            {/* ------------------------------
                Tab Panel 3: Contest Overview
            ------------------------------ */}
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
                <ContestOverviewTable contests={safeContests} />
              </Box>
            </TabPanel>

            {/* ------------------------------
                Tab Panel 4: Team Rankings
            ------------------------------ */}
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
        </Box>
      </Container>
    </Box>
  );
}