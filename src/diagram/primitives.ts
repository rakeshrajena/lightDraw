/**
 * Diagram node primitives façade.
 * Implementation: `./primitives/`
 */
export type { BoxStyle, OrgNodeOptions, OrgBranchStyle } from './primitives/index';
export {
  measureTextWidth,
  centerTextX,
  createLabeledBox,
  createFlowchartNode,
  createClassNode,
  createNetworkNode,
  hashOrgBranchSeed,
  buildDistinctOrgBranchPalette,
  resolveOrgBranchStyle,
  countOrgDescendants,
  drawOrgCollapseGlyph,
  updateOrgCollapseButton,
  orgInitialsAvatarDataUri,
  createOrgNode,
  createPipelineStage,
  createStateNode,
  createCanEcuNode,
  createEdgeLabel,
} from './primitives/index';
