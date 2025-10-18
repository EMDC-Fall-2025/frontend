import { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import useContestStore from "../../store/primary_stores/contestStore";
import { useNavigate } from "react-router-dom";
import AreYouSureModal from "../Modals/AreYouSureModal";
import ContestModal from "../Modals/ContestModal";
import dayjs from "dayjs";
import useMapContestOrganizerStore from "../../store/map_stores/mapContestToOrganizerStore";
import CampaignIcon from "@mui/icons-material/Campaign";
import GroupIcon from "@mui/icons-material/Group";

function createData(
  id: number,
  name: string,
  date: dayjs.Dayjs,
  is_open: boolean,
  is_tabulated: boolean,
  organizers: any[]
) {
  return { id, name, date, is_open, is_tabulated, organizers };
}

export default function AdminContestTable() {
  const navigate = useNavigate();

  // Contest store for managing contest data
  const {
    fetchAllContests,
    allContests,
    deleteContest,
    isLoadingContest,
  } = useContestStore();

  // Organizer mapping store for contest-organizer relationships
  const {
    fetchOrganizerNamesByContests,
    organizerNamesByContests,
    isLoadingMapContestOrganizer,
  } = useMapContestOrganizerStore();

  // Modal state management
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [contestId, setContestId] = useState(0);
  const [openContestModal, setOpenContestModal] = useState(false);
  const [contestData, setContestData] = useState<any>();

  // Fetch contests on component mount
  useEffect(() => {
    fetchAllContests();
  }, [fetchAllContests]);

  // Fetch organizer names when contests are loaded
  useEffect(() => {
    fetchOrganizerNamesByContests();
  }, [allContests, fetchOrganizerNamesByContests]);

  // Transform contest data for table display
  const rows = allContests.map((contest) =>
    createData(
      contest.id,
      contest.name,
      dayjs(contest.date),
      contest.is_open,
      contest.is_tabulated,
      organizerNamesByContests[contest.id]
    )
  );

  // Open edit modal with contest data
  const handleOpenEditContest = (contest: any) => {
    setContestData({
      contestid: contest.id,
      name: contest.name,
      date: contest.date,
    });
    setOpenContestModal(true);
  };

  // Delete contest and refresh data
  const handleDelete = async (id: number) => {
    await deleteContest(id);
    await fetchAllContests();
  };

  // Open confirmation modal for deletion
  const handleOpenAreYouSure = (id: number) => {
    setContestId(id);
    setOpenAreYouSure(true);
  };

  // Check if any data is still loading
  const loading = isLoadingContest || isLoadingMapContestOrganizer;

  return loading ? (
    <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
      <CircularProgress />
    </Box>
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
      <Table sx={{ 
        minWidth: { xs: 320, sm: 650 },
        tableLayout: { xs: "fixed", sm: "auto" }
      }}>
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
            {/* Table headers with responsive visibility */}
            <TableCell align="left" sx={{ minWidth: { xs: "160px", sm: "250px" } }}>Name</TableCell>
            <TableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" }, minWidth: "70px" }}>Date</TableCell>
            <TableCell align="center" sx={{ display: { xs: "none", md: "table-cell" }, minWidth: "60px" }}>Is Open</TableCell>
            <TableCell align="center" sx={{ display: { xs: "none", lg: "table-cell" }, minWidth: "100px" }}>Organizers</TableCell>
            <TableCell align="right" sx={{ minWidth: { xs: "90px", sm: "160px" } }}>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
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
              <TableCell align="left" sx={{ 
                py: { xs: 1, sm: 2 }, 
                pr: { xs: 0.5, sm: 1 },
                minWidth: { xs: "160px", sm: "250px" }
              }}>
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
                    <CampaignIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                  </Box>

                  <Box minWidth={0}>
                    <Typography
                      variant="h6"
                      sx={{ 
                        fontWeight: 600, 
                        lineHeight: 1.2, 
                        fontSize: { xs: "0.8rem", sm: "1rem" }
                      }}
                      noWrap
                      title={row.name}
                    >
                      {row.name}
                    </Typography>

                    {/* Mobile summary: show date and organizer count when other columns are hidden */}
                    <Stack
                      direction="row"
                      spacing={{ xs: 1, sm: 2 }}
                      alignItems="center"
                      flexWrap="wrap"
                      sx={{ mt: 0.25, display: { xs: "flex", sm: "none" } }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {row.date.format("MM-DD-YYYY")}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <GroupIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" color="text.secondary">
                          {row.organizers?.length ?? 0}{" "}
                          {(row.organizers?.length ?? 0) === 1
                            ? "organizer"
                            : "organizers"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </TableCell>

              {/* Date column - hidden on mobile */}
              <TableCell
                align="center"
                sx={{
                  whiteSpace: "nowrap",
                  display: { xs: "none", sm: "table-cell" },
                  minWidth: "70px",
                }}
              >
                {row.date.format("MM-DD-YYYY")}
              </TableCell>

              {/* Is Open status - hidden on mobile and tablet */}
              <TableCell
                align="center"
                sx={{
                  whiteSpace: "nowrap",
                  display: { xs: "none", md: "table-cell" },
                  minWidth: "60px",
                }}
              >
                {row.is_open ? "Yes" : "No"}
              </TableCell>

              {/* Organizers column - hidden on mobile, tablet, and small desktop */}
              <TableCell
                align="center"
                sx={{
                  display: { xs: "none", lg: "table-cell" },
                  minWidth: "100px",
                }}
              >
                {row.organizers && row.organizers.length !== 0 ? (
                  <Box sx={{ overflowX: "auto", pr: 0.5 }}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {row.organizers.map((org: string, idx: number) => (
                        <Chip
                          key={`${row.id}-org-${idx}`}
                          label={org}
                          size="small"
                          sx={{
                            borderRadius: 1.5,
                            bgcolor: (t) => alpha(t.palette.success.main, 0.06),
                            color: "success.dark",
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No organizers assigned
                  </Typography>
                )}
              </TableCell>

              {/* Action buttons column */}
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
                {/* Action buttons - stacked on mobile, inline on desktop */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 0.5, sm: 0.75 }}
                  justifyContent="flex-end"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  sx={{ minHeight: { xs: "60px", sm: "35px" } }}
                >
                     <Button
                       onClick={() => navigate(`/manage-contest/${row.id}/`)}
                       variant="contained"
                       size="small"
                       sx={{
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
                       }}
                     >
                       Manage
                     </Button>
                     <Button
                       onClick={() => handleOpenEditContest(row)}
                       variant="outlined"
                       size="small"
                       sx={{
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
                       }}
                     >
                       Edit
                     </Button>
                     <Button
                       onClick={() => handleOpenAreYouSure(row.id)}
                       variant="outlined"
                       color="error"
                       size="small"
                       sx={{
                         textTransform: "none",
                         borderRadius: 1,
                         borderColor: "error.light",
                         "&:hover": {
                           borderColor: "error.main",
                           bgcolor: "rgba(211,47,47,0.06)",
                         },
                         px: { xs: 0.75, sm: 2 },
                         py: { xs: 0.2, sm: 0.75 },
                         fontSize: { xs: "0.6rem", sm: "0.875rem" },
                         fontWeight: 500,
                         minWidth: { xs: "100%", sm: "80px" },
                         height: { xs: "24px", sm: "36px" },
                       }}
                     >
                       Delete
                     </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Confirmation modal for contest deletion */}
      <AreYouSureModal
        open={openAreYouSure}
        handleClose={() => setOpenAreYouSure(false)}
        title="Are you sure you want to delete this contest?"
        handleSubmit={() => handleDelete(contestId)}
      />

      {/* Edit contest modal */}
      <ContestModal
        open={openContestModal}
        handleClose={() => setOpenContestModal(false)}
        mode="edit"
        contestData={contestData}
      />
    </TableContainer>
  );
}
