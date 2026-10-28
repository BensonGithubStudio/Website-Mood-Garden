/* ============================================================================
 * js/icons.js — 日期工具與 SVG 圖示
 * ----------------------------------------------------------------------------
 * 這份檔案在做什麼：
 *   ・日期格式工具：dk（Date→YYYY-MM-DD）、today、fmt（依語言顯示日期）、
 *     ents（依日期排序的花朵紀錄）。
 *   ・用 SVG 手繪的小圖示：ic（Material 圖示）、SV、face（六種心情的表情）、
 *     flo（六種花的小圖）。
 *
 * 需要先載入：state.js
 * 提供給其他檔案：dk、today、fmt、ents、ic、SV、face、pet、flo
 * 載入順序：第 4 個（共 34 個）。順序由 index.html 決定，請勿隨意調換。
 * ============================================================================ */

const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dk(new Date()),
  fmt = k => new Date(k + 'T12:00').toLocaleDateString(LC(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
const ents = () => Object.entries(S.e).sort((a, b) => a[0] < b[0] ? -1 : 1);
const ic = n => `<span class="ms" aria-hidden="true">${n}</span>`,
  SV = (s, b) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true" style="vertical-align:middle;flex:none">${b}</svg>`;

function face(k, s) {
  const I = '#5B4A4A',
    sk = `stroke="${I}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`,
    dot = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${I}"/>`,
    H = '<path d="M13 21.5l-4.2-4.2a2.4 2.4 0 013.4-3.4l.8.8.8-.8a2.4 2.4 0 013.4 3.4z" fill="#E4577E"/>';
  const f = {
    happy: `<path d="M10 19q3-4 6 0M24 19q3-4 6 0" fill="none" ${sk}/><path d="M14 25q6 7 12 0z" fill="#fff" ${sk}/>`,
    excited: `${dot(14,18,3.4)}${dot(26,18,3.4)}<circle cx="15" cy="17" r="1.1" fill="#fff"/><circle cx="27" cy="17" r="1.1" fill="#fff"/><path d="M13 24q7 9 14 0z" fill="#fff" ${sk}/>`,
    calm: `<path d="M10 19q3 3 6 0M24 19q3 3 6 0M16 26q4 3 8 0" fill="none" ${sk}/>`,
    loved: `${H}<g transform="translate(13 0)">${H}</g><path d="M15 26q5 5 10 0" fill="none" ${sk}/>`,
    sad: `${dot(14,20)}${dot(26,20)}<path d="M15 29q5-5 10 0" fill="none" ${sk}/><path d="M12 24q-2.5 3 0 5 2.5-2 0-5z" fill="#8DB9E8"/>`,
    anxious: `${dot(14,19,2)}${dot(26,19,2)}<path d="M13 27q2-3 4 0t4 0t4 0" fill="none" ${sk}/><path d="M33 10q-3 4 0 6 3-2 0-6z" fill="#9AD0F0"/>`
  } [k];
  return SV(s, `<circle cx="20" cy="20" r="17" fill="${M[k].c}"/><circle cx="20" cy="20" r="17" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><circle cx="8.5" cy="25" r="3" fill="#F29BB5" opacity=".45"/><circle cx="31.5" cy="25" r="3" fill="#F29BB5" opacity=".45"/>${f}`)
}
const pet = (n, r, rx, ry, f, st) => Array.from({
  length: n
}, (_, i) => `<ellipse cx="20" cy="${20-r}" rx="${rx}" ry="${ry}" fill="${f}" ${st} transform="rotate(${i*360/n} 20 20)"/>`).join('');

function flo(k, s) {
  const L = 'stroke="#8a7a5a" stroke-opacity=".35" stroke-width=".8"',
    G = 'stroke="#7DB36F" fill="none" stroke-linecap="round"',
    bell = (x, y) => `<path d="M${x-4} ${y}q0-4 4-4t4 4l2.5 7q-6.5 2-13 0z" fill="#8DB9E8" ${L}/>`;
  const b = {
    happy: pet(12, 11, 3.6, 6.2, '#F5D04A', L) + '<circle cx="20" cy="20" r="6.5" fill="#7A5236"/><circle cx="18" cy="18" r="1.6" fill="#a47a55"/>',
    excited: `<path d="M20 38V26" ${G} stroke-width="3"/><path d="M29 9q2 13-9 19 1-9 2-15z" fill="#F6A35C" ${L}/><path d="M11 9q-2 13 9 19-1-9-2-15z" fill="#F6A35C" ${L}/><path d="M20 5q-6 8-4 21h8q2-13-4-21z" fill="#F9BE86" ${L}/>`,
    calm: pet(10, 11, 3.1, 6.5, '#fff', L) + '<circle cx="20" cy="20" r="5.2" fill="#F5D04A"/>',
    loved: `<circle cx="20" cy="20" r="15" fill="#F29BB5" ${L}/><circle cx="20" cy="20" r="10.5" fill="#F5ABC2"/><path d="M20 20m-2 0a2 2 0 114 0 4 4 0 11-8 0 6.5 6.5 0 1113 0" fill="none" stroke="#E0668C" stroke-width="1.7" stroke-linecap="round"/>`,
    sad: `<path d="M10 38q2-24 16-27" ${G} stroke-width="2.4"/>${bell(28,11)}${bell(20,20)}${bell(13,29)}`,
    anxious: `<path d="M20 38V8" ${G} stroke-width="2.4"/>` + Array.from({
      length: 7
    }, (_, i) => `<ellipse cx="${20+(i%2?3.2:-3.2)}" cy="${8+i*4.3}" rx="3.2" ry="3.8" fill="${i%2?'#B7A2E0':'#9C86D4'}" ${L}/>`).join('')
  } [k];
  return SV(s, b)
}
