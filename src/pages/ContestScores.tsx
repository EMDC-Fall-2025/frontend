// ContestScores.tsx
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Container, Tabs, Tab, Box, Stack, Alert, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import theme from "../theme";
import confetti from "canvas-confetti";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import useSpecialAwardStore from "../store/map_stores/mapAwardToTeamStore";
import { useMapCoachToTeamStore } from "../store/map_stores/mapCoachToTeamStore";
import ContestResultsTable from "../components/Tables/ContestResultsTable";
import AwardWinners from "../components/Tables/AwardWinners";
import ContestHighlightPage from "../components/Tables/ContestHighlight";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import StarIcon from "@mui/icons-material/Star";
import { useContestStore } from "../store/primary_stores/contestStore";
import { useMapClusterToContestStore } from "../store/map_stores/mapClusterToContestStore";
import useContestJudgeStore from "../store/map_stores/mapContestToJudgeStore";
import { useAuthStore } from "../store/primary_stores/authStore";

export default function ContestScores() {
  const { contestId } = useParams<{ contestId: string }>();
  const contestIdNumber = contestId ? parseInt(contestId, 10) : null;
  const { role } = useAuthStore();
  const isCoach = role?.user_type === 4;
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

  const [activeTab, setActiveTab] = useState("prelim");
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const lastContestIdRef = useRef<number | null>(null);

  // Check if championship advancement has occurred (memoized)
  const hasChampionshipAdvance = useMemo(
    () => teamsByContest.some((team) => team.advanced_to_championship === true),
    [teamsByContest]
  );

  // Fetch data on mount or contest change - fetchTeamsByContest uses cache internally for instant display
  useEffect(() => {
    if (!contestIdNumber) return;

    lastContestIdRef.current = contestIdNumber;

    // Fetch all data in parallel 
    Promise.all([
      fetchTeamsByContest(contestIdNumber), // Uses cache if available for instant render
      fetchContestById(contestIdNumber),
      fetchClustersByContestId(contestIdNumber),
      getAllJudgesByContestId(contestIdNumber),
    ]).catch((error) => {
      console.error("Error fetching contest data:", error);
    });
  }, [contestIdNumber, fetchTeamsByContest, fetchContestById, fetchClustersByContestId, getAllJudgesByContestId]);

  // Fetch coaches and awards only for teams missing data (optimized)
  useEffect(() => {
    if (teamsByContest.length === 0) return;

    const teamData = teamsByContest.map((team) => ({ id: team.id }));
    
    // Only fetch coaches for teams that don't have coach data
    const teamsNeedingCoaches = teamData.filter((team) => !coachesByTeams[team.id]);
    if (teamsNeedingCoaches.length > 0) {
      fetchCoachesByTeams(teamsNeedingCoaches);
    }
    
    // Only fetch awards for teams that don't have award data
    teamsByContest.forEach((team) => {
      if (!awards[team.id]) {
        AwardsByTeamTable(team.id);
      }
    });
  }, [teamsByContest, coachesByTeams, awards, fetchCoachesByTeams, AwardsByTeamTable]);

  // Memoize coach names and awards computation for instant rendering
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

  // Memoize rows computation for instant rendering
  const rows = useMemo(() => {
    return teamsByContest.map((team) => ({
      id: team.id,
      team_name: team.team_name,
      school_name: (team as any).school_name || "",
      team_rank: team.team_rank || 0,
      // Use preliminary_total_score for preliminary results 
 
      total_score: (team as any).preliminary_total_score ?? team.total_score ?? 0,
      coachName: coachNames[team.id] || "N/A",
      awards: teamAwards[team.id] || "N/A",
    }));
  }, [teamsByContest, coachNames, teamAwards]);

  // Memoize ranked rows to prevent recalculation
  const rankedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.total_score - a.total_score);
    return sorted.map((team, index) => ({
      ...team,
      team_rank: index + 1
    }));
  }, [rows]);

  // Trigger celebration sprinklers on first load when results are available
  useEffect(() => {
    if (rankedRows.length > 0 && !hasCelebrated && activeTab === "prelim") {
      // Main confetti burst from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4caf50', '#ffeb99', '#C0C0C0', '#CD7F32', '#00a353']
      });
      
      // Left side burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#4caf50', '#ffeb99', '#C0C0C0']
        });
      }, 250);
      
      // Right side burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4caf50', '#ffeb99', '#C0C0C0']
        });
      }, 400);
      
      setHasCelebrated(true);
    }
  }, [rankedRows.length, hasCelebrated, activeTab]);

  // Memoize championship rows for instant rendering
  const championshipRows = useMemo(() => {
    const championshipTeams = teamsByContest.filter((team) => team.advanced_to_championship);
    return championshipTeams
      .map((team) => {
        const championshipScore = (team as any).championship_total_score || (team as any).championship_score || team.total_score || 0;
        return {
          id: team.id,
          team_name: team.team_name,
          school_name: (team as any).school_name || "",
          team_rank: (team as any).championship_rank || 0,
          total_score: championshipScore,
          coachName: coachNames[team.id] || "N/A",
          awards: teamAwards[team.id] || "N/A",
        };
      })
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 6);
  }, [teamsByContest, coachNames, teamAwards]);

  // Memoize redesign rows for instant rendering
  const redesignRows = useMemo(() => {
    const redesignTeams = teamsByContest.filter((team) => !team.advanced_to_championship);
    return redesignTeams
      .map((team) => ({
        id: team.id,
        team_name: team.team_name,
        school_name: (team as any).school_name || "",
        team_rank: (team as any).redesign_rank || 0,
        total_score: (team as any).redesign_total_score || (team as any).redesign_score || team.total_score || 0,
        coachName: coachNames[team.id] || "N/A",
        awards: teamAwards[team.id] || "N/A",
      }))
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 3);
  }, [teamsByContest, coachNames, teamAwards]);

  if (isCoach && contest && contest.is_open === true) {
    return (
      <Container sx={{ mt: 3 }}>
        <Alert severity="info">Results will be visible after the contest ends.</Alert>
      </Container>
    );
  }

  return (
    <>
      {/* Page Title */}
      <Container
        maxWidth="lg"
        sx={{
          px: { xs: 3, sm: 5 },
          mt: 2,
          mb: 2,
        }}
      >

        {/* Back link */}
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
            }}
          >
            Contest Results
          </Typography>
        </Stack>

        {/* Tabs Section */}
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
                      Championship & Redesign
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

      {/* Prelim Tab */}
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
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 2, 
              mt: 0,
              textAlign: "center", 
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Preliminary Round – Top 6
          </Typography>
          {rankedRows.length > 0 ? (
            <ContestResultsTable rows={rankedRows.slice(0, 6)} />
          ) : !isLoadingMapContestToTeam ? (
            <Typography 
              sx={{ 
                textAlign: "center", 
                color: "text.secondary", 
                py: 6,
                fontSize: { xs: "0.95rem", sm: "1rem" }
              }}
            >
              No preliminary results available.
            </Typography>
          ) : null}
        </Container>
      )}

      {/* Championship/Redesign Tab */}
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
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 2, 
              mt: 0,
              textAlign: "center", 
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Championship Round - Top 6
          </Typography>
          {championshipRows.length > 0 ? (
            <ContestResultsTable rows={championshipRows} />
          ) : (
            <Typography 
              sx={{ 
                textAlign: "center", 
                color: "text.secondary", 
                py: 6,
                fontSize: { xs: "0.95rem", sm: "1rem" }
              }}
            >
              No championship teams available.
            </Typography>
          )}

          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 2, 
              textAlign: "center", 
              mt: 3, 
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Redesign Round – Top 3
          </Typography>
          {redesignRows.length > 0 ? (
            <ContestResultsTable rows={redesignRows} />
          ) : (
            <Typography 
              sx={{ 
                textAlign: "center", 
                color: "text.secondary", 
                py: 6,
                fontSize: { xs: "0.95rem", sm: "1rem" }
              }}
            >
              No redesign teams available.
            </Typography>
          )}
        </Container>
      )}

      {/* Award Winners Tab */}
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
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 2, 
              mt: 0,
              textAlign: "center", 
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Award Winners
          </Typography>
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

      {/* Highlights Tab */}
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
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 2, 
              mt: 0,
              textAlign: "center", 
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Contest Highlights
          </Typography>
          <ContestHighlightPage />
        </Container>
      )}
    </>
  );
}
