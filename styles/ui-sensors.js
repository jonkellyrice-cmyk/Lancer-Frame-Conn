/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui-sensors.js
 */

/**
 * ============================================================
 * FRAME CONN UI FEATURE -- SENSOR CANVAS PRESENTATION
 * ============================================================
 *
 * ROLE:
 *   Owns the executable canvas/PIXI presentation belonging to
 *   the Frame Conn Sensors feature.
 *
 * RUNTIME DOMAIN:
 *   scripts/sensors-feature.js
 *
 * STYLE CONFIGURATION:
 *   styles/ui-sensors.css
 *
 * OWNS:
 *   - Sensor PIXI overlay.
 *   - Sensor PIXI containers.
 *   - Sensor contact circles.
 *   - Sensor contact labels.
 *   - Canvas contact placement.
 *   - Sensor visual geometry.
 *   - Reading Sensors visual configuration from CSS.
 *   - Destruction of the transient sensor UI layer.
 *
 * DOES NOT OWN:
 *   - Sensor range.
 *   - Hostility determination.
 *   - Contact qualification.
 *   - Sensor distance calculation.
 *   - Controlled-token selection.
 *   - Foundry sensor refresh policy.
 */


/* ============================================================
   Sensor UI identity
   ============================================================ */

const MODULE_TITLE =
  "Frame Conn";

const SENSOR_LAYER_NAME =
  "lancer-frame-conn-sensor-contacts";


/* ============================================================
   Sensor UI state
   ============================================================ */

let frameConnSensorLayer =
  null;


/* ============================================================
   Sensor CSS configuration
   ============================================================ */

function frameConnSensorCssValue(
  propertyName,
  fallback
) {
  if (
    typeof document === "undefined"
  ) {
    return fallback;
  }

  const value =
    getComputedStyle(
      document.documentElement
    )
      .getPropertyValue(
        propertyName
      )
      .trim();

  return value || fallback;
}


function frameConnSensorCssNumber(
  propertyName,
  fallback
) {
  const value =
    Number.parseFloat(
      frameConnSensorCssValue(
        propertyName,
        String(fallback)
      )
    );

  return Number.isFinite(value)
    ? value
    : fallback;
}


function frameConnCssColorToNumber(
  value,
  fallback
) {
  const normalized =
    String(value ?? "")
      .trim();

  if (
    /^#[0-9a-f]{6}$/i.test(
      normalized
    )
  ) {
    return Number.parseInt(
      normalized.slice(1),
      16
    );
  }

  if (
    /^0x[0-9a-f]{6}$/i.test(
      normalized
    )
  ) {
    return Number.parseInt(
      normalized.slice(2),
      16
    );
  }

  return fallback;
}


function getFrameConnSensorVisualConfiguration() {
  return {
    contactColor:
      frameConnCssColorToNumber(
        frameConnSensorCssValue(
          "--fc-sensor-contact-color",
          "#ff3030"
        ),
        0xff3030
      ),

    reticleStrokeWidth:
      frameConnSensorCssNumber(
        "--fc-sensor-reticle-stroke-width",
        1.5
      ),

    reticleAlpha:
      frameConnSensorCssNumber(
        "--fc-sensor-reticle-alpha",
        0.9
      ),

    reticleClearance:
      frameConnSensorCssNumber(
        "--fc-sensor-reticle-clearance",
        5
      ),

    reticleBracketMinimum:
      frameConnSensorCssNumber(
        "--fc-sensor-reticle-bracket-minimum",
        8
      ),

    reticleBracketScale:
      frameConnSensorCssNumber(
        "--fc-sensor-reticle-bracket-scale",
        0.28
      ),

    layerZIndex:
      frameConnSensorCssNumber(
        "--fc-sensor-layer-z-index",
        100000
      )
  };
}


/* ============================================================
   Sensor layer ownership
   ============================================================ */

function getFrameConnSensorLayer() {
  return frameConnSensorLayer;
}


function destroyFrameConnSensorContacts() {
  if (!frameConnSensorLayer) {
    return;
  }

  try {
    frameConnSensorLayer.destroy({
      children: true
    });
  } catch (error) {
    console.warn(
      `${MODULE_TITLE} | Could not destroy sensor contact layer cleanly.`,
      error
    );
  }

  frameConnSensorLayer =
    null;
}


/* ============================================================
   Sensor presentation primitives
   ============================================================ */

function createFrameConnSensorReticle(
  contact,
  visual
) {
  const graphics =
    new PIXI.Graphics();

  const tokenWidth =
    Math.max(
      1,
      Number(contact.width) ||
        30
    );

  const tokenHeight =
    Math.max(
      1,
      Number(contact.height) ||
        30
    );

  const halfWidth =
    tokenWidth / 2 +
    visual.reticleClearance;

  const halfHeight =
    tokenHeight / 2 +
    visual.reticleClearance;

  const bracketLength =
    Math.min(
      halfWidth,
      halfHeight,
      Math.max(
        visual.reticleBracketMinimum,
        Math.min(
          halfWidth,
          halfHeight
        ) * visual.reticleBracketScale
      )
    );

  const drawBracketGeometry =
    () => {
      graphics
        .moveTo(
          -halfWidth + bracketLength,
          -halfHeight
        )
        .lineTo(
          -halfWidth,
          -halfHeight
        )
        .lineTo(
          -halfWidth,
          -halfHeight + bracketLength
        );

      graphics
        .moveTo(
          halfWidth - bracketLength,
          -halfHeight
        )
        .lineTo(
          halfWidth,
          -halfHeight
        )
        .lineTo(
          halfWidth,
          -halfHeight + bracketLength
        );

      graphics
        .moveTo(
          -halfWidth,
          halfHeight - bracketLength
        )
        .lineTo(
          -halfWidth,
          halfHeight
        )
        .lineTo(
          -halfWidth + bracketLength,
          halfHeight
        );

      graphics
        .moveTo(
          halfWidth - bracketLength,
          halfHeight
        )
        .lineTo(
          halfWidth,
          halfHeight
        )
        .lineTo(
          halfWidth,
          halfHeight - bracketLength
        );
    };

  if (
    typeof graphics.stroke ===
      "function"
  ) {
    drawBracketGeometry();

    graphics.stroke({
      color:
        visual.contactColor,

      width:
        visual.reticleStrokeWidth,

      alpha:
        visual.reticleAlpha
    });
  } else {
    graphics.lineStyle(
      visual.reticleStrokeWidth,
      visual.contactColor,
      visual.reticleAlpha
    );

    drawBracketGeometry();
  }

  return graphics;
}


/* ============================================================
   Sensor contact composition
   ============================================================ */

function createFrameConnSensorContact(
  contact,
  visual
) {
  const container =
    new PIXI.Container();

  container.position.set(
    contact.x,
    contact.y
  );

  container.addChild(
    createFrameConnSensorReticle(
      contact,
      visual
    )
  );

  return container;
}


/* ============================================================
   Sensor overlay composition
   ============================================================ */

function renderFrameConnSensorContacts(
  contacts = []
) {
  destroyFrameConnSensorContacts();

  if (
    !canvas?.ready ||
    !canvas?.interface
  ) {
    return null;
  }

  if (
    !Array.isArray(contacts) ||
    contacts.length === 0
  ) {
    return null;
  }

  const visual =
    getFrameConnSensorVisualConfiguration();

  const layer =
    new PIXI.Container();

  layer.name =
    SENSOR_LAYER_NAME;

  layer.eventMode =
    "none";

  layer.interactiveChildren =
    false;

  layer.zIndex =
    visual.layerZIndex;

  for (
    const contact
    of contacts
  ) {
    layer.addChild(
      createFrameConnSensorContact(
        contact,
        visual
      )
    );
  }

  canvas.interface.addChild(
    layer
  );

  frameConnSensorLayer =
    layer;

  return layer;
}


/* ============================================================
   Public sensor UI surface
   ============================================================ */

export {
  renderFrameConnSensorContacts,
  destroyFrameConnSensorContacts,
  getFrameConnSensorLayer,
  getFrameConnSensorVisualConfiguration
};