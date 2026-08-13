/* ============================================================
   Application -- Listener activation
   ============================================================ */

/**
 * Bind Frame Helm Application DOM listeners.
 *
 * The stable FrameHelmApplication surface remains responsible for
 * calling super.activateListeners(html) before delegating here.
 * This component owns only Frame Helm-specific event routing and
 * delegates behavior back to the application instance.
 */
function activateFrameHelmApplicationListeners(
  application,
  html
) {
  html.find(
    "[data-frame-helm-category]"
  ).on(
    "click",
    event => {
      application.selectedCategory =
        event.currentTarget
          .dataset
          .frameHelmCategory ??
        null;


      application.render(
        false
      );
    }
  );


  html.find(
    "[data-frame-helm-action]"
  ).on(
    "click",
    event => {
      const actionId =
        event.currentTarget
          .dataset
          .frameHelmAction;


      application.onActionSelected(
        actionId
      );
    }
  );


  html.find(
    "[data-frame-helm-movement-mode]"
  ).on(
    "click",
    event => {
      const actionId =
        event.currentTarget
          .dataset
          .frameHelmMovementMode ??
        null;


      application.commitMovementAction(
        actionId
      );
    }
  );


  html.find(
    "[data-frame-helm-quick-action]"
  ).on(
    "click",
    event => {
      application.selectedQuickActionId =
        event.currentTarget
          .dataset
          .frameHelmQuickAction ??
        null;


      application.render(
        false
      );
    }
  );


  html.find(
    "[data-frame-helm-quick-execute]"
  ).on(
    "click",
    event => {
      const actionId =
        event.currentTarget
          .dataset
          .frameHelmActionId;


      const source =
        event.currentTarget
          .dataset
          .frameHelmQuickExecute;


      application.executeQuickAction(
        actionId,
        source ===
          "overcharge"
      );
    }
  );


  html.find(
    "[data-frame-helm-full-action]"
  ).on(
    "click",
    event => {
      application.selectedFullActionId =
        event.currentTarget
          .dataset
          .frameHelmFullAction ??
        null;


      application.render(
        false
      );
    }
  );


  html.find(
    "[data-frame-helm-full-execute]"
  ).on(
    "click",
    event => {
      const actionId =
        event.currentTarget
          .dataset
          .frameHelmFullExecute;


      application.executeFullAction(
        actionId
      );
    }
  );


  html.find(
    "[data-frame-helm-committed-execute]"
  ).on(
    "click",
    event => {
      const committedActionId =
        event.currentTarget
          .dataset
          .frameHelmCommittedExecute ??
        null;


      const actionId =
        event.currentTarget
          .dataset
          .frameHelmActionId ??
        null;


      application.executeCommittedAction(
        committedActionId,
        actionId
      );
    }
  );


  html.find(
    "[data-frame-helm-command]"
  ).on(
    "click",
    event => {
      const command =
        event.currentTarget
          .dataset
          .frameHelmCommand;


      application.onCommand(
        command
      );
    }
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  activateFrameHelmApplicationListeners
};
