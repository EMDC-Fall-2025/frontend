import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Stack,
} from "@mui/material";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";

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
    const { deleteClusterTeamMapping, deleteTeamCompletely } = useMapClusterTeamStore();

    // Deletes only the mapping (keeps the team in all team)
    const handleDeleteFromCluster = async () => {
        if (mapId && clusterId) {
            try {
                await deleteClusterTeamMapping(mapId, clusterId);
                onClose();
            } catch (error) {
                console.error("Error removing from cluster:", error);
            }
        }
    };

    // Permanently deletes the team from the database
    const handleDeleteFromDatabase = async () => {
        try {
            await deleteTeamCompletely(teamId);
            onClose();
        } catch (error) {
            console.error("Error deleting team from DB:", error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ textAlign: "center" }}>
                <strong>Delete Team</strong>
            </DialogTitle>

            <DialogContent sx={{ textAlign: "center" }}>
                <Typography sx={{ mb: 2 }}>
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
            </DialogContent>

            <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
                <Stack direction="row" spacing={2}>
                    {showRemoveFromCluster && (
                        <Button
                            variant="outlined"
                            color="warning"
                            onClick={handleDeleteFromCluster}
                        >
                            Remove from Cluster
                        </Button>
                    )}

                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteFromDatabase}
                    >
                        Delete from DB
                    </Button>
                </Stack>

                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        textTransform: "uppercase",
                        fontWeight: 600,
                        borderColor: "#bdbdbd",
                        color: "#616161",
                        "&:hover": {
                            borderColor: "#9e9e9e",
                            backgroundColor: "#f5f5f5",
                        },
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
