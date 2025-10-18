import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Container } from "@mui/material";
import theme from "../theme";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import useSpecialAwardStore from "../store/map_stores/mapAwardToTeamStore";
import { useMapCoachToTeamStore } from "../store/map_stores/mapCoachToTeamStore";
import ContestResultsTable from "../components/Tables/ContestResultsTable"; 
// FILE OVERVIEW: Page for displaying the contest results

export default function ContestScores() {
  // Extract contestId from URL params and convert it to a number
  const { contestId } = useParams<{ contestId: string }>();
  const contestIdNumber = contestId ? parseInt(contestId, 10) : null;

  const {
    teamsByContest,
    fetchTeamsByContest,
    clearTeamsByContest,
    clearContests,
  } = useMapContestToTeamStore();

  const { awards, AwardsByTeamTable } = useSpecialAwardStore();
  const { coachesByTeams, fetchCoachesByTeams } = useMapCoachToTeamStore();

  // Local state to store fetched coach names and awards
  const [coachNames, setCoachNames] = useState<{ [key: number]: string }>({});
  const [teamAwards, setTeamAwards] = useState<{ [key: number]: string }>({});

  // Fetch teams by contest
  useEffect(() => {
    if (contestIdNumber) {
      fetchTeamsByContest(contestIdNumber);
    }
    return () => {
      clearTeamsByContest();
      clearContests();
    };
  }, [contestIdNumber]);

  // Fetch coaches and awards
  useEffect(() => {
    if (teamsByContest.length > 0) {
      // Format team data for fetching coaches
      const teamData = teamsByContest.map((team) => ({ id: team.id }));
      fetchCoachesByTeams(teamData);

      // Fetch awards for each team
      teamsByContest.forEach((team) => {
        AwardsByTeamTable(team.id);
      });
    }
  }, [teamsByContest]);

  // Update state with coach names and team awards
  useEffect(() => {
    // Map team ID to coach names
    const newCoachNames = teamsByContest.reduce((acc, team) => {
      const teamCoachData = coachesByTeams[team.id];
      const fullName = teamCoachData
        ? `${teamCoachData.first_name || ""} ${teamCoachData.last_name || ""}`.trim()
        : "N/A";
      return { ...acc, [team.id]: fullName || "N/A" };
    }, {});

    // Map team ID to awards
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

    // Update local state
    setCoachNames(newCoachNames);
    setTeamAwards(newTeamAwards);
  }, [awards, coachesByTeams, teamsByContest]);

  // Transform teamsByContest into rows
  const rows = teamsByContest.map((team) => ({
    id: team.id,
    team_name: team.team_name,
    school_name: (team as any).school_name || "",
    team_rank: team.team_rank || 0,
    total_score: team.total_score,
    coachName: coachNames[team.id] || "N/A",
    awards: teamAwards[team.id] || "N/A",
  }));

  return (
    <>
      <Typography 
        variant="h1" 
        sx={{ 
          ml: { xs: 2, sm: "2%" }, 
          mt: 4, 
          mb: 4,
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" }
        }}
      >
        Contest Results
      </Typography>

      {/* Back link to contest page */}
      <Link to="/contestPage/" style={{ textDecoration: "none", color: "inherit" }}>
        <Typography 
          variant="body2" 
          sx={{ 
            ml: { xs: 2, sm: 2 }, 
            mt: 2,
            fontSize: { xs: "0.875rem", sm: "1rem" }
          }}
        >
          {"<"} Back to Contests {" "}
        </Typography>
      </Link>

      <Container
        maxWidth="lg"
        sx={{
          width: { xs: "100%", sm: "90vw" },
          padding: { xs: 2, sm: 3 },
          bgcolor: theme.palette.secondary.light,
          ml: { xs: 0, sm: "2%" },
          mx: { xs: 2, sm: "auto" },
          borderRadius: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Render the ContestResultsTable component */}
        <ContestResultsTable rows={rows} />
      </Container>
    </>
  );
}