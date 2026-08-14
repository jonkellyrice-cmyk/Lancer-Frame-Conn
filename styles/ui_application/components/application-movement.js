/* ============================================================
   Imports -- Application movement dependencies
   ============================================================ */

import {
  getFrameConnApplicationActionRegistry
} from "./application-runtime-bindings.js";


/* ============================================================
   Application -- Movement
   ============================================================ */

function renderMovementPanel(
  application,
  data
) {
  const state =
    data.turnState;


  if (
    !state
  ) {
    return `
      <section class="frame-conn-action-panel">
        <div class="frame-conn-section-heading frame-conn-section-heading-with-back">
          <button
            type="button"
            class="frame-conn-back-button"
            data-frame-conn-command="back"
            aria-label="Back to action categories"
          >
            <i class="fas fa-arrow-left"></i>
          </button>

          <div>
            <span>Movement</span>
            <small>
              Begin a turn plan before tracking movement.
            </small>
          </div>
        </div>

        <div class="frame-conn-no-actions">
          <i class="fas fa-circle-play"></i>
          <p>
            Begin a turn plan to configure and track movement.
          </p>
        </div>
      </section>
    `;
  }


  const registry =
    getFrameConnApplicationActionRegistry();

  const movement =
    state.movement;

  const hasRatedSpeed =
    movement.maximum !==
    null;


  const speedConfiguration =
    hasRatedSpeed
      ? ""
      : `
        <section class="frame-conn-movement-speed-setup">
          <label for="frame-conn-speed-input">
            Mech Speed
          </label>

          <div class="frame-conn-movement-input-row">
            <input
              id="frame-conn-speed-input"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              placeholder="Enter Speed"
              data-frame-conn-speed-input
            >

            <button
              type="button"
              data-frame-conn-command="set-speed"
            >
              <i class="fas fa-gauge-high"></i>
              Set Speed
            </button>
          </div>

          <p class="frame-conn-movement-note">
            Automatic Speed detection will be added during Lancer-system integration.
          </p>
        </section>
      `;


  const movementModes =
    registry
      .childrenOf(
        "movement.standard"
      )
      .filter(
        action =>
          action.movementMode
      )
      .map(
        action => {
          const selected =
            application.selectedMovementMode ===
            action.id;


          const selectedClass =
            selected
              ? " frame-conn-movement-mode-selected"
              : "";


          const restrictedNote =
            action.metadata
              ?.requiresFlightCapability
              ? "Requires flight capability."
              : action.metadata
                  ?.requiresTeleportCapability
                ? "Requires a teleport effect."
                : "";


          return `
            <button
              type="button"
              class="frame-conn-movement-mode${selectedClass}"
              data-frame-conn-movement-mode="${foundry.utils.escapeHTML(action.id)}"
              ${movement.completed ? "disabled" : ""}
            >
              <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

              <span>
                <strong>${foundry.utils.escapeHTML(action.label)}</strong>
                <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>

                ${
                  restrictedNote
                    ? `<em>${foundry.utils.escapeHTML(restrictedNote)}</em>`
                    : ""
                }
              </span>
            </button>
          `;
        }
      )
      .join(
        ""
      );


  const standardMoveSelected =
    application.selectedMovementMode ===
    "movement.standard";


  const standardMoveClass =
    standardMoveSelected
      ? " frame-conn-movement-mode-selected"
      : "";


  const selectedAction =
    application.selectedMovementMode
      ? registry.get(
          application.selectedMovementMode
        )
      : null;


  const selectedMovementLabel =
    selectedAction
      ? selectedAction.label
      : "No movement mode selected";


  const tracker =
    hasRatedSpeed
      ? `
        <section class="frame-conn-movement-tracker">
          <div class="frame-conn-movement-summary">
            <div>
              <span>Speed</span>
              <strong>${movement.maximum}</strong>
            </div>

            <div>
              <span>Spent</span>
              <strong>${movement.spent}</strong>
            </div>

            <div>
              <span>Remaining</span>
              <strong>${movement.remaining}</strong>
            </div>
          </div>

          <div class="frame-conn-movement-current-mode">
            <span>
              Selected Mode
            </span>

            <strong>
              ${foundry.utils.escapeHTML(selectedMovementLabel)}
            </strong>
          </div>

          <p class="frame-conn-movement-note frame-conn-movement-commit-note">
            Selecting a movement mode commits the unit's entire currently available movement allowance. Frame Conn tracks the action budget; the token may still be moved normally on the canvas.
          </p>

          <div class="frame-conn-movement-controls">
            <button
              type="button"
              class="frame-conn-secondary-button"
              data-frame-conn-command="reset-movement"
            >
              <i class="fas fa-rotate-left"></i>
              Reset Movement
            </button>

            <button
              type="button"
              class="frame-conn-primary-button"
              data-frame-conn-command="${movement.completed ? "reopen-movement" : "complete-movement"}"
            >
              <i class="fas ${movement.completed ? "fa-lock-open" : "fa-check"}"></i>
              ${movement.completed ? "Reopen Movement" : "Movement Complete"}
            </button>
          </div>
        </section>
      `
      : "";


  return `
    <section class="frame-conn-action-panel frame-conn-movement-panel">
      <div class="frame-conn-section-heading frame-conn-section-heading-with-back">
        <button
          type="button"
          class="frame-conn-back-button"
          data-frame-conn-command="back"
          aria-label="Back to action categories"
        >
          <i class="fas fa-arrow-left"></i>
        </button>

        <div>
          <span>
            Movement
          </span>

          <small>
            Move up to the unit's rated Speed during its turn.
          </small>
        </div>
      </div>

      ${speedConfiguration}

      <section class="frame-conn-movement-modes">
        <div class="frame-conn-movement-subheading">
          Choose Movement Mode
        </div>

        <button
          type="button"
          class="frame-conn-movement-mode${standardMoveClass}"
          data-frame-conn-movement-mode="movement.standard"
          ${movement.completed ? "disabled" : ""}
        >
          <i class="fas fa-person-walking"></i>

          <span>
            <strong>
              Standard Move
            </strong>

            <small>
              Move normally up to your remaining Speed.
            </small>
          </span>
        </button>

        ${movementModes}
      </section>

      ${tracker}
    </section>
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  renderMovementPanel
};
