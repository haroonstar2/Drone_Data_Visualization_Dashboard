export const WAYPOINT_ACTIONS = {
  PASS_THROUGH: 'PASS_THROUGH', // Default: Fly through without stopping
  HOVER: 'HOVER',               // Stop and hover indefinitely
  HOVER_T: 'HOVER_T',           // Stop and hover (e.g., for 5 seconds)
  TAKE_PHOTO: 'TAKE_PHOTO',     // Stop, stabilize, take photo, continue
  LAND: 'LAND',                 // Land at this location
};

// Helper array for rendering dropdown options easily
export const ACTION_OPTIONS = [
  { value: WAYPOINT_ACTIONS.PASS_THROUGH, label: 'Pass Through (Default)' },
  { value: WAYPOINT_ACTIONS.HOVER, label: 'Hover' },
  { value: WAYPOINT_ACTIONS.HOVER_T, label: 'Hover for _ seconds'}, 
  { value: WAYPOINT_ACTIONS.TAKE_PHOTO, label: 'Take Photo' },
  { value: WAYPOINT_ACTIONS.LAND, label: 'Land Here' },
];