/* ============================================================
   Application -- Action categories
   ============================================================ */

function renderCategoryMenu(
  data
) {
  const buttons =
    data.categories
      .map(
        category => {
          const unavailableClass =
            data.hasTurnState &&
            !category.hasAvailableAction
              ? " frame-helm-category-unavailable"
              : "";


          return `
            <button
              type="button"
              class="frame-helm-category-button${unavailableClass}"
              data-frame-helm-category="${foundry.utils.escapeHTML(category.id)}"
            >
              <i class="${foundry.utils.escapeHTML(category.icon)}"></i>

              <span class="frame-helm-category-copy">
                <strong>
                  ${foundry.utils.escapeHTML(category.label)}
                </strong>

                <small>
                  ${foundry.utils.escapeHTML(category.description)}
                </small>
              </span>

              <i class="fas fa-chevron-right frame-helm-category-arrow"></i>
            </button>
          `;
        }
      )
      .join(
        ""
      );


  return `
    <section class="frame-helm-action-panel">
      <div class="frame-helm-section-heading">
        <span>
          Choose an action type
        </span>
      </div>

      <div class="frame-helm-category-list">
        ${buttons}
      </div>
    </section>
  `;
}


/* ============================================================
   Application -- Generic category panel
   ============================================================ */

function renderGenericCategoryPanel(
  category
) {
  const actionButtons =
    category.actions
      .map(
        action => {
          const disabledAttribute =
            action.allowed
              ? ""
              : "disabled";


          const unavailableText =
            action.allowed
              ? ""
              : `
                <span class="frame-helm-action-reason">
                  ${foundry.utils.escapeHTML(action.unavailableReason)}
                </span>
              `;


          return `
            <button
              type="button"
              class="frame-helm-action-button"
              data-frame-helm-action="${foundry.utils.escapeHTML(action.id)}"
              ${disabledAttribute}
            >
              <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

              <span class="frame-helm-action-copy">
                <strong>${foundry.utils.escapeHTML(action.label)}</strong>
                <small>${foundry.utils.escapeHTML(action.shortDescription)}</small>
                ${unavailableText}
              </span>
            </button>
          `;
        }
      )
      .join(
        ""
      );


  const emptyMessage =
    category.hasActions
      ? ""
      : `
        <div class="frame-helm-no-actions">
          <i class="fas fa-circle-info"></i>

          <p>
            No universal actions are registered in this category yet.
          </p>
        </div>
      `;


  return `
    <section class="frame-helm-action-panel">
      <div class="frame-helm-section-heading frame-helm-section-heading-with-back">
        <button
          type="button"
          class="frame-helm-back-button"
          data-frame-helm-command="back"
          aria-label="Back to action categories"
        >
          <i class="fas fa-arrow-left"></i>
        </button>

        <div>
          <span>
            ${foundry.utils.escapeHTML(category.label)}
          </span>

          <small>
            ${foundry.utils.escapeHTML(category.description)}
          </small>
        </div>
      </div>

      <div class="frame-helm-action-list">
        ${actionButtons}
        ${emptyMessage}
      </div>
    </section>
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  renderCategoryMenu,
  renderGenericCategoryPanel
};
