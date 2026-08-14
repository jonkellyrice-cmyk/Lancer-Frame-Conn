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
          class="frame-conn-unit-image"
          src="${foundry.utils.escapeHTML(data.tokenImage)}"
          alt=""
        >
      `
      : `
        <div class="frame-conn-unit-image frame-conn-unit-image-empty">
          <i class="fas fa-robot"></i>
        </div>
      `;


  const unitText =
    data.hasSelectedToken
      ? `
        <div class="frame-conn-unit-text">
          <span class="frame-conn-label">
            Controlled Unit
          </span>

          <strong>
            ${foundry.utils.escapeHTML(data.tokenName)}
          </strong>
        </div>
      `
      : `
        <div class="frame-conn-unit-text">
          <span class="frame-conn-label">
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
    <section class="frame-conn-unit-panel">
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
