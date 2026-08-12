/* ============================================================
   Application lifecycle configuration
   ============================================================ */

const frameHelmApplicationLifecycleConfiguration = {
  createApplication:
    null,

  moduleId:
    null,

  moduleTitle:
    null
};


function configureFrameHelmApplicationLifecycle({
  createApplication,
  moduleId,
  moduleTitle
} = {}) {
  if (
    typeof createApplication ===
    "function"
  ) {
    frameHelmApplicationLifecycleConfiguration.createApplication =
      createApplication;
  }


  if (
    moduleId
  ) {
    frameHelmApplicationLifecycleConfiguration.moduleId =
      moduleId;
  }


  if (
    moduleTitle
  ) {
    frameHelmApplicationLifecycleConfiguration.moduleTitle =
      moduleTitle;
  }


  return {
    ...frameHelmApplicationLifecycleConfiguration
  };
}


/* ============================================================
   Canonical application instance
   ============================================================ */

let frameHelmApplication =
  null;


/* ============================================================
   Application construction
   ============================================================ */

function getFrameHelmApplication() {
  if (
    !frameHelmApplication
  ) {
    const createApplication =
      frameHelmApplicationLifecycleConfiguration
        .createApplication;


    if (
      typeof createApplication !==
      "function"
    ) {
      throw new Error(
        "Frame Helm application lifecycle has not been configured with an application factory."
      );
    }


    frameHelmApplication =
      createApplication();
  }


  return (
    frameHelmApplication
  );
}


function peekFrameHelmApplication() {
  return (
    frameHelmApplication
  );
}


/* ============================================================
   Application visibility
   ============================================================ */

function isFrameHelmApplicationRendered() {
  return Boolean(
    frameHelmApplication
      ?.rendered
  );
}


/* ============================================================
   Application rendering
   ============================================================ */

function renderFrameHelmApplication(
  force = false
) {
  if (
    !frameHelmApplication
      ?.rendered
  ) {
    return false;
  }


  frameHelmApplication.render(
    Boolean(
      force
    )
  );


  return true;
}


function openFrameHelmApplication() {
  const moduleId =
    frameHelmApplicationLifecycleConfiguration
      .moduleId;

  const moduleTitle =
    frameHelmApplicationLifecycleConfiguration
      .moduleTitle ??
    "Frame Helm";


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
    getFrameHelmApplication();


  application.render(
    true
  );


  return application;
}


function closeFrameHelmApplication() {
  if (
    !frameHelmApplication
  ) {
    return null;
  }


  return (
    frameHelmApplication.close()
  );
}


/* ============================================================
   Application token resolution
   ============================================================ */

function getDisplayedFrameHelmToken() {
  return (
    frameHelmApplication
      ?.getControlledToken?.() ??
    null
  );
}


function frameHelmApplicationDisplaysActor(
  actor
) {
  if (
    !actor ||
    !frameHelmApplication
      ?.rendered
  ) {
    return false;
  }


  const displayedActor =
    getDisplayedFrameHelmToken()
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

function handleFrameHelmApplicationControlToken() {
  renderFrameHelmApplication(
    false
  );
}


function handleFrameHelmApplicationDeleteToken() {
  renderFrameHelmApplication(
    false
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  configureFrameHelmApplicationLifecycle,
  getFrameHelmApplication,
  peekFrameHelmApplication,
  isFrameHelmApplicationRendered,
  renderFrameHelmApplication,
  openFrameHelmApplication,
  closeFrameHelmApplication,
  getDisplayedFrameHelmToken,
  frameHelmApplicationDisplaysActor,
  handleFrameHelmApplicationControlToken,
  handleFrameHelmApplicationDeleteToken
};
