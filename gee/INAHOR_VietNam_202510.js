// -------------===================================================================================== ------------
// ----***----- =                   The following script is GEE-INAHOR tool which is                 = ----***-----
// ----***----- =  "INternational Asian Harvest mOnitoring system for Rice on Google Earth Engine " = ----***-----
// ----***----- =                                 developed by JAXA                                 = ----***-----
// ------------ ===================================================================================== ------------
// To Non-expert Users:
// In order to customize INAHOR, please only modify steps 0-7 based on the requested items and available tutorials.

// [0] Define the Area of Interest (AOI)

// IMPORTANT! Change table name based on your uploaded asset
var AOI=ee.FeatureCollection("projects/ee-tmasaki040685/assets/imf-inahor-demo/02_AnGiang_Districts");

// [1] Import the training data

// IMPORTANT! Change table name based on your uploaded asset
var training_data = ee.FeatureCollection("projects/ee-tmasaki040685/assets/imf-inahor-demo/an_giang_gt_500");

// [2] Import the administrative boundary data

// IMPORTANT! Change table name based on your uploaded asset
var admnFeat = ee.FeatureCollection("projects//ee-tmasaki040685/assets/imf-inahor-demo/02_AnGiang_Districts");

//[3] Specify the period for ALOS-2 data
var Start_Date = '2024-04-01';
var End_Date = '2024-07-31';

// [4] Specify the column name for each land cover class number
var classProperty = 'DN';

// [5] Specify the resolution of the classification image (in meters)
var scale= 50

// [6] Specify the resolution of the export image
var resolution= 25

// [7] Specify the column name which contains administrative boundaries names data
var Name= 'TEN_HUYEN'


//============================================================ Main Body of INAHOR ====================================================================================================
// * Non-expert user does NOT need to deal with below scripts
//=================================================================
// 1- Data Acquisition: input PALSAR-2 images and Sentinel-2 Data
//=================================================================
var ALOS2= ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')
              .filterDate(Start_Date, End_Date)
              .filterBounds(AOI);
var S2_Data = ee.ImageCollection('COPERNICUS/S2')
                .filterDate(Start_Date, End_Date)    
                .filterBounds(AOI);
                
//===================================================================
// 2- Pre-Processing
//===================================================================
// ------------- Pre-Processing Functions-------------------------
// Culculate NDVI from S2
var NDVI = function(image) {
  return image.normalizedDifference(["B8", "B4"]).rename('NDVI'); // S2
};
var NDWI = function(image) {
  return image.normalizedDifference(["B3","B11"]).rename('NDWI'); // S2 McFeeters, 1996, IJRS 
};
var NDSI = function(image) {
  return image.normalizedDifference(["B11","B8"]).rename('NDSI'); // S2 Takeuchi et al, JSPRS
};
// Cleaning function for AL2
var nodata_filter = function(img1){
  var img2 = ee.Image(img1);
  var img_nodata = img2.select('HH').neq(0);
  var img3 = img2.updateMask(img_nodata);
  return img3;
};
var DN2dB= function (img) {
  img = ee.Image(img);
  var img4 = img.multiply(img).log10().multiply(10.0).subtract(83.0);
  return img4};
var SmoothingF= function(img){
    var img= img.focalMedian({
          radius: 1.5, 
          kernelType: "square",
          units: "pixels"});
  return img};

// ------------- Applying Functions ---------------------------------
var result_NDVI = S2_Data.map(NDVI).median();
var result_NDWI = S2_Data.map(NDWI).median();
var result_NDSI = S2_Data.map(NDSI).median();
var result_S2 = (result_NDVI.addBands(result_NDWI).addBands(result_NDSI));
//Map.addLayer(S2_Data.map(NDVI).median(),  {min:-0.8,max:0.8}, 'S2_Max NDVI');
// Map.addLayer(S2_Data.map(NDVI).median(), {min:-0.6,max:0.6}, 'S2_median NDVI',0);
// Map.addLayer(S2_Data.map(NDWI).median(), {min:-0.6,max:0.6}, 'S2_median NDWI',0);
// Map.addLayer(S2_Data.map(NDSI).median(), {min:-0.6,max:0.6}, 'S2_median NDSI',0);

var images = ALOS2.map(nodata_filter)
                  .map(DN2dB)
                  .map(SmoothingF);

images=images.map(function(img){ 
        var Sum=img.select('HH').add(img.select('HV')).rename('Sum');
        var Def=img.select('HH').subtract(img.select('HV')).rename('Def');
        var img= img.select(['HH','HV']).addBands(Sum).addBands(Def);
        return img });

//calculate max,min and mean
var reducer1 =  ee.Reducer.max();
var reduce_output = reducer1.combine({reducer2: ee.Reducer.min(), sharedInputs: true})
                      .combine({reducer2: ee.Reducer.mean(), sharedInputs: true});
var reduce_output2 = reducer1.combine({reducer2: ee.Reducer.min(), sharedInputs: true});

var results_HH = (images.select('HH')).reduce(reduce_output2);
var results_HV = (images.select('HV')).reduce(reduce_output2);
var results_Sum = (images.select('Sum')).reduce(reduce_output);
var results_Def = (images.select('Def')).reduce(reduce_output);
// Range Calculatoion
var results_range_HH = results_HH.select('HH_max').subtract(results_HH.select('HH_min'));
var results_range_HV = results_HV.select('HV_max').subtract(results_HV.select('HV_min'));
var results_range = results_range_HH.addBands(results_range_HV);

var results = (results_range.addBands(results_Sum).addBands(results_Def).addBands(result_S2)).double();
print('results',results)
Map.addLayer(results.select('HH_max'), {min:-30,max:15},'max HH',0);
Map.addLayer(results.select('HV_max'), {min:-30,max:15},'max HV',0);

// Map.addLayer(results.select('HH_min'), {min:-30,max:15},'min HH',0);
// Map.addLayer(results.select('HV_min'), {min:-30,max:15},'min HV',0);

Map.addLayer(results.select('Sum_mean'), {min:-30,max:15},'mean Sum',0);
Map.addLayer(results.select('Def_mean'), {min:-30,max:15},'mean Def',0);
// Map.addLayer(results.select('HH_mean'), {min:-30,max:15},'mean HH',0);
// Map.addLayer(results.select('HV_mean'), {min:-30,max:15},'mean HV',0);
//Map.addLayer(results_HH.select('stdDev'), {bands:'stdDev',min:0,max:15},'std HH',0);
//Map.addLayer(results_HV.select('stdDev'), {bands:'stdDev',min:0,max:15},'std HV',0);

//====================================================================================
// 3- Creating training datasets
//====================================================================================
// Sample the composite to generate training data.  
var training = results.sampleRegions({
  collection: training_data,
  properties: [classProperty],
  //definition of resolution. If unspecified, the projection of the image's first band is used.
  scale: scale
});

//========================================================================================
// 4- Training the Machine Learning using 1 and 3
//========================================================================================
// Make a Random Forest classifier and train it.
var classifier = ee.Classifier.smileRandomForest(30)
    .train({
      features: training,
      classProperty: classProperty,
    });
    
//========================================================================================
// 5- Classification
//========================================================================================    
// Classify the input imagery.
var classified = results.classify(classifier);
// Define a palette for the training data classification.
var CLS_PALETTE = [
  "000000",//0:black (Other)
  "FF0000",//1:red (rice)
];
// Display the input and the classification.
var classViz = {palette: CLS_PALETTE, min: 0, max: 1, opacity: 0.7};
var classMasked = classified.updateMask(classified.eq(1));
// Water Mask
var dataset = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24');
var water = dataset.select('water_mask');
var mask = water.eq(0);  // for MOD44W
var classMasked = classMasked.updateMask(mask);
//Map.addLayer(classMasked, classViz, 'classification');

// ESA Landcover Mask
var dataset2 = ee.ImageCollection('ESA/WorldCover/v200').first();
var lc = dataset2.select('Map');
var mask = lc.eq(40).or(lc.eq(90));  // for ESA Worldcover   other than 40(cropland) and 90(wetland) will be zero
var classMasked = classMasked.updateMask(mask);
//Map.addLayer(classMasked, classViz, 'classification');

// Majority Filter
var majorityFilter = function(image) {
  return image.focalMode({
    radius: 2.5,   // = 5x5 pixels
    kernelType: 'square',
    units: 'pixels',
    iterations: 1
  });
};
var classMasked = majorityFilter(classMasked);

//Clip image
var classified_clipped = classified.clip(AOI);

//===================================
// 6- Accuracy assessment 
//===================================  
// Optionally, do some accuracy assessment.  Fist, add a column of
// random uniforms to the training dataset.
var sum = 0;
var No_Test = 5;
for( var i=0; i<No_Test; i++ ){
  var withRandom = training.randomColumn({
    columnName:'random',
    seed:i});
  
  var split = 0.5;  // Roughly 50% training, 50% testing.
  var trainingPartition = withRandom.filter(ee.Filter.lt('random', split));
  var testingPartition = withRandom.filter(ee.Filter.gte('random', split));

  // Trained with 50% of our data.
  var trainedClassifier = ee.Classifier.smileRandomForest(30).train({
    features: trainingPartition,
    classProperty: classProperty,
    inputProperties: results.bandNames()
  });
  // Classify the train FeatureCollection.
  var train_classified = trainingPartition.classify(trainedClassifier);
  // Classify the test FeatureCollection.
  var test_classified = testingPartition.classify(trainedClassifier)
  // Print the confusion matrix.
  var train_confusionMatrix = train_classified.errorMatrix(classProperty, 'classification');
  print(i+1 ,'times');
  print('Train data Confusion Matrix', train_confusionMatrix);
  print('Train data Accuracy', train_confusionMatrix.accuracy());
  var test_confusionMatrix = test_classified.errorMatrix(classProperty, 'classification');
  print('Test data Confusion Matrix', test_confusionMatrix);
  print('Test data Accuracy', test_confusionMatrix.accuracy());
  
}
//===================================
// 7- Extracting statistics 
//===================================    
// Calc paddy field area by admin polygons
var calcPaddyArea = function(feature) {
  var areas = ee.Image.pixelArea().addBands(classified)
    .reduceRegion({
      reducer: ee.Reducer.sum().group({
        groupField: 1,
        groupName: 'class',
      }),
      geometry: feature.geometry(),
      scale: scale,
      maxPixels: 1e13,
      tileScale:8
    });

  var classAreas = ee.List(areas.get('groups'));
  var classAreaLists = classAreas.map(function(item) {
    var areaDict = ee.Dictionary(item);
    var classNumber = ee.Number(
      areaDict.get('class')).format();
    //area unit:ha (convert m2 to ha)  
    var area = ee.Number(
      areaDict.get('sum')).divide(1e4);
    return ee.List([classNumber, area]);
  });
  var result = ee.Dictionary(classAreaLists.flatten());
  var district = feature.get(Name);
  return ee.Feature(
    feature.geometry(),
    result.set('district', district));
};
var districtAreas = admnFeat.map(calcPaddyArea);
print('Total area of each class in the administrative district:',districtAreas);
Map.addLayer(districtAreas, {color: 'purple'}, 'Admin Poly', 1);
Map.addLayer(classified_clipped, classViz, 'classification');
// Map.addLayer(classMasked, classViz, 'classification');

//===================================
// 8- Exporting final outputs
//===================================   
// Export image
Export.image.toDrive({
            image: classified_clipped,
            description: 'output_P2',
            folder:'INAHOR_Result',
            scale: resolution,
            //region
            region: AOI,
            //WGS84
            crs: 'EPSG:4326',
            maxPixels: 1e13
});
// Export shape file 
Export.table.toDrive({
  collection: districtAreas,
  description:'result_P2',
  folder:'INAHOR_Result',
  fileFormat: 'CSV'
});

Map.centerObject(AOI, 10);
