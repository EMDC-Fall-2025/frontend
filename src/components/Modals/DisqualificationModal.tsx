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
  const { organizerDisqualifyTeam } = useOrganizerStore();
  const { judgeDisqualifyTeam } = useJudgeStore();
  const { fetchTeamsByClusterId} =
    useMapClusterTeamStore();

  const [openAreYouSureConfirm, setOpenAreYouSureConfirm] = useState(false);
  const [openAreYouSureReverse, setOpenAreYouSureReverse] = useState(false);

  const handleConfirm = async () => {
    await organizerDisqualifyTeam(teamId, true);
    await fetchTeamsByClusterId(clusterId);
    setOpenAreYouSureConfirm(false);
    handleClose();
  };

  const handleReverse = async () => {
    await judgeDisqualifyTeam(teamId, false);
    await fetchTeamsByClusterId(clusterId);
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
        {/* Confirm button - updated with smooth 3D effect and green glow */}
        <Button
          onClick={() => setOpenAreYouSureConfirm(true)}
          sx={{
            width: 90,
            height: 44,
            bgcolor: theme.palette.success.main,
            color: "#fff",
            mt: 2,
            textTransform: "none",
            borderRadius: "12px",
            boxShadow: `
              0 4px 12px rgba(76, 175, 80, 0.3),
              0 2px 4px rgba(76, 175, 80, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": { 
              bgcolor: theme.palette.success.dark,
              transform: "translateY(-2px)",
              boxShadow: `
                0 6px 16px rgba(76, 175, 80, 0.4),
                0 4px 8px rgba(76, 175, 80, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
            },
            "&:active": {
              transform: "translateY(0px)",
              boxShadow: `
                0 2px 8px rgba(76, 175, 80, 0.3),
                inset 0 2px 4px rgba(0, 0, 0, 0.1)
              `,
            },
          }}
        >
          Confirm
        </Button>
        {/* Reverse button - updated with smooth 3D effect */}
        <Button
          onClick={() => setOpenAreYouSureReverse(true)}
          sx={{
            width: 90,
            height: 44,
            bgcolor: theme.palette.warning.main,
            color: "#fff",
            mt: 2,
            textTransform: "none",
            borderRadius: "12px",
            boxShadow: `
              0 4px 12px rgba(255, 152, 0, 0.3),
              0 2px 4px rgba(255, 152, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": { 
              bgcolor: theme.palette.warning.dark,
              transform: "translateY(-2px)",
              boxShadow: `
                0 6px 16px rgba(255, 152, 0, 0.4),
                0 4px 8px rgba(255, 152, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
            },
            "&:active": {
              transform: "translateY(0px)",
              boxShadow: `
                0 2px 8px rgba(255, 152, 0, 0.3),
                inset 0 2px 4px rgba(0, 0, 0, 0.1)
              `,
            },
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
