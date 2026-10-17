import { LANTERNS } from '../world/layout.js';

/** The small status line in the corner. Re-rendered only when the journal changes. */
export function createHud(element, journal, totalPlaces) {
  const render = () => {
    const { progress } = journal;
    const parts = [
      `✦ <b>${journal.motes}</b> light`,
      `lanterns <b>${progress.lanterns.length}</b>/${LANTERNS.length}`,
      `places <b>${progress.places.length}</b>/${totalPlaces}`,
    ];
    if (progress.flowers) parts.push(`✿ <b>${progress.flowers}</b>`);
    element.innerHTML = parts.join(' &nbsp;·&nbsp; ');
  };
  journal.onChange(render);
  render();
  return { show() { element.style.opacity = '1'; } };
}
