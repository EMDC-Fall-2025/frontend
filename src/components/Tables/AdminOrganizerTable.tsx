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
  const [open, setOpen] = useState(false);
  const [organizerId, setOrganizerId] = useState(0);
  const [contestId, setContestId] = useState(0);
  const [openAreYouSureUnassign, setOpenAreYouSureUnassign] = useState(false);

  const {
    contestsByOrganizers,
    fetchContestsByOrganizers,
    deleteContestOrganizerMapping,
    mapContestOrganizerError,
  } = useMapContestOrganizerStore();

  const handleOpenAreYouSureUnassign = (organizerId: number, contestId: number) => {
    setOrganizerId(organizerId);
    setContestId(contestId);
    setOpenAreYouSureUnassign(true);
  };

  const handleUnassign = async (organizerId: number, contestId: number) => {
    await deleteContestOrganizerMapping(organizerId, contestId);
    await fetchContestsByOrganizers();
  };

  return (
    <React.Fragment>
      <TableRow
        hover
        sx={{
          "& td": { borderBottomColor: "grey.200" },
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
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        {/* Name cell — styled content (no structure change) */}
        <TableCell component="th" scope="row" sx={{ py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} minWidth={0}>
            <Box
              aria-hidden
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: (t) => alpha(t.palette.success.light, 0.5),
                color: "success.dark",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <GroupIcon fontSize="small" />
            </Box>
            <Box minWidth={0}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
                noWrap
                title={`${row.first_name} ${row.last_name}`}
              >
                {row.first_name} {row.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Organizer
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        {/* Actions — restyled buttons, same structure */}
        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
          <Stack direction="row" spacing={1.25} justifyContent="flex-end">
            {React.cloneElement(
  row.assignContest,
  {
    variant: "contained",
    size: "small",
    sx: {
      textTransform: "none",
      borderRadius: 2,
      bgcolor: "success.main",
      "&:hover": { bgcolor: "success.dark" },
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
                borderRadius: 2,
                borderColor: "grey.400",
                color: "text.primary",
                "&:hover": { borderColor: "text.primary", bgcolor: "grey.100" },
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
                borderRadius: 2,
                borderColor: "error.light",
                "&:hover": { borderColor: "error.main", bgcolor: "rgba(211,47,47,0.06)" },
                ...(row.deleteButton.props.sx || {}),
              },
              children: "Delete",
            })}
          </Stack>
        </TableCell>
      </TableRow>

      {/* Collapse — keep your nested table, just style it to look minimal */}
      <TableRow sx={{ display: open ? "table-row" : "none" }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3} sx={{ borderBottom: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1, mb: 1, mx: 1.5 }}>
              <Table
                size="small"
                aria-label="purchases"
                sx={{
                  // remove inner table feel
                  "& td, & th": { border: 0, py: 1 },
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
                          <TableCell sx={{ pl: 0 }}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Box
                                aria-hidden
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  bgcolor: (t) => alpha(t.palette.success.main, 0.1),
                                  color: "success.dark",
                                  display: "grid",
                                  placeItems: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <CampaignIcon sx={{ fontSize: 16 }} />
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {contest.name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 0 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOpenAreYouSureUnassign(row.id, contest.id)}
                              sx={{
                                textTransform: "none",
                                borderRadius: 2,
                                borderColor: "grey.400",
                                "&:hover": { borderColor: "text.primary", bgcolor: "grey.100" },
                              }}
                            >
                              Unassign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell sx={{ pl: 0 }}>
                          <Typography variant="body2" color="text.secondary">
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
        error={mapContestOrganizerError}
      />
    </React.Fragment>
  );
}

export default function AdminOrganizerTable() {
  const { allOrganizers, fetchAllOrganizers, deleteOrganizer, organizerError } = useOrganizerStore();
  const [openOrganizerModal, setOpenOrganizerModal] = useState(false);
  const [organizerData, setOrganizerData] = useState<any>(null);
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [openAssignContest, setOpenAssignContest] = useState(false);
  const [organizerId, setOrganizerId] = useState(0);
  const { fetchContestsByOrganizers, isLoadingMapContestOrganizer } = useMapContestOrganizerStore();

  useEffect(() => {
    fetchAllOrganizers();
  }, []);

  useEffect(() => {
    fetchContestsByOrganizers();
  }, [allOrganizers]);

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

  const handleOpenEditOrganizer = (organizer: any) => {
    setOrganizerData({
      id: organizer.id,
      first_name: organizer.first_name,
      last_name: organizer.last_name,
      username: organizer.username,
    });
    setOpenOrganizerModal(true);
  };

  const handleDelete = async (id: number) => {
    await deleteOrganizer(id);
    await fetchAllOrganizers();
  };

  const handleOpenAreYouSure = (id: number) => {
    setOrganizerId(id);
    setOpenAreYouSure(true);
  };

  const handleOpenAssignContest = (id: number) => {
    setOrganizerId(id);
    setOpenAssignContest(true);
  };

  return isLoadingMapContestOrganizer ? (
    <CircularProgress />
  ) : (
    <TableContainer component={Box}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                fontWeight: 700,
                bgcolor: (t) => alpha(t.palette.success.main, 0.04),
                borderBottomColor: "grey.300",
              },
            }}
          >
            <TableCell width={56} />
            <TableCell component="th" scope="row">
              Name
            </TableCell>
            <TableCell align="right">Actions</TableCell>
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
        error={organizerError}
      />
      <AssignContestModal
        organizerId={organizerId}
        open={openAssignContest}
        handleClose={() => setOpenAssignContest(false)}
      />
    </TableContainer>
  );
}
