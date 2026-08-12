/* ============================================================
   Imports -- Application budget dependencies
   ============================================================ */

import {
  renderCommittedPlan
} from "./application-committed-plan.js";


/* ============================================================
   Application -- Turn budget
   ============================================================ */

function renderBudgetPanel(
  data,
  committedPlan =
    data?.committedPlan ??
    null
) {
  if (
    !data.hasTurnState
  ) {
    return `
      <section class="frame-helm-budget frame-helm-budget-empty">
        <div class="frame-helm-budget-message">
          <i class="fas fa-circle-play"></i>

          <div>
            <strong>
              No turn plan is active.
            </strong>

            <p>
              Begin a plan to track movement, actions, and Overcharge.
            </p>
          </div>
        </div>

        <button
          type="button"
          class="frame-helm-primary-button"
          data-frame-helm-command="begin-turn"
          ${data.hasSelectedToken ? "" : "disabled"}
        >
          <i class="fas fa-play"></i>
          Begin Turn Plan
        </button>
      </section>
    `;
  }


  const state =
    data.turnState;


  const movementValue =
    state.movement.maximum ===
    null
      ? "Unrated"
      : `${state.movement.remaining} / ${state.movement.maximum}`;


  const normalActionLabel =
    state.actionMode ===
    "full"
      ? "Full action used"
      : state.actionMode ===
          "quick"
        ? `${state.quickActionsRemaining} quick remaining`
        : "2 quick or 1 full";


  const overchargeLabel =
    state.overcharge.used
      ? state.overcharge
          .quickActionRemaining >
        0
        ? "Quick action ready"
        : "Used"
      : "Available";


  return `
    <section class="frame-helm-budget">
      <div class="frame-helm-budget-grid">
        <div class="frame-helm-budget-item">
          <span>Movement</span>
          <strong>${foundry.utils.escapeHTML(movementValue)}</strong>
        </div>

        <div class="frame-helm-budget-item">
          <span>Actions</span>
          <strong>${foundry.utils.escapeHTML(normalActionLabel)}</strong>
        </div>

        <div class="frame-helm-budget-item">
          <span>Overcharge</span>
          <strong>${foundry.utils.escapeHTML(overchargeLabel)}</strong>
        </div>

        <div class="frame-helm-budget-item">
          <span>Protocol Window</span>

          <strong>
            ${
              state.protocol.startOfTurnOpen
                ? "Open"
                : "Closed"
            }
          </strong>
        </div>
      </div>

      <div class="frame-helm-budget-controls">
        <button
          type="button"
          class="frame-helm-secondary-button"
          data-frame-helm-command="reset-turn"
        >
          <i class="fas fa-rotate-left"></i>
          Reset Plan
        </button>

        <button
          type="button"
          class="frame-helm-end-turn-button"
          data-frame-helm-command="end-turn"
        >
          <i class="fas fa-flag-checkered"></i>
          End Turn
        </button>
      </div>
    </section>

    ${renderCommittedPlan(committedPlan)}
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  renderBudgetPanel
};
