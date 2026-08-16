/* ============================================================
   Imports -- Application telemetry dependencies
   ============================================================ */

import {
  getFrameConnApplicationTurnState
} from "./application-runtime-bindings.js";


/* ============================================================
   Application -- Telemetry data
   ============================================================ */

function defaultManualStats() {
  return {
    hpCurrent:
      0,

    hpMax:
      0,

    heatCurrent:
      0,

    heatMax:
      0,

    armor:
      0,

    overshield:
      0,

    burn:
      0,

    structureCurrent:
      0,

    structureMax:
      0,

    stressCurrent:
      0,

    stressMax:
      0,

    repairsCurrent:
      0,

    repairsMax:
      0,

    meltdownTimer:
      null,

    meltdownImminent:
      false,

    dangerZoneActive:
      false,

    exposedActive:
      false
  };
}


function manualStatsKey(
  token
) {
  return String(
    token?.actor?.id ??
    token?.document?.actorId ??
    token?.id ??
    token?.document?.id ??
    "unselected"
  );
}


function getManualStats(
  application,
  token
) {
  const key =
    manualStatsKey(
      token
    );


  if (
    !application.manualStatsByUnit.has(
      key
    )
  ) {
    application.manualStatsByUnit.set(
      key,
      defaultManualStats()
    );
  }


  const fallback =
    application.manualStatsByUnit.get(
      key
    );

  const actor =
    token?.actor ??
    null;

  const system =
    actor?.system ??
    null;


  if (
    !system
  ) {
    return {
      ...fallback,

      speed:
        null,

      live:
        false,

      actorType:
        null,

      repairsAvailable:
        true
    };
  }


  const finiteOr =
    (
      value,
      fallbackValue = 0
    ) => {
      const numericValue =
        Number(
          value
        );


      return (
        Number.isFinite(
          numericValue
        )
          ? numericValue
          : fallbackValue
      );
    };


  const rangeValue =
    (
      range,
      property,
      fallbackValue = 0
    ) => {
      return finiteOr(
        range?.[
          property
        ],
        fallbackValue
      );
    };


  const repairsAvailable =
    Boolean(
      system.repairs &&
      typeof system.repairs ===
        "object"
    );


  return {
    hpCurrent:
      rangeValue(
        system.hp,
        "value",
        fallback.hpCurrent
      ),

    hpMax:
      rangeValue(
        system.hp,
        "max",
        fallback.hpMax
      ),

    heatCurrent:
      rangeValue(
        system.heat,
        "value",
        fallback.heatCurrent
      ),

    heatMax:
      rangeValue(
        system.heat,
        "max",
        fallback.heatMax
      ),

    armor:
      finiteOr(
        system.armor,
        fallback.armor
      ),

    overshield:
      rangeValue(
        system.overshield,
        "value",
        fallback.overshield
      ),

    burn:
      finiteOr(
        system.burn,
        fallback.burn
      ),

    structureCurrent:
      rangeValue(
        system.structure,
        "value",
        fallback.structureCurrent
      ),

    structureMax:
      rangeValue(
        system.structure,
        "max",
        fallback.structureMax
      ),

    stressCurrent:
      rangeValue(
        system.stress,
        "value",
        fallback.stressCurrent
      ),

    stressMax:
      rangeValue(
        system.stress,
        "max",
        fallback.stressMax
      ),

    repairsCurrent:
      repairsAvailable
        ? rangeValue(
            system.repairs,
            "value",
            fallback.repairsCurrent
          )
        : fallback.repairsCurrent,

    repairsMax:
      repairsAvailable
        ? rangeValue(
            system.repairs,
            "max",
            fallback.repairsMax
          )
        : fallback.repairsMax,

    meltdownTimer:
      system.meltdown_timer === null ||
      system.meltdown_timer === undefined
        ? null
        : finiteOr(
            system.meltdown_timer,
            null
          ),

    speed:
      finiteOr(
        system.speed,
        null
      ),

    live:
      true,

    actorType:
      actor.type ??
      null,

    meltdownImminent:
      system.meltdown_timer !== null &&
      system.meltdown_timer !== undefined &&
      system.meltdown_timer !== "",

    dangerZoneActive:
      (() => {
        const heat = Number(system.heat?.value);
        const heatCap = Number(system.heat?.max);

        return (
          Number.isFinite(heat) &&
          Number.isFinite(heatCap) &&
          heatCap > 0 &&
          heat >= Math.ceil(heatCap / 2)
        );
      })(),

    exposedActive:
      Boolean(
        system.statuses?.exposed
      ),

    structureWarningLevel:
      (() => {
        const structure = Number(system.structure?.value);
        if (!Number.isFinite(structure)) return null;
        if (structure === 3) return "yellow";
        if (structure === 2) return "orange";
        if (structure === 1) return "red";
        return null;
      })(),

    repairsAvailable
  };
}


function updateManualStat(
  application,
  token,
  statName,
  value
) {
  const key =
    manualStatsKey(
      token
    );


  if (
    !application.manualStatsByUnit.has(
      key
    )
  ) {
    application.manualStatsByUnit.set(
      key,
      defaultManualStats()
    );
  }


  const stats =
    application.manualStatsByUnit.get(
      key
    );


  if (
    !Object.prototype
      .hasOwnProperty
      .call(
        stats,
        statName
      )
  ) {
    return;
  }


  const numericValue =
    Number(
      value
    );


  stats[
    statName
  ] =
    Number.isFinite(
      numericValue
    ) &&
    numericValue >= 0
      ? numericValue
      : 0;
}


function synchronizeTurnSpeed(
  application,
  token =
    application?.getControlledToken?.()
) {
  const state =
    getFrameConnApplicationTurnState();


  const numericSpeed =
    Number(
      token?.actor?.system?.speed
    );


  if (
    !state ||
    !Number.isFinite(
      numericSpeed
    ) ||
    numericSpeed < 0
  ) {
    return;
  }


  const tokenId =
    token?.id ??
    token?.document?.id ??
    null;

  const actorId =
    token?.actor?.id ??
    null;

  const stateTokenId =
    state.context?.tokenId ??
    null;

  const stateActorId =
    state.context?.actorId ??
    null;


  const belongsToCurrentPlan =
    Boolean(
      (
        !stateTokenId &&
        !stateActorId
      ) ||
      (
        stateTokenId &&
        stateTokenId ===
          tokenId
      ) ||
      (
        stateActorId &&
        stateActorId ===
          actorId
      )
    );


  if (
    !belongsToCurrentPlan
  ) {
    return;
  }


  if (
    state.speed !==
    numericSpeed
  ) {
    state.setSpeed(
      numericSpeed
    );
  }
}


/* ============================================================
   Application -- Telemetry rendering
   ============================================================ */

function renderPairedStat({
  label,
  currentName,
  maximumName,
  currentValue,
  maximumValue,
  stateClass = ""
}) {
  const normalizedStateClass =
    typeof stateClass === "string"
      ? stateClass.trim()
      : "";

  return `
    <div class="frame-conn-stat-cell frame-conn-stat-paired${normalizedStateClass ? ` ${foundry.utils.escapeHTML(normalizedStateClass)}` : ""}">
      <span class="frame-conn-stat-label">
        ${foundry.utils.escapeHTML(label)}
      </span>

      <div class="frame-conn-stat-value-group">
        <input
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          value="${currentValue}"
          data-frame-conn-stat="${foundry.utils.escapeHTML(currentName)}"
          aria-label="${foundry.utils.escapeHTML(label)} current"
          readonly
        >

        <span class="frame-conn-stat-divider">/</span>

        <input
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          value="${maximumValue}"
          data-frame-conn-stat="${foundry.utils.escapeHTML(maximumName)}"
          aria-label="${foundry.utils.escapeHTML(label)} maximum"
          readonly
        >
      </div>
    </div>
  `;
}


function renderSingleStat({
  label,
  statName,
  value
}) {
  return `
    <div class="frame-conn-stat-cell frame-conn-stat-single">
      <span class="frame-conn-stat-label">
        ${foundry.utils.escapeHTML(label)}
      </span>

      <input
        type="number"
        min="0"
        step="1"
        inputmode="numeric"
        value="${value}"
        data-frame-conn-stat="${foundry.utils.escapeHTML(statName)}"
        aria-label="${foundry.utils.escapeHTML(label)}"
        readonly
      >
    </div>
  `;
}


function renderMechStatsBar(
  data
) {
  const stats =
    data.manualStats;


  const telemetryLabel =
    stats.live
      ? `LIVE ${String(
          stats.actorType ??
          "ACTOR"
        ).toUpperCase()} TELEMETRY`
      : "MANUAL FALLBACK TELEMETRY";


  return `
    <section class="frame-conn-mech-stats-bar">
      <header class="frame-conn-mech-stats-heading">
        <span>&lt;MECH//STATS&gt;</span>
        <small>${foundry.utils.escapeHTML(telemetryLabel)}</small>
      </header>

      <div class="frame-conn-mech-stats-grid${stats.meltdownTimer !== null ? " has-reactor-meltdown" : ""}">
        ${
          stats.meltdownTimer !== null
            ? `
              <div class="frame-conn-stat-cell frame-conn-stat-single frame-conn-stat-meltdown" title="Reactor meltdown: turns until detonation">
                <span class="frame-conn-stat-label">RCTR.MELT</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputmode="numeric"
                  value="${stats.meltdownTimer}"
                  aria-label="Reactor meltdown timer"
                  readonly
                >
              </div>
            `
            : ""
        }

        ${renderPairedStat({
          label:
            "HP",

          currentName:
            "hpCurrent",

          maximumName:
            "hpMax",

          currentValue:
            stats.hpCurrent,

          maximumValue:
            stats.hpMax
        })}

        ${renderPairedStat({
          label:
            "HEAT",

          currentName:
            "heatCurrent",

          maximumName:
            "heatMax",

          currentValue:
            stats.heatCurrent,

          maximumValue:
            stats.heatMax,

          stateClass:
            stats.exposedActive
              ? "frame-conn-heat-exposed"
              : stats.dangerZoneActive
                ? "frame-conn-heat-danger-zone"
                : ""
        })}

        ${renderSingleStat({
          label:
            "ARM",

          statName:
            "armor",

          value:
            stats.armor
        })}

        ${renderSingleStat({
          label:
            "O.SHLD",

          statName:
            "overshield",

          value:
            stats.overshield
        })}

        ${renderSingleStat({
          label:
            "BURN",

          statName:
            "burn",

          value:
            stats.burn
        })}

        ${renderPairedStat({
          label:
            "STRUCT",

          currentName:
            "structureCurrent",

          maximumName:
            "structureMax",

          currentValue:
            stats.structureCurrent,

          maximumValue:
            stats.structureMax,

          stateClass:
            stats.structureWarningLevel
              ? `frame-conn-structure-${stats.structureWarningLevel}`
              : ""
        })}

        ${renderPairedStat({
          label:
            "STRESS",

          currentName:
            "stressCurrent",

          maximumName:
            "stressMax",

          currentValue:
            stats.stressCurrent,

          maximumValue:
            stats.stressMax
        })}

        ${
          stats.repairsAvailable
            ? renderPairedStat({
                label:
                  "REP",

                currentName:
                  "repairsCurrent",

                maximumName:
                  "repairsMax",

                currentValue:
                  stats.repairsCurrent,

                maximumValue:
                  stats.repairsMax
              })
            : `
              <div class="frame-conn-stat-cell frame-conn-stat-unavailable">
                <span class="frame-conn-stat-label">
                  REP
                </span>

                <strong>
                  N/A
                </strong>
              </div>
            `
        }
      </div>
    </section>
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  defaultManualStats,
  manualStatsKey,
  getManualStats,
  updateManualStat,
  synchronizeTurnSpeed,
  renderPairedStat,
  renderSingleStat,
  renderMechStatsBar
};
