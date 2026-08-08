/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * styles/ui-sensors.js
 */

/**
 * ============================================================
 * FRAME HELM UI FEATURE -- SENSOR CANVAS PRESENTATION
 * ============================================================
 *
 * ROLE:
 *   Owns the executable canvas/PIXI presentation belonging to
 *   the Frame Helm Sensors feature.
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
  "Lancer: Frame Helm";

const SENSOR_LAYER_NAME =
  "lancer-frame-helm-sensor-contacts";


/* ============================================================
   Sensor UI state
   ============================================================ */

let frameHelmSensorLayer =
  null;


/* ============================================================
   Sensor CSS configuration
   ============================================================ */

function frameHelmSensorCssValue(
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


function frameHelmSensorCssNumber(
  propertyName,
  fallback
) {
  const value =
    Number.parseFloat(
      frameHelmSensorCssValue(
        propertyName,
        String(fallback)
      )
    );

  return Number.isFinite(value)
    ? value
    : fallback;
}


function frameHelmCssColorToNumber(
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


function getFrameHelmSensorVisualConfiguration() {
  return {
    contactColor:
      frameHelmCssColorToNumber(
        frameHelmSensorCssValue(
          "--fh-sensor-contact-color",
          "#ff3030"
        ),
        0xff3030
      ),

    labelColor:
      frameHelmCssColorToNumber(
        frameHelmSensorCssValue(
          "--fh-sensor-label-color",
          "#ff5a5a"
        ),
        0xff5a5a
      ),

    labelStrokeColor:
      frameHelmCssColorToNumber(
        frameHelmSensorCssValue(
          "--fh-sensor-label-stroke-color",
          "#160000"
        ),
        0x160000
      ),

    circleStrokeWidth:
      frameHelmSensorCssNumber(
        "--fh-sensor-contact-stroke-width",
        3
      ),

    circleAlpha:
      frameHelmSensorCssNumber(
        "--fh-sensor-contact-alpha",
        0.95
      ),

    radiusMinimum:
      frameHelmSensorCssNumber(
        "--fh-sensor-contact-radius-minimum",
        10
      ),

    radiusScale:
      frameHelmSensorCssNumber(
        "--fh-sensor-contact-radius-scale",
        0.22
      ),

    labelFontSize:
      frameHelmSensorCssNumber(
        "--fh-sensor-label-font-size",
        14
      ),

    labelStrokeWidth:
      frameHelmSensorCssNumber(
        "--fh-sensor-label-stroke-width",
        4
      ),

    labelOffset:
      frameHelmSensorCssNumber(
        "--fh-sensor-label-offset",
        6
      ),

    layerZIndex:
      frameHelmSensorCssNumber(
        "--fh-sensor-layer-z-index",
        100000
      ),

    fontFamily:
      frameHelmSensorCssValue(
        "--fh-sensor-label-font-family",
        "Arial, sans-serif"
      )
  };
}


/* ============================================================
   Sensor layer ownership
   ============================================================ */

function getFrameHelmSensorLayer() {
  return frameHelmSensorLayer;
}


function destroyFrameHelmSensorContacts() {
  if (!frameHelmSensorLayer) {
    return;
  }

  try {
    frameHelmSensorLayer.destroy({
      children: true
    });
  } catch (error) {
    console.warn(
      `${MODULE_TITLE} | Could not destroy sensor contact layer cleanly.`,
      error
    );
  }

  frameHelmSensorLayer =
    null;
}


/* ============================================================
   Sensor presentation primitives
   ============================================================ */

function createFrameHelmSensorCircle(
  radius,
  visual
) {
  const graphics =
    new PIXI.Graphics();

  if (
    typeof graphics.circle === "function" &&
    typeof graphics.stroke === "function"
  ) {
    graphics
      .circle(
        0,
        0,
        radius
      )
      .stroke({
        color:
          visual.contactColor,

        width:
          visual.circleStrokeWidth,

        alpha:
          visual.circleAlpha
      });
  } else {
    graphics.lineStyle(
      visual.circleStrokeWidth,
      visual.contactColor,
      visual.circleAlpha
    );

    graphics.drawCircle(
      0,
      0,
      radius
    );
  }

  return graphics;
}


function createFrameHelmSensorLabel(
  name,
  visual
) {
  const style = {
    fontFamily:
      visual.fontFamily,

    fontSize:
      visual.labelFontSize,

    fontWeight:
      "bold",

    fill:
      visual.labelColor,

    stroke: {
      color:
        visual.labelStrokeColor,

      width:
        visual.labelStrokeWidth
    },

    align:
      "center"
  };

  let label;

  try {
    label =
      new PIXI.Text({
        text:
          name,

        style
      });
  } catch (_error) {
    const strokeHex =
      `#${visual.labelStrokeColor
        .toString(16)
        .padStart(6, "0")}`;

    label =
      new PIXI.Text(
        name,

        new PIXI.TextStyle({
          fontFamily:
            style.fontFamily,

          fontSize:
            style.fontSize,

          fontWeight:
            style.fontWeight,

          fill:
            style.fill,

          stroke:
            strokeHex,

          strokeThickness:
            visual.labelStrokeWidth,

          align:
            style.align
        })
      );
  }

  label.anchor?.set?.(
    0.5,
    1
  );

  return label;
}


/* ============================================================
   Sensor contact composition
   ============================================================ */

function createFrameHelmSensorContact(
  contact,
  visual
) {
  const container =
    new PIXI.Container();

  container.position.set(
    contact.x,
    contact.y
  );

  const radius =
    Math.max(
      visual.radiusMinimum,

      Math.min(
        Number(contact.width) || 30,
        Number(contact.height) || 30
      ) * visual.radiusScale
    );

  const circle =
    createFrameHelmSensorCircle(
      radius,
      visual
    );

  const label =
    createFrameHelmSensorLabel(
      contact.name ??
      "CONTACT",

      visual
    );

  label.position.set(
    0,
    -radius -
      visual.labelOffset
  );

  container.addChild(
    circle
  );

  container.addChild(
    label
  );

  return container;
}


/* ============================================================
   Sensor overlay composition
   ============================================================ */

function renderFrameHelmSensorContacts(
  contacts = []
) {
  destroyFrameHelmSensorContacts();

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
    getFrameHelmSensorVisualConfiguration();

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
      createFrameHelmSensorContact(
        contact,
        visual
      )
    );
  }

  canvas.interface.addChild(
    layer
  );

  frameHelmSensorLayer =
    layer;

  return layer;
}


/* ============================================================
   Public sensor UI surface
   ============================================================ */

export {
  renderFrameHelmSensorContacts,
  destroyFrameHelmSensorContacts,
  getFrameHelmSensorLayer,
  getFrameHelmSensorVisualConfiguration
};