// UMAP of single cells: switch the coloring and filter by cell line, compound and dose.
// Vehicle (control) cells can be shown in gray, so treated cells can be compared with them.
const D = window.CELLS;
const T = D.treated, V = D.vehicle;
const DOSE_LABEL = D.doses.map(d => (d >= 1000 ? d / 1000 + ' µM' : d + ' nM'));
const CELL_LINE_COLOR = ['#7F77DD', '#1D9E75', '#EF9F27'];
const DOSE_COLOR = ['#FDCC8A', '#FC8D59', '#D7301F', '#7F0000'];
const compoundColor = i => 'hsl(' + Math.round(i * 360 / D.compounds.length) + ',70%,45%)';

const el = id => document.getElementById(id);

function fillSelect(id, labels) {
  el(id).innerHTML = '<option value="-1">All</option>' + labels.map((t, i) => '<option value="' + i + '">' + t + '</option>').join('');
  el(id).addEventListener('change', draw);
}
fillSelect('fCellLine', D.cell_lines);
fillSelect('fCompound', D.compounds);
fillSelect('fDose', DOSE_LABEL);
el('colorBy').addEventListener('change', draw);
el('showVehicle').addEventListener('change', draw);

// one WebGL trace from a list of cell indices
function trace(name, idx, src, marker) {
  const n = idx.length, x = new Float32Array(n), y = new Float32Array(n), text = new Array(n);
  for (let j = 0; j < n; j++) {
    const i = idx[j];
    x[j] = src.x[i]; y[j] = src.y[i];
    text[j] = src === V
      ? 'Vehicle<br>' + D.cell_lines[src.cell_line[i]]
      : D.compounds[src.compound[i]] + '<br>' + DOSE_LABEL[src.dose[i]] + '<br>' + D.cell_lines[src.cell_line[i]];
  }
  return { type: 'scattergl', mode: 'markers', name, x, y, text, hovertemplate: '%{text}<extra></extra>', marker };
}

function draw() {
  const fCl = +el('fCellLine').value, fCo = +el('fCompound').value, fDo = +el('fDose').value;
  const colorBy = el('colorBy').value;

  const sel = [];
  for (let i = 0; i < T.x.length; i++) {
    if ((fCl < 0 || T.cell_line[i] === fCl) && (fCo < 0 || T.compound[i] === fCo) && (fDo < 0 || T.dose[i] === fDo)) sel.push(i);
  }
  const size = sel.length > 100000 ? 2 : sel.length > 5000 ? 3 : 5;
  const dot = color => ({ size, color, opacity: 0.7 });

  const traces = [];
  let nVeh = 0;
  if (el('showVehicle').checked) {
    const veh = [];
    for (let i = 0; i < V.x.length; i++) if (fCl < 0 || V.cell_line[i] === fCl) veh.push(i);
    nVeh = veh.length;
    traces.push(trace('Vehicle (control)', veh, V, { size: 2, color: '#BDBDBD', opacity: 0.7 }));
  }
  if (colorBy === 'cell_line') {
    D.cell_lines.forEach((name, k) => traces.push(trace(name, sel.filter(i => T.cell_line[i] === k), T, dot(CELL_LINE_COLOR[k]))));
  } else if (colorBy === 'dose') {
    DOSE_LABEL.forEach((name, k) => traces.push(trace(name, sel.filter(i => T.dose[i] === k), T, dot(DOSE_COLOR[k]))));
  } else if (fCo >= 0) {
    traces.push(trace(D.compounds[fCo], sel, T, dot(compoundColor(fCo))));
  } else {
    // 188 compounds: one hue each, no legend; hover a point for its name
    const stops = D.compounds.map((_, i) => [i / (D.compounds.length - 1), compoundColor(i)]);
    traces.push(trace('188 compounds', sel, T, {
      size, opacity: 0.7, color: sel.map(i => T.compound[i]), colorscale: stops, cmin: 0, cmax: D.compounds.length - 1,
    }));
  }

  el('count').textContent = sel.length.toLocaleString() + ' treated cells' + (nVeh ? ', ' + nVeh.toLocaleString() + ' vehicle cells' : '') + ' shown';
  Plotly.react('umap', traces, {
    margin: { l: 40, r: 10, t: 10, b: 40 },
    xaxis: { title: 'UMAP 1', zeroline: false },
    yaxis: { title: 'UMAP 2', zeroline: false, scaleanchor: 'x' },
    hovermode: 'closest', dragmode: 'pan', uirevision: 'keep',
    legend: { itemsizing: 'constant' },
  }, { responsive: true, scrollZoom: true, displayModeBar: false });
}

draw();
