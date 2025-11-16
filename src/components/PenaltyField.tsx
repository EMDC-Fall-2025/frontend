import { Box, Typography, Checkbox, Button } from "@mui/material"; // Adjust import path as needed

// Interface for PenaltyField Props
interface IPenaltyFieldProps {
  text: string;
  points: string;
  yesOrNo?: string;
  isIncrement: boolean;
  incrementLowerBound?: number;
  incrementUpperBound?: number;
  fieldId: number;
  disabled: boolean;
  penaltyState: { [key: number]: number };
  onCheckboxChange?: (field: number) => void;
  onIncrement?: (field: number, upperBound: number) => void;
  onDecrement?: (field: number, lowerBound: number) => void;
}

export function PenaltyField({
  text,
  points,
  yesOrNo,
  isIncrement,
  incrementLowerBound = 0,
  incrementUpperBound = Infinity,
  fieldId,
  disabled = false,
  penaltyState,
  onCheckboxChange,
  onIncrement,
  onDecrement,
}: IPenaltyFieldProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: { xs: "center", sm: "left" },
        textAlign: { xs: "center", sm: "left" },
        pt: 1,
        pb: 1,
        pl: 0.75,
        pr: 0.75,
        mt: 1,
        flexDirection: { xs: "column", sm: "row" },
        mb: isIncrement ? 1 : 0,
      }}
    >
      {isIncrement ? (
        <Typography sx={{ 
          mb: { xs: 1, sm: 0 },
          fontSize: { xs: "0.75rem", sm: "0.9375rem" },
          fontWeight: 400,
          cursor: "default"
        }}>
          {text}
        </Typography>
      ) : (
        <Typography sx={{ 
          fontSize: { xs: "0.75rem", sm: "0.9375rem" },
          fontWeight: 400,
          cursor: "default"
        }}>
          {text}
        </Typography>
      )}

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography sx={{ 
          ml: 2,
          fontSize: { xs: "0.75rem", sm: "0.9375rem" },
          fontWeight: 400,
          cursor: "default"
        }}>
          {points}
        </Typography>
        {!isIncrement ? (
          <>
            <Checkbox
              id={`penalty-checkbox-${fieldId}`}
              name={`penalty-${fieldId}`}
              checked={penaltyState[fieldId] === 1}
              onChange={() => onCheckboxChange?.(fieldId)}
              sx={{ ml: 2 }}
              disabled={disabled}
            />
            <Typography sx={{ 
              fontSize: { xs: "0.75rem", sm: "0.9375rem" },
              fontWeight: 400,
              cursor: "default"
            }}>
              {yesOrNo}
            </Typography>
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Button
              id={`penalty-decrement-${fieldId}`}
              name={`penalty-decrement-${fieldId}`}
              sx={{
                padding: "0 !important",
                minWidth: 20,
                width: 30,
                height: 30,
                ml: 2,
              }}
              variant="contained"
              onClick={() => onDecrement?.(fieldId, incrementLowerBound)}
              disabled={penaltyState[fieldId] <= incrementLowerBound}
            >
              -
            </Button>
            <Typography sx={{ 
              ml: 2,
              fontSize: { xs: "0.75rem", sm: "0.9375rem" },
              fontWeight: 600,
              cursor: "default"
            }}>
              {penaltyState[fieldId]}
            </Typography>
            <Button
              id={`penalty-increment-${fieldId}`}
              name={`penalty-increment-${fieldId}`}
              sx={{
                padding: "0 !important",
                minWidth: 20,
                width: 30,
                height: 30,
                ml: 2,
              }}
              variant="contained"
              onClick={() => onIncrement?.(fieldId, incrementUpperBound)}
              disabled={penaltyState[fieldId] >= incrementUpperBound}
            >
              +
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
