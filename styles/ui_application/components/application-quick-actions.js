/* ============================================================
   Imports -- Application quick-action dependencies
   ============================================================ */

import {
  getFrameConnApplicationActionRegistry,
  getFrameConnApplicationTurnState
} from "./application-runtime-bindings.js";


/* ============================================================
   Application -- Quick actions
   ============================================================ */

function quickActionChildren(
  actionId
) {
  return (
    getFrameConnApplicationActionRegistry()
      .childrenOf(
        actionId
      )
  );
}


function quickActionBreadcrumb(
  action
) {
  const registry =
    getFrameConnApplicationActionRegistry();

  const breadcrumb =
    [];

  let current =
    action;


  while (
    current
  ) {
    breadcrumb.unshift(
      current
    );


    current =
      current.parentId
        ? registry.get(
            current.parentId
          )
        : null;
  }


  return breadcrumb;
}


function renderQuickActionBudget(
  state
) {
  const normalRemaining =
    state?.quickActionsRemaining ??
    0;

  const overchargeRemaining =
    state?.overcharge
      ?.quickActionRemaining ??
    0;


  const overchargeStatus =
    !state?.overcharge?.used
      ? "Available"
      : overchargeRemaining >
          0
        ? "Quick action ready"
        : "Spent";


  return `
    <section class="frame-conn-quick-budget">
      <div>
        <span>Normal Quick Actions</span>
        <strong>${normalRemaining}</strong>
      </div>

      <div>
        <span>Overcharge</span>
        <strong>${foundry.utils.escapeHTML(overchargeStatus)}</strong>
      </div>
    </section>
  `;
}


function canAutomaticallyOvercharge(
  action,
  state
) {
  if (
    !state ||
    !action ||
    action.cost !==
      "quick"
  ) {
    return false;
  }


  if (
    state.ended
  ) {
    return false;
  }


  if (
    state.overcharge.used
  ) {
    return (
      state.overcharge
        .quickActionRemaining >
      0
    );
  }


  return true;
}


function renderQuickActionChoice(
  action,
  state
) {
  const children =
    quickActionChildren(
      action.id
    );

  const hasChildren =
    children.length >
    0;


  let availability;

  let requiresOvercharge =
    false;


  if (
    hasChildren
  ) {
    availability = {
      allowed:
        true,

      reason:
        null
    };
  } else if (
    state
  ) {
    const currentState =
      getFrameConnApplicationTurnState();


    const normalPermission =
      currentState
        ?.canUseAction(
          action
        ) ?? {
        allowed:
          false,

        reason:
          "No active turn state."
      };


    const activeOverchargePermission =
      currentState
        ?.canUseAction(
          action,
          {
            useOvercharge:
              true
          }
        ) ?? {
        allowed:
          false,

        reason:
          "No active turn state."
      };


    const automaticOverchargeAvailable =
      canAutomaticallyOvercharge(
        action,
        state
      );


    requiresOvercharge =
      !normalPermission.allowed &&
      (
        activeOverchargePermission.allowed ||
        automaticOverchargeAvailable
      );


    availability = {
      allowed:
        normalPermission.allowed ||
        activeOverchargePermission.allowed ||
        automaticOverchargeAvailable,

      reason:
        normalPermission.reason ??
        activeOverchargePermission.reason
    };
  } else {
    availability = {
      allowed:
        false,

      reason:
        "Begin a turn plan first."
    };
  }


  const disabled =
    availability.allowed
      ? ""
      : "disabled";


  const arrow =
    hasChildren
      ? `<i class="fas fa-chevron-right frame-conn-category-arrow"></i>`
      : "";


  const status =
    requiresOvercharge
      ? `
        <span class="frame-conn-action-overcharge-warning">
          <i class="fas fa-temperature-high"></i>
          Requires Overcharge
        </span>
      `
      : availability.allowed
        ? ""
        : `
          <span class="frame-conn-action-reason">
            ${foundry.utils.escapeHTML(
              availability.reason ??
              "Unavailable"
            )}
          </span>
        `;


  const overchargeClass =
    requiresOvercharge
      ? " frame-conn-quick-choice-overcharge"
      : "";


  return `
    <button
      type="button"
      class="frame-conn-action-button frame-conn-quick-choice${overchargeClass}"
      data-frame-conn-quick-action="${foundry.utils.escapeHTML(action.id)}"
      ${disabled}
    >
      <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

      <span class="frame-conn-action-copy">
        <strong>${foundry.utils.escapeHTML(action.label)}</strong>
        <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>
        ${status}
      </span>

      ${arrow}
    </button>
  `;
}


function renderQuickActionExecution(
  action,
  state
) {
  const currentState =
    getFrameConnApplicationTurnState();


  const normalPermission =
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


  const activeOverchargePermission =
    state &&
    currentState
      ? currentState.canUseAction(
          action,
          {
            useOvercharge:
              true
          }
        )
      : {
          allowed:
            false,

          reason:
            "Begin a turn plan first."
        };


  const automaticOverchargeAvailable =
    canAutomaticallyOvercharge(
      action,
      state
    );


  const overchargeAllowed =
    activeOverchargePermission.allowed ||
    automaticOverchargeAvailable;


  const willTriggerOvercharge =
    Boolean(
      state &&
      !state.overcharge.used &&
      automaticOverchargeAvailable
    );


  const normalReason =
    normalPermission.allowed
      ? "Spend one of your normal Quick Actions."
      : normalPermission.reason;


  let overchargeTitle =
    "Use Overcharge Action";

  let overchargeReason =
    activeOverchargePermission.reason ??
    "Overcharge is unavailable.";


  if (
    willTriggerOvercharge
  ) {
    overchargeTitle =
      "Overcharge and Use Action";

    overchargeReason =
      "Warning: this will trigger Overcharge, apply the current Overcharge Heat cost, and immediately spend the granted Quick Action.";
  } else if (
    activeOverchargePermission.allowed
  ) {
    overchargeReason =
      "Spend the additional Quick Action already granted by Overcharge.";
  }


  const targetNotice =
    action.requiresTarget
      ? `
        <div class="frame-conn-quick-requirement">
          <i class="fas fa-crosshairs"></i>

          <span>
            This action requires a target. Guided targeting will be added in a later patch.
          </span>
        </div>
      `
      : "";


  return `
    <section class="frame-conn-quick-detail">
      <div class="frame-conn-quick-detail-header">
        <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

        <div>
          <h3>${foundry.utils.escapeHTML(action.label)}</h3>
          <p>${foundry.utils.escapeHTML(action.shortDescription)}</p>
        </div>
      </div>

      ${targetNotice}

      <div class="frame-conn-quick-execution-options">
        <button
          type="button"
          class="frame-conn-quick-execute-button"
          data-frame-conn-quick-execute="normal"
          data-frame-conn-action-id="${foundry.utils.escapeHTML(action.id)}"
          ${normalPermission.allowed ? "" : "disabled"}
        >
          <i class="fas fa-bolt"></i>

          <span>
            <strong>Use Quick Action</strong>
            <small>${foundry.utils.escapeHTML(normalReason ?? "Unavailable")}</small>
          </span>
        </button>

        <button
          type="button"
          class="frame-conn-quick-execute-button frame-conn-overcharge-execute${willTriggerOvercharge ? " frame-conn-auto-overcharge-execute" : ""}"
          data-frame-conn-quick-execute="overcharge"
          data-frame-conn-action-id="${foundry.utils.escapeHTML(action.id)}"
          ${overchargeAllowed ? "" : "disabled"}
        >
          <i class="fas fa-temperature-high"></i>

          <span>
            <strong>${foundry.utils.escapeHTML(overchargeTitle)}</strong>
            <small>${foundry.utils.escapeHTML(overchargeReason)}</small>
          </span>
        </button>
      </div>

      <p class="frame-conn-quick-placeholder-note">
        This records the selected action in the turn planner. The action's attack, tech, targeting, and dice workflow will be connected in later patches.
      </p>
    </section>
  `;
}


function renderQuickActionPanel(
  application,
  data
) {
  const state =
    data.turnState;

  const registry =
    getFrameConnApplicationActionRegistry();


  const selectedAction =
    application.selectedQuickActionId
      ? registry.get(
          application.selectedQuickActionId
        )
      : null;


  const availableActions =
    selectedAction
      ? quickActionChildren(
          selectedAction.id
        )
      : registry.roots(
          "quick"
        );


  const breadcrumb =
    selectedAction
      ? quickActionBreadcrumb(
          selectedAction
        )
      : [];


  const breadcrumbText =
    breadcrumb.length
      ? breadcrumb
          .map(
            action =>
              action.label
          )
          .join(
            " › "
          )
      : "Quick Actions";


  const hasChildren =
    availableActions.length >
    0;


  const actionChoices =
    availableActions
      .map(
        action => {
          return (
            renderQuickActionChoice(
              action,
              state
            )
          );
        }
      )
      .join(
        ""
      );


  const content =
    selectedAction &&
    !hasChildren
      ? renderQuickActionExecution(
          selectedAction,
          state
        )
      : `
        <div class="frame-conn-action-list">
          ${actionChoices}
        </div>
      `;


  return `
    <section class="frame-conn-action-panel">
      <div class="frame-conn-section-heading frame-conn-section-heading-with-back">
        <button
          type="button"
          class="frame-conn-back-button"
          data-frame-conn-command="quick-back"
          aria-label="Go back"
        >
          <i class="fas fa-arrow-left"></i>
        </button>

        <div>
          <span>${foundry.utils.escapeHTML(breadcrumbText)}</span>

          <small>
            Choose one universal quick action. Normally, the same action cannot be taken twice in one turn.
          </small>
        </div>
      </div>

      ${renderQuickActionBudget(state)}
      ${content}
    </section>
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  quickActionChildren,
  quickActionBreadcrumb,
  renderQuickActionBudget,
  canAutomaticallyOvercharge,
  renderQuickActionChoice,
  renderQuickActionExecution,
  renderQuickActionPanel
};
