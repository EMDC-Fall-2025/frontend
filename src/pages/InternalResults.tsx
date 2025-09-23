import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMapContestToTeamStore } from "../store/map_stores/mapContestToTeamStore";
import InternalResultsTable from "../components/Tables/InternalResultsTable";
import { Link, Typography } from "@mui/material";
import { useAuthStore } from "../store/primary_stores/authStore";
export default function InternalResults() {
  const { contestId } = useParams();
  const parsedContestId = contestId ? parseInt(contestId, 10) : undefined;
  const { fetchTeamsByContest, clearTeamsByContest } =
    useMapContestToTeamStore();
  const { role } = useAuthStore();

  useEffect(() => {
    const loadContestData = async () => {
      if (parsedContestId) {
        await fetchTeamsByContest(parsedContestId);
      }
    };

    loadContestData();
    return () => {
      clearTeamsByContest();
    };
  }, [parsedContestId]);

  useEffect(() => {
    const handlePageHide = () => {
      clearTeamsByContest();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return (
    <>
      {role?.user_type === 2 && (
        <Link href="/organizer" sx={{ textDecoration: "none" }}>
          <Typography variant="body2" sx={{ m: 2 }}>
            {"<"} Back to Dashboard{" "}
          </Typography>
        </Link>
      )}
      <Typography variant="h1" sx={{ m: 5 }}>
        Results
      </Typography>
      <InternalResultsTable contestId={parsedContestId} />
    </>
  );
}
