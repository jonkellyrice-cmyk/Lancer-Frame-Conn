/* ============================================================
   Imports -- Application action-surface dependencies
   ============================================================ */

import {
  renderMechStatsBar
} from "./application-telemetry.js";

import {
  renderUnitPanel
} from "./application-unit-panel.js";

import {
  renderBudgetPanel
} from "./application-budget-panel.js";

import {
  renderCategoryMenu,
  renderGenericCategoryPanel
} from "./application-category-panel.js";

import {
  renderQuickActionPanel
} from "./application-quick-actions.js";

import {
  renderFullActionPanel
} from "./application-full-actions.js";

import {
  renderMovementPanel
} from "./application-movement.js";


/* ============================================================
   Application -- Action surface
   ============================================================ */

function renderActionList(
  application,
  data
) {
  const category =
    data.selectedCategory;


  if (
    category?.id ===
    "movement"
  ) {
    return (
      renderMovementPanel(
        application,
        data
      )
    );
  }


  if (
    category?.id ===
    "quick"
  ) {
    return (
      renderQuickActionPanel(
        application,
        data
      )
    );
  }


  if (
    category?.id ===
    "full"
  ) {
    return (
      renderFullActionPanel(
        application,
        data
      )
    );
  }


  if (
    !category
  ) {
    return (
      renderCategoryMenu(
        data
      )
    );
  }


  return (
    renderGenericCategoryPanel(
      category
    )
  );
}


/* ============================================================
   Application -- Inner rendering
   ============================================================ */

function renderApplicationInner(
  application,
  data
) {
  return `
    <section class="frame-helm-shell">
      ${renderMechStatsBar(data)}

      <div class="frame-helm-horizontal-layout">
        <aside class="frame-helm-overview-column">
          ${renderUnitPanel(data)}
          ${renderBudgetPanel(data)}
        </aside>

        <main class="frame-helm-action-column">
          ${renderActionList(application, data)}
        </main>
      </div>
    </section>
  `;
}


async function renderApplicationInnerElement(
  application,
  data
) {
  return $(
    renderApplicationInner(
      application,
      data
    )
  );
}


/* ============================================================
   Exports
   ============================================================ */

export {
  renderActionList,
  renderApplicationInner,
  renderApplicationInnerElement
};
