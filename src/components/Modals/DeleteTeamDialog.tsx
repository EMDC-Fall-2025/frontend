import {
    Button,
    Typography,
    Container,
    Box,
} from "@mui/material";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";
import { extractErrorMessage } from "../../utils/errorHandler";
import toast from "react-hot-toast";
import Modal from "./Modal";

interface DeleteTeamDialogProps {
    open: boolean;
    onClose: () => void;
    teamId: number;
    teamName: string;
    mapId?: number;
    clusterId?: number;
    showRemoveFromCluster?: boolean;
}

export default function DeleteTeamDialog({
    open,
    onClose,
    teamId,
    teamName,
    mapId,
    clusterId,
    showRemoveFromCluster,
}: DeleteTeamDialogProps) {
    const { deleteTeamCompletely } = useMapClusterTeamStore();

    // Remove from specific cluster; keep the team under "All Teams" and refresh lists without full reload
    const handleDeleteFromCluster = async () => {
        if (mapId != null && clusterId != null) {
            try {
                const {
                    teamsByClusterId,
                    deleteClusterTeamMapping,
                    addTeamToCluster,
                    fetchTeamsByClusterId,
                    clusters,
                } = useMapClusterTeamStore.getState();

                const teamToMove = teamsByClusterId[clusterId]?.find(
                    (team) => (team as any).map_id === mapId
                );

                await deleteClusterTeamMapping(mapId, clusterId);

                // Determine the real "All Teams" cluster id
                const allTeamsCluster = clusters.find((c: any) => c.cluster_name === "All Teams");
                const allTeamsClusterId = allTeamsCluster?.id;

                if (teamToMove && allTeamsClusterId != null) {
                    addTeamToCluster(allTeamsClusterId, teamToMove as any);
                }

                await Promise.all([
                    fetchTeamsByClusterId(clusterId, true),
                    allTeamsClusterId != null ? fetchTeamsByClusterId(allTeamsClusterId, true) : Promise.resolve(),
                ]);

                toast.success("Team removed from cluster");
                onClose();

            } catch (error) {
                toast.error("Failed to remove team from cluster");
                console.error("Error removing from cluster:", error);
            }
        } else {
            console.warn("Missing mapId or clusterId", { mapId, clusterId });
        }
    };




    // Permanently deletes the team from the database
    const handleDeleteFromDatabase = async () => {
        try {
            await deleteTeamCompletely(teamId);
            toast.success("Team deleted successfully");
            onClose();
        } catch (error) {
            const errorMessage = extractErrorMessage(error);
            toast.error(`Failed to delete team: ${errorMessage}`);
            console.error("Error deleting team from DB:", error);
        }
    };

    return (
        <Modal open={open} handleClose={onClose} title="Delete Team">
            <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Are you sure you want to delete <strong>{teamName}</strong>?
                </Typography>

                {showRemoveFromCluster ? (
                    <Typography variant="body2" color="text.secondary">
                        You can either remove this team from the cluster or delete it completely from the database.
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        This will permanently delete the team from the database.
                    </Typography>
                )}
            </Box>

            <Container
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 1.25,
                    alignItems: "center",
                    justifyContent: "center",
                    p: 0,
                    width: "100%",
                }}
            >
                    {showRemoveFromCluster && (
                        <Button
                            variant="outlined"
                            onClick={handleDeleteFromCluster}
                        sx={{
                            textTransform: "none",
                            borderRadius: 1.5,
                            py: 1.25,
                            px: 2.5,
                            borderColor: "#9e9e9e",
                            color: "#424242",
                            minWidth: 0,
                            flex: 1,
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
                        }}
                        >
                            Remove from Cluster
                        </Button>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleDeleteFromDatabase}
                    sx={{
                        textTransform: "none",
                        borderRadius: 1.5,
                        py: 1.25,
                        px: 2.5,
                        bgcolor: "#d32f2f",
                        color: "#fff",
                        minWidth: 0,
                        flex: showRemoveFromCluster ? 1 : "auto",
                        "&:hover": { bgcolor: "#b71c1c" },
                    }}
                    >
                        Delete from DB
                    </Button>
            </Container>
        </Modal>
    );
}