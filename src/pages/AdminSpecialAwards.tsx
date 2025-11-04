import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Box,
  TextField,
  Container,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Link } from "react-router-dom";
import theme from "../theme";
import useSpecialAwardStore, { SpecialAward } from "../store/map_stores/mapAwardToTeamStore";

export default function AdminSpecialAwardsPage() {
  const {
    awards,
    isLoading,
    error,
    getAllAwards,
    createAward,
    deleteAward,
    updateAward,
  } = useSpecialAwardStore();

  // State variables
  const [awardName, setAwardName] = useState("");
  const [isJudge, setIsJudge] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [editingAward, setEditingAward] = useState<SpecialAward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getAllAwards();
  }, []);

  // Toggle logic to ensure only one option is selected
  const handleJudgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsJudge(isChecked);
    if (isChecked) setIsVoted(false);
  };

  const handleVotedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsVoted(isChecked);
    if (isChecked) setIsJudge(false);
  };

  // Create a new award
  const handleCreateAward = async () => {
    if (awardName) {
      const payload = { teamid: 0, award_name: awardName, isJudge: isJudge };
      await createAward(payload);
      setAwardName("");
      setIsJudge(false);
      setIsVoted(false);
      getAllAwards();
    }
  };

  // Delete an award
  const handleDeleteAward = async (teamid: number, award_name: string) => {
    await deleteAward(teamid, award_name);
    getAllAwards();
  };

  // Edit an award
  const handleEditAward = (award: SpecialAward) => {
    setEditingAward(award);
    setAwardName(award.award_name);
    setIsJudge(award.isJudge);
    setIsVoted(!award.isJudge);
    setIsModalOpen(true);
  };

  // Update an award
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
    <Container
      maxWidth="lg"
      sx={{
        px: { xs: 3, sm: 5 },
        mt: 5,
        mb: 2,
      }}
    >
      {/* Back to Admin  */}
      <Link
        to="/admin/"
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
            "&:hover": { color: theme.palette.primary.main },
          }}
        >
          {"<"} Back to Admin Dashboard{" "}
        </Typography>
      </Link>

      {/* Aligned Title */}
      <Typography
        variant="h1"
        sx={{
          fontSize: "2rem",
          fontWeight: 800,
          color: theme.palette.primary.main,
          mb: 3,
        }}
      >
        Special Awards Management
      </Typography>

      {/* Award name input */}
      <TextField
        label="Award Name"
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
        label="Voted by Teams"
      />

      {/* Create or Update award button */}
      {editingAward ? (
        <Button variant="contained" onClick={handleUpdateAward} sx={{ mb: 2, display: "block" }}>
          Update Award
        </Button>
      ) : (
        <Button variant="contained" onClick={handleCreateAward} sx={{ mb: 2, display: "block" }}>
          Create Award
        </Button>
      )}

      {isLoading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      {/* List of all awards */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4">All Awards</Typography>
        {Array.isArray(awards) && awards.length > 0 ? (
          awards.map((award) => (
            <Box
              key={`${award.teamid}-${award.award_name}`}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                border: "1px solid #ddd",
                borderRadius: 2,
                mb: 1,
              }}
            >
              <Box>
                <Typography variant="h6">{award.award_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {award.isJudge ? "Assigned by Judge" : "Voted by Teams"}
                </Typography>
              </Box>
              <Box>
                <Button color="primary" onClick={() => handleEditAward(award)}>
                  Edit
                </Button>
                <Button color="error" onClick={() => handleDeleteAward(award.teamid, award.award_name)}>
                  Delete
                </Button>
              </Box>
            </Box>
          ))
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
            label="Voted by Teams"
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
