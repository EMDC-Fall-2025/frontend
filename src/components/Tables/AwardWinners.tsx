// src/components/Tables/AwardWinners.tsx
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import theme from "../../theme";

interface Award {
  id: number;
  award_name: string;
  team_name: string;
  isJudge?: boolean;
}

export default function AwardWinners({ awards }: { awards: Award[] }) {
  const allAwards = awards || [];

  if (allAwards.length === 0) {
    return (
      <Typography
        align="center"
        sx={{ mt: 4, fontWeight: 500, color: theme.palette.text.secondary }}
      >
        No awards have been assigned yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: 2 }}>
      <Grid
        container
        spacing={3}
        justifyContent="center"
        alignItems="stretch"
        sx={{ display: "flex", flexWrap: "wrap" }}
      >
        {allAwards.flatMap((award) =>
          award.award_name.split(",").map((name, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={`${award.id}-${index}`}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <Card
                elevation={4}
                sx={{
                  width: "100%",
                  maxWidth: 320,
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
                  {/* EMDC-styled icon circle */}
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.success.light + "55", // same as ContestHighlight
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    <EmojiEventsIcon
                      sx={{
                        fontSize: 40,
                        color: theme.palette.success.dark,
                        mb: 1,
                      }}
                    />
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
                    {name.trim()}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: theme.palette.primary.main,
                    }}
                  >
                    {award.team_name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
