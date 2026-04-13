# Data Files

This folder contains the input datasets for the INAHOR demo. Both must be uploaded to your Google Earth Engine assets before running the script.

## AdminBoundaty_AnGiang_District/

District-level administrative boundaries for **An Giang Province**, Viet Nam (11 districts). The key field used by the INAHOR script is `TEN_HUYEN` (district name in Vietnamese).

**Files:** `02_AnGiang_Districts.shp/.shx/.dbf/.prj/.cpg/.qmd`

## DEMO_RandomGT_AnGiang_20260413/

A **synthetic** ground truth dataset of 500 random points within An Giang Province:
- **400 points** labeled as rice (`DN = 1`)
- **100 points** labeled as non-rice (`DN = 0`)

These labels were derived by sampling the [JAXA High-Resolution Land Use and Land Cover Map (2020)](https://www.eorc.jaxa.jp/ALOS/en/dataset/lulc_e.htm) at random locations. The `LC_VAL` field preserves the original JAXA land cover class. This is a **demonstration dataset** and does not replace field-collected ground truth.

**Files:** `an_giang_gt_500.shp/.shx/.dbf/.prj/.cpg`

## How to Upload to GEE

1. Go to [code.earthengine.google.com](https://code.earthengine.google.com/)
2. In the **Assets** panel (left sidebar), click **NEW > Shape files**
3. Select all files (`.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`) from one folder at a time
4. Give the asset a name and click **Upload**
5. After upload completes, copy the asset path and paste it into the GEE script (Steps 0, 1, 2)
