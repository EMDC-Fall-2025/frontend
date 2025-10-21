// src/components/AwardWinners.tsx
import { Grid, Card, CardContent, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupIcon from "@mui/icons-material/Group";
import StarIcon from "@mui/icons-material/Star";
import FavoriteIcon from "@mui/icons-material/Favorite";
import theme from "../../theme";

interface Award {
  id: number;
  award_name: string;
  team_name: string;
}

export default function AwardWinners({ awards }: { awards: Award[] }) {
  // placeholder awards
  const placeholderAwards: Award[] = [
    { id: -1, award_name: "Best Overall Design", team_name: "Quantum" },
    { id: -2, award_name: "Best Team Collaboration", team_name: "Pulse" },
    { id: -3, award_name: "Fan Favorite", team_name: "Maxis" },
    { id: -4, award_name: "Underdog Award", team_name: "Orion" },
  ];

  //icons place holder
  const placeholderIcons = [
    <EmojiEventsIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />,
    <GroupIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />,
    <StarIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />,
    <FavoriteIcon sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />,
  ];

  //display 4 awards
  const displayAwards: Award[] = [
    ...awards,
    ...placeholderAwards.slice(0, Math.max(0, 4 - awards.length)),
  ].slice(0, 4);

  return (
    <Grid container spacing={3}>
      {displayAwards.map((award, index) => (
        <Grid item xs={12} sm={6} key={index}> 
          <Card
            sx={{
              borderRadius: 3,
              backgroundColor: theme.palette.success.light + "22",
              textAlign: "center",
              p: 3,
              height: "auto"
            }}
          >
            <CardContent>
              
              {award.id < 0
                ? placeholderIcons[index % placeholderIcons.length]
                : <EmojiEventsIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              }

              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                {award.award_name}
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, color: theme.palette.success.main }}
              >
                {award.team_name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
