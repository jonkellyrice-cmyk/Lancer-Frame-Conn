/* ============================================================
   Application lifecycle configuration
   ============================================================ */

const frameConnApplicationLifecycleConfiguration = {
  createApplication:
    null,

  moduleId:
    null,

  moduleTitle:
    null
};


function configureFrameConnApplicationLifecycle({
  createApplication,
  moduleId,
  moduleTitle
} = {}) {
  if (
    typeof createApplication ===
    "function"
  ) {
    frameConnApplicationLifecycleConfiguration.createApplication =
      createApplication;
  }


  if (
    moduleId
  ) {
    frameConnApplicationLifecycleConfiguration.moduleId =
      moduleId;
  }


  if (
    moduleTitle
  ) {
    frameConnApplicationLifecycleConfiguration.moduleTitle =
      moduleTitle;
  }


  return {
    ...frameConnApplicationLifecycleConfiguration
  };
}


/* ============================================================
   Canonical application instance
   ============================================================ */

let frameConnApplication =
  null;


/* ============================================================
   Application construction
   ============================================================ */

function getFrameConnApplication() {
  if (
    !frameConnApplication
  ) {
    const createApplication =
      frameConnApplicationLifecycleConfiguration
        .createApplication;


    if (
      typeof createApplication !==
      "function"
    ) {
      throw new Error(
        "Frame Conn application lifecycle has not been configured with an application factory."
      );
    }


    frameConnApplication =
      createApplication();
  }


  return (
    frameConnApplication
  );
}


function peekFrameConnApplication() {
  return (
    frameConnApplication
  );
}


/* ============================================================
   Application visibility
   ============================================================ */

function isFrameConnApplicationRendered() {
  return Boolean(
    frameConnApplication
      ?.rendered
  );
}


/* ============================================================
   Application rendering
   ============================================================ */

function renderFrameConnApplication(
  force = false
) {
  if (
    !frameConnApplication
      ?.rendered
  ) {
    return false;
  }


  frameConnApplication.render(
    Boolean(
      force
    )
  );


  return true;
}


function openFrameConnApplication() {
  const moduleId =
    frameConnApplicationLifecycleConfiguration
      .moduleId;

  const moduleTitle =
    frameConnApplicationLifecycleConfiguration
      .moduleTitle ??
    "Frame Conn";


  if (
    moduleId &&
    !game.settings.get(
      moduleId,
      "enabled"
    )
  ) {
    ui.notifications.warn(
      `${moduleTitle} is currently disabled.`
    );


    return null;
  }


  const application =
    getFrameConnApplication();


  application.render(
    true
  );


  return application;
}


function closeFrameConnApplication() {
  if (
    !frameConnApplication
  ) {
    return null;
  }


  return (
    frameConnApplication.close()
  );
}


/* ============================================================
   Application token resolution
   ============================================================ */

function getDisplayedFrameConnToken() {
  return (
    frameConnApplication
      ?.getControlledToken?.() ??
    null
  );
}


function frameConnApplicationDisplaysActor(
  actor
) {
  if (
    !actor ||
    !frameConnApplication
      ?.rendered
  ) {
    return false;
  }


  const displayedActor =
    getDisplayedFrameConnToken()
      ?.actor ??
    null;


  if (
    !displayedActor
  ) {
    return false;
  }


  return Boolean(
    displayedActor ===
      actor ||
    (
      displayedActor.uuid &&
      actor.uuid &&
      displayedActor.uuid ===
        actor.uuid
    ) ||
    (
      displayedActor.id &&
      actor.id &&
      displayedActor.id ===
        actor.id
    )
  );
}


/* ============================================================
   Application-specific Foundry hook handlers
   ============================================================ */

function handleFrameConnApplicationControlToken() {
  renderFrameConnApplication(
    false
  );
}


function handleFrameConnApplicationDeleteToken() {
  renderFrameConnApplication(
    false
  );
}


function handleFrameConnApplicationUpdateActor(
  actor
) {
  if (
    !frameConnApplicationDisplaysActor(
      actor
    )
  ) {
    return false;
  }


  // Actor telemetry is live state. Force the already-open application to
  // rerender on the same Actor update instead of waiting for a combat, token,
  // or control event to refresh the cockpit.
  return renderFrameConnApplication(
    true
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  configureFrameConnApplicationLifecycle,
  getFrameConnApplication,
  peekFrameConnApplication,
  isFrameConnApplicationRendered,
  renderFrameConnApplication,
  openFrameConnApplication,
  closeFrameConnApplication,
  getDisplayedFrameConnToken,
  frameConnApplicationDisplaysActor,
  handleFrameConnApplicationControlToken,
  handleFrameConnApplicationDeleteToken,
  handleFrameConnApplicationUpdateActor
};
