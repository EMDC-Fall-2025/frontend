
import React, { useRef } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import theme from "../../theme";

interface ContestRow {
  id: number;
  name: string;
  date: string;
  status: string;
}

interface ContestTableProps {
  rows: ContestRow[];
  isLoading: boolean;
  onRowClick: (id: number) => void;
}

export default function ContestTable({
  rows,
  isLoading,
  onRowClick,
}: ContestTableProps) {
  const gearRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start rotating gear on mouse down
  const handleMouseDown = () => {
    startTimeRef.current = Date.now();
    rotationRef.current = 0;

    // Start continuous rotation
    intervalRef.current = setInterval(() => {
      const gear = gearRef.current;
      if (gear) {
        const elapsed = Date.now() - startTimeRef.current;
        // Increase rotation speed over time (faster the longer it's held)
        const speedMultiplier = Math.min(elapsed / 1000, 5); // Max speed after 5 seconds
        rotationRef.current += speedMultiplier * 10; // Rotate faster over time

        // Add small jiggle movement
        const jiggleX = (Math.random() - 0.5) * 8;
        const jiggleY = (Math.random() - 0.5) * 6;

        gear.style.transform = `translate(${jiggleX}px, ${jiggleY}px) rotate(${rotationRef.current}deg) scale(1.15)`;
      }
    }, 50); // Update every 50ms for smooth animation
  };

  // Stop rotating gear on mouse up
  const handleMouseUp = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const gear = gearRef.current;
    if (gear) {
      // Reset to slight jiggle position when released
      const finalJiggleX = (Math.random() - 0.5) * 4;
      const finalJiggleY = (Math.random() - 0.5) * 3;
      const finalRotation = rotationRef.current % 360;

      gear.style.transform = `translate(${finalJiggleX}px, ${finalJiggleY}px) rotate(${finalRotation}deg) scale(1)`;

      // Add release animation class
      gear.classList.add("gear-release-animate");
      setTimeout(() => {
        gear.classList.remove("gear-release-animate");
      }, 300);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Floating Gear Icon -*/}
      <div
        ref={gearRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop if mouse leaves while pressed
        style={{
          position: "absolute",
          top: -90,
          right: 880,
          width: 48,
          height: 48,
          zIndex: 10,
          cursor: "pointer",
          opacity: 0.85,
          transition: "transform 0.7s cubic-bezier(.25,.1,.25,1)",
          pointerEvents: "auto",
        }}
        className="floating-gear"
        tabIndex={0}
        title="Move gear!"
      >
        {/* Simple gear SVG, colored to match your green theme */}
        <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="18" stroke={theme.palette.primary.main} strokeWidth="5" fill="#eafaea" />
          <g stroke={theme.palette.primary.dark} strokeWidth="3">
            <path d="M24 8V0" />
            <path d="M24 48v-8" />
            <path d="M40 24h8" />
            <path d="M0 24h8" />
            <path d="M39.7 39.7l5.7 5.7" />
            <path d="M8.3 8.3l-5.7-5.7" />
            <path d="M8.3 39.7l-5.7 5.7" />
            <path d="M39.7 8.3l5.7-5.7" />
          </g>
          <circle cx="24" cy="24" r="7" fill="#fff" stroke={theme.palette.primary.main} strokeWidth="2" />
        </svg>
      </div>
      {/* Table stays fully interactive, unaffected */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: 3,
          zIndex: 1, // Ensure table is above gear
          position: "relative",
        }}
      >
        <Table
          aria-label="contest table"
          sx={{
            "& th:first-of-type, & td:first-of-type": { pl: 1 },
          }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
              <TableCell sx={{ fontWeight: 700, color: "#fff" }}>
                Contest Name
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#fff" }}>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography>Loading contests...</Typography>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => onRowClick(row.id)}
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.2s ease, transform 0.1s ease",
                    "&:hover": {
                      backgroundColor: theme.palette.primary.light,
                      transform: "scale(1.01)",
                    },
                  }}
                >
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell
                    sx={{
                      color:
                        row.status === "Finalized"
                          ? "green"
                          : row.status === "In Progress"
                          ? "orange"
                          : "red",
                      fontWeight: 600,
                    }}
                  >
                    {row.status}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Optional: Place this at the end of a CSS file or in <style jsx> */}
      <style>
        {`
          .floating-gear:active {
            filter: drop-shadow(0 0 6px #2ecc40cc);
          }
          .gear-move-animate {
            transition: transform 0.7s cubic-bezier(.25,.1,.25,1);
          }
          .gear-release-animate {
            transition: transform 0.3s ease-out;
          }
        `}
      </style>

    </div>
  );
}