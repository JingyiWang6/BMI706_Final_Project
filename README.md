# sci-Plex UMAP Explorer

BMI 706 project: an interactive view of single-cell drug responses in the sci-Plex 3 dataset.

## Team

- Jingyi Wang
- Xiaofeng Li
- Yiyang Zhang
- Zihan Zhou

## Data source

We use the **sci-Plex 3** dataset from [Srivatsan et al. (2020)](https://doi.org/10.1126/science.aax6234), which is publicly available through GEO ([GSM4150378](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSM4150378)). The source files contain raw counts, cell metadata, and gene annotations.

The notebook  `data_preprocess/sciPlex3_combine.ipynb` combines these files into an AnnData object. Then `data_preprocess/sciPlex3_preprocess.ipynb` removes cells with fewer than 200 detected genes and genes detected in fewer than three cells, and selects 3,000 highly variable genes. Counts are normalized and log-transformed before computing 50 principal components, a 15-neighbor graph, and a 2D UMAP. The resulting `sciplex3_pca_umap.h5ad` supplies the coordinates and metadata.

## Packages

- **Scanpy**: reads the `.h5ad` file (in backed mode, so the expression matrix stays on disk).
- **NumPy** and **pandas**: filter cells and format the cell table.
- **Plotly.js 2.35.2**: draws the UMAP in the browser with WebGL (`scattergl`). It is bundled in `lib/`, so the page works offline.

## Preprocessing (`preprocess.py`)

```
python preprocess.py path/to/sciplex3_pca_umap.h5ad
```

The script keeps cells that meet all of these conditions:

- cell line is A549, MCF7 or K562
- time point is 24 h
- compound name is not missing
- the cell is a vehicle (control) cell, or its dose is 10 nM, 100 nM, 1 µM or 10 µM

All cells that pass the filter are exported; there is no sampling. For each cell, the script writes its UMAP coordinates (from `obsm['X_umap']`), cell line, compound and dose to `data/cells.js`. No values are computed.

## App

- **`index.html`**: the page. It holds the controls and the plot area, and loads Plotly, `data/cells.js` and `app.js`.
- **`app.js`**: draws the UMAP. You can:
  - color cells by cell line, compound or dose
  - filter by cell line, compound and dose
  - show or hide vehicle cells (gray)
  - hover a cell to see its compound, dose and cell line; scroll to zoom and drag to pan

Open `index.html` in a browser after running the preprocessing step.

## Use of AI

We used Claude Code (Anthropic) in a sandbox environment as a coding assistant for writing the preprocessing script and the web page. All design and data decisions were made by the team.
