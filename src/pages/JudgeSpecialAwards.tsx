import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  Container,
  CircularProgress,
  FormControl,
  InputLabel,
} from "@mui/material";
import useSpecialAwardStore, { SpecialAward } from "../store/map_stores/mapAwardToTeamStore";
import { useTeamStore } from "../store/primary_stores/teamStore";

export default function JudgeSpecialAwards() {
  const {
    awards,
    isLoading,
    error,
    getAwardsByRole,
    updateAward,
  } = useSpecialAwardStore();

  const {
    teams,
    fetchAllTeams,
    isLoadingTeam,
  } = useTeamStore();

  const [selectedTeams, setSelectedTeams] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    getAwardsByRole("True");
    fetchAllTeams();
  }, []);

  const handleTeamSelect = (awardKey: string, teamId: string) => {
    setSelectedTeams((prev) => ({ ...prev, [awardKey]: teamId }));
  };

  const handleAssignToTeam = async (award: SpecialAward) => {
    const teamIdStr = selectedTeams[award.award_name];
    const teamId = parseInt(teamIdStr);
    if (!isNaN(teamId)) {
      const updatedAward = { ...award, teamid: teamId };
      await updateAward(award.teamid, award.award_name, updatedAward);
      getAwardsByRole("True");
    }
  };

  return (
    <Container>
      <Typography 
        variant="h4" 
        sx={{ 
          my: 4,
          fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
          fontFamily: '"DM Serif Display", "Georgia", serif',
          fontWeight: 400,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
        }}
      >
        Assign Judge Awards to Teams
      </Typography>

      {(isLoading || isLoadingTeam) && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      <Box sx={{ mt: 3 }}>
        {Array.isArray(awards) && awards.length > 0 ? (
          awards.map((award) => {
            const awardKey = award.award_name;
            return (
              <Box
                key={awardKey}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6">{award.award_name}</Typography>
                  <Typography variant="body2">
                     Assigned to Team:{" "}
                    {teams.find((t) => t.id === award.teamid)?.team_name || "None"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Assign to Team</InputLabel>
                    <Select
                      value={selectedTeams[awardKey] || award.teamid?.toString() || ""}
                      onChange={(e) => handleTeamSelect(awardKey, e.target.value)}
                      label="Assign to Team"
                    >
                      {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.team_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={() => handleAssignToTeam(award)}
                    disabled={!selectedTeams[awardKey]}
                  >
                    Assign
                  </Button>
                </Box>
              </Box>
            );
          })
        ) : (
          <Typography>No awards found.</Typography>
        )}
      </Box>
    </Container>
  );
}
