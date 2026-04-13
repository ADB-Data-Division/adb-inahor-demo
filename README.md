# INAHOR Demo: Rice Mapping with SAR and Optical Satellite Data

A demonstration of the **INAHOR** (INternational Asian Harvest mOnitoring system for Rice) tool on Google Earth Engine (GEE), applied to **An Giang Province, Viet Nam**.

This repository was prepared for the **CICDC-IMF Big Data Workshop: Big Data for Macroeconomic Statistics** (April 13--17, 2026, Shenzhen, China) as part of the session *"Seeing the Unseen: AI and Machine Learning to Find the Left-Behind in Asia and the Pacific"* presented by Takaaki Masaki on April 16, 2026.

## What is INAHOR?

INAHOR is a Google Earth Engine-based tool developed by the **Japan Aerospace Exploration Agency (JAXA)** for monitoring rice cultivation using satellite remote sensing. It combines:

- **ALOS-2 PALSAR-2** L-band Synthetic Aperture Radar (SAR) data -- sensitive to the physical structure of rice paddies through the growing season
- **Sentinel-2** optical imagery -- providing vegetation indices (NDVI, NDWI, NDSI)

The tool uses a **Random Forest classifier** trained on ground truth data to produce binary rice/non-rice maps and district-level rice area statistics.

### How It Works

1. **Data Acquisition** -- Retrieves PALSAR-2 ScanSAR and Sentinel-2 imagery for the specified area and time period
2. **Pre-processing** -- Computes radar features (HH, HV, Sum, Difference; max, min, mean, range) and optical indices (NDVI, NDWI, NDSI)
3. **Training** -- Samples the multi-sensor composite at ground truth locations
4. **Classification** -- Trains a Random Forest model (30 trees) and classifies the full area
5. **Post-processing** -- Applies water mask (MODIS MOD44W), land cover mask (ESA WorldCover: cropland + wetland only), and majority filter
6. **Accuracy Assessment** -- 5-fold cross-validation with 50/50 train/test split
7. **Statistics** -- Computes rice area (hectares) per administrative district
8. **Export** -- Outputs classified raster (GeoTIFF) and district statistics (CSV) to Google Drive

## Repository Structure

```
adb-inahor-demo/
|-- gee/
|   +-- INAHOR_VietNam_202510.js      # GEE JavaScript script (paste into GEE Code Editor)
|-- data-raw/
|   |-- AdminBoundaty_AnGiang_District/
|   |   +-- 02_AnGiang_Districts.*     # An Giang province district boundaries (shapefile)
|   |-- DEMO_RandomGT_AnGiang_20260413/
|   |   +-- an_giang_gt_500.*          # Synthetic ground truth points (shapefile)
|-- doc/
|   +-- IMF-Big-Data-Workshop-2026-04-16.pptx  # Presentation slides
+-- README.md
```

## Data Description

### Administrative Boundaries

**File:** `data-raw/AdminBoundaty_AnGiang_District/02_AnGiang_Districts.shp`

District-level administrative boundaries for An Giang Province, Viet Nam. Contains 11 districts with the following key fields:

| Field | Description |
|-------|-------------|
| `TEN_HUYEN` | District name (Vietnamese) |
| `TEN_TINH` | Province name |
| `MA_DVHC_H` | Administrative code (district) |

### Ground Truth Data

**File:** `data-raw/DEMO_RandomGT_AnGiang_20260413/an_giang_gt_500.shp`

A **synthetic** dataset of 500 randomly sampled ground truth points generated from the [JAXA High-Resolution Land Use and Land Cover Map (2020)](https://www.eorc.jaxa.jp/ALOS/en/dataset/lulc_e.htm). This dataset is for **demonstration purposes only** and does not represent field-collected data.

| Field | Description |
|-------|-------------|
| `DN` | Binary class label: **1** = Rice, **0** = Non-rice |
| `LC_VAL` | Original JAXA land cover class value |
| `PT_ID` | Unique point identifier |

**Class distribution:** 400 rice points (DN=1) and 100 non-rice points (DN=0).

## Quick Start

### Prerequisites

- A [Google Earth Engine](https://earthengine.google.com/) account
- Access to the GEE Code Editor at [code.earthengine.google.com](https://code.earthengine.google.com/)

### Step-by-Step Instructions

#### 1. Upload Assets to Google Earth Engine

Upload the following shapefiles to your GEE assets (Assets panel > NEW > Shape files):

1. **District boundaries:** Upload all files from `data-raw/AdminBoundaty_AnGiang_District/` (`.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`)
2. **Ground truth points:** Upload all files from `data-raw/DEMO_RandomGT_AnGiang_20260413/` (`.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`)

Note the asset paths after upload (e.g., `projects/your-project/assets/your-folder/02_AnGiang_Districts`).

#### 2. Update the Script

Open `gee/INAHOR_VietNam_202510.js` in a text editor and update the three asset paths in **Steps 0, 1, and 2** at the top of the script:

```javascript
// [0] Define the Area of Interest (AOI)
var AOI = ee.FeatureCollection("projects/<YOUR-GEE-PROJECT>/assets/<YOUR-FOLDER>/02_AnGiang_Districts");

// [1] Import the training data
var training_data = ee.FeatureCollection("projects/<YOUR-GEE-PROJECT>/assets/<YOUR-FOLDER>/an_giang_gt_500");

// [2] Import the administrative boundary data
var admnFeat = ee.FeatureCollection("projects/<YOUR-GEE-PROJECT>/assets/<YOUR-FOLDER>/02_AnGiang_Districts");
```

Replace `<YOUR-GEE-PROJECT>` and `<YOUR-FOLDER>` with your actual GEE project and asset folder names.

#### 3. Run the Script

1. Open the [GEE Code Editor](https://code.earthengine.google.com/)
2. Create a new script and paste the contents of `INAHOR_VietNam_202510.js`
3. Click **Run**
4. View results in the Console (accuracy metrics) and Map (classification overlay)
5. Check the **Tasks** tab to export the classified image and CSV statistics to Google Drive

### Configurable Parameters (Steps 3--7)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `Start_Date` | `2024-04-01` | Start of ALOS-2/Sentinel-2 observation period |
| `End_Date` | `2024-07-31` | End of observation period |
| `classProperty` | `DN` | Column name for class labels in ground truth |
| `scale` | `50` | Classification resolution (meters) |
| `resolution` | `25` | Export image resolution (meters) |
| `Name` | `TEN_HUYEN` | Column name for district names in admin boundaries |

## Credits and Acknowledgments

- **INAHOR tool:** Developed by the [Japan Aerospace Exploration Agency (JAXA)](https://www.jaxa.jp/). INAHOR is part of JAXA's Earth observation applications for food security monitoring in the Asia-Pacific region.
- **GEE script:** Originally presented by **Pegah Hashemvand Khiabani** and **Furuta Naoki** ([RESTEC](https://www.restec.or.jp/)) at the *Workshop on Harnessing Remote Sensing for Rice Mapping in Viet Nam* (May 2024). Adapted for this demo.
- **Demo preparation:** [Anthony Burgard](https://development.asia/expert/anthony-burgard) (ADB) supported the preparation of demo materials, including the synthetic ground truth dataset and GEE asset setup.
- **Satellite data:** [ALOS-2 PALSAR-2 ScanSAR](https://developers.google.com/earth-engine/datasets/catalog/JAXA_ALOS_PALSAR-2_Level2_2_ScanSAR) (JAXA) and [Sentinel-2](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2) (ESA/Copernicus).
- **Ancillary data:** [MODIS Water Mask](https://developers.google.com/earth-engine/datasets/catalog/MODIS_MOD44W_MOD44W_005_2000_02_24) (NASA) and [ESA WorldCover v200](https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200) (ESA).
- **Ground truth (synthetic):** Generated from the [JAXA High-Resolution Land Use and Land Cover Map (2020)](https://www.eorc.jaxa.jp/ALOS/en/dataset/lulc_e.htm).

## References

- Oyoshi, K., Tomiyama, N., Okumura, T., Sobue, S., & Sato, J. (2016). Mapping rice-planted areas using time-series synthetic aperture radar data for the Asia-RiCE activity. *Paddy and Water Environment*, 14, 463--472.
- JAXA EORC. ALOS/ALOS-2 High-Resolution Land Use and Land Cover Map. <https://www.eorc.jaxa.jp/ALOS/en/dataset/lulc_e.htm>

## License

This repository is provided for educational and demonstration purposes. The INAHOR tool is developed and maintained by JAXA. Please refer to JAXA's terms for use of the INAHOR methodology and ALOS-2 data products.
