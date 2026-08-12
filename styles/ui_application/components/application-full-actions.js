/* ============================================================
   Imports -- Application full-action dependencies
   ============================================================ */

import {
  getFrameHelmApplicationActionRegistry,
  getFrameHelmApplicationTurnState
} from "./application-runtime-bindings.js";


/* ============================================================
   Application -- Full actions
   ============================================================ */

function renderFullActionBudget(
  state
) {
  let status =
    "Unavailable";


  if (
    state
  ) {
    if (
      state.actionMode ===
      "full"
    ) {
      status =
        "Full action used";
    } else if (
      state.actionMode ===
      "quick"
    ) {
      status =
        "Quick action already used";
    } else if (
      state.fullActionAvailable
    ) {
      status =
        "Available";
    }
  }


  return `
    <section class="frame-helm-full-budget">
      <div>
        <span>Full Action</span>
        <strong>${foundry.utils.escapeHTML(status)}</strong>
      </div>

      <div>
        <span>Normal Quick Actions</span>
        <strong>${state?.quickActionsRemaining ?? 0}</strong>
      </div>
    </section>
  `;
}


function renderFullActionChoice(
  action,
  state
) {
  const currentState =
    getFrameHelmApplicationTurnState();


  const permission =
    state &&
    currentState
      ? currentState.canUseAction(
          action
        )
      : {
          allowed:
            false,

          reason:
            "Begin a turn plan first."
        };


  const reason =
    permission.allowed
      ? ""
      : `
        <span class="frame-helm-action-reason">
          ${foundry.utils.escapeHTML(permission.reason ?? "Unavailable")}
        </span>
      `;


  return `
    <button
      type="button"
      class="frame-helm-action-button frame-helm-full-choice"
      data-frame-helm-full-action="${foundry.utils.escapeHTML(action.id)}"
      ${permission.allowed ? "" : "disabled"}
    >
      <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

      <span class="frame-helm-action-copy">
        <strong>${foundry.utils.escapeHTML(action.label)}</strong>
        <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>
        ${reason}
      </span>

      <i class="fas fa-chevron-right frame-helm-category-arrow"></i>
    </button>
  `;
}


function renderFullActionRequirements(
  action
) {
  const notices =
    [];


  if (
    action.requiresTarget
  ) {
    notices.push(`
      <div class="frame-helm-full-requirement">
        <i class="fas fa-crosshairs"></i>
        <span>
          This action requires one or more targets. Guided targeting will be connected in a later patch.
        </span>
      </div>
    `);
  }


  if (
    action.id ===
    "full.barrage"
  ) {
    notices.push(`
      <div class="frame-helm-full-requirement">
        <i class="fas fa-gun"></i>
        <span>
          Choose two eligible weapons, or one eligible Superheavy weapon. Weapon-mount selection will be added later.
        </span>
      </div>
    `);
  }


  if (
    action.id ===
    "full.full-tech"
  ) {
    notices.push(`
      <div class="frame-helm-full-requirement">
        <i class="fas fa-laptop-code"></i>
        <span>
          Full Tech allows two different Quick Tech options, or one available Full Tech option. Its nested selector will be added during tech integration.
        </span>
      </div>
    `);
  }


  if (
    action.id ===
    "full.stabilize"
  ) {
    notices.push(`
      <div class="frame-helm-full-requirement">
        <i class="fas fa-screwdriver-wrench"></i>
        <span>
          Choose the applicable Stabilize options after selecting this action. The detailed Stabilize workflow will be added later.
        </span>
      </div>
    `);
  }


  if (
    action.id ===
    "full.activate"
  ) {
    notices.push(`
      <div class="frame-helm-full-requirement">
        <i class="fas fa-gears"></i>
        <span>
          This branch will list installed systems with an Activate (Full) action once actor-system integration is added.
        </span>
      </div>
    `);
  }


  if (
    action.id ===
    "full.mount-dismount"
  ) {
    notices.push(`
      <div class="frame-helm-full-requirement">
        <i class="fas fa-person-arrow-up-from-line"></i>
        <span>
          Choose Mount, Dismount, or Eject. The selected mode will be resolved manually for now.
        </span>
      </div>
    `);
  }


  return (
    notices.join(
      ""
    )
  );
}


function renderFullActionExecution(
  action,
  state
) {
  const currentState =
    getFrameHelmApplicationTurnState();


  const permission =
    state &&
    currentState
      ? currentState.canUseAction(
          action
        )
      : {
          allowed:
            false,

          reason:
            "Begin a turn plan first."
        };


  const confirmationText =
    permission.allowed
      ? "Spend your normal action budget as one Full Action."
      : permission.reason ??
        "This Full Action is unavailable.";


  return `
    <section class="frame-helm-full-detail">
      <div class="frame-helm-full-detail-header">
        <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

        <div>
          <h3>${foundry.utils.escapeHTML(action.label)}</h3>
          <p>${foundry.utils.escapeHTML(action.shortDescription)}</p>
        </div>
      </div>

      ${renderFullActionRequirements(action)}

      <button
        type="button"
        class="frame-helm-full-execute-button"
        data-frame-helm-full-execute="${foundry.utils.escapeHTML(action.id)}"
        ${permission.allowed ? "" : "disabled"}
      >
        <i class="fas fa-hourglass"></i>

        <span>
          <strong>Use Full Action</strong>
          <small>${foundry.utils.escapeHTML(confirmationText)}</small>
        </span>
      </button>

      <p class="frame-helm-full-placeholder-note">
        Frame Helm will record the action and spend the normal action budget. Dice rolls, targeting, weapon selection, and system effects remain manual until their dedicated workflows are added.
      </p>
    </section>
  `;
}


function renderFullActionPanel(
  application,
  data
) {
  const state =
    data.turnState;

  const registry =
    getFrameHelmApplicationActionRegistry();


  const selectedAction =
    application.selectedFullActionId
      ? registry.get(
          application.selectedFullActionId
        )
      : null;


  const content =
    selectedAction
      ? renderFullActionExecution(
          selectedAction,
          state
        )
      : `
        <div class="frame-helm-action-list">
          ${registry
            .roots(
              "full"
            )
            .map(
              action => {
                return (
                  renderFullActionChoice(
                    action,
                    state
                  )
                );
              }
            )
            .join(
              ""
            )}
        </div>
      `;


  const heading =
    selectedAction
      ? selectedAction.label
      : "Full Actions";


  return `
    <section class="frame-helm-action-panel">
      <div class="frame-helm-section-heading frame-helm-section-heading-with-back">
        <button
          type="button"
          class="frame-helm-back-button"
          data-frame-helm-command="full-back"
          aria-label="Go back"
        >
          <i class="fas fa-arrow-left"></i>
        </button>

        <div>
          <span>${foundry.utils.escapeHTML(heading)}</span>

          <small>
            A Full Action spends both normal Quick Action slots. Overcharge remains separate.
          </small>
        </div>
      </div>

      ${renderFullActionBudget(state)}
      ${content}
    </section>
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  renderFullActionBudget,
  renderFullActionChoice,
  renderFullActionRequirements,
  renderFullActionExecution,
  renderFullActionPanel
};
