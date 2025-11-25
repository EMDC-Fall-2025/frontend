// ==============================
// Component: ContestScores
// Displays contest results with tabs for preliminary, championship, awards, and highlights.
// Features confetti celebration for preliminary results and optimized data loading.
// ==============================

// ==============================
// React Core
// ==============================
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";

// ==============================
// UI Libraries & Theme
// ==============================
import { Typography, Container, Tabs, Tab, Box, Stack, Alert, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import StarIcon from "@mui/icons-material/Star";
import theme from "../theme";
import confetti from "canvas-confetti";

// ==============================
// Store Hooks
// ==============================
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import useSpecialAwardStore from "../store/map_stores/mapAwardToTeamStore";
import { useMapCoachToTeamStore } from "../store/map_stores/mapCoachToTeamStore";
import { useContestStore } from "../store/primary_stores/contestStore";
import { useMapClusterToContestStore } from "../store/map_stores/mapClusterToContestStore";
import useContestJudgeStore from "../store/map_stores/mapContestToJudgeStore";
import { useAuthStore } from "../store/primary_stores/authStore";

// ==============================
// Local Components
// ==============================
import ContestResultsTable, { type ThemeType } from "../components/Tables/ContestResultsTable";
import AwardWinners from "../components/Tables/AwardWinners";
import ContestHighlightPage from "../components/Tables/ContestHighlight";

export default function ContestScores() {
  // ------------------------------
  // Route Parameters & Authentication
  // ------------------------------
  const { contestId } = useParams<{ contestId: string }>();
  const contestIdNumber = contestId ? parseInt(contestId, 10) : null;
  const { role } = useAuthStore();
  const isCoach = role?.user_type === 4;

  // ------------------------------
  // Store State & Actions
  // ------------------------------
  const { fetchContestById, contest } = useContestStore();
  const { fetchClustersByContestId } = useMapClusterToContestStore();
  const { getAllJudgesByContestId } = useContestJudgeStore();

  const {
    teamsByContest,
    fetchTeamsByContest,
    isLoadingMapContestToTeam,
  } = useMapContestToTeamStore();

  const { awards, AwardsByTeamTable } = useSpecialAwardStore();
  const { coachesByTeams, fetchCoachesByTeams } = useMapCoachToTeamStore();

  // ------------------------------
  // Local UI State
  // ------------------------------
  const [activeTab, setActiveTab] = useState("prelim");
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const lastContestIdRef = useRef<number | null>(null);
  const [resultsTheme, setResultsTheme] = useState<ThemeType>("green");

  // Theme primary color mapping
  const THEME_PRIMARY: Record<ThemeType, string> = {
    green: "#166534",
    brown: "#8B4513",
    black: "#111827",
  };

  const themePrimary = THEME_PRIMARY[resultsTheme];
  const isGreenTheme = resultsTheme === "green";
  const mainTitleColor = isGreenTheme ? THEME_PRIMARY.green : "#111827"; // Contest Results title logic

  // Reusable section title styles for all sub-headings
 
  const sectionHeadingSx = {
    fontWeight: 400,
    mt: 0.5,
    mb: 2.5,
    textAlign: "center",
    fontSize: { xs: "1.25rem", sm: "1.6rem", md: "1.8rem" },
    fontFamily: '"DM Serif Display", "Georgia", serif',
    letterSpacing: "0.04em",
    lineHeight: 1.2,
    color: theme.palette.text.primary, // keep section text black
    position: "relative" as const,
    display: "inline-block",
    px: { xs: 1.5, sm: 2.5 },
    "&::after": {
      content: '""',
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      bottom: -8,
      width: "55%",
      height: 3,
      borderRadius: 999,
      // underline follows resultsTheme color
      background: `linear-gradient(90deg, ${themePrimary}33, ${themePrimary}, ${themePrimary}33)`,
    },
  } as const;

  // ==============================
  // Computed Values
  // ==============================

  const hasChampionshipAdvance = useMemo(
    () => teamsByContest.some((team) => team.advanced_to_championship === true),
    [teamsByContest]
  );

  // ==============================
  // Data Loading & Effects
  // ==============================

  useEffect(() => {
    if (!contestIdNumber) return;

    lastContestIdRef.current = contestIdNumber;

    Promise.all([
      fetchTeamsByContest(contestIdNumber),
      fetchContestById(contestIdNumber),
      fetchClustersByContestId(contestIdNumber),
      getAllJudgesByContestId(contestIdNumber),
    ]).catch((error) => {
      console.error("Error fetching contest data:", error);
    });
  }, [contestIdNumber, fetchTeamsByContest, fetchContestById, fetchClustersByContestId, getAllJudgesByContestId]);

  useEffect(() => {
    setHasCelebrated(false);
  }, [contestIdNumber]);

  useEffect(() => {
    if (teamsByContest.length === 0) return;

    const teamData = teamsByContest.map((team) => ({ id: team.id }));

    const teamsNeedingCoaches = teamData.filter((team) => !coachesByTeams[team.id]);
    if (teamsNeedingCoaches.length > 0) {
      fetchCoachesByTeams(teamsNeedingCoaches);
    }

    teamsByContest.forEach((team) => {
      if (!awards[team.id]) {
        AwardsByTeamTable(team.id);
      }
    });
  }, [teamsByContest, coachesByTeams, awards, fetchCoachesByTeams, AwardsByTeamTable]);

  // ==============================
  // Memoized Data Transformations
  // ==============================

  const coachNames = useMemo(() => {
    return teamsByContest.reduce((acc, team) => {
      const teamCoachData = coachesByTeams[team.id];
      const fullName = teamCoachData
        ? `${teamCoachData.first_name || ""} ${teamCoachData.last_name || ""}`.trim()
        : "N/A";
      return { ...acc, [team.id]: fullName || "N/A" };
    }, {} as { [key: number]: string });
  }, [teamsByContest, coachesByTeams]);

  const teamAwards = useMemo(() => {
    return teamsByContest.reduce((acc, team) => {
      const teamAwardsData = awards[team.id];
      let awardString = "N/A";
      if (Array.isArray(teamAwardsData)) {
        awardString = teamAwardsData.map((award) => award.award_name).join(", ") || "N/A";
      } else if (teamAwardsData) {
        awardString = teamAwardsData.award_name || "N/A";
      }
      return { ...acc, [team.id]: awardString };
    }, {} as { [key: number]: string });
  }, [teamsByContest, awards]);

  const rows = useMemo(() => {
    return teamsByContest.map((team) => ({
      id: team.id,
      team_name: team.team_name,
      school_name: (team as any).school_name || "",
      team_rank: team.team_rank || 0,
      total_score: (team as any).preliminary_total_score ?? team.total_score ?? 0,
      coachName: coachNames[team.id] || "N/A",
      awards: teamAwards[team.id] || "N/A",
    }));
  }, [teamsByContest, coachNames, teamAwards]);

  const rankedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.total_score - a.total_score);
    return sorted.map((team, index) => ({
      ...team,
      team_rank: index + 1,
    }));
  }, [rows]);

  // ==============================
  // Celebration Effects
  // ==============================

  const hasPrelimResults = rankedRows.length > 0;

  useEffect(() => {
    if (!hasPrelimResults || hasCelebrated || activeTab !== "prelim") return;

    setHasCelebrated(true);

    requestAnimationFrame(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4caf50", "#ffeb99", "#C0C0C0", "#CD7F32", "#00a353"],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#4caf50", "#ffeb99", "#C0C0C0"],
        });
      }, 250);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#4caf50", "#ffeb99", "#C0C0C0"],
        });
      }, 400);
    });
  }, [hasPrelimResults, hasCelebrated, activeTab]);

  const championshipRows = useMemo(() => {
    const championshipTeams = teamsByContest.filter((team) => team.advanced_to_championship);
    const sorted = championshipTeams
      .map((team) => {
        const championshipScore =
          (team as any).championship_total_score ||
          (team as any).championship_score ||
          team.total_score ||
          0;
        return {
          id: team.id,
          team_name: team.team_name,
          school_name: (team as any).school_name || "",
          team_rank: 0,
          total_score: championshipScore,
          coachName: coachNames[team.id] || "N/A",
          awards: teamAwards[team.id] || "N/A",
        };
      })
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 6)
      .map((team, index) => ({
        ...team,
        team_rank: index + 1,
      }));
    return sorted;
  }, [teamsByContest, coachNames, teamAwards]);

  const redesignRows = useMemo(() => {
    const redesignTeams = teamsByContest.filter((team) => !team.advanced_to_championship);
    const sorted = redesignTeams
      .map((team) => ({
        id: team.id,
        team_name: team.team_name,
        school_name: (team as any).school_name || "",
        team_rank: 0,
        total_score:
          (team as any).redesign_total_score ||
          (team as any).redesign_score ||
          team.total_score ||
          0,
        coachName: coachNames[team.id] || "N/A",
        awards: teamAwards[team.id] || "N/A",
      }))
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 3)
      .map((team, index) => ({
        ...team,
        team_rank: index + 1,
      }));
    return sorted;
  }, [teamsByContest, coachNames, teamAwards]);

  // ==============================
  // Early Returns
  // ==============================

  if (isCoach && contest && contest.is_open === true) {
    return (
      <Container sx={{ mt: 3 }}>
        <Alert severity="info">Results will be visible after the contest ends.</Alert>
      </Container>
    );
  }

  // ==============================
  // Main Render
  // ==============================

  return (
    <>
      {/* Header & Navigation */}
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 3, sm: 5 },
          mt: 2,
          mb: 2,
        }}
      >
        <Box sx={{ mb: 1, mt: { xs: 1, sm: 2 } }}>
          <Button
            component={Link}
            to="/contestPage/"
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
            Back to Contests
          </Button>
        </Box>

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
              fontWeight: 400,
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              color: mainTitleColor, // dynamic: green for green theme, black otherwise
            }}
          >
            Contest Results
          </Typography>
        </Stack>

        {/* Tabs */}
        <Box sx={{ width: "100%", mt: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            sx={{
              borderBottom: `1px solid ${theme.palette.grey[300]}`,
              mb: 0,
              "& .MuiTabs-indicator": {
                backgroundColor: themePrimary,
              },
              "& .MuiTab-root.Mui-selected": {
                color: themePrimary,
                fontWeight: 700,
              },
              "& .MuiTab-root": {
                minHeight: 64,
                px: { xs: 1.5, sm: 2.5 },
              },
            }}
          >
            <Tab
              value="prelim"
              iconPosition="start"
              icon={<MilitaryTechIcon sx={{ fontSize: 26 }} />}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Preliminary</span>
                </Stack>
              }
            />

            {hasChampionshipAdvance && (
              <Tab
                value="championship"
                iconPosition="start"
                icon={<WorkspacePremiumIcon sx={{ fontSize: 26 }} />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                      Championship &amp; Redesign
                    </span>
                  </Stack>
                }
              />
            )}
            <Tab
              value="winners"
              iconPosition="start"
              icon={<EmojiEventsIcon sx={{ fontSize: 26 }} />}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Award Winners</span>
                </Stack>
              }
            />
            <Tab
              value="highlights"
              iconPosition="start"
              icon={<StarIcon sx={{ fontSize: 26 }} />}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Highlights</span>
                </Stack>
              }
            />
          </Tabs>
        </Box>
      </Container>

      {/* Preliminary */}
      {activeTab === "prelim" && (
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 3, sm: 5 },
            pt: { xs: 1, sm: 1 },
            pb: { xs: 3, sm: 4 },
            mb: 5,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" sx={sectionHeadingSx}>
              Preliminary Round – Top 6
            </Typography>
          </Box>

          {hasPrelimResults ? (
            <ContestResultsTable
              rows={rankedRows.slice(0, 6)}
              theme={resultsTheme}
              onThemeChange={setResultsTheme}
            />
          ) : isLoadingMapContestToTeam ? (
            <Typography
              sx={{
                textAlign: "center",
                color: "text.secondary",
                py: 6,
                fontSize: { xs: "0.95rem", sm: "1rem" },
              }}
            >
              Loading results…
            </Typography>
          ) : (
            <Typography
              sx={{
                textAlign: "center",
                color: "text.secondary",
                py: 6,
                fontSize: { xs: "0.95rem", sm: "1rem" },
              }}
            >
              No preliminary results available.
            </Typography>
          )}
        </Container>
      )}

      {/* Championship & Redesign */}
      {activeTab === "championship" && (
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 3, sm: 5 },
            pt: { xs: 1, sm: 1 },
            pb: { xs: 3, sm: 4 },
            mb: 5,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" sx={sectionHeadingSx}>
              Championship Round – Top 6
            </Typography>
          </Box>

          {championshipRows.length > 0 ? (
            <ContestResultsTable
              rows={championshipRows}
              theme={resultsTheme}
              onThemeChange={setResultsTheme}
            />
          ) : (
            <Typography
              sx={{
                textAlign: "center",
                color: "text.secondary",
                py: 6,
                fontSize: { xs: "0.95rem", sm: "1rem" },
              }}
            >
              No championship teams available.
            </Typography>
          )}

          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h5" sx={sectionHeadingSx}>
              Redesign Round – Top 3
            </Typography>
          </Box>

          {redesignRows.length > 0 ? (
            <ContestResultsTable
              rows={redesignRows}
              theme={resultsTheme}
              onThemeChange={setResultsTheme}
            />
          ) : (
            <Typography
              sx={{
                textAlign: "center",
                color: "text.secondary",
                py: 6,
                fontSize: { xs: "0.95rem", sm: "1rem" },
              }}
            >
              No redesign teams available.
            </Typography>
          )}
        </Container>
      )}

      {/* Award Winners */}
      {activeTab === "winners" && (
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 3, sm: 5 },
            pt: { xs: 1, sm: 1 },
            pb: { xs: 3, sm: 4 },
            mb: 5,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" sx={sectionHeadingSx}>
              Award Winners
            </Typography>
          </Box>

          <AwardWinners
            awards={rows
              .filter((team) => team.awards !== "N/A")
              .map((team) => ({
                id: team.id,
                team_name: team.team_name,
                award_name: team.awards,
              }))}
          />
        </Container>
      )}

      {/* Highlights */}
      {activeTab === "highlights" && (
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 3, sm: 5 },
            pt: { xs: 1, sm: 1 },
            pb: { xs: 3, sm: 4 },
            mb: 5,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" sx={sectionHeadingSx}>
              Contest Highlights
            </Typography>
          </Box>

          <ContestHighlightPage />
        </Container>
      )}
    </>
  );
}