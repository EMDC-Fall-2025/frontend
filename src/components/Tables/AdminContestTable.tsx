// ==============================
// Component: AdminContestTable
// Administrative table for managing contests with CRUD operations.
// Provides contest overview, status management, and organizer assignments.
// ==============================

// ==============================
// React Core
// ==============================
import { useEffect, useState, useMemo } from "react";

// ==============================
// Router
// ==============================
import { useNavigate } from "react-router-dom";

// ==============================
// UI Libraries & Theme
// ==============================
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
import CampaignIcon from "@mui/icons-material/Campaign";
import GroupIcon from "@mui/icons-material/Group";

// ==============================
// Store Hooks
// ==============================
import useContestStore from "../../store/primary_stores/contestStore";

// ==============================
// Utilities
// ==============================
import { onDataChange, DataChangeEvent } from "../../utils/dataChangeEvents";
import dayjs from "dayjs";

// ==============================
// Local Components
// ==============================
import AreYouSureModal from "../Modals/AreYouSureModal";
import ContestModal from "../Modals/ContestModal";

// ==============================
// Data Creation Helpers
// ==============================

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

// ==============================
// Global Event Listeners
// ==============================

// Global event listener setup - survives component unmounts
let globalListenerUnsubscribe: (() => void) | null = null;

const setupGlobalListener = () => {
  if (globalListenerUnsubscribe) {
    return; 
  }

  const handleDataChange = (event: DataChangeEvent) => {
   
    if (event.type === 'contest' && (event.action === 'create' || event.action === 'update' || event.action === 'delete')) {
      // Refresh contest data 
      useContestStore.getState().fetchAllContests(true);  
    } else if (event.type === 'organizer' && event.action === 'update') {
      
      useContestStore.getState().fetchAllContests(true);
    }
  };

  globalListenerUnsubscribe = onDataChange(handleDataChange);

};


setupGlobalListener();

export default function AdminContestTable() {
  const navigate = useNavigate();

  const allContests = useContestStore((state) => state.allContests);
  const fetchAllContests = useContestStore((state) => state.fetchAllContests);
  const deleteContest = useContestStore((state) => state.deleteContest);
  const isLoadingContest = useContestStore((state) => state.isLoadingContest);
  const [openAreYouSure, setOpenAreYouSure] = useState(false);
  const [contestId, setContestId] = useState(0);
  const [openContestModal, setOpenContestModal] = useState(false);
  const [contestData, setContestData] = useState<any>();

  const [showSpinner, setShowSpinner] = useState(false);
  
  useEffect(() => {
    const loading = isLoadingContest;
    let timer: NodeJS.Timeout;
    
    if (loading) {
      timer = setTimeout(() => setShowSpinner(true), 1500);
    } else {
      setShowSpinner(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoadingContest]);

 
  useEffect(() => {
    if (allContests.length === 0) {
      fetchAllContests();
    }
   
  }, []);




  const rows = useMemo(() =>
    allContests.map((contest) =>
      createData(
        contest.id,
        contest.name,
        dayjs(contest.date),
        contest.is_open,
        contest.is_tabulated,
        (contest as any).organizers || []
      )
    ), [allContests]);

  const handleOpenEditContest = (contest: any) => {
    setContestData({
      contestid: contest.id,
      name: contest.name,
      date: contest.date,
    });
    setOpenContestModal(true);
  };

  const handleDelete = async (id: number) => {
    await deleteContest(id);
  };
  const handleOpenAreYouSure = (id: number) => {
    setContestId(id);
    setOpenAreYouSure(true);
  };

  return showSpinner ? (
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
            {/* Table headers */}
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

                    {/* Summary with date and organizer count icons */}
                    <Stack
                      direction="row"
                      spacing={{ xs: 1, sm: 1.5 }}
                      alignItems="center"
                      flexWrap="wrap"
                      sx={{ mt: 0.25 }}
                    >
                      {/* Date - only show on mobile */}
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: "flex", sm: "none" } }}>
                        <CampaignIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          {row.date.format("MM-DD-YYYY")}
                        </Typography>
                      </Stack>
                      {/* Organizer count - show on all screen sizes */}
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <GroupIcon sx={{ fontSize: { xs: 12, sm: 14 }, color: "text.secondary" }} />
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
                {/* Action buttons */}
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
                         borderRadius: 2,
                         bgcolor: (t) => alpha(t.palette.success.main, 0.85),
                         color: "white",
                         boxShadow: "none",
                         "&:hover": { 
                           bgcolor: (t) => alpha(t.palette.success.main, 0.95),
                           boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                         },
                         px: { xs: 0.75, sm: 2 },
                         py: { xs: 0.2, sm: 0.75 },
                         fontSize: { xs: "0.6rem", sm: "0.875rem" },
                         fontWeight: 500,
                         minWidth: { xs: "100%", sm: "80px" },
                         height: { xs: "24px", sm: "36px" },
                         transition: "all 0.2s ease",
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
                         borderRadius: 2,
                         borderColor: (t) => alpha(t.palette.grey[400], 0.5),
                         color: "text.primary",
                         bgcolor: "transparent",
                         "&:hover": { 
                           borderColor: (t) => alpha(t.palette.grey[600], 0.6),
                           bgcolor: (t) => alpha(t.palette.grey[100], 0.5),
                         },
                         px: { xs: 0.75, sm: 2 },
                         py: { xs: 0.2, sm: 0.75 },
                         fontSize: { xs: "0.6rem", sm: "0.875rem" },
                         fontWeight: 500,
                         minWidth: { xs: "100%", sm: "80px" },
                         height: { xs: "24px", sm: "36px" },
                         transition: "all 0.2s ease",
                       }}
                     >
                       Edit
                     </Button>
                     <Button
                       onClick={() => handleOpenAreYouSure(row.id)}
                       variant="outlined"
                       size="small"
                       sx={{
                         textTransform: "none",
                         borderRadius: 2,
                         borderColor: (t) => alpha(t.palette.error.light, 0.5),
                         color: (t) => alpha(t.palette.error.main, 0.8),
                         bgcolor: "transparent",
                         "&:hover": {
                           borderColor: (t) => alpha(t.palette.error.main, 0.7),
                           bgcolor: (t) => alpha(t.palette.error.main, 0.08),
                         },
                         px: { xs: 0.75, sm: 2 },
                         py: { xs: 0.2, sm: 0.75 },
                         fontSize: { xs: "0.6rem", sm: "0.875rem" },
                         fontWeight: 500,
                         minWidth: { xs: "100%", sm: "80px" },
                         height: { xs: "24px", sm: "36px" },
                         transition: "all 0.2s ease",
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
