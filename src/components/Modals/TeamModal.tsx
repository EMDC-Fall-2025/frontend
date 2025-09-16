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
  const { createTeam, editTeam, teamError } = useTeamStore();
  const { getTeamsByClusterId } = useMapClusterTeamStore();

  const title = mode === "new" ? "New Team" : "Edit Team";

  const handleCreateTeam = async () => {
    if (contestId) {
      try {
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
        if (clusters) {
          for (const cluster of clusters) {
            await getTeamsByClusterId(cluster.id);
          }
        }
        handleCloseModal();
      } catch (error) {
        console.error("Failed to create team", error);
      }
    }
  };

  const handleEditTeam = async () => {
    try {
      await editTeam({
        id: teamData?.id ?? 0,
        team_name: teamName,
        clusterid: cluster,
        username: coachEmail,
        first_name: coachFirstName,
        last_name: coachLastName,
        contestid: contestId ?? 0,
      });

      if (clusters) {
        for (const cluster of clusters) {
          await getTeamsByClusterId(cluster.id);
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error("Failed to edit team", error);
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
      error={teamError}
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
        <Button
          type="submit"
          sx={{
            width: 150,
            height: 35,
            bgcolor: `${theme.palette.primary.main}`,
            color: `${theme.palette.secondary.main}`,
            mt: 3,
          }}
        >
          {buttonText}
        </Button>
      </form>
    </Modal>
  );
}
