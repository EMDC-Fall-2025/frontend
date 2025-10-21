import { Grid, Card, CardContent, Typography } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups"; // 👥 Teams
import GavelIcon from "@mui/icons-material/Gavel"; // ⚖️ Judges
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech"; // 🏅 Most Points
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // 🏆 Most Awards
import theme from "../../theme";

export default function ContestHighlightPage() {
  // Placeholder (dummy) highlights
  const highlights = [
    { id: 1, title: "Number of Participation", value: "40 Teams" },
    { id: 2, title: "Number of Judges", value: "15" },
    { id: 3, title: "Most Points", value: "Nexus – 94.2" },
    { id: 4, title: "Most Awards", value: "Maxis" },
  ];

  // 🔹 Icons matching each highlight type
  const icons = [
    <GroupsIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />,
    <GavelIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />,
    <MilitaryTechIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />,
    <EmojiEventsIcon sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />,
  ];

  return (
    <Grid container spacing={3}>
      {highlights.map((item, index) => (
        <Grid item xs={12} sm={6} key={item.id}>
          <Card
            sx={{
              borderRadius: 3,
              backgroundColor: theme.palette.success.light + "22",
              textAlign: "center",
              p: 3,
              height: "auto",
            }}
          >
            <CardContent>
              {/* Icon */}
              {icons[index % icons.length]}

              {/* Title */}
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                {item.title}
              </Typography>

              {/* Value */}
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
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
  );
}
