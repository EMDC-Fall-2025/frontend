import { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import GavelIcon from "@mui/icons-material/Gavel";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import { useParams } from "react-router-dom";
import theme from "../../theme";
import { useMapContestToTeamStore } from "../../store/map_stores/mapContestToTeamStore";
import useContestJudgeStore from "../../store/map_stores/mapContestToJudgeStore";
import { useContestStore } from "../../store/primary_stores/contestStore";

export default function ContestHighlightPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const contestIdNumber = contestId ? parseInt(contestId, 10) : null;
  
  const { isLoadingContest } = useContestStore();
  const { teamsByContest, isLoadingMapContestToTeam } = useMapContestToTeamStore();
  
  // Use selector to get judges for this specific contest - this ensures reactivity
  const contestJudges = useContestJudgeStore((state) => state.contestJudges);
  const getAllJudgesByContestId = useContestJudgeStore((state) => state.getAllJudgesByContestId);
  const isLoadingMapContestJudge = useContestJudgeStore((state) => state.isLoadingMapContestJudge);

  // Get judges for this specific contest
  const judgesForContest = contestIdNumber ? (contestJudges[contestIdNumber] || []) : [];

  const [totalTeams, setTotalTeams] = useState<number>(0);
  const [totalJudges, setTotalJudges] = useState<number>(0);
  const [mostPointsTeam, setMostPointsTeam] = useState<string>("N/A");

  // Fetch judges for the contest when contestId is available - force refresh to get latest data
  useEffect(() => {
    if (contestIdNumber) {
      getAllJudgesByContestId(contestIdNumber, true); // Force refresh to get latest count
    }
  }, [contestIdNumber, getAllJudgesByContestId]);

  // Count total teams
  useEffect(() => {
    if (teamsByContest && teamsByContest.length > 0) {
      setTotalTeams(teamsByContest.length);

      // Find team with the highest total_score
      const highest = teamsByContest.reduce((max, t) =>
        t.total_score > (max?.total_score || 0) ? t : max, teamsByContest[0]
      );
      if (highest) setMostPointsTeam(`${highest.team_name} – ${highest.total_score}`);
    } else {
      setTotalTeams(0);
    }
  }, [teamsByContest]);

  // Count total judges - deduplicate by judge ID to ensure accurate count
  useEffect(() => {
    if (judgesForContest && judgesForContest.length > 0) {
      // Deduplicate judges by ID in case of duplicates
      const uniqueJudges = Array.from(
        new Map(judgesForContest.map(judge => [judge.id, judge])).values()
      );
      setTotalJudges(uniqueJudges.length);
    } else {
      setTotalJudges(0);
    }
  }, [judgesForContest]);

  if (isLoadingContest || isLoadingMapContestToTeam || isLoadingMapContestJudge) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const highlights = [
    {
      id: 1,
      title: "Number of Participating Teams",
      value: totalTeams,
      iconBg: theme.palette.success.light + "55",
      icon: <GroupsIcon sx={{ fontSize: 40, color: theme.palette.success.dark, mb: 1 }} />,
    },
    {
      id: 2,
      title: "Number of Judges",
      value: totalJudges,
      iconBg: theme.palette.warning.light + "55",
      icon: <GavelIcon sx={{ fontSize: 40, color: theme.palette.warning.dark, mb: 1 }} />,
    },
    {
      id: 3,
      title: "Most Points",
      value: mostPointsTeam,
      iconBg: theme.palette.primary.light + "55",
      icon: <MilitaryTechIcon sx={{ fontSize: 40, color: theme.palette.primary.dark, mb: 1 }} />,
    },
  ];

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: 2 }}>
      <Grid container spacing={3} justifyContent="center" alignItems="stretch">
        {highlights.map((item) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={item.id}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Card
              elevation={4}
              sx={{
                width: "100%",
                maxWidth: 330,
                borderRadius: 4,
                backgroundColor: theme.palette.background.paper,
                textAlign: "center",
                p: 2,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    backgroundColor: item.iconBg,
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  {item.icon}
                </Box>

                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    mb: 1,
                    color: theme.palette.text.primary,
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.success.main,
                  }}
                >
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
