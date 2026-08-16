/**
 * @file scripts/rules_features/status_conditions/reactor-meltdown-resolution.js
 * @module reactor-meltdown-resolution
 * @responsibility Resolve the terminal Burst 2 reactor-meltdown explosion after countdown timing has declared detonation.
 *
 * Rules ownership:
 * - reactor-meltdown-status.js owns countdown timing.
 * - this module owns the terminal area/save/damage/token-removal consequence.
 * - native Lancer actor.damageCalc remains authoritative for actual damage application.
 */

import {
  rollNativeD20,
  applyNativeDamage
} from "../../../system_bridge/native_adapter/native-adapter.js";

const BURST_RANGE = 2;
const EXPLOSIVE_DAMAGE_FORMULA = "4d6";

function finiteNumber(value) {
  return Number.isFinite(Number(value));
}

function activeTokenForActor(actor) {
  if (!actor) return null;
  const tokens = globalThis.canvas?.tokens?.placeables ?? [];
  return tokens.find(token =>
    token?.actor === actor ||
    (token?.actor?.uuid && token.actor.uuid === actor.uuid) ||
    (token?.actor?.id && token.actor.id === actor.id)
  ) ?? null;
}

async function waitForTemplateObject(templateDocument) {
  if (templateDocument?.object?.shape) return templateDocument;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    await new Promise(resolve => globalThis.setTimeout(resolve, 5));
    if (templateDocument?.object?.shape) return templateDocument;
  }

  return templateDocument;
}

async function createMeltdownBurstTemplate(sourceToken) {
  const scene = globalThis.canvas?.scene ?? null;
  const WeaponRangeTemplate = globalThis.game?.lancer?.canvas?.WeaponRangeTemplate ?? null;
  if (!scene || !sourceToken || typeof WeaponRangeTemplate?.fromRange !== "function") {
    throw new Error("Native Lancer WeaponRangeTemplate is unavailable for reactor meltdown.");
  }

  const templateObject = WeaponRangeTemplate.fromRange(
    { type: "Burst", val: BURST_RANGE },
    sourceToken
  );
  if (!templateObject?.document) {
    throw new Error("Native Lancer Burst 2 template could not be constructed.");
  }

  const gridDistance = Number(scene?.dimensions?.distance) || 1;
  const sourceSize = Number(sourceToken?.document?.width) || 1;
  const center = sourceToken.center ?? {
    x: Number(sourceToken.x) + Number(sourceToken.w) / 2,
    y: Number(sourceToken.y) + Number(sourceToken.h) / 2
  };

  templateObject.document.updateSource({
    x: Math.round(center.x),
    y: Math.round(center.y),
    distance: (BURST_RANGE + sourceSize / 2) * gridDistance,
    [`flags.${globalThis.game.system.id}.burstToken`]: sourceToken.id
  });

  const created = await scene.createEmbeddedDocuments(
    "MeasuredTemplate",
    [templateObject.document.toObject()]
  );
  const templateDocument = created?.[0] ?? null;
  if (!templateDocument) {
    throw new Error("Reactor meltdown Burst 2 template creation failed.");
  }

  return waitForTemplateObject(templateDocument);
}

function tokenInsideTemplate(token, templateDocument) {
  if (!token?.document || !templateDocument?.object) return false;

  const grid = globalThis.canvas?.grid ?? null;
  if (!grid) return false;

  if (grid.type === globalThis.CONST?.GRID_TYPES?.GRIDLESS) {
    const tokenRadius = (Number(token.document.width) || 1) / 2;
    const range = grid.measurePath([token.center, { x: templateDocument.x, y: templateDocument.y }])?.distance;
    return finiteNumber(range) && Number(range) <= Number(templateDocument.distance) + tokenRadius;
  }

  const highlighted = templateDocument.object._getGridHighlightPositions?.() ?? [];
  const templateOffsets = highlighted.map(({ x, y }) =>
    grid.getOffset({
      x: x + grid.sizeX / 2,
      y: y + grid.sizeY / 2
    })
  );
  const tokenOffsets = token.document.getOccupiedGridSpaceOffsets?.() ?? [];

  return tokenOffsets.some(tokenOffset =>
    templateOffsets.some(templateOffset =>
      tokenOffset.i === templateOffset.i &&
      tokenOffset.j === templateOffset.j
    )
  );
}

function affectedCharacterTokens(sourceToken, templateDocument) {
  return (globalThis.canvas?.tokens?.placeables ?? []).filter(token => {
    if (!token?.actor || token.id === sourceToken?.id) return false;
    if (!finiteNumber(token.actor?.system?.agi)) return false;
    return tokenInsideTemplate(token, templateDocument);
  });
}

async function rollMeltdownDamage(sourceActor) {
  const roll = await new Roll(EXPLOSIVE_DAMAGE_FORMULA).evaluate();
  const total = Number(roll.total);
  if (!Number.isFinite(total)) {
    throw new Error("Reactor meltdown 4d6 damage roll did not produce a finite total.");
  }

  await roll.toMessage?.({
    speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: sourceActor }),
    flavor: "REACTOR MELTDOWN // BURST 2 // EXPLOSIVE DAMAGE"
  });

  return total;
}

async function rollAutomaticAgilitySave(targetActor, sourceActor, saveTarget) {
  if (targetActor?.system?.statuses?.stunned) {
    await globalThis.ChatMessage?.create?.({
      speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: targetActor }),
      content: `<strong>${targetActor.name}</strong> automatically fails the Reactor Meltdown Agility save while STUNNED.`
    });
    return Object.freeze({ succeeded: false, total: null, automaticFailure: true });
  }

  const modifier = Number(targetActor?.system?.agi) || 0;
  const execution = await rollNativeD20({
    modifier,
    title: `REACTOR MELTDOWN // AGILITY SAVE vs ${saveTarget}`,
    sourceActorUuid: sourceActor?.uuid ?? null,
    createChatMessage: true
  });

  const total = Number(
    execution?.result?.total ??
    execution?.result?.roll?.total ??
    execution?.raw?.total
  );
  if (!Number.isFinite(total)) {
    throw new Error(`Automatic Agility save failed to resolve for ${targetActor?.name ?? "target"}.`);
  }

  return Object.freeze({
    succeeded: total >= saveTarget,
    total,
    automaticFailure: false,
    execution
  });
}

async function removeVaporizedToken(sourceToken) {
  const scene = sourceToken?.document?.parent ?? globalThis.canvas?.scene ?? null;
  if (!scene || !sourceToken?.document?.id) return false;

  await scene.deleteEmbeddedDocuments(
    "Token",
    [sourceToken.document.id]
  );
  return true;
}

export async function resolveReactorMeltdownExplosion({
  actor: sourceActor
} = {}) {
  if (!sourceActor) return false;

  const sourceToken = activeTokenForActor(sourceActor);
  if (!sourceToken) {
    throw new Error("Reactor meltdown requires the melting mech to have an active scene token.");
  }

  const saveTarget = Number(sourceActor?.system?.save);
  if (!Number.isFinite(saveTarget)) {
    throw new Error("Reactor meltdown source actor has no valid native Save Target.");
  }

  const templateDocument = await createMeltdownBurstTemplate(sourceToken);
  const affectedTokens = affectedCharacterTokens(sourceToken, templateDocument);
  const damageTotal = await rollMeltdownDamage(sourceActor);
  const results = [];

  for (const token of affectedTokens) {
    const targetActor = token.actor;
    const save = await rollAutomaticAgilitySave(targetActor, sourceActor, saveTarget);
    const requestedDamage = save.succeeded
      ? Math.ceil(damageTotal / 2)
      : damageTotal;

    const damageExecution = await applyNativeDamage({
      target: targetActor,
      damage: { explosive: requestedDamage },
      sourceActorUuid: sourceActor.uuid
    });

    results.push(Object.freeze({
      tokenId: token.id,
      actorUuid: targetActor.uuid,
      save,
      requestedDamage,
      damageExecution
    }));
  }

  await removeVaporizedToken(sourceToken);

  return Object.freeze({
    sourceActorUuid: sourceActor.uuid,
    sourceTokenId: sourceToken.id,
    templateId: templateDocument.id,
    saveTarget,
    damageTotal,
    affected: Object.freeze(results)
  });
}
