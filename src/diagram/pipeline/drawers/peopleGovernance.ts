/**
 * People, governance, security seals, and finance marks.
 */
import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import { MID, stroke, fill, addLine, addCircle, addText, addBox, addPoly, addEllipse } from './drawHelpers';

export function drawPerson(app: App, g: Group): void {
  addCircle(app, g, MID, 15, 6, null, 1.7);
  addPoly(app, g, [12, 40, 16, 26, 32, 26, 36, 40], 1.7);
}

export function drawPeople(app: App, g: Group): void {
  addCircle(app, g, 16, 15, 4.5, null, 1.5);
  addCircle(app, g, 32, 15, 4.5, null, 1.5);
  addPoly(app, g, [8, 38, 12, 26, 20, 26, 24, 38], 1.5);
  addPoly(app, g, [24, 38, 28, 26, 36, 26, 40, 38], 1.5);
}

export function drawCheck(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addPoly(app, g, [15, 24, 22, 31, 34, 15], 2.4);
}

export function drawFlag(app: App, g: Group): void {
  addLine(app, g, 14, 8, 0, 32, 2.1);
  g.add(
    app.polygon({
      points: [14, 10, 38, 17, 14, 24],
      fill: fill(),
      stroke: stroke(),
      strokeWidth: 1.5,
      listening: false,
    })
  );
}

export function drawCoin(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addText(app, g, '$', MID - 4, MID + 4, 14);
}

export function drawChange(app: App, g: Group): void {
  addBox(app, g, 10, 10, 28, 28, 4);
  addPoly(app, g, [18, 20, 24, 14, 30, 20], 1.7);
  addPoly(app, g, [18, 28, 24, 34, 30, 28], 1.7);
}

export function drawShield(app: App, g: Group): void {
  addPoly(app, g, [MID, 8, 38, 14, 38, 28, MID, 40, 10, 28, 10, 14, MID, 8], 1.8);
  addLine(app, g, 18, 24, 6, 6, 1.9);
  addLine(app, g, 24, 30, 8, -10, 1.9);
}

export function drawReview(app: App, g: Group): void {
  // Review — eye
  addEllipse(app, g, MID, MID, 16, 10, fill(), 1.7);
  addCircle(app, g, MID, MID, 5, null, 1.6);
  addCircle(app, g, MID, MID, 2, stroke(), 0);
}

export function drawInspection(app: App, g: Group): void {
  // Inspection — magnifier over checklist
  addBox(app, g, 8, 12, 14, 22, 2);
  addLine(app, g, 11, 18, 8, 0, 1.2);
  addLine(app, g, 11, 24, 8, 0, 1.2);
  addLine(app, g, 11, 30, 6, 0, 1.2);
  addCircle(app, g, 32, 20, 9, null, 1.7);
  addLine(app, g, 38, 26, 6, 6, 2.2);
}

export function drawApproval(app: App, g: Group): void {
  // Approval — stamp / seal check
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addCircle(app, g, MID, MID, 10, null, 1.3);
  addPoly(app, g, [16, 24, 22, 30, 34, 16], 2.2);
}

export function drawValidation(app: App, g: Group): void {
  // Validation — clipboard with check (rules pass)
  addBox(app, g, 12, 12, 24, 28, 2);
  addBox(app, g, 18, 8, 12, 6, 1);
  addLine(app, g, 16, 20, 14, 0, 1.2);
  addLine(app, g, 16, 26, 14, 0, 1.2);
  addPoly(app, g, [18, 32, 22, 36, 32, 24], 1.8);
}

export function drawVerification(app: App, g: Group): void {
  // Verification — shield with check (confirmed authentic)
  addPoly(app, g, [MID, 8, 38, 14, 38, 28, MID, 40, 10, 28, 10, 14], 1.8, fill());
  addPoly(app, g, [17, 24, 22, 30, 33, 16], 2.1);
}

export function drawSignOff(app: App, g: Group): void {
  // Sign-off — document + ink signature
  addBox(app, g, 10, 8, 28, 32, 2);
  addLine(app, g, 14, 16, 18, 0, 1.3);
  addLine(app, g, 14, 22, 14, 0, 1.3);
  addLine(app, g, 14, 32, 4, -4, 1.8);
  addLine(app, g, 18, 28, 6, 4, 1.8);
  addLine(app, g, 24, 32, 8, -6, 1.8);
  addLine(app, g, 14, 36, 20, 0, 1.2);
}

export function drawCertification(app: App, g: Group): void {
  // Certification — award badge / seal with ribbon
  addCircle(app, g, MID, 18, 10, fill(), 1.7);
  addCircle(app, g, MID, 18, 5, null, 1.3);
  addPoly(app, g, [18, 26, 14, 40, 20, 34], 1.5, fill());
  addPoly(app, g, [30, 26, 34, 40, 28, 34], 1.5, fill());
  addPoly(app, g, [MID - 3, 16, MID, 22, MID + 5, 12], 1.5);
}

export function drawCompliance(app: App, g: Group): void {
  // Compliance — clipboard + scale/balance mark (distinct from verification shield)
  addBox(app, g, 14, 14, 20, 26, 2);
  addBox(app, g, 18, 10, 12, 6, 1);
  addLine(app, g, MID, 20, 0, 10, 1.6);
  addLine(app, g, 18, 30, 12, 0, 1.6);
  addPoly(app, g, [18, 30, 14, 36, 22, 36], 1.3);
  addPoly(app, g, [30, 30, 26, 36, 34, 36], 1.3);
}

export function drawMilestone(app: App, g: Group): void {
  // Milestone — diamond flag / milestone diamond
  addPoly(app, g, [MID, 10, 36, MID, MID, 38, 12, MID], 1.8, fill());
  addCircle(app, g, MID, MID, 3, stroke(), 0);
}

export function drawPhase(app: App, g: Group): void {
  // Phase — chevron stage
  addPoly(app, g, [6, 14, 28, 14, 38, MID, 28, 34, 6, 34, 14, MID], 1.7, fill());
}

export function drawSprint(app: App, g: Group): void {
  // Sprint — looped arrow around board
  addBox(app, g, 12, 14, 24, 20, 3);
  addLine(app, g, 16, 20, 0, 8, 1.3);
  addLine(app, g, 24, 20, 0, 8, 1.3);
  addLine(app, g, 32, 20, 0, 8, 1.3);
  addPoly(app, g, [38, 12, 42, 16, 34, 16], 0, stroke());
}

export function drawGoal(app: App, g: Group): void {
  // Goal — target
  addCircle(app, g, MID, MID, 14, fill(), 1.7);
  addCircle(app, g, MID, MID, 9, null, 1.4);
  addCircle(app, g, MID, MID, 4, stroke(), 0);
}

export function drawObjective(app: App, g: Group): void {
  // Objective — flag on target base
  addLine(app, g, 14, 10, 0, 28, 2);
  addPoly(app, g, [14, 12, 34, 18, 14, 24], 1.5, fill());
  addCircle(app, g, 14, 38, 4, null, 1.4);
}

export function drawTimeline(app: App, g: Group): void {
  addLine(app, g, 8, MID, 32, 0, 2);
  addCircle(app, g, 12, MID, 3, stroke(), 0);
  addCircle(app, g, 24, MID, 3, stroke(), 0);
  addCircle(app, g, 36, MID, 3, stroke(), 0);
  addLine(app, g, 12, MID, 0, -8, 1.4);
  addLine(app, g, 24, MID, 0, 8, 1.4);
}

export function drawIssue(app: App, g: Group): void {
  // Issue — ticket / bug note
  addBox(app, g, 10, 12, 28, 24, 3);
  addLine(app, g, 10, 20, 28, 0, 1.3);
  addCircle(app, g, 16, 28, 2.5, stroke(), 0);
  addText(app, g, '!', MID + 2, 18, 10);
}

export function drawRisk(app: App, g: Group): void {
  // Risk — warning triangle with R
  addPoly(app, g, [MID, 8, 42, 40, 6, 40], 1.8, fill());
  addText(app, g, 'R', MID - 4, 34, 11);
}

export function drawCustomer(app: App, g: Group): void {
  drawPerson(app, g);
  addCircle(app, g, 34, 14, 6, fill(), 1.4);
  addText(app, g, 'C', 31, 17, 8);
}

export function drawEngineer(app: App, g: Group): void {
  drawPerson(app, g);
  addCircle(app, g, 34, 14, 6, fill(), 1.4);
  addText(app, g, 'E', 31, 17, 8);
}

export function drawManager(app: App, g: Group): void {
  drawPerson(app, g);
  addCircle(app, g, 34, 14, 6, fill(), 1.4);
  addText(app, g, 'M', 30, 17, 8);
}

export function drawOperator(app: App, g: Group): void {
  drawPerson(app, g);
  addCircle(app, g, 34, 14, 6, fill(), 1.4);
  addText(app, g, 'O', 30, 17, 8);
}

export function drawTechnician(app: App, g: Group): void {
  drawPerson(app, g);
  addCircle(app, g, 34, 14, 6, fill(), 1.4);
  addText(app, g, 'T', 31, 17, 8);
}

export function drawVendor(app: App, g: Group): void {
  drawPerson(app, g);
  addCircle(app, g, 34, 14, 6, fill(), 1.4);
  addText(app, g, 'V', 31, 17, 8);
}

export function drawSecretVault(app: App, g: Group): void {
  // Vault — lock
  addBox(app, g, 14, 20, 20, 16, 3);
  addCircle(app, g, MID, 16, 8, null, 1.7);
  addCircle(app, g, MID, 16, 4, fill(), 1.2);
  addCircle(app, g, MID, 28, 2, stroke(), 0);
}

export function drawFirewall(app: App, g: Group): void {
  // Firewall — brick wall
  addBox(app, g, 8, 12, 32, 24, 2);
  addLine(app, g, 8, 20, 32, 0, 1.4);
  addLine(app, g, 8, 28, 32, 0, 1.4);
  addLine(app, g, 18, 12, 0, 8, 1.4);
  addLine(app, g, 28, 12, 0, 8, 1.4);
  addLine(app, g, 13, 20, 0, 8, 1.4);
  addLine(app, g, 24, 20, 0, 8, 1.4);
  addLine(app, g, 18, 28, 0, 8, 1.4);
  addLine(app, g, 28, 28, 0, 8, 1.4);
}

export function drawEncryption(app: App, g: Group): void {
  // Encryption — key
  addCircle(app, g, 16, MID, 8, null, 1.7);
  addCircle(app, g, 16, MID, 3, fill(), 1.2);
  addLine(app, g, 24, MID, 14, 0, 2.2);
  addLine(app, g, 34, MID, 0, 6, 2);
  addLine(app, g, 30, MID, 0, 4, 2);
}

export function drawAuthorization(app: App, g: Group): void {
  // Authorization — shield with keyhole
  addPoly(app, g, [MID, 8, 38, 14, 38, 28, MID, 40, 10, 28, 10, 14], 1.8);
  addCircle(app, g, MID, 22, 3.5, null, 1.5);
  addLine(app, g, MID, 25, 0, 6, 1.8);
}

export function drawDollar(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addText(app, g, '$', MID - 4, MID + 5, 16);
}

export function drawEuro(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addText(app, g, '€', MID - 5, MID + 5, 15);
}

export function drawRupee(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 14, fill(), 1.8);
  addText(app, g, '₹', MID - 5, MID + 5, 15);
}

export function drawVirus(app: App, g: Group): void {
  addCircle(app, g, MID, MID, 8, fill(), 1.6);
  const spikes: Array<[number, number]> = [[0, -14], [10, -10], [14, 0], [10, 10], [0, 14], [-10, 10], [-14, 0], [-10, -10]];
  for (const [dx, dy] of spikes) {
    addLine(app, g, MID + dx * 0.5, MID + dy * 0.5, dx * 0.4, dy * 0.4, 1.5);
    addCircle(app, g, MID + dx, MID + dy, 2, stroke(), 0);
  }
}

export function drawBug(app: App, g: Group): void {
  // Software bug
  addEllipse(app, g, MID, MID, 8, 10, fill(), 1.5);
  addLine(app, g, 16, 16, -6, -6, 1.4);
  addLine(app, g, 32, 16, 6, -6, 1.4);
  addLine(app, g, 16, 24, -8, 0, 1.4);
  addLine(app, g, 32, 24, 8, 0, 1.4);
  addLine(app, g, 16, 32, -6, 6, 1.4);
  addLine(app, g, 32, 32, 6, 6, 1.4);
  addLine(app, g, MID, 14, 0, -6, 1.4);
}

export function drawInsect(app: App, g: Group): void {
  addEllipse(app, g, MID, 28, 7, 9, fill(), 1.5);
  addCircle(app, g, MID, 16, 5, fill(), 1.5);
  addLine(app, g, 18, 14, -6, -6, 1.3);
  addLine(app, g, 30, 14, 6, -6, 1.3);
  addLine(app, g, 18, 30, -8, 4, 1.3);
  addLine(app, g, 30, 30, 8, 4, 1.3);
}

