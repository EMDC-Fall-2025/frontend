// ContestScores.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Container, Tabs, Tab, Box, Stack, Alert } from "@mui/material";
import theme from "../theme";
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
    clearTeamsByContest,
    clearContests,
  } = useMapContestToTeamStore();

  const { awards, AwardsByTeamTable } = useSpecialAwardStore();
  const { coachesByTeams, fetchCoachesByTeams } = useMapCoachToTeamStore();

  const [coachNames, setCoachNames] = useState<{ [key: number]: string }>({});
  const [teamAwards, setTeamAwards] = useState<{ [key: number]: string }>({});
  const [activeTab, setActiveTab] = useState("prelim");
  // Check if championship advancement has occurred

  const hasChampionshipAdvance = teamsByContest.some((team) => team.advanced_to_championship === true);

  useEffect(() => {
    if (contestIdNumber) {
      fetchTeamsByContest(contestIdNumber);
      fetchContestById(contestIdNumber);
      fetchClustersByContestId(contestIdNumber);
      getAllJudgesByContestId(contestIdNumber);
      fetchTeamsByContest(contestIdNumber);
    }
    return () => {
      clearTeamsByContest();
      clearContests();
    };
  }, [contestIdNumber]);

  useEffect(() => {
    if (teamsByContest.length > 0) {
      const teamData = teamsByContest.map((team) => ({ id: team.id }));
      fetchCoachesByTeams(teamData);
      teamsByContest.forEach((team) => {
        AwardsByTeamTable(team.id);
      });
    }
  }, [teamsByContest]);

  useEffect(() => {
    const newCoachNames = teamsByContest.reduce((acc, team) => {
      const teamCoachData = coachesByTeams[team.id];
      const fullName = teamCoachData
        ? `${teamCoachData.first_name || ""} ${teamCoachData.last_name || ""}`.trim()
        : "N/A";
      return { ...acc, [team.id]: fullName || "N/A" };
    }, {});

    const newTeamAwards = teamsByContest.reduce((acc, team) => {
      const teamAwardsData = awards[team.id];
      let awardString = "N/A";
      if (Array.isArray(teamAwardsData)) {
        awardString = teamAwardsData.map((award) => award.award_name).join(", ") || "N/A";
      } else if (teamAwardsData) {
        awardString = teamAwardsData.award_name || "N/A";
      }
      return { ...acc, [team.id]: awardString };
    }, {});

    setCoachNames(newCoachNames);
    setTeamAwards(newTeamAwards);
  }, [awards, coachesByTeams, teamsByContest]);

  const rows = teamsByContest.map((team) => ({
    id: team.id,
    team_name: team.team_name,
    school_name: (team as any).school_name || "",
    team_rank: team.team_rank || 0,
    total_score: team.total_score,
    coachName: coachNames[team.id] || "N/A",
    awards: teamAwards[team.id] || "N/A",
  }));

  // Recalculate ranks to ensure no duplicates
  const sortedRows = [...rows].sort((a, b) => b.total_score - a.total_score);
  const rankedRows = sortedRows.map((team, index) => ({
    ...team,
    team_rank: index + 1
  }));

  // Championship teams - teams that advanced to championship
  const championshipTeams = teamsByContest.filter((team) => team.advanced_to_championship);

  const championshipRows = championshipTeams
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

  // Redesign teams - teams that did not advance to championship
  const redesignTeams = teamsByContest.filter((team) => !team.advanced_to_championship);

  const redesignRows = redesignTeams
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
          mt: 5,
          mb: 2,
        }}
      >

        {/* Back link */}
        <Link
          to="/contestPage/"
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "inline-block",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              fontSize: "1.05rem",
            }}
          >
            {"<"} Back to Contests{" "}
          </Typography>
        </Link>

        <Stack spacing={1} sx={{ mb: 1 }}>
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
        <Box sx={{ width: "100%", mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            sx={{
              borderBottom: `1px solid ${theme.palette.grey[300]}`,
              mb: 2,
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
            backgroundColor: "transparent",
            boxShadow: "none",
            border: "none",
            p: 4,
            mb: 5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 3, 
              textAlign: "center", 
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              fontFamily: '"DM Serif Display", "Georgia", serif',
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            Preliminary Round – Top 6
          </Typography>
          {rows.length > 0 ? (
            <ContestResultsTable rows={rankedRows.slice(0, 6)} />
          ) : (
            <Typography>No preliminary results available.</Typography>
          )}
        </Container>
      )}

      {/* Championship/Redesign Tab */}
      {activeTab === "championship" && (
        <Container
          maxWidth="lg"
          sx={{
            backgroundColor: "transparent",
            boxShadow: "none",
            border: "none",
            p: 4,
            mb: 5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 3, 
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
            <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
              No championship teams available.
            </Typography>
          )}

          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 3, 
              textAlign: "center", 
              mt: 5, 
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
            <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
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
            backgroundColor: "transparent",
            boxShadow: "none",
            border: "none",
            p: 4,
            mb: 5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 3, 
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
            backgroundColor: "transparent",
            boxShadow: "none",
            border: "none",
            p: 4,
            mb: 5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ 
              fontWeight: 400, 
              mb: 3, 
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
