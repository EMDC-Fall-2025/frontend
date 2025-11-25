// ==============================
// Component: ContestResultsTable
// Hero leaderboard-style results table for Engineering Machine Design Contest.
// Features modern green/white theme with special styling for top 3 teams.
// ==============================

// ==============================
// React Core
// ==============================
import React from "react";

// ==============================
// UI Libraries & Theme
// ==============================
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";

// ==============================
// Types & Interfaces
// ==============================

interface ContestResultsRow {
  id: number;
  team_name: string;
  school_name: string;
  team_rank: number;
  total_score: number;
  awards: string;
}

// ==============================
// Theme Type Export
// ==============================
export type ThemeType = "green" | "brown" | "black";

interface ContestResultsTableProps {
  rows: ContestResultsRow[];
  theme?: ThemeType;
  onThemeChange?: (theme: ThemeType) => void;
}

// ==============================
// Component Definition
// ==============================

const ContestResultsTable: React.FC<ContestResultsTableProps> = ({ 
  rows, 
  theme = "green", 
  onThemeChange 
}) => {
  const selectedTheme: ThemeType = theme;

  const handleThemeClick = (value: ThemeType) => {
    onThemeChange?.(value);
  };
  
  // Theme Definitions
  // ==============================
  const themes = {
    green: {
      pageBg: "#F3F4F6",
      cardBg: "#FFFFFF",
      primary: "#166534",
      primaryDark: "#064E3B",
      soft: "#E6F4EA",
      accentGold: "#D97706",
      accentSilver: "#9CA3AF",
      accentBronze: "#B45309",
      accent4th: "#6B7280",
      accent5th: "#6B7280",
      accent6th: "#6B7280",
      border: "#E5E7EB",
      textPrimary: "#0B1120",
      textMuted: "#6B7280",
      shadow: "rgba(15, 23, 42, 0.08)",
      hover: "#ECFDF3",
      evenRow: "#FFFFFF",
      oddRow: "#FAFAFA",
      rank1Bg: "linear-gradient(to right, #ECFDF3, #FFFFFF)",
      rank2Bg: "#F9FAFB",
      rank3Bg: "#F9FAFB",
    },
    brown: {
      pageBg: "#F5F3F0",
      cardBg: "#FFFFFF",
      primary: "#8B4513",
      primaryDark: "#654321",
      soft: "#F5E6D3",
      accentGold: "#D4A574",
      accentSilver: "#C9A961",
      accentBronze: "#8B6914",
      accent4th: "#8B7355",
      accent5th: "#8B7355",
      accent6th: "#8B7355",
      border: "#D4C4B0",
      textPrimary: "#3E2723",
      textMuted: "#6D4C41",
      shadow: "rgba(62, 39, 35, 0.08)",
      hover: "#F5E6D3",
      evenRow: "#FFFFFF",
      oddRow: "#FAF8F5",
      rank1Bg: "linear-gradient(to right, #F5E6D3, #FFFFFF)",
      rank2Bg: "#FAF8F5",
      rank3Bg: "#FAF8F5",
    },
    black: {
      pageBg: "#1A1A1A",
      cardBg: "#2D2D2D",
      primary: "#000000",
      primaryDark: "#000000",
      soft: "#3A3A3A",
      accentGold: "#FFD700",
      accentSilver: "#C0C0C0",
      accentBronze: "#CD7F32",
      accent4th: "#808080",
      accent5th: "#808080",
      accent6th: "#808080",
      border: "#404040",
      textPrimary: "#FFFFFF",
      textMuted: "#B0B0B0",
      shadow: "rgba(0, 0, 0, 0.3)",
      hover: "#3A3A3A",
      evenRow: "#2D2D2D",
      oddRow: "#252525",
      rank1Bg: "linear-gradient(to right, #3A3A3A, #2D2D2D)",
      rank2Bg: "#2D2D2D",
      rank3Bg: "#2D2D2D",
    },
  };

  // Get current theme colors
  const colors = themes[selectedTheme];

  // Typography font family
  const poppinsFont = '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  // Get awards array from comma-separated string
  const getAwardsArray = (awards?: string): string[] => {
    if (!awards) return [];
    return awards
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  };

  // Get award chip color based on award type
  const getAwardColor = (award: string): string => {
    const lowerAward = award.toLowerCase();
    if (lowerAward.includes("best design")) {
      return selectedTheme === "green" ? "#16A34A" : selectedTheme === "brown" ? "#A0522D" : "#FFD700";
    }
    if (lowerAward.includes("innovation")) {
      return selectedTheme === "green" ? "#0EA5E9" : selectedTheme === "brown" ? "#CD853F" : "#87CEEB";
    }
    return colors.primary;
  };

  return (
    <Box
      sx={{
        width: "100%",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Main Card / Table Wrapper */}
        <Box
          sx={{
            backgroundColor: colors.cardBg,
            borderRadius: "18px",
            boxShadow: `0 14px 30px ${colors.shadow}`,
            p: 3,
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* Header Area Above the Table */}
          <Box
            sx={{
              mb: 3,
              pb: 2,
              borderBottom: `2px solid ${colors.primary}`,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography
                  sx={{
                    fontFamily: poppinsFont,
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: colors.textPrimary,
                    mb: 0.5,
                  }}
                >
                  Contest Results
                </Typography>
                <Typography
                  sx={{
                    fontFamily: poppinsFont,
                    fontSize: "0.9rem",
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                    color: colors.textMuted,
                  }}
                >
                  Final scores & awards · EMDC
                </Typography>
              </Box>

              {/* Theme Selector - Simple Colored Circles */}
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Tooltip title="Green Theme">
                  <Box
                    onClick={() => handleThemeClick("green")}
                    sx={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#166534",
                      border: selectedTheme === "green" ? `2px solid ${colors.primary}` : `1.5px solid ${colors.border}`,
                      cursor: "pointer",
                      transition: "border 0.2s ease-out",
                    }}
                  />
                </Tooltip>
                <Tooltip title="Brown Theme">
                  <Box
                    onClick={() =>  handleThemeClick("brown")}
                    sx={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#8B4513",
                      border: selectedTheme === "brown" ? `2px solid ${colors.primary}` : `1.5px solid ${colors.border}`,
                      cursor: "pointer",
                      transition: "border 0.2s ease-out",
                    }}
                  />
                </Tooltip>
                <Tooltip title="Black Theme">
                  <Box
                    onClick={() =>  handleThemeClick("black")}
                    sx={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#000000",
                      border: selectedTheme === "black" ? `2px solid ${colors.primary}` : `1.5px solid ${colors.border}`,
                      cursor: "pointer",
                      transition: "border 0.2s ease-out",
                    }}
                  />
                </Tooltip>
              </Box>
            </Box>
          </Box>

          {/* Table Container */}
          <TableContainer
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: colors.border,
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: colors.accentSilver,
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#6B7280",
                },
              },
            }}
          >
            <Table
              stickyHeader
              sx={{
                minWidth: 700,
                "& thead th": {
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  backgroundColor: colors.soft,
                  borderBottom: `1px solid ${colors.border}`,
                  padding: "12px 16px",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  {/* Empty first column to shift all headers right */}
                  <TableCell
                    sx={{
                      width: 4,
                      padding: 0,
                      border: "none",
                      backgroundColor: colors.soft,
                    }}
                  />
                  <TableCell
                    sx={{
                      fontFamily: poppinsFont,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: colors.textPrimary,
                      width: 100,
                    }}
                  >
                    Rank
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: poppinsFont,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: colors.textPrimary,
                    }}
                  >
                    Team
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: poppinsFont,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: colors.textPrimary,
                    }}
                  >
                    School
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontFamily: poppinsFont,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: colors.textPrimary,
                    }}
                  >
                    Total Score
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: poppinsFont,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: colors.textPrimary,
                    }}
                  >
                    Awards
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row, index) => {
                  const rank = row.team_rank || 0;
                  const isRank1 = rank === 1;
                  const isRank2 = rank === 2;
                  const isRank3 = rank === 3;
                  const isRank4 = rank === 4;
                  const isRank5 = rank === 5;
                  const isRank6 = rank === 6;
                  const isTop6 = isRank1 || isRank2 || isRank3 || isRank4 || isRank5 || isRank6;
                  const awardsArray = getAwardsArray(row.awards);
                  const isEven = index % 2 === 0;

                  // Determine row styling based on rank
                  let rowBg = isEven ? colors.evenRow : colors.oddRow;
                  let leftBarColor = colors.border;
                  let rankBadgeBg = colors.border;
                  let rankBadgeText = colors.textPrimary;

                  if (isRank1) {
                    rowBg = colors.rank1Bg;
                    leftBarColor = colors.accentGold;
                    rankBadgeBg = colors.accentGold;
                    rankBadgeText = "#FFFFFF";
                  } else if (isRank2) {
                    rowBg = colors.rank2Bg;
                    leftBarColor = colors.accentSilver;
                    rankBadgeBg = colors.accentSilver;
                    rankBadgeText = "#FFFFFF";
                  } else if (isRank3) {
                    rowBg = colors.rank3Bg;
                    leftBarColor = colors.accentBronze;
                    rankBadgeBg = colors.accentBronze;
                    rankBadgeText = "#FFFFFF";
                  } else if (isRank4) {
                    rowBg = colors.rank2Bg;
                    leftBarColor = colors.accent4th;
                    rankBadgeBg = colors.accent4th;
                    rankBadgeText = "#FFFFFF";
                  } else if (isRank5) {
                    rowBg = colors.rank2Bg;
                    leftBarColor = colors.accent5th;
                    rankBadgeBg = colors.accent5th;
                    rankBadgeText = "#FFFFFF";
                  } else if (isRank6) {
                    rowBg = colors.rank2Bg;
                    leftBarColor = colors.accent6th;
                    rankBadgeBg = colors.accent6th;
                    rankBadgeText = "#FFFFFF";
                  }

                  return (
                    <TableRow
                      key={row.id}
                      sx={{
                        backgroundColor: rowBg,
                        borderBottom: `1px solid ${colors.border}`,
                        position: "relative",
                        transition: "all 200ms ease-out",
                        "&:hover": {
                          backgroundColor: colors.hover,
                          transform: "translateY(-2px)",
                          boxShadow: `0 10px 25px ${colors.shadow}`,
                        },
                        "&:focus-visible": {
                          outline: `2px solid ${colors.primary}`,
                          outlineOffset: "2px",
                        },
                        "& td": {
                          py: { xs: 1.75, md: 1.2 },
                        },
                      }}
                    >
                      {/* Left Accent Bar for Top 6 */}
                      {isTop6 && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: "4px",
                            backgroundColor: leftBarColor,
                            borderRadius: "999px",
                          }}
                        />
                      )}

                      {/* Rank */}
                      <TableCell
                        align="center"
                        sx={{
                          position: "relative",
                          width: 100,
                          pl: isTop6 ? 2 : 1, 
                        }}
                      >
                        {isTop6 ? (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              backgroundColor: rankBadgeBg,
                              color: rankBadgeText,
                              fontFamily: poppinsFont,
                              fontSize: "0.9rem",
                              fontWeight: 500,
                            }}
                          >
                            {rank}
                          </Box>
                        ) : (
                          <Typography
                            sx={{
                              fontFamily: poppinsFont,
                              fontSize: "0.9rem",
                              fontWeight: 500,
                              color: colors.textPrimary,
                            }}
                          >
                            {rank || "—"}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Team */}
                      <TableCell>
                        <Typography
                          sx={{
                            fontFamily: poppinsFont,
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            color: colors.textPrimary,
                          }}
                        >
                          {row.team_name}
                        </Typography>
                      </TableCell>

                      {/* School */}
                      <TableCell>
                        <Typography
                          sx={{
                            fontFamily: poppinsFont,
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            color: colors.textMuted,
                          }}
                        >
                          {row.school_name || "—"}
                        </Typography>
                      </TableCell>

                      {/* Total Score */}
                      <TableCell align="center">
                        <Typography
                          sx={{
                            fontFamily: poppinsFont,
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            color: colors.textPrimary,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {row.total_score}
                        </Typography>
                      </TableCell>

                      {/* Awards */}
                      <TableCell>
                        {awardsArray.length > 0 ? (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.75,
                            }}
                          >
                            {awardsArray.map((award, idx) => (
                              <Chip
                                key={`${row.id}-award-${idx}`}
                                label={award}
                                size="small"
                                sx={{
                                  fontFamily: poppinsFont,
                                  fontSize: "0.8rem",
                                  fontWeight: 500,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                  backgroundColor: getAwardColor(award),
                                  color: "#FFFFFF",
                                  borderRadius: "999px",
                                  px: 1.25,
                                  py: 0.5,
                                  height: "auto",
                                  transition: "background-color 180ms ease-out",
                                  "&:hover": {
                                    backgroundColor: colors.primaryDark,
                                    opacity: 0.9,
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography
                            sx={{
                              fontFamily: poppinsFont,
                              fontSize: "0.9rem",
                              fontWeight: 500,
                              color: colors.textMuted,
                              fontStyle: "italic",
                            }}
                          >
                            No special awards
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </Box>
  );
};

export default ContestResultsTable;
