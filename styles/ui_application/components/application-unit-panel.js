/* ============================================================
   Application -- Unit panel
   ============================================================ */

function renderUnitPanel(
  data
) {
  const portrait =
    data.tokenImage
      ? `
        <img
          class="frame-helm-unit-image"
          src="${foundry.utils.escapeHTML(data.tokenImage)}"
          alt=""
        >
      `
      : `
        <div class="frame-helm-unit-image frame-helm-unit-image-empty">
          <i class="fas fa-robot"></i>
        </div>
      `;


  const unitText =
    data.hasSelectedToken
      ? `
        <div class="frame-helm-unit-text">
          <span class="frame-helm-label">
            Controlled Unit
          </span>

          <strong>
            ${foundry.utils.escapeHTML(data.tokenName)}
          </strong>
        </div>
      `
      : `
        <div class="frame-helm-unit-text">
          <span class="frame-helm-label">
            Controlled Unit
          </span>

          <strong>
            No token selected
          </strong>

          <small>
            Select a mech or NPC token on the canvas.
          </small>
        </div>
      `;


  return `
    <section class="frame-helm-unit-panel">
      ${portrait}
      ${unitText}
    </section>
  `;
}


/* ============================================================
   Exports
   ============================================================ */

export {
  renderUnitPanel
};
