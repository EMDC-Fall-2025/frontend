import {
  Collapse,
  Divider,
  IconButton,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { PenaltyField } from "./PenaltyField";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import React from "react";

type PenaltyCategoryProps = {
  isOpen: boolean;
  toggleOpen: () => void;
  categoryTitle: string;
  fields: {
    text: string;
    points: string;
    yesOrNo?: string;
    isIncrement: boolean;
    fieldId: number;
    disabled: boolean;
    incrementLowerBound?: number;
    incrementUpperBound?: number;
  }[];
  penaltyState: any; // Replace `any` with the specific type for `penaltyState`
  onCheckboxChange: (field: number) => void;
  onIncrement: (field: number, upperBound: number) => void;
  onDecrement: (field: number, lowerBound: number) => void;
};

export default function PenaltyCategory({
  isOpen,
  toggleOpen,
  categoryTitle,
  fields,
  penaltyState,
  onCheckboxChange,
  onIncrement,
  onDecrement,
}: PenaltyCategoryProps) {
  return (
    <React.Fragment>
      <TableRow
        sx={{
          "& > *": { borderBottom: "unset" },
          boxShadow: isOpen ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
          transition: "box-shadow 0.3s ease",
          cursor: "pointer",
        }}
        onClick={toggleOpen}
      >
        <TableCell>
          <IconButton>
            {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ cursor: "pointer" }}>
          <Typography sx={{ 
            fontSize: { xs: "0.75rem", sm: "0.9375rem" },
            fontWeight: 600,
            cursor: "pointer"
          }}>
            {categoryTitle}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} style={{ paddingBottom: 0, paddingTop: 0 }}>
          <Collapse in={isOpen}>
            {fields.map((field) => (
              <>
                <PenaltyField
                  fieldId={field.fieldId}
                  text={field.text}
                  points={field.points}
                  disabled={field.disabled}
                  penaltyState={penaltyState}
                  onCheckboxChange={onCheckboxChange}
                  isIncrement={field.isIncrement}
                  yesOrNo={field.yesOrNo}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                  incrementLowerBound={field.incrementLowerBound}
                  incrementUpperBound={field.incrementUpperBound}
                />
                <Divider variant="middle" sx={{ ml: 0.5, mr: 0.5 }} />
              </>
            ))}
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}
