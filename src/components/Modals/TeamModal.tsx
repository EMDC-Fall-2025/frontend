/**
 * TeamModal Component
 * 
 * Modal for creating and editing teams with modern theme styling.
 * Features:
 * - Clean white background with subtle borders
 * - Green success theme for buttons
 * - Consistent typography with bold titles
 * - Modern form styling with proper spacing
 */
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useTeamStore } from "../../store/primary_stores/teamStore";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";

export interface ITeamModalProps {
  open: boolean;
  handleClose: () => void;
  mode: "new" | "edit";
  clusters?: any[];
  contestId?: number;
  teamData?: {
    id: number;
    team_name: string;
    clusterid: number;
    username: string;
    first_name: string;
    last_name: string;
    contestid: number;
  };
}

export default function TeamModal(props: ITeamModalProps) {
  const { handleClose, open, mode, clusters, contestId, teamData } = props;
  const [teamName, setTeamName] = useState("");
  const [cluster, setCluster] = useState(-1);
  const [coachFirstName, setCoachFirstName] = useState("");
  const [coachLastName, setCoachLastName] = useState("");
  const [coachEmail, setCoachEmail] = useState("");
  const { createTeam, editTeam } = useTeamStore();
  const { getTeamsByClusterId } = useMapClusterTeamStore();

  const title = mode === "new" ? "New Team" : "Edit Team";

  /**
   * Create a new team with coach account and assign to contest/cluster
   * Initializes all scores to 0 and creates coach login credentials
   */
  const handleCreateTeam = async () => {
    if (contestId) {
      try {
        // Create team with initial scores and coach information
        await createTeam({
          team_name: teamName,
          journal_score: 0,
          presentation_score: 0,
          machinedesign_score: 0,
          penalties_score: 0,
          total_score: 0,
          redesign_score: 0,
          championship_score: 0,
          clusterid: cluster,
          username: coachEmail,
          password: "password",
          first_name: coachFirstName || "n/a",
          last_name: coachLastName || "n/a",
          contestid: contestId,
        });
        
        // Refresh team lists for all clusters in the contest
        if (clusters) {
          for (const cluster of clusters) {
            await getTeamsByClusterId(cluster.id);
          }
        }
        toast.success("Team created successfully!");
        handleCloseModal();
      } catch (error: any) {
        // Handle team creation errors with user-friendly messages
        let errorMessage = "";
        
        // Extract error message from various possible response structures
        if (error?.response?.data) {
          const data = error.response.data;
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.error && typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.detail && typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (data.message && typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (data.errors && typeof data.errors === 'object') {
            // Handle Django-style error objects
            errorMessage = JSON.stringify(data.errors);
          }
        } else if (error?.message && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        
        if (errorMessage.toLowerCase().includes("already exists") || 
            errorMessage.toLowerCase().includes("duplicate") ||
            errorMessage.toLowerCase().includes("username") && errorMessage.toLowerCase().includes("taken")) {
          toast.error("Account already exists in the system");
        } else {
          toast.error("Failed to create team. Please try again.");
        }
      }
    }
  };

  /**
   * Update existing team information and coach details
   * Preserves team ID while updating name, cluster, and coach information
   */
  const handleEditTeam = async () => {
    try {
      // Update team with current form values
      await editTeam({
        id: teamData?.id ?? 0,
        team_name: teamName,
        clusterid: cluster,
        username: coachEmail,
        first_name: coachFirstName,
        last_name: coachLastName,
        contestid: contestId ?? 0,
      });

      // Refresh team lists for all clusters to reflect changes
      if (clusters) {
        for (const cluster of clusters) {
          await getTeamsByClusterId(cluster.id);
        }
      }

      toast.success("Team updated successfully!");
      handleCloseModal();
    } catch (error: any) {
      // Handle team update errors
      toast.error("Failed to update team. Please try again.");
    }
  };

  const handleCloseModal = () => {
    handleClose();
    setCluster(-1);
    setCoachEmail("");
    setCoachFirstName("");
    setCoachLastName("");
    setTeamName("");
  };

  useEffect(() => {
    if (teamData) {
      setCoachFirstName(teamData.first_name);
      setCoachLastName(teamData.last_name);
      setCoachEmail(teamData.username);
      setTeamName(teamData.team_name);
      setCluster(teamData.clusterid);
    }
  }, [teamData]);

  const buttonText = mode === "new" ? "Create Team" : "Update Team";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "new") {
      handleCreateTeam();
    } else {
      handleEditTeam();
    }
  };

  return (
    <Modal
      open={open}
      handleClose={handleCloseModal}
      title={title}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <TextField
          required
          label="Team Name"
          variant="outlined"
          value={teamName}
          onChange={(e: any) => setTeamName(e.target.value)}
          sx={{ mt: 1, width: 300 }}
        />
        <FormControl
          required
          sx={{
            width: 300,
            mt: 3,
          }}
        >
          <InputLabel>Cluster</InputLabel>
          <Select
            value={cluster}
            label="Cluster"
            sx={{ textAlign: "left" }}
            onChange={(e) => setCluster(Number(e.target.value))}
          >
            {clusters?.map((clusterItem) => (
              <MenuItem key={clusterItem.id} value={clusterItem.id}>
                {clusterItem.cluster_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Coach First Name"
          variant="outlined"
          value={coachFirstName}
          onChange={(e: any) => setCoachFirstName(e.target.value)}
          sx={{ mt: 3, width: 300 }}
        />
        <TextField
          label="Coach Last Name"
          variant="outlined"
          value={coachLastName}
          onChange={(e: any) => setCoachLastName(e.target.value)}
          sx={{ mt: 3, width: 300 }}
        />
        <TextField
          required
          label="Coach Email"
          variant="outlined"
          value={coachEmail}
          onChange={(e: any) => setCoachEmail(e.target.value)}
          sx={{ mt: 3, width: 300 }}
        />
        {/* Submit button - updated to use modern green success theme */}
        <Button
          type="submit"
          sx={{
            width: 150,
            height: 44,                                    // Consistent height (was 35)
            bgcolor: theme.palette.success.main,          // Green theme (was primary.main)
            "&:hover": { bgcolor: theme.palette.success.dark }, // Hover effect
            color: "#fff",                                // White text (was secondary.main)
            mt: 3,
            textTransform: "none",                        // No uppercase transformation
            borderRadius: 2,                              // Modern border radius
          }}
        >
          {buttonText}
        </Button>
      </form>
    </Modal>
  );
}