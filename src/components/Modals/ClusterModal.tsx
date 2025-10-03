/**
 * ClusterModal Component
 * 
 * Modal for creating and editing clusters with modern theme styling.
 * Features:
 * - Clean white background with subtle borders
 * - Green success theme for buttons
 * - Consistent typography with bold titles
 * - Modern form styling with proper spacing
 */
import { Button, TextField } from "@mui/material";
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
  };
}

export default function ClusterModal(props: IClusterModalProps) {
  const { handleClose, open, mode, contestid, clusterData } = props;
  const [clusterName, setClusterName] = useState("");
  const { fetchClustersByContestId } = useMapClusterToContestStore();
  const { createCluster, editCluster } = useClusterStore();

  useEffect(() => {
    if (clusterData) {
      setClusterName(clusterData.cluster_name);
    }
  }, [clusterData]);

  const handleCloseModal = () => {
    handleClose();
    setClusterName("");
  };

  const handleCreateCluster = async (event: React.FormEvent) => {
    event.preventDefault();
    if (contestid) {
      try {
        await createCluster({
          cluster_name: clusterName,
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
        await editCluster({ id: clusterData.id, cluster_name: clusterName });
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
