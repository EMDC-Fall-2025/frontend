/**
 * DisqualificationModal Component
 * 
 * Modal for disqualifying/reversing team disqualification with modern theme styling.
 * Features:
 * - Clean white background with subtle borders
 * - Green success theme for buttons
 * - Consistent typography with bold titles
 * - Modern form styling with proper spacing
 */
import { Button, Container } from "@mui/material";
import Modal from "./Modal";
import theme from "../../theme";
import AreYouSureModal from "./AreYouSureModal";
import { useState } from "react";
import useOrganizerStore from "../../store/primary_stores/organizerStore";
import { useJudgeStore } from "../../store/primary_stores/judgeStore";
import useMapClusterTeamStore from "../../store/map_stores/mapClusterToTeamStore";

export interface IDisqualificationModalProps {
  open: boolean;
  teamName: string;
  teamId: number;
  clusterId: number;
  handleClose: () => void;
}

export default function DisqualificationModal(
  props: IDisqualificationModalProps
) {
  const { handleClose, open, teamName, teamId, clusterId } = props;
  const { organizerDisqualifyTeam, organizerError } = useOrganizerStore();
  const { judgeDisqualifyTeam, judgeError } = useJudgeStore();
  const { getTeamsByClusterId, mapClusterToTeamError } =
    useMapClusterTeamStore();

  const [openAreYouSureConfirm, setOpenAreYouSureConfirm] = useState(false);
  const [openAreYouSureReverse, setOpenAreYouSureReverse] = useState(false);

  const handleConfirm = async () => {
    await organizerDisqualifyTeam(teamId, true);
    await getTeamsByClusterId(clusterId);
    setOpenAreYouSureConfirm(false);
    handleClose();
  };

  const handleReverse = async () => {
    await judgeDisqualifyTeam(teamId, false);
    await getTeamsByClusterId(clusterId);
    setOpenAreYouSureReverse(false);
    handleClose();
  };

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={"Confirm or reverse judge disqualification."}
    >
      <Container
        sx={{
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
          gap: 2,
        }}
      >
        {/* Confirm button - updated to use modern green success theme */}
        <Button
          onClick={() => setOpenAreYouSureConfirm(true)}
          sx={{
            width: 90,
            height: 44,
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
            color: "#fff",
            mt: 2,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Confirm
        </Button>
        {/* Reverse button - updated to use modern orange warning theme */}
        <Button
          onClick={() => setOpenAreYouSureReverse(true)}
          sx={{
            width: 90,
            height: 44,
            bgcolor: theme.palette.warning.main,
            "&:hover": { bgcolor: theme.palette.warning.dark },
            color: "#fff",
            mt: 2,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Reverse
        </Button>
      </Container>
      <AreYouSureModal
        open={openAreYouSureConfirm}
        handleClose={() => setOpenAreYouSureConfirm(false)}
        title={`Are you sure you want to disqualify ${teamName}?`}
        handleSubmit={() => handleConfirm()}
      />
      <AreYouSureModal
        open={openAreYouSureReverse}
        handleClose={() => setOpenAreYouSureReverse(false)}
        title={`Are you sure you want to reverse judge disqualification?`}
        handleSubmit={() => handleReverse()}
      />
    </Modal>
  );
}
