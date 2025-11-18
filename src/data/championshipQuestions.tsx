// Import all question types
import { machineDesignQuestions } from './machineDesignQuestions';
import { presentationQuestions } from './presentationQuestions';
import { generalPenaltiesQuestions } from './generalPenaltiesQuestions';
import { runPenaltiesQuestions } from './runPenaltiesQuestions';

// Combine all question types for championship scoring
export const championshipQuestions = [
  // Machine Design Questions (8 questions) - fields 1-8
  ...machineDesignQuestions.slice(0, 8).map((q, index) => ({
    ...q,
    id: index + 1,
    field: `field${index + 1}`,
    section: "Machine Design",
    isPenalty: false
  })),
  
  // Machine Design Comment (field9)
  {
    id: 9,
    field: "field9",
    questionText: "Machine Design Comments",
    section: "Machine Design",
    isPenalty: false
  },
  
  // Presentation Questions (8 questions) - fields 10-17
  ...presentationQuestions.slice(0, 8).map((q, index) => ({
    ...q,
    id: index + 10,
    field: `field${index + 10}`,
    section: "Presentation",
    isPenalty: false
  })),
  
  // Presentation Comment (field18)
  {
    id: 18,
    field: "field18",
    questionText: "Presentation Comments",
    section: "Presentation",
    isPenalty: false
  }
];

// Penalty questions for championship scoring
// These will be handled separately as they need different field mappings
export const championshipGeneralPenalties = generalPenaltiesQuestions.map((q, index) => ({
  ...q,
  id: index + 1,
  field: `field${index + 1}`,
  section: "General Penalties",
  isPenalty: true
}));

export const championshipRunPenalties = runPenaltiesQuestions.filter(q => q.id !== 9).map((q, index) => ({
  ...q,
  id: index + 1,
  field: `field${index + 1}`,
  section: "Run Penalties",
  isPenalty: true
}));
