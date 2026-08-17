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
    null,
  {
    includeCommittedPlan = true
  } = {}
) {
  if (
    !data.hasTurnState
  ) {
    return `
      <section class="frame-conn-budget frame-conn-budget-empty">
        <div class="frame-conn-budget-message">
          <i class="fas fa-bolt"></i>

          <div>
            <strong>
              Turn plan ready.
            </strong>

            <p>
              Choose an action and Frame Conn will begin tracking the turn automatically.
            </p>
          </div>
        </div>
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
    <section class="frame-conn-budget">
      <div class="frame-conn-budget-grid">
        <div class="frame-conn-budget-item">
          <span>Movement</span>
          <strong>${foundry.utils.escapeHTML(movementValue)}</strong>
        </div>

        <div class="frame-conn-budget-item">
          <span>Actions</span>
          <strong>${foundry.utils.escapeHTML(normalActionLabel)}</strong>
        </div>

        <div class="frame-conn-budget-item">
          <span>Overcharge</span>
          <strong>${foundry.utils.escapeHTML(overchargeLabel)}</strong>
        </div>

        <div class="frame-conn-budget-item">
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

      <div class="frame-conn-budget-controls">
        <button
          type="button"
          class="frame-conn-secondary-button"
          data-frame-conn-command="reset-turn"
        >
          <i class="fas fa-rotate-left"></i>
          Reset Plan
        </button>

        <button
          type="button"
          class="frame-conn-end-turn-button"
          data-frame-conn-command="end-turn"
        >
          <i class="fas fa-flag-checkered"></i>
          End Turn
        </button>
      </div>
    </section>

    ${includeCommittedPlan ? renderCommittedPlan(committedPlan) : ""}
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  renderBudgetPanel
};
