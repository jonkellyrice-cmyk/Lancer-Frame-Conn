/* ============================================================
   Application -- Listener activation
   ============================================================ */

/**
 * Bind Frame Conn Application DOM listeners.
 *
 * The stable FrameConnApplication surface remains responsible for
 * calling super.activateListeners(html) before delegating here.
 * This component owns only Frame Conn-specific event routing and
 * delegates behavior back to the application instance.
 */
function activateFrameConnApplicationListeners(
  application,
  html
) {
  html.find(
    "[data-frame-conn-category]"
  ).on(
    "click",
    event => {
      const categoryId =
        event.currentTarget
          .dataset
          .frameConnCategory ??
        null;


      const beginsTurnPlan =
        categoryId ===
          "movement" ||
        categoryId ===
          "quick" ||
        categoryId ===
          "full" ||
        categoryId ===
          "special" ||
        categoryId ===
          "protocol";


      if (
        beginsTurnPlan &&
        !application.ensureTurnPlan()
      ) {
        return;
      }


      application.selectedCategory =
        categoryId;


      application.render(
        false
      );
    }
  );


  html.find(
    "[data-frame-conn-action]"
  ).on(
    "click",
    event => {
      const actionId =
        event.currentTarget
          .dataset
          .frameConnAction;


      application.onActionSelected(
        actionId
      );
    }
  );


  html.find(
    "[data-frame-conn-movement-mode]"
  ).on(
    "click",
    event => {
      const actionId =
        event.currentTarget
          .dataset
          .frameConnMovementMode ??
        null;


      application.commitMovementAction(
        actionId
      );
    }
  );


  html.find(
    "[data-frame-conn-quick-action]"
  ).on(
    "click",
    event => {
      application.selectedQuickActionId =
        event.currentTarget
          .dataset
          .frameConnQuickAction ??
        null;


      application.render(
        false
      );
    }
  );


  html.find(
    "[data-frame-conn-quick-execute]"
  ).on(
    "click",
    event => {
      const actionId =
        event.currentTarget
          .dataset
          .frameConnActionId;


      const source =
        event.currentTarget
          .dataset
          .frameConnQuickExecute;


      application.executeQuickAction(
        actionId,
        source ===
          "overcharge"
      );
    }
  );


  html.find(
    "[data-frame-conn-full-action]"
  ).on(
    "click",
    event => {
      application.selectedFullActionId =
        event.currentTarget
          .dataset
          .frameConnFullAction ??
        null;


      application.render(
        false
      );
    }
  );


  html.find(
    "[data-frame-conn-full-execute]"
  ).on(
    "click",
    event => {
      const actionId =
        event.currentTarget
          .dataset
          .frameConnFullExecute;


      application.executeFullAction(
        actionId
      );
    }
  );


  html.find(
    "[data-frame-conn-committed-execute]"
  ).on(
    "click",
    event => {
      const committedActionId =
        event.currentTarget
          .dataset
          .frameConnCommittedExecute ??
        null;


      const actionId =
        event.currentTarget
          .dataset
          .frameConnActionId ??
        null;


      application.executeCommittedAction(
        committedActionId,
        actionId
      );
    }
  );


  html.find(
    "[data-frame-conn-command]"
  ).on(
    "click",
    event => {
      const command =
        event.currentTarget
          .dataset
          .frameConnCommand;


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
  activateFrameConnApplicationListeners
};
