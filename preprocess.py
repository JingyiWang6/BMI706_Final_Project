"""Prepare UMAP coordinates and cell metadata for the web page (Scanpy).

    python preprocess.py path/to/sciplex3_pca_umap.h5ad

Writes data/cells.js. The page loads only coordinates and metadata, not the
gene-expression matrix. All cells that pass the filter are exported.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import scanpy as sc

CELL_LINES = ["A549", "MCF7", "K562"]
DOSES = [10, 100, 1000, 10000]  # nM

adata = sc.read_h5ad(sys.argv[1], backed="r")   # backed: the count matrix stays on disk
obs = adata.obs.copy()
obs["umap1"] = adata.obsm["X_umap"][:, 0]
obs["umap2"] = adata.obsm["X_umap"][:, 1]
print(len(obs), "cells in the file")

# filtering: 24 h cells with a known cell line and treatment
obs["vehicle"] = obs["vehicle"].astype(str).str.upper() == "TRUE"
obs = obs[obs["cell_type"].isin(CELL_LINES) & (obs["time_point"] == 24) & obs["product_name"].notna()]
obs = obs[obs["vehicle"] | obs["dose"].isin(DOSES)].copy()
obs["compound"] = obs["product_name"].astype(str).str.strip()
print(len(obs), "cells after filtering")

treated = obs[~obs["vehicle"]]
control = obs[obs["vehicle"]]
compounds = sorted(treated["compound"].unique())
print(len(treated), "treated cells,", len(control), "vehicle cells,", len(compounds), "compounds")


def codes(values, categories):
    return pd.Categorical(values, categories=categories).codes.tolist()


def pack(df, with_treatment):
    out = {
        "x": np.round(df["umap1"].values.astype(float), 2).tolist(),
        "y": np.round(df["umap2"].values.astype(float), 2).tolist(),
        "cell_line": codes(df["cell_type"].astype(str), CELL_LINES),
    }
    if with_treatment:
        out["compound"] = codes(df["compound"], compounds)
        out["dose"] = codes(df["dose"].astype(int), DOSES)
    return out


data = {"cell_lines": CELL_LINES, "doses": DOSES, "compounds": compounds,
        "treated": pack(treated, True), "vehicle": pack(control, False)}
out = Path(__file__).parent / "data" / "cells.js"
out.parent.mkdir(exist_ok=True)
out.write_text("window.CELLS = " + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
print("wrote", out, round(out.stat().st_size / 1e6, 1), "MB")
