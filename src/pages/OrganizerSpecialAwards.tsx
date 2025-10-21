import { useEffect, useState } from "react";
import {
  Typography,
  Link as MuiLink,
  Button,
  Box,
  Select,
  MenuItem,
  Container,
  CircularProgress,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import useSpecialAwardStore, { SpecialAward } from "../store/map_stores/mapAwardToTeamStore";
import { useTeamStore } from "../store/primary_stores/teamStore";
import { useNavigate } from "react-router-dom";
import theme from "../theme";

export default function OrganizerSpecialAwards() {
  const navigate = useNavigate();
  const {
    awards,
    isLoading,
    error,
    getAllAwards,
    createAward,
    updateAward,
    deleteAward
  } = useSpecialAwardStore();
  
  const {
    teams,
    fetchAllTeams,
    isLoadingTeam,
  } = useTeamStore();

  const [awardName, setAwardName] = useState("");
  const [isJudge, setIsJudge] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<SpecialAward | null>(null);

  useEffect(() => {
    getAllAwards(); 
    fetchAllTeams();
  }, []);

  //Create award 
  const handleCreateAward = async () => {
    if (awardName.trim()) {
      const payload = { teamid: 0, award_name: awardName.trim(), isJudge: isJudge };
      await createAward(payload);
      setIsJudge(false);
      setIsVoted(false);
      setAwardName("");
      getAllAwards();
    }
  };

  //Handles which team u have selected 
  const handleTeamSelect = (awardKey: string, teamId: string) => {
    setSelectedTeams((prev) => ({ ...prev, [awardKey]: teamId }));
  };

  //Assigns award to team
  const handleAssignToTeam = async (award: SpecialAward) => {
    const teamIdStr = selectedTeams[award.award_name];
    const teamId = parseInt(teamIdStr);
    if (!isNaN(teamId)) {
      const updatedAward = { ...award, teamid: teamId };
      await updateAward(award.teamid, award.award_name, updatedAward);
      getAllAwards();
    }
  };

  //Deletes an award
  const handleDeleteAward = async (award: SpecialAward) => {
    await deleteAward(award.teamid, award.award_name);
    getAllAwards(); 
  };

  //Change wether the award is assigned by a judge or by a organizer
  const handleJudgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsJudge(isChecked);
    if (isChecked) setIsVoted(false);
  };

  //Handles logic for changing the type of award
  const handleVotedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsVoted(isChecked);
    if (isChecked) setIsJudge(false);
  };
  
  //Edit an award
  const handleEditAward = (award: SpecialAward) => {
    setEditingAward(award);
    setAwardName(award.award_name);
    setIsJudge(award.isJudge);
    setIsVoted(!award.isJudge);
    setIsModalOpen(true);
  };

  //Logic for updating an award
  const handleUpdateAward = async () => {
    if (editingAward && awardName) {
      const updatedAward = {
        ...editingAward,
        award_name: awardName,
        isJudge: isJudge, 
      };
      await updateAward(editingAward.teamid, editingAward.award_name, updatedAward);
      setEditingAward(null);
      setAwardName("");
      setIsJudge(false);
      setIsVoted(false);
      setIsModalOpen(false);
      getAllAwards();
    }
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAward(null);
    setAwardName("");
    setIsJudge(false);
    setIsVoted(false);
  };

  return (
    <Container>
      <MuiLink onClick={() => navigate(-1)} sx={{ textDecoration: "none", cursor: "pointer" }}>
        <Typography variant="body2" sx={{ ml: 2, mt: 2 }}>
          {"<"} Back to Organizer
        </Typography>
      </MuiLink>
      <Typography variant="h4" sx={{ my: 4, ml: 2 }}>
        Organizer Awards Management
      </Typography>

      {/* Create New Organizer Award */}
      <Box sx={{ mb: 4 }}>
        <TextField
          label="New Award Name"
          variant="outlined"
          fullWidth
          value={awardName}
          onChange={(e) => setAwardName(e.target.value)}
          sx={{ mb: 2 }}
        />
        {/* Checkboxes for award type */}
        <FormControlLabel
          control={<Checkbox checked={isJudge} onChange={handleJudgeChange} />}
          label="Assigned by Judge"
        />
        <FormControlLabel
          control={<Checkbox checked={isVoted} onChange={handleVotedChange} />}
          label="Assigned by Organizer"
        />
        
        <Button variant="contained" onClick={handleCreateAward}>
          Create Organizer Award
        </Button>
      </Box>
      

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
                  Type of award: {award.isJudge ? "Assigned by Judge" : "Assigned by Organizer"} Assigned to Team:{" "} 
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
                  <Button color="primary" onClick={() => handleEditAward(award)}>
                    Edit
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => handleDeleteAward(award)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            );
          })
        ) : (
          <Typography>No awards found.</Typography>
        )}
      </Box>
      
      {/* Edit Award Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>Edit Award</DialogTitle>
        <DialogContent>
          <TextField
            label="Award Name"
            variant="outlined"
            fullWidth
            value={awardName}
            onChange={(e) => setAwardName(e.target.value)}
            sx={{ mb: 2, mt: 2 }}
          />
          <FormControlLabel
            control={<Checkbox checked={isJudge} onChange={handleJudgeChange} />}
            label="Assigned by Judge"
          />
          <FormControlLabel
            control={<Checkbox checked={isVoted} onChange={handleVotedChange} />}
            label="Assigned by Organizer"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleUpdateAward}>Update</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
