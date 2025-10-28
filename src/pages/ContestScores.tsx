// ContestScores.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Container, Tabs, Tab, Box, Stack } from "@mui/material";
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

export default function ContestScores() {
  const { contestId } = useParams<{ contestId: string }>();
  const contestIdNumber = contestId ? parseInt(contestId, 10) : null;
  const { fetchContestById } = useContestStore();
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

  const championshipRows = [
    { id: 1, team_name: "Nexus", team_rank: 1, total_score: 188, coachName: "Coach A", awards: "Champion" },
    { id: 2, team_name: "Robo", team_rank: 2, total_score: 176, coachName: "Coach B", awards: "Runner-Up" },
    { id: 3, team_name: "Team3", team_rank: 3, total_score: 170, coachName: "Coach 3", awards: "N/A" },
    { id: 4, team_name: "Team4", team_rank: 4, total_score: 162, coachName: "Coach 4", awards: "N/A" },
    { id: 5, team_name: "Team5", team_rank: 5, total_score: 158, coachName: "Coach 5", awards: "N/A" },
    { id: 6, team_name: "Team6", team_rank: 6, total_score: 150, coachName: "Coach 6", awards: "N/A" },
  ];

  const redesignRows = [
    { id: 1, team_name: "Vertex", team_rank: 1, total_score: 95, coachName: "Coach C", awards: "N/A" },
    { id: 2, team_name: "Tech", team_rank: 2, total_score: 92, coachName: "Coach E", awards: "N/A" },
    { id: 3, team_name: "Team3", team_rank: 3, total_score: 90, coachName: "Coach 3", awards: "N/A" },
  ];

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
        <Stack spacing={1} sx={{ mb: 1 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: "2rem",
              fontWeight: 800,
            }}
          >
            Contest Results
          </Typography>
        </Stack>

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
            border: `1px solid ${theme.palette.grey[300]}`,
            borderRadius: 4,
            backgroundColor: "#fff",
            p: 4,
            mb: 5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 3, textAlign: "center", fontSize: "1.3rem" }}
          >
            Preliminary Round – Top 6
          </Typography>
          {rows.length > 0 ? (
            <ContestResultsTable rows={rows.slice(0, 6)} />
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
            border: `1px solid ${theme.palette.grey[300]}`,
            borderRadius: 4,
            backgroundColor: "#fff",
            p: 4,
            mb: 5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 3, textAlign: "center", fontSize: "1.3rem" }}
          >
            Championship Round - Top 6
          </Typography>
          <ContestResultsTable rows={championshipRows} />

          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 3, textAlign: "center", mt: 5, fontSize: "1.3rem" }}
          >
            Redesign Round – Top 3
          </Typography>
          <ContestResultsTable rows={redesignRows} />
        </Container>
      )}

      {/* Award Winners Tab */}
      {activeTab === "winners" && (
        <Container
          maxWidth="lg"
          sx={{
            border: `1px solid ${theme.palette.grey[300]}`,
            borderRadius: 4,
            backgroundColor: "#fff",
            p: 4,
            mb: 5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 3, textAlign: "center", fontSize: "1.3rem" }}
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
            border: `1px solid ${theme.palette.grey[300]}`,
            borderRadius: 4,
            backgroundColor: "#fff",
            p: 4,
            mb: 5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 3, textAlign: "center", fontSize: "1.3rem" }}
          >
            Contest Highlights
          </Typography>
          <ContestHighlightPage />
        </Container>
      )}
    </>
  );
}
