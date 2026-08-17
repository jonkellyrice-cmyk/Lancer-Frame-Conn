import {
  FEATURE_KEY,
  MODULE_ID,
  STYLE_ID,
  finiteNumberOr
} from "../../../../foundry_features/elevation_los/elevation-los-contract.js";

import {
  wallBlocksElevation,
  wallDocumentFromEdge,
  wallElevationRange,
  wallHasFiniteElevation
} from "../../../../foundry_features/elevation_los/wall-elevation-state.js";

import {
  installVisionPolygonWrapper,
  refreshElevationVision,
  sourceDocumentFromPolygon,
  sourceElevationFromPolygon
} from "../../../../foundry_features/elevation_los/elevation-vision-service.js";

import {
  LIGHT_GROUND_ELEVATION,
  horizontalRadiusAtGround,
  installAmbientLightRadiusWrapper,
  preserveRadiusSign,
  radiusValueForReturnedUnits,
  sceneDistanceToPixels
} from "../../../../foundry_features/elevation_los/elevated-light-service.js";

import {
  setAmbientLightElevation,
  setSelectedLightElevation,
  setSelectedWallRange,
  setWallRange
} from "../../../../foundry_features/elevation_los/elevation-document-commands.js";

import {
  injectAmbientLightElevationField,
  injectWallElevationFields,
  installStyles,
  wallConfigRoot
} from "../../../../foundry_features/elevation_los/elevation-config-presentation.js";


/* ==========================================================
   Wall elevation data
   ========================================================== */


/* ==========================================================
   Three-dimensional ambient-light radius
   ========================================================== */


/* ==========================================================
   Vision polygon integration
   ========================================================== */


/* ==========================================================
   Vision and fog refresh
   ========================================================== */


/* ==========================================================
   Wall configuration UI
   ========================================================== */


/* ==========================================================
   Ambient light elevation configuration
   ========================================================== */


/* ==========================================================
   Public helpers and bulk editing
   ========================================================== */


/* ==========================================================
   Foundry hooks
   ========================================================== */

Hooks.once("init", () => {
  installStyles();
  installVisionPolygonWrapper();
  installAmbientLightRadiusWrapper();
});

Hooks.once("ready", () => {
  game.lancerElevationLOS = {
    refresh: refreshElevationVision,
    getWallRange: wallElevationRange,
    setWallRange,
    setSelectedWallRange,
    setAmbientLightElevation,
    setSelectedLightElevation,
    horizontalRadiusAtGround
  };

  refreshElevationVision();
});

Hooks.on(
  "renderWallConfig",
  injectWallElevationFields
);

Hooks.on(
  "renderAmbientLightConfig",
  injectAmbientLightElevationField
);

Hooks.on(
  "updateToken",
  (tokenDocument, changes) => {
    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        "elevation"
      )
    ) {
      refreshElevationVision();
    }
  }
);

Hooks.on(
  "updateWall",
  (wallDocument, changes) => {
    const changedElevationData =
      foundry.utils.hasProperty(
        changes,
        `flags.${MODULE_ID}.${FEATURE_KEY}`
      );

    if (
      changedElevationData ||
      Object.prototype.hasOwnProperty.call(changes, "c") ||
      Object.prototype.hasOwnProperty.call(changes, "sight") ||
      Object.prototype.hasOwnProperty.call(changes, "door") ||
      Object.prototype.hasOwnProperty.call(changes, "ds")
    ) {
      refreshElevationVision();
    }
  }
);

Hooks.on(
  "updateAmbientLight",
  (lightDocument, changes) => {
    const relevantChange =
      Object.prototype.hasOwnProperty.call(
        changes,
        "elevation"
      ) ||
      Object.prototype.hasOwnProperty.call(
        changes,
        "x"
      ) ||
      Object.prototype.hasOwnProperty.call(
        changes,
        "y"
      ) ||
      Object.prototype.hasOwnProperty.call(
        changes,
        "walls"
      ) ||
      Object.prototype.hasOwnProperty.call(
        changes,
        "config"
      );

    if (relevantChange) {
      try {
        lightDocument.object?.initializeLightSource?.();
      } catch (error) {
        console.warn(
          `${MODULE_ID} | Could not directly reinitialize the light source.`,
          error
        );
      }

      refreshElevationVision();
    }
  }
);

Hooks.on(
  "createAmbientLight",
  lightDocument => {
    try {
      lightDocument.object?.initializeLightSource?.();
    } catch {
      // The placeable may not be fully drawn yet.
    }

    refreshElevationVision();
  }
);

Hooks.on(
  "deleteAmbientLight",
  refreshElevationVision
);

Hooks.on(
  "createWall",
  refreshElevationVision
);

Hooks.on(
  "deleteWall",
  refreshElevationVision
);

Hooks.on(
  "canvasReady",
  refreshElevationVision
);
