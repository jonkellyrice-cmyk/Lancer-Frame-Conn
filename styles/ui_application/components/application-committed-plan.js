/* ============================================================
   Application -- Committed-plan rendering
   ============================================================ */

/**
 * Render the canonical committed-plan presentation supplied by the
 * Turn UI feature.
 *
 * This component intentionally does not reconstruct Turn state from
 * history or usedActions. Interpretation belongs to ui_turn; the
 * Application UI is presentation-only at this boundary.
 */
function renderCommittedPlan(
  committedPlan
) {
  const plan =
    committedPlan ??
    {
      empty: true,
      count: 0,
      pendingCount: 0,
      executedCount: 0,
      entries: []
    };


  const entries =
    Array.isArray(
      plan.entries
    )
      ? plan.entries
      : [];


  if (
    plan.empty ||
    entries.length === 0
  ) {
    return `
      <div class="frame-helm-plan-empty">
        <span class="frame-helm-plan-empty-icon">
          <i class="fas fa-circle-notch"></i>
        </span>

        <span class="frame-helm-plan-empty-label">
          NO COMMITTED ACTIONS
        </span>
      </div>
    `;
  }


  return `
    <div class="frame-helm-plan-list">
      ${entries.map(
        entry => {
          const classNames =
            entry?.classNames ??
            "frame-helm-plan-entry";

          const state =
            entry?.state ??
            "committed";

          const detail =
            entry?.detail ??
            "";

          const icon =
            entry?.icon ??
            "fas fa-circle";

          const label =
            entry?.label ??
            "Unknown Action";

          const indexLabel =
            entry?.indexLabel ??
            String(
              entry?.index ??
              ""
            );


          return `
            <div
              class="${foundry.utils.escapeHTML(classNames)}"
              data-frame-helm-plan-state="${foundry.utils.escapeHTML(state)}"
              ${
                entry?.actionId
                  ? `data-frame-helm-action-id="${foundry.utils.escapeHTML(entry.actionId)}"`
                  : ""
              }
              ${
                entry?.id
                  ? `data-frame-helm-committed-action-id="${foundry.utils.escapeHTML(entry.id)}"`
                  : ""
              }
            >
              <span class="frame-helm-plan-index">
                ${foundry.utils.escapeHTML(indexLabel)}
              </span>

              <span class="frame-helm-plan-icon">
                <i class="${foundry.utils.escapeHTML(icon)}"></i>
              </span>

              <span class="frame-helm-plan-copy">
                <strong class="frame-helm-plan-label">
                  ${foundry.utils.escapeHTML(label)}
                </strong>

                ${
                  detail
                    ? `
                      <small class="frame-helm-plan-detail">
                        ${foundry.utils.escapeHTML(detail)}
                      </small>
                    `
                    : ""
                }
              </span>

              <span class="frame-helm-plan-state">
                ${foundry.utils.escapeHTML(
                  String(state).toUpperCase()
                )}
              </span>
            </div>
          `;
        }
      ).join("")}
    </div>
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  renderCommittedPlan
};
