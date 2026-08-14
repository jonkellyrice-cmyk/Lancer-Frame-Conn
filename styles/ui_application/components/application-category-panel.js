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
              ? " frame-conn-category-unavailable"
              : "";


          return `
            <button
              type="button"
              class="frame-conn-category-button${unavailableClass}"
              data-frame-conn-category="${foundry.utils.escapeHTML(category.id)}"
            >
              <i class="${foundry.utils.escapeHTML(category.icon)}"></i>

              <span class="frame-conn-category-copy">
                <strong>
                  ${foundry.utils.escapeHTML(category.label)}
                </strong>

                <small>
                  ${foundry.utils.escapeHTML(category.description)}
                </small>
              </span>

              <i class="fas fa-chevron-right frame-conn-category-arrow"></i>
            </button>
          `;
        }
      )
      .join(
        ""
      );


  return `
    <section class="frame-conn-action-panel">
      <div class="frame-conn-section-heading">
        <span>
          Choose an action type
        </span>
      </div>

      <div class="frame-conn-category-list">
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
                <span class="frame-conn-action-reason">
                  ${foundry.utils.escapeHTML(action.unavailableReason)}
                </span>
              `;


          return `
            <button
              type="button"
              class="frame-conn-action-button"
              data-frame-conn-action="${foundry.utils.escapeHTML(action.id)}"
              ${disabledAttribute}
            >
              <i class="${foundry.utils.escapeHTML(action.icon)}"></i>

              <span class="frame-conn-action-copy">
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
        <div class="frame-conn-no-actions">
          <i class="fas fa-circle-info"></i>

          <p>
            No universal actions are registered in this category yet.
          </p>
        </div>
      `;


  return `
    <section class="frame-conn-action-panel">
      <div class="frame-conn-section-heading frame-conn-section-heading-with-back">
        <button
          type="button"
          class="frame-conn-back-button"
          data-frame-conn-command="back"
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

      <div class="frame-conn-action-list">
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
