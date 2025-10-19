/**
 * ClusterModal Component
 * 
 * Modal for creating and editing clusters. 
 */
import { Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import { useEffect, useState } from "react";
import { useClusterStore } from "../../store/primary_stores/clusterStore";
import { useMapClusterToContestStore } from "../../store/map_stores/mapClusterToContestStore";
import toast from "react-hot-toast";


export interface IClusterModalProps {
  open: boolean;
  handleClose: () => void;
  mode: "new" | "edit";
  contestid?: number;
  clusterData?: {
    id: number;
    cluster_name: string;
    cluster_type?: string;
  };
}

export default function ClusterModal(props: IClusterModalProps) {
  const { handleClose, open, mode, contestid, clusterData } = props;
  const [clusterName, setClusterName] = useState("");
  const [clusterType, setClusterType] = useState("preliminary");
  const { fetchClustersByContestId } = useMapClusterToContestStore();
  const { createCluster, editCluster } = useClusterStore();

  useEffect(() => {
    if (clusterData) {
      setClusterName(clusterData.cluster_name);
      setClusterType(clusterData.cluster_type || "preliminary");
    }
  }, [clusterData]);

  const handleCloseModal = () => {
    handleClose();
    setClusterName("");
    setClusterType("preliminary");
  };

  const handleCreateCluster = async (event: React.FormEvent) => {
    event.preventDefault();
    if (contestid) {
      try {
        await createCluster({
          cluster_name: clusterName,
          cluster_type: clusterType,
          contestid: contestid,
        });
        fetchClustersByContestId(contestid);
        toast.success("Cluster created successfully!");
        handleCloseModal();
      } catch (error) {
        console.error("Failed to create cluster", error);
        toast.error("Failed to create cluster");
      }
    }
  };

  const handleEditCluster = async (event: React.FormEvent) => {
    event.preventDefault();
    if (clusterData?.id && contestid) {
      try {
        await editCluster({ id: clusterData.id, cluster_name: clusterName, cluster_type: clusterType });
        fetchClustersByContestId(contestid);
        toast.success("Cluster updated successfully!");
        handleCloseModal();
      } catch (error) {
        console.error("Failed to edit cluster", error);
        toast.error("Failed to update cluster");
      }
    }
  };

  const title = mode === "new" ? "New Cluster" : "Edit Cluster";
  const buttonText = mode === "new" ? "Create Cluster" : "Update Cluster";
  const handleSubmit = mode === "new" ? handleCreateCluster : handleEditCluster;

  return (
    <Modal
      open={open}
      handleClose={handleClose}
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
          label="Cluster Name"
          variant="outlined"
          value={clusterName}
          onChange={(e: any) => setClusterName(e.target.value)}
          sx={{ mt: 1, width: 300 }}
        />
        <FormControl
          required
          sx={{
            width: 300,
            mt: 3,
          }}
        >
          <InputLabel>Cluster Type</InputLabel>
          <Select
            value={clusterType}
            label="Cluster Type"
            sx={{ textAlign: "left" }}
            onChange={(e) => setClusterType(e.target.value)}
          >
            <MenuItem value="preliminary">Preliminary</MenuItem>
            <MenuItem value="championship">Championship</MenuItem>
            <MenuItem value="redesign">Redesign</MenuItem>
          </Select>
        </FormControl>
        {/* Submit button - updated to use modern green success theme */}
        <Button
          type="submit"
          sx={{
            width: 150,
            height: 44,
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
            color: "#fff",
            mt: 3,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          {buttonText}
        </Button>
      </form>
    </Modal>
  );
}
