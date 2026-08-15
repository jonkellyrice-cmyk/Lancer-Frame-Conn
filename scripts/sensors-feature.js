/**
 * ============================================================
 * FILE PATH / NAME
 * ============================================================
 *
 * scripts/sensors-feature.js
 */

/**
 * ============================================================
 * FRAME CONN -- SENSOR CONTACTS FEATURE
 * ============================================================
 *
 * ROLE:
 *   Owns Frame Conn's sensor-contact gameplay/domain behavior.
 *
 * RESPONSIBILITIES:
 *   - Determine the current sensor-source token.
 *   - Read the source unit's Lancer sensor range.
 *   - Measure hostile-token distance from the source.
 *   - Identify hostile contacts within Sensors.
 *   - Construct sensor-contact presentation data.
 *   - Request rendering through the Sensors UI feature.
 *   - Refresh contacts in response to sensor-relevant
 *     Foundry canvas hooks.
 *
 * DOES NOT OWN:
 *   - PIXI containers.
 *   - PIXI graphics.
 *   - PIXI text.
 *   - Sensor-contact colors.
 *   - Sensor-contact typography.
 *   - Sensor-contact marker geometry.
 *   - Canvas presentation-layer lifecycle.
 *   - Frame Conn application rendering.
 *   - Actor telemetry synchronization.
 *   - Turn state.
 *   - Movement tracking.
 *   - Action registration.
 *   - Action execution.
 *   - Combat synchronization.
 *
 * UI OWNERSHIP:
 *
 *   styles/ui-sensors.js
 *       - PIXI construction
 *       - PIXI layer ownership
 *       - marker rendering
 *       - label rendering
 *       - canvas.interface attachment
 *
 *   styles/ui-sensors.css
 *       - sensor UI visual configuration
 *       - contact colors
 *       - stroke widths
 *       - label typography
 *       - sizing and spacing constants
 *
 * FEATURE CONTRACT:
 *
 *   Provides:
 *     - sensors.contacts
 *     - sensors.refresh
 *     - sensors.measurement
 *
 *   Required dependencies:
 *     - none
 */

import {
  defineFrameConnFeature
} from "./feature-contract.js";

import {
  renderFrameConnSensorContacts,
  destroyFrameConnSensorContacts,
  getFrameConnSensorLayer
} from "../styles/ui-sensors.js";


/* ============================================================
   Sensor-domain identity
   ============================================================ */

const MODULE_TITLE =
  "Frame Conn";


/* ============================================================
   Sensor-distance measurement
   ============================================================ */

function frameConnSensorDistance(
  sourceToken,
  targetToken
) {
  const source =
    sourceToken?.center;

  const target =
    targetToken?.center;

  if (
    !source ||
    !target
  ) {
    return Infinity;
  }

  try {
    const measured =
      canvas?.grid?.measurePath?.(
        [
          source,
          target
        ],
        {
          cost: true
        }
      );

    /**
     * Foundry path cost is already expressed as grid traversal
     * cost/spaces. Do not divide it by the scene distance again.
     * Doing so previously shrank contact distances and allowed
     * enemies far outside a mech's Sensors to qualify.
     */
    const measuredCost =
      typeof measured?.cost === "number"
        ? measured.cost
        : NaN;

    if (
      Number.isFinite(
        measuredCost
      )
    ) {
      return measuredCost;
    }

    /**
     * Some Foundry measurement paths expose physical scene
     * distance instead of traversal cost. Normalize that value
     * exactly once into Lancer grid spaces.
     */
    const measuredDistance =
      typeof measured?.distance === "number"
        ? measured.distance
        : NaN;

    const sceneDistance =
      Number(
        canvas?.scene?.grid?.distance ??
        canvas?.dimensions?.distance ??
        1
      );

    if (
      Number.isFinite(
        measuredDistance
      )
    ) {
      return (
        Number.isFinite(
          sceneDistance
        ) &&
        sceneDistance > 0
      )
        ? measuredDistance /
          sceneDistance
        : measuredDistance;
    }
  } catch (error) {
    console.warn(
      `${MODULE_TITLE} | Sensor range measurement fell back to geometry.`,
      error
    );
  }

  const gridSize =
    Number(
      canvas?.dimensions?.size ??
      100
    );

  if (
    !Number.isFinite(gridSize) ||
    gridSize <= 0
  ) {
    return Infinity;
  }

  return Math.hypot(
    target.x - source.x,
    target.y - source.y
  ) / gridSize;
}


/* ============================================================
   Sensor-source resolution
   ============================================================ */

function frameConnSensorSourceToken() {
  const controlled =
    canvas?.tokens?.controlled ??
    [];

  if (
    controlled.length > 0
  ) {
    return controlled[0];
  }

  return (
    game.combat
      ?.combatant
      ?.token
      ?.object ??
    null
  );
}


/* ============================================================
   Sensor-contact discovery
   ============================================================ */

/**
 * Produces presentation-neutral contact records.
 *
 * The Sensors domain decides WHO qualifies as a contact.
 * The Sensors UI decides HOW that contact looks.
 */
function getFrameConnSensorContacts() {
  const sourceToken =
    frameConnSensorSourceToken();

  const sensorRange =
    Number(
      sourceToken
        ?.actor
        ?.system
        ?.sensor_range
    );

  if (
    !sourceToken ||
    !Number.isFinite(
      sensorRange
    ) ||
    sensorRange <= 0
  ) {
    return [];
  }

  const contacts = [];

  for (
    const token
    of (
      canvas
        ?.tokens
        ?.placeables ??
      []
    )
  ) {
    if (
      token === sourceToken ||
      Number(
        token
          ?.document
          ?.disposition
      ) >= 0
    ) {
      continue;
    }

    const distance =
      frameConnSensorDistance(
        sourceToken,
        token
      );

    if (
      !Number.isFinite(distance) ||
      distance > sensorRange
    ) {
      continue;
    }

    contacts.push({
      id:
        token.document?.id ??
        token.id ??
        null,

      name:
        token.document?.name ??
        token.name ??
        "CONTACT",

      x:
        Number(token.center?.x) ||
        0,

      y:
        Number(token.center?.y) ||
        0,

      width:
        Number(token.w) ||
        30,

      height:
        Number(token.h) ||
        30,

      distance
    });
  }

  return contacts;
}


/* ============================================================
   Sensor-contact refresh
   ============================================================ */

/**
 * Coordinates domain discovery with UI rendering.
 */
function refreshFrameConnSensorContacts() {
  if (
    !canvas?.ready ||
    !canvas?.interface
  ) {
    destroyFrameConnSensorContacts();
    return;
  }

  const contacts =
    getFrameConnSensorContacts();

  renderFrameConnSensorContacts(
    contacts
  );
}


/* ============================================================
   Sensor-domain Foundry hook handlers
   ============================================================ */

function handleFrameConnCanvasReady() {
  refreshFrameConnSensorContacts();
}


function handleFrameConnCanvasPan() {
  refreshFrameConnSensorContacts();
}


function handleFrameConnCreateToken() {
  refreshFrameConnSensorContacts();
}


function handleFrameConnDeleteToken() {
  refreshFrameConnSensorContacts();
}


function handleFrameConnRefreshToken() {
  refreshFrameConnSensorContacts();
}


function handleFrameConnSightRefresh() {
  refreshFrameConnSensorContacts();
}


function handleFrameConnControlToken() {
  refreshFrameConnSensorContacts();
}


/* ============================================================
   Sensor feature definition
   ============================================================ */

export const frameConnSensorsFeature =
  defineFrameConnFeature({
    id:
      "sensors",

    domain:
      "sensors",

    provides: [
      "sensors.contacts",
      "sensors.refresh",
      "sensors.measurement"
    ],

    dependsOn: [],

    optionalDependsOn: [],

    state: {},

    commands: {
      refresh:
        refreshFrameConnSensorContacts,

      destroy:
        destroyFrameConnSensorContacts
    },

    queries: {
      getLayer:
        getFrameConnSensorLayer,

      getSourceToken:
        frameConnSensorSourceToken,

      getContacts:
        getFrameConnSensorContacts,

      distance:
        frameConnSensorDistance
    },

    hooks: {
      canvasReady:
        handleFrameConnCanvasReady,

      canvasPan:
        handleFrameConnCanvasPan,

      createToken:
        handleFrameConnCreateToken,

      deleteToken:
        handleFrameConnDeleteToken,

      refreshToken:
        handleFrameConnRefreshToken,

      sightRefresh:
        handleFrameConnSightRefresh,

      controlToken:
        handleFrameConnControlToken
    },

    lifecycle: {},

    api: {
      refresh:
        refreshFrameConnSensorContacts,

      destroy:
        destroyFrameConnSensorContacts,

      getLayer:
        getFrameConnSensorLayer,

      getSourceToken:
        frameConnSensorSourceToken,

      getContacts:
        getFrameConnSensorContacts,

      distance:
        frameConnSensorDistance
    },

    metadata: {
      label:
        "Sensor Contacts",

      description:
        "Identifies hostile contacts within the selected unit's Lancer sensor range.",

      extractedFrom:
        "scripts/runtime-orchestrator.js",

      uiImplementation:
        "styles/ui-sensors.js",

      uiStyles:
        "styles/ui-sensors.css",

      authoritativeRuntime:
        "scripts/runtime-orchestrator.js"
    }
  });


/* ============================================================
   Transitional named exports
   ============================================================ */

export {
  refreshFrameConnSensorContacts,
  destroyFrameConnSensorContacts as frameConnDestroySensorLayer,
  frameConnSensorDistance,
  frameConnSensorSourceToken,
  getFrameConnSensorContacts
};