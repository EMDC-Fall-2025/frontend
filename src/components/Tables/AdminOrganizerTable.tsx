import * as React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { OrganizerRow } from "../../types";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import useOrganizerStore from "../../store/primary_stores/organizerStore";
import { useEffect, useState } from "react";
import OrganizerModal from "../Modals/OrganizerModal";
import AreYouSureModal from "../Modals/AreYouSureModal";
import useMapContestOrganizerStore from "../../store/map_stores/mapContestToOrganizerStore";
import AssignContestModal from "../Modals/AssignContestModal";
import GroupIcon from "@mui/icons-material/Group";
import CampaignIcon from "@mui/icons-material/Campaign";

function createData(
  id: number,
  first_name: string,
  last_name: string,
  editButton: any,
  deleteButton: any,
  assignContest: any
): OrganizerRow {
  return { id, first_name, last_name, editButton, deleteButton, assignContest };
}

function Row(props: { row: ReturnType<typeof createData> }) {
  const { row } = props;
  // Collapsible row state for showing assigned contests
  const [open, setOpen] = useState(false);
  const [organizerId, setOrganizerId] = useState(0);
  const [contestId, setContestId] = useState(0);
  const [openAreYouSureUnassign, setOpenAreYouSureUnassign] = useState(false);

  // Contest-organizer mapping store for managing assignments
  const {
    contestsByOrganizers,
    fetchContestsByOrganizers,
    deleteContestOrganizerMapping,
  } = useMapContestOrganizerStore();

  // Open confirmation modal for unassigning contest
  const handleOpenAreYouSureUnassign = (organizerId: number, contestId: number) => {
    setOrganizerId(organizerId);
    setContestId(contestId);
    setOpenAreYouSureUnassign(true);
  };

  // Remove contest assignment from organizer
  const handleUnassign = async (organizerId: number, contestId: number) => {
    await deleteContestOrganizerMapping(organizerId, contestId);
    await fetchContestsByOrganizers();
  };

  return (
    <React.Fragment>
      <TableRow
        hover
        sx={{
          "& td": { 
            borderBottomColor: "grey.200",
            padding: { xs: "6px 4px", sm: "16px" },
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
            minHeight: { xs: "60px", sm: "auto" },
          },
        }}
      >
        <TableCell width={56}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{
              color: open ? "success.main" : "inherit",
              "&:hover": { bgcolor: (t) => alpha(t.palette.success.main, 0.08) },
              fontSize: { xs: "1rem", sm: "1.25rem" },
              padding: { xs: 0.5, sm: 1 },
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell 
          component="th" 
          scope="row" 
          sx={{ 
            py: { xs: 1, sm: 2 },
            pr: { xs: 0.5, sm: 1 },
            minWidth: { xs: "160px", sm: "250px" }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }} minWidth={0}>
            <Box
              aria-hidden
              sx={{
                width: { xs: 28, sm: 40 },
                height: { xs: 28, sm: 40 },
                borderRadius: "50%",
                bgcolor: (t) => alpha(t.palette.success.light, 0.5),
                color: "success.dark",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <GroupIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
            </Box>
            <Box minWidth={0}>
              <Typography
                variant="subtitle1"
                sx={{ 
                  fontWeight: 700, 
                  lineHeight: 1.2,
                  fontSize: { xs: "0.8rem", sm: "1rem" }
                }}
                noWrap
                title={`${row.first_name} ${row.last_name}`}
              >
                {row.first_name} {row.last_name}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: { xs: "0.6rem", sm: "0.75rem" } }}
              >
                Organizer
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        <TableCell 
          align="right" 
          sx={{ 
            whiteSpace: "nowrap",
            minWidth: { xs: "90px", sm: "160px" },
            pl: { xs: 0.1, sm: 0.25 },
            pr: { xs: 0.1, sm: 0.25 },
            textAlign: "right",
            verticalAlign: "top",
          }}
        >
          <Stack 
            direction={{ xs: "column", sm: "row" }} 
            spacing={{ xs: 0.5, sm: 0.75 }} 
            justifyContent="flex-end"
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ minHeight: { xs: "60px", sm: "35px" } }}
          >
            {React.cloneElement(
            row.assignContest,
            {
              variant: "contained",
              size: "small",
              sx: {
                textTransform: "none",
                borderRadius: 1,
                bgcolor: "success.main",
                "&:hover": { bgcolor: "success.dark" },
                px: { xs: 0.75, sm: 2 },
                py: { xs: 0.2, sm: 0.75 },
                fontSize: { xs: "0.6rem", sm: "0.875rem" },
                fontWeight: 550,
                minWidth: { xs: "100%", sm: "80px" },
                height: { xs: "24px", sm: "36px" },
                ...(row.assignContest.props.sx || {}),
              },
            },
            "Assign"
          )}

            {React.cloneElement(row.editButton, {
              variant: "outlined",
              size: "small",
              sx: {
                textTransform: "none",
                borderRadius: 1,
                borderColor: "grey.400",
                color: "text.primary",
                "&:hover": { borderColor: "text.primary", bgcolor: "grey.100" },
                px: { xs: 0.75, sm: 2 },
                py: { xs: 0.2, sm: 0.75 },
                fontSize: { xs: "0.6rem", sm: "0.875rem" },
                fontWeight: 550,
                minWidth: { xs: "100%", sm: "80px" },
                height: { xs: "24px", sm: "36px" },
                ...(row.editButton.props.sx || {}),
              },
              children: "Edit",
            })}
            {React.cloneElement(row.deleteButton, {
              variant: "outlined",
              color: "error",
              size: "small",
              sx: {
                textTransform: "none",
                borderRadius: 1,
                borderColor: "error.light",
                "&:hover": { borderColor: "error.main", bgcolor: "rgba(211,47,47,0.06)" },
                px: { xs: 0.75, sm: 2 },
                py: { xs: 0.2, sm: 0.75 },
                fontSize: { xs: "0.6rem", sm: "0.875rem" },
                fontWeight: 500,
                minWidth: { xs: "100%", sm: "80px" },
                height: { xs: "24px", sm: "36px" },
                ...(row.deleteButton.props.sx || {}),
              },
              children: "Delete",
            })}
          </Stack>
        </TableCell>
      </TableRow>

      
      <TableRow sx={{ display: open ? "table-row" : "none" }}>
        <TableCell 
          style={{ paddingBottom: 0, paddingTop: 0 }} 
          colSpan={3} 
          sx={{ 
            borderBottom: 0,
            padding: { xs: "4px", sm: "8px" }
          }}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ 
              mt: { xs: 0.5, sm: 1 }, 
              mb: { xs: 0.5, sm: 1 }, 
              mx: { xs: 0.5, sm: 1.5 } 
            }}>
              <Table
                size="small"
                aria-label="purchases"
                sx={{
                  "& td, & th": { 
                    border: 0, 
                    py: { xs: 0.5, sm: 1 },
                    fontSize: { xs: "0.7rem", sm: "0.875rem" }
                  },
                }}
              >
                <TableBody>
                  <Table
                    sx={{
                      "& td, & th": { border: 0, py: 0 },
                    }}
                  >
                    {contestsByOrganizers[row.id]?.length !== 0 ? (
                      contestsByOrganizers[row.id]?.map((contest: any) => (
                        <TableRow key={`org-${row.id}-contest-${contest.id}`}>
                          <TableCell sx={{ 
                            pl: { xs: 0, sm: 0 },
                            py: { xs: 0.5, sm: 1 }
                          }}>
                            <Stack direction="row" spacing={{ xs: 1, sm: 1.25 }} alignItems="center">
                              <Box
                                aria-hidden
                                sx={{
                                  width: { xs: 24, sm: 28 },
                                  height: { xs: 24, sm: 28 },
                                  borderRadius: "50%",
                                  bgcolor: (t) => alpha(t.palette.success.main, 0.1),
                                  color: "success.dark",
                                  display: "grid",
                                  placeItems: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <CampaignIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                              </Box>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: "0.7rem", sm: "0.875rem" }
                                }}
                              >
                                {contest.name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            pr: { xs: 0, sm: 0 },
                            py: { xs: 0.5, sm: 1 }
                          }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOpenAreYouSureUnassign(row.id, contest.id)}
                              sx={{
                                textTransform: "none",
                                borderRadius: 1,
                                borderColor: "grey.400",
                                "&:hover": { borderColor: "text.primary", bgcolor: "grey.100" },
                                px: { xs: 1.5, sm: 2.5 },
                                py: { xs: 0.4, sm: 0.75 },
                                fontSize: { xs: "0.65rem", sm: "0.85rem" },
                                fontWeight: 550,
                                minWidth: { xs: "80px", sm: "auto" },
                                height: { xs: "24px", sm: "32px" },
                              }}
                            >
                              Unassign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell sx={{ 
                          pl: { xs: 0, sm: 0 },
                          py: { xs: 0.5, sm: 1 }
                        }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                          >
                            No Contests Assigned
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </Table>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <AreYouSureModal
        open={openAreYouSureUnassign}
        handleClose={() => setOpenAreYouSureUnassign(false)}
        title="Are you sure you want to unassign this contest?"
        handleSubmit={() => handleUnassign(organizerId, contestId)}

      />
    </React.Fragment>
  );
}

export default function AdminOrganizerTable() {
  // Organizer store for managing organizer data
  const { allOrganizers, fetchAllOrganizers, deleteOrganizer, organizerError } = useOrganizerStore();
  
  // Modal state management
  const [openOrganizerModal, setOpenOrganizerModal] = useState(false);
  const [organizerData, setOrganizerData] = useState<any>(null);
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [openAssignContest, setOpenAssignContest] = useState(false);
  const [organizerId, setOrganizerId] = useState(0);
  
  // Contest-organizer mapping store
  const { fetchContestsByOrganizers, isLoadingMapContestOrganizer } = useMapContestOrganizerStore();

  // Fetch organizers on component mount
  useEffect(() => {
    fetchAllOrganizers();
  }, []);

  // Fetch contest assignments when organizers are loaded
  useEffect(() => {
    fetchContestsByOrganizers();
  }, [allOrganizers]);

  // Transform organizer data for table display
  const rows: OrganizerRow[] = allOrganizers.map((organizer: any) =>
    createData(
      organizer.id,
      organizer.first_name,
      organizer.last_name,
      <Button onClick={() => handleOpenEditOrganizer(organizer)} />,
      <Button onClick={() => handleOpenAreYouSure(organizer.id)} />,
      <Button onClick={() => handleOpenAssignContest(organizer.id)} />
    )
  );

  // Open edit modal with organizer data
  const handleOpenEditOrganizer = (organizer: any) => {
    setOrganizerData({
      id: organizer.id,
      first_name: organizer.first_name,
      last_name: organizer.last_name,
      username: organizer.username,
    });
    setOpenOrganizerModal(true);
  };

  // Delete organizer and refresh data
  const handleDelete = async (id: number) => {
    await deleteOrganizer(id);
    await fetchAllOrganizers();
  };

  // Open confirmation modal for deletion
  const handleOpenAreYouSure = (id: number) => {
    setOrganizerId(id);
    setOpenAreYouSure(true);
  };

  // Open assign contest modal
  const handleOpenAssignContest = (id: number) => {
    setOrganizerId(id);
    setOpenAssignContest(true);
  };

  return isLoadingMapContestOrganizer ? (
    <CircularProgress />
  ) : (
    <TableContainer 
      component={Box}
      sx={{
        border: "0px solid",
        borderColor: "grey.300",
        borderRadius: 2,
        overflow: { xs: "auto", sm: "hidden" },
        maxWidth: "100%",
      }}
    >
      <Table 
        aria-label="collapsible table"
        sx={{
          minWidth: { xs: 320, sm: 650 },
          tableLayout: { xs: "fixed", sm: "auto" }
        }}
      >
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                fontWeight: 700,
                bgcolor: (t) => alpha(t.palette.success.main, 0.04),
                borderBottomColor: "grey.300",
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
                padding: { xs: "6px 4px", sm: "16px" },
                whiteSpace: "nowrap",
              },
            }}
          >
            <TableCell width={56} />
            <TableCell component="th" scope="row" sx={{ minWidth: { xs: "160px", sm: "250px" } }}>
              Name
            </TableCell>
            <TableCell align="right" sx={{ minWidth: { xs: "90px", sm: "160px" } }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </TableBody>
      </Table>

      <OrganizerModal
        open={openOrganizerModal}
        handleClose={() => setOpenOrganizerModal(false)}
        mode="edit"
        organizerData={organizerData}
      />
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to delete this organizer?"
        handleSubmit={() => handleDelete(organizerId)}
      />
      <AssignContestModal
        organizerId={organizerId}
        open={openAssignContest}
        handleClose={() => setOpenAssignContest(false)}
      />
    </TableContainer>
  );
}
