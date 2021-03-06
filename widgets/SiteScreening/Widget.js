define([
    "dojo/_base/declare",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidget",
    "jimu/dijit/TabContainer",
    'jimu/dijit/LoadingIndicator',
    "jimu/utils",
    "esri/config",
    "esri/urlUtils",
    "esri/tasks/Geoprocessor",
    "esri/tasks/FeatureSet",
    "esri/layers/GraphicsLayer",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/geometry/Polygon",
    "esri/symbols/SimpleFillSymbol",
    "esri/toolbars/draw",
    "esri/InfoTemplate",
    "esri/request",
    "esri/graphicsUtils",
    "esri/geometry/webMercatorUtils",
    "dojo/_base/Color",
    "dijit/Dialog",
    "dijit/ProgressBar",
    "dijit/form/NumberSpinner",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-style",
    "dijit/form/Select",
    "dojox/form/CheckedMultiSelect",
    "dijit/form/TextBox",
    "dijit/form/NumberTextBox",
    "esri/geometry/jsonUtils",
    "dojo/_base/array",
    "dojo/_base/html",
    "jimu/dijit/DrawBox",
    "esri/tasks/query", 
    "esri/tasks/QueryTask",
    "dojo/dom-construct"
],
    function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, LoadingIndicator, utils, esriConfig, urlUtils, Geoprocessor, FeatureSet, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, SimpleLineSymbol, Polygon, SimpleFillSymbol, Draw, InfoTemplate, esriRequest, graphicsUtils, webMercatorUtils, Color, Dialog, ProgressBar, NumberSpinner, lang, on, dom, domStyle, Select, CheckedMultiSelect,TextBox,NumberTextBox, jsonUtils, array, html, DrawBox, Query, QueryTask, domConstruct) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            
            baseClass: 'jimu-widget-erg',
            name: 'SCREENING',
            spillGraphicsLayer: null,
            selectedMaterialType: null,
            selectedCustomMetrics:null,
            ergGPChemicalService: null,
            ergGPJobID: null,
            maploading:null,
            queryname:null,
            querylistMaster:[],
            incidentGraphic:null,
            inputFileData:null,
            inputFileDataType:null,
            outputrasterlayer:null,

            //get distinct values 
            onChangequeryFieldName:function (newValue){

              if(newValue != "No Field"){
                  var that = this;
                  var qTask = new QueryTask(this.config.dataurl+'/'+this.queryLayer.value);
                  
                  if(this.config.token != ''){
                        var qTask = new QueryTask(this.config.dataurl+'/'+this.queryLayer.value+"?token="+this.config.token);
                  }
                  else{
                        var qTask = new QueryTask(this.config.dataurl+'/'+this.queryLayer.value);
                  }
                  
                  var filterquery = new Query();
                  filterquery.where = "1=1";
                  filterquery.outFields = [newValue];
                  filterquery.returnDistinctValues=true;

                  filterquery.returnGeometry = false;

                  document.getElementById('fieldvaluelab').innerHTML = '..Loading Fields';
                  // execute the query
                  qTask.execute(filterquery).then(function (featureSet) {
                        var features, i;

                        features = array.map(featureSet.features, function (feature) {
                          return feature.attributes[newValue];
                        });
                        // sort the list
                        features.sort();
                        var queryvalueChoices = [];
                        queryvalueChoices[0] ={};
                        queryvalueChoices[0].label ="No Value";
                        queryvalueChoices[0].value ="No Value";

                        for (var i = 0; i < features.length; i++) {
                            queryvalueChoices[i+1] ={};
                            queryvalueChoices[i+1].label =String(features[i]);
                            queryvalueChoices[i+1].value =String(features[i]);
                        }
                        that.queryFieldValue.set('options',[]);
                        that.queryFieldValue._updateSelection();
                        that.queryFieldValue.addOption(queryvalueChoices);
                        document.getElementById('fieldvaluelab').innerHTML = 'Field Value';
                  });
              }
              
            },

            onChangelayer: function (newValue,t) {

                this.queryFieldName.set('options',[]);
                this.queryType.set('options',[]);
                this.queryFieldName._updateSelection();
                this.queryType._updateSelection();
                
                for (var prop in this.config.layeroptions) {
                    
                    if(dijit.byId('queryLayer').attr('displayedValue') == prop){
                        
                        var queryFieldChoices = [];
                        queryFieldChoices[0] ={};
                        queryFieldChoices[0].label = 'No Field';
                        queryFieldChoices[0].value = 'No Field';
                        for (var i = 0; i < this.config.layeroptions[prop].Fields.length; i++) {
                            if(this.queryType.value=='Count'){
                                if(this.config.layeroptions[prop].Fields[i][1]=="1"){
                                    queryFieldChoices[i+1] ={};
                                    queryFieldChoices[i+1].label =this.config.layeroptions[prop].Fields[i][0];
                                    queryFieldChoices[i+1].value =this.config.layeroptions[prop].Fields[i][0];
                                }
                            }
                            else{
                                queryFieldChoices[i+1] ={};
                                queryFieldChoices[i+1].label =this.config.layeroptions[prop].Fields[i][0];
                                queryFieldChoices[i+1].value =this.config.layeroptions[prop].Fields[i][0];
                            }
                        }

                        this.queryFieldName.addOption(queryFieldChoices);

                        document.getElementById('overlapspinner').removeAttribute("disabled");
                        document.getElementById('queryFieldValue').removeAttribute("disabled");
                        document.getElementById('queryValue').removeAttribute("disabled");

                        var filetype = [];

                        if(this.config.layeroptions[prop].GeoType == 'Polygon'){
                            for (var i = 0; i < this.config.queryTypePoly.length; i++) {
                                filetype[i] =this.config.queryTypePoly[i];
                            }
                        }
                        else if(this.config.layeroptions[prop].GeoType == 'Polyline'){
                            for (var i = 0; i < this.config.queryTypePoly.length; i++) {
                                filetype[i] =this.config.queryTypePoly[i];
                            }
                        }
                        //if(this.config.layeroptions[prop].GeoType == 'Point')
                        else {
                            for (var i = 0; i < this.config.queryTypePoint.length; i++) {
                                filetype[i] =this.config.queryTypePoint[i];
                            }
                            document.getElementById('overlapspinner').setAttribute("disabled", true);
                            this.overlapspinner.value = '';
                            document.getElementById('queryFieldValue').setAttribute("disabled", true);
                            //document.getElementById('queryValue').setAttribute("disabled", true);
                        }

                        this.queryType.addOption(filetype);
                        this.queryType.attr("value", "Distance");
                        var queryOperator = [];
                        for (var i = 0; i < this.config.queryOperator.length; i++) {
                             queryOperator[i] ={};
                             queryOperator[i].label =this.config.queryOperator[i];
                             queryOperator[i].value =this.config.queryOperator[i];
                        }
                        this.queryOperator.addOption(queryOperator);
                    }
                }
            },
            
            onChangeCustomMetrics: function (newValue) {
                var stringvalue = '';
                for (var i = 0; i < newValue.length; i++) {
                    if(i>0 &&stringvalue !=''){
                       stringvalue+=';';
                    }
                    if(newValue[i]!="None"){
                        stringvalue+=newValue[i];
                    }
                }
                this.selectedCustomMetrics = stringvalue;
                document.getElementById("predefinedQ").innerHTML = stringvalue;
            },
            
            onClearBtnClicked: function () {
                this.spillGraphicsLayer.clear();
                
                //clear other layers if on the map
                if(this.map.getLayer('incidentLayer')){
                    this.map.getLayer('incidentLayer').clear();
                }                

                this.selectedMaterialType= null;
                this.selectedCustomMetrics= null;
                this.inputFileData= null;
                this.queryName.value= null;

                if(this.outputrasterlayer != null){
                    this.map.removeLayer(this.outputrasterlayer );
                }

                this.queryLayer.set('value',[]);
                this.queryLayer._updateSelection();
                this.queryType.set('value',[]);
                this.queryType._updateSelection();
                this.queryOperator.set('value',[]);
                this.queryOperator._updateSelection();
                this.CustomMetricsSite.set('value',[]);
                this.CustomMetricsSite._updateSelection();
                this.drawToolbar.deactivate();
                this.queryValue.attr('value', '');
                this.scenarioName.attr('value', '');
                this.shpType.set('value',"No Value");
                this.shpType._updateSelection();

                domStyle.set("downloadfile", {
                    "display": 'none',
                });
            },

            onChangequeryType:function(value){
                this.queryOperator.set('options',[]);
                this.queryOperator._updateSelection();
                var queryOperator = [];
                
                document.getElementById('overlapspinner').setAttribute("disabled", true);
                this.overlapspinner.value='';
                
                //this will need to change when distint values
                document.getElementById('queryValue').removeAttribute("disabled");
                document.getElementById('queryValue').innerHTML='';
                
                //for now
                this.queryValue.attr('value', '');
                this.queryFieldValue.value = '';
                this.overlapspinner.attr('value', '');

                dijit.byId('queryFieldName').set('disabled', false);
                dijit.byId('queryFieldValue').set('disabled', false);

                if(value == 'Presence'){
                    for (var i = 0; i < this.config.queryOperatorPresence.length; i++) {
                         queryOperator[i] ={};
                         queryOperator[i].label =this.config.queryOperatorPresence[i];
                         queryOperator[i].value =this.config.queryOperatorPresence[i];
                    }
                    document.getElementById('queryValue').setAttribute("disabled", true);
                    document.getElementById('queryValueText').innerHTML = '';
                    document.getElementById('overlapspinner').removeAttribute("disabled");
                }
                else if(value == 'Count'){
                    var queryOperator = [];
                    for (var i = 0; i < this.config.queryOperator.length; i++) {
                         queryOperator[i] ={};
                         queryOperator[i].label =this.config.queryOperator[i];
                         queryOperator[i].value =this.config.queryOperator[i];
                    }
                    document.getElementById('queryValueText').innerHTML = 'Count';
                    dijit.byId('queryFieldName').set('disabled', false);
                    dijit.byId('queryFieldValue').set('disabled', true);

                    //remove number fields
                    this.queryFieldName.set('options',[]);
                    var queryFieldChoices = [];
                    queryFieldChoices[ii] ={};
                    queryFieldChoices[ii].label = 'No Field';
                    queryFieldChoices[ii].value = 'No Field';
                    for (var ii = 0; ii < this.config.layeroptions[dijit.byId('queryLayer').attr('displayedValue')].Fields.length; ii++) {
                        if(this.config.layeroptions[dijit.byId('queryLayer').attr('displayedValue')].Fields[ii][1]=="1"){

                            queryFieldChoices[ii+1] ={};
                            queryFieldChoices[ii+1].label =this.config.layeroptions[dijit.byId('queryLayer').attr('displayedValue')].Fields[ii][0];
                            queryFieldChoices[ii+1].value =this.config.layeroptions[dijit.byId('queryLayer').attr('displayedValue')].Fields[ii][0];
                        }
                    }

                    this.queryFieldName.addOption(queryFieldChoices);
                }
                else if(value == 'Overlap'){
                    document.getElementById('overlapspinner').removeAttribute("disabled");
                    this.overlapspinner.value = '';
                    var queryOperator = [];
                    for (var i = 0; i < this.config.queryOperator.length; i++) {
                         queryOperator[i] ={};
                         queryOperator[i].label =this.config.queryOperator[i];
                         queryOperator[i].value =this.config.queryOperator[i];
                    }

                    if(this.config.layeroptions[dijit.byId('queryLayer').attr('displayedValue')].GeoType == 'Polygon')
                    {
                        document.getElementById('queryValueText').innerHTML = 'Area in (km2)';
                    }
                    else{
                        document.getElementById('queryValueText').innerHTML = 'Distance (km)';
                    }
                }
                //Distance
                else{
                    var queryOperator = [];
                    for (var i = 0; i < this.config.queryOperator.length; i++) {
                         queryOperator[i] ={};
                         queryOperator[i].label =this.config.queryOperator[i];
                         queryOperator[i].value =this.config.queryOperator[i];
                    }
                    document.getElementById('queryValueText').innerHTML = 'Distance in meters';
                    
                    dijit.byId('queryFieldName').set('disabled', true);
                    this.queryFieldName.value = '';
                    dijit.byId('queryFieldValue').set('disabled', true);
                    this.queryFieldValue.value = '';
                }

                this.queryOperator.addOption(queryOperator);
            },

            onChangequeryOperator:function(value){
                //querylistMaster
            },

            scenarioNameChange:function(value){
                //this.scenarioName = value
            },

            queryNameChange:function(value){
                this.queryname = value;
            },
            
            //asynchronous job completed successfully
            displayERGServiceResults: function (results) {
                if(this.outputrasterlayer != null){
                    this.map.removeLayer(this.outputrasterlayer );
                }
                //add raster to map
                domStyle.set("loadingrunscreen", {
                    "display": 'none',
                });
                domStyle.set("downloadfile", {
                    "display": 'inherit',
                });
                document.getElementById("downloadfileLinkdetails").href = results.url;
                results.name = "Output Site Screening Layer";
                this.outputrasterlayer = results;
                var urlwithoutoken = this.outputrasterlayer.url.split('?token')[0];
                //if(this.config.token != ''){
                //    this.outputrasterlayer.token = this.config.token;
                //}
                this.outputrasterlayer.url = urlwithoutoken;
                this.map.addLayers([results]);
            },

            addDownloadOption:function(val){
                document.getElementById("downloadfileLink").href = val.value;
            },

            onERGGPComplete: function (jobInfo) {

                if (jobInfo.jobStatus !== "esriJobFailed") {
                    this.ergGPJobID = jobInfo.jobId;

                    this.ergGPChemicalService.getResultData(jobInfo.jobId, "OutputURL",
                            lang.hitch(this, this.addDownloadOption));
                    this.ergGPChemicalService.getResultImageLayer(jobInfo.jobId, null,null,
                            lang.hitch(this, this.displayERGServiceResults));
                }
                else{
                    this.showDialog('Job Failed, Please try again');
                    domStyle.set("loadingrunscreen", {
                        "display": 'none',
                    });
                }
            },

            onERGGPStatusCallback: function (jobInfo) {
                var status = jobInfo.jobStatus;
            },

            showDialog: function (configJson) {
                var dialog = new Dialog({
                    title: "Alert",
                    content: ["<div style='font-size:17px;padding-top:30px;padding-bottom:30px;'>", configJson, "</div>"].join('')
                });

                // dialog.onButtonClickEvent = function (button) {
                //     return function () {
                //         button.callBack.apply(this, []);
                //         dialog.onCancel();
                //     }
                // };

                dialog.startup();
                dialog.show();
            },

            addGraphic: function (evt) {
                //deactivate the toolbar and clear existing graphics
                this.drawToolbar.deactivate();
                this.map.enableMapNavigation();

                // figure out which symbol to use
                var symbol;
                if (evt.geometry.type === "polygon") {
                    symbol = new SimpleFillSymbol(
                        SimpleFillSymbol.STYLE_NULL,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 255]), 2),
                        new Color([0, 0, 255, 0.5]));
                }
                this.spillGraphicsLayer.add(new Graphic(evt.geometry, symbol));
                this.incidentGraphic = evt.geometry;
            },

            bindDrawToolbar: function (evt) {
                if (evt.target.id === "drawSpillInfo") {
                    return;
                }

                var tool = evt.target.id.toLowerCase();
                
                this.map.disableMapNavigation();
                this.spillGraphicsLayer.clear();
                this.drawToolbar.activate(tool);

                //clear other layers if on the map
                if(this.map.getLayer('incidentLayer')){
                    this.map.getLayer('incidentLayer').clear();
                }
            },

            addQuery:function(){
                
                if(this.queryName.displayedValue == ""){
                    this.showDialog('Please Select a Query Name.');
                }
                else{
                    if(this.queryType.value=='Distance'||this.queryFieldName.value=="No Field"){
                        this.queryFieldName.value = '';
                        this.queryFieldValue.value = '';
                    }

                    else if(this.queryType.value!='Overlap'&&this.queryType.value!='Presence'){
                        this.overlapspinner.displayedValue = '';
                    }
                    else{
                        if(this.overlapspinner.displayedValue == ''){
                            this.overlapspinner.displayedValue=0;
                        }
                    }
                    if(this.queryType.value=='Count'){
                        this.queryFieldValue.value = '';
                    }
                    if(this.queryType.value=='Presence'){
                        this.queryValue.displayedValue = '';
                        this.queryValue.value = '';
                    }


                    //Alert type check and validator 
                    var addquery = true;
                    if(this.queryType.value=='Distance'&&this.queryValue.displayedValue ==''){
                        addquery = false;
                        this.showDialog("Please make sure all display value fields for Query Type DISTANCE are selected.");
                    }
                    if(this.queryType.value=='Count'&&(this.queryValue.displayedValue ==''||this.queryFieldName.value =='')){
                        addquery = false;
                        this.showDialog("Please make sure all enabled fields for Query Type COUNT are selected.");
                    }
                    if(this.queryType.value=='Presence'&&this.overlapspinner.displayedValue == ''){
                        addquery = false;
                        this.showDialog("Please make sure all Overlap fields for Query Type PRESENCE are selected.");
                    }
                    if(this.queryType.value=='Overlap'&&(this.overlapspinner.displayedValue == ''||this.queryValue.displayedValue =='')){
                        addquery = false;
                        this.showDialog("Please make sure all enabled fields for Query Type OVERLAP are selected.");
                    }

                    if(addquery == true){
                        this.CustomMetricsSite.addOption({"label":this.queryName.displayedValue,"value":this.queryName.displayedValue+","+dijit.byId('queryLayer').attr('displayedValue')+","+this.queryType.value+","+this.queryOperator.value+","+this.queryValue.displayedValue+","+ this.queryFieldName.value+","+this.queryFieldValue.value+","+this.overlapspinner.displayedValue+","});        
                        this.showDialog('Query '+this.queryName.displayedValue+' added to Paramter List.');
                        this.queryName.attr('value', null);
                    }
                }
            },

            onSolve: function (evt) {
                
                this.drawToolbar.deactivate();
                domStyle.set("downloadfile", {
                    "display": 'none',
                });

                var params = {};

                if(this.incidentGraphic == null && this.inputFileData == null && this.shpType.value == "No Layer"){
                    this.showDialog("Please add polygon geometry input or upload a file.");
                }
                else if(this.scenarioName.displayedValue == ""){
                    this.showDialog("Please Select a Scenario Name.");   
                }
                else if(this.selectedCustomMetrics == null ||this.selectedCustomMetrics == ''){
                    this.showDialog("Please Select a Query Option (s).");   
                }
                else{
                    //send in layer from list
                    if(this.shpType.value != "No Layer"){
                        params['AOI_Input'] = this.shpType.value;
                        params['AOI_Input_Type'] = "Layer";
                    }
                    else if(this.inputFileData != null){
                        params['AOI_Input'] = this.inputFileData;
                        params['AOI_Input_Type'] = "Shapefile";
                    }
                    else {
                        params['AOI_Input_Type'] = 'AOI';
                        params['AOI_Input'] = this.incidentGraphic;
                    }

                    params['Query_Type'] = 'Custom';
                    params['Query_Input'] =this.selectedCustomMetrics;
                    params['Cell_Size'] = this.winDirSpinner.value;
                    
                    domStyle.set("loadingrunscreen", {
                        "display": 'inherit',
                    });
                    
                    this.maploading = new LoadingIndicator();
                    var t = document.getElementById("loadingrunscreen");
                    this.maploading.placeAt(t);
                    this.ergGPChemicalService.submitJob(params, lang.hitch(this, this.onERGGPComplete),
                            lang.hitch(this, this.onERGGPStatusCallback));
                }              
            },

            postCreate: function () {
                this.inherited(arguments);
            },

            startup: function () {
                this.inherited(arguments);
                var that = this;

                //add CORS servers
                for (var key in this.config) {
                    if (this.config.hasOwnProperty(key)) {
                        if (this._isValidUrl(this.config[key])) {
                            var url = this._parseUrl(this.config[key]);
                            if (!this._itemExists(url.hostname, esri.config.defaults.io.corsEnabledServers)) {
                                
                                if(that.config.proxy != ''){
                                    esri.config.defaults.io.corsEnabledServers.push(url.hostname);
                                    //esriConfig.defaults.io.proxyUrl = "proxy.aspx";  
                                    //esriConfig.defaults.io.alwaysUseProxy = true;
                                    urlUtils.addProxyRule({
                                        urlPrefix : that.config.proxyprefix,
                                        proxyUrl : that.config.proxy
                                    });
                                }                               
                            }   
                        }
                    }
                }

                this.tabContainer = new TabContainer({
                    tabs: [
                        {
                            title: this.nls.tabERG,
                            content: this.tabNode1
                        },
                        {
                            title: this.nls.tabFacilities,
                            content: this.tabNode3
                        },
                        {
                            title: this.nls.tabDemo,
                            content: this.tabNode2
                        }
                    ],
                    selected: this.nls.conditions
                }, this.tabERG);
                this.tabContainer.startup();
                utils.setVerticalCenter(this.tabContainer.domNode);
                
                //Get Chemical names from the GP Service
                this.ergGPChemicalService = new Geoprocessor(this.config.url);
                if(this.config.token != ''){
                    this.ergGPChemicalService.token = this.config.token;
                }

                //stressors
                var layerOption = [];
                for (var i = 0; i < this.config.layers.length; i++) {
                    layerOption[i] ={};
                    layerOption[i].label =this.config.layers[i].label;
                    layerOption[i].value =this.config.layers[i].value;

                    if(i==0){
                        //start with polygon
                        var queryFieldChoices = [];
                        queryFieldChoices[0] ={};
                        queryFieldChoices[0].label = 'No Field';
                        queryFieldChoices[0].value = 'No Field';
                        for (var tt = 0; tt < this.config.layeroptions[this.config.layers[i].label].Fields.length; tt++) {
                            queryFieldChoices[tt+1] ={};
                            queryFieldChoices[tt+1].label =this.config.layeroptions[this.config.layers[i].label].Fields[tt][0];
                            queryFieldChoices[tt+1].value =this.config.layeroptions[this.config.layers[i].label].Fields[tt][0];
                        }

                        this.queryFieldName.addOption(queryFieldChoices);
                        this.own(on(this.queryFieldName, "change", lang.hitch(this, this.onChangequeryFieldName)));
                        
                        //FOR NOW to begin
                        dijit.byId('queryFieldName').set('disabled', true);
                        dijit.byId('queryFieldValue').set('disabled', true);
                        document.getElementById('overlapspinner').setAttribute("disabled", true);
                    }
                }

                this.queryLayer.addOption(layerOption);
                this.own(on(this.queryLayer, "change", lang.hitch(this, this.onChangelayer)));

                var queryType = [];
                for (var i = 0; i < this.config.queryTypePoly.length; i++) {
                     queryType[i] ={};
                     queryType[i].label =this.config.queryTypePoly[i].label;
                     queryType[i].value =this.config.queryTypePoly[i].value;
                }

                this.queryType.addOption(queryType);
                this.own(on(this.queryType, "change", lang.hitch(this, this.onChangequeryType)));

                var queryOperator = [];
                for (var i = 0; i < this.config.queryOperator.length; i++) {
                     queryOperator[i] ={};
                     queryOperator[i].label =this.config.queryOperator[i];
                     queryOperator[i].value =this.config.queryOperator[i];
                }

                this.queryOperator.addOption(queryOperator);
                this.own(on(this.queryOperator, "change", lang.hitch(this, this.onChangequeryOperator)));

                this.own(on(this.scenarioName, "change", lang.hitch(this, this.scenarioNameChange)));
                this.own(on(this.queryName, "change", lang.hitch(this, this.queryNameChange)));

                var filetype = [];
                var filetypenum = 1;
                filetype[0] ={};
                filetype[0].label ="No Layer";
                filetype[0].value ="No Layer";

                for (var layerNam in this.config.layeroptions) { 
                    if(this.config.layeroptions[layerNam].GeoType == 'Polygon'){
                        filetype[filetypenum] ={};
                        filetype[filetypenum].label =layerNam;
                        filetype[filetypenum].value =layerNam;
                        filetypenum++;
                    }
                }
                this.shpType.addOption(filetype);
                //this.own(on(this.shpType, "change", lang.hitch(this, this.onChangefiletype)));
                
                var CustomMetricsChoices = [];
                for (var i = 0; i < this.config.custom.length; i++) {
                    CustomMetricsChoices[i] ={};
                    CustomMetricsChoices[i].label =this.config.custom[i].label;
                    CustomMetricsChoices[i].value =this.config.custom[i].value;
                }
                this.CustomMetricsSite.addOption(CustomMetricsChoices);
                this.own(on(this.CustomMetricsSite, "change", lang.hitch(this, this.onChangeCustomMetrics)));

                document.getElementById("infile-site").onchange = function() {
                    
                    if(this.spillGraphicsLayer != null){
                        this.incidentGraphic == null;
                        this.spillGraphicsLayer.clear();
                    }                    

                    var gpUploadURL = that.config.url_upload;
                    var form = dojo.byId("uploadFormSite");

                    var requestHandle = esri.request({  
                        url: gpUploadURL,  
                        form: form,  
                        content : {  
                          f : "pjson"  
                         } , 
                        handleAs: "json",
                        load: uploadSucceeded,  
                        error: uploadFailed  
                    });  
                      
                    function uploadFailed(response) {                                                                                                                                                                                                                                                             
                      this.showDialog(response.message);
                    }  
                    function uploadSucceeded(response,io) {                                                                                                                                                                                                                                                             
                      //that.inputFileData = {'Input_Rows': "{'itemID':" +response["item"].itemID+ "}" };  
                      that.inputFileData = response["item"].itemID+"\\"+response["item"].itemName ;  
                    }
                };

                //spill location graphics layer
                this.spillGraphicsLayer = new GraphicsLayer();
                this.spillGraphicsLayer.id = 'screeningLayer';
                this.map.addLayer(this.spillGraphicsLayer);

                this.drawToolbar = new Draw(this.map);
                this.own(on(this.drawToolbar, "draw-end", lang.hitch(this, this.addGraphic)));
                this.own(on(this.drawSpillInfo, "click", lang.hitch(this, this.bindDrawToolbar)));
            },

            onOpen: function () {
            },

            onClose: function () {
            },

            onMinimize: function () {
            },

            onMaximize: function () {
            },

            onSignIn: function (credential) {
            },

            onSignOut: function () {

            },

            destroy: function () {
                
            },

            _setFeatureSymbol: function (f) {
                switch (f.geometry.type) {
                    case 'extent':
                    case 'polygon':
                        f.setSymbol(this._getFillSymbol());
                        break;
                    default:
                        f.setSymbol(this._getMarkerSymbol());
                        break;
                }
            },

            _getHighLightColor:function(){
                var color = new Color('#f5f50e');
                if(this.config && this.config.highLightColor){
                    color = new Color(this.config.highLightColor);
                }
                return color;
            },

            _getMarkerSymbol: function () {
                var style = SimpleMarkerSymbol.STYLE_CIRCLE;
                var size = 15;
                var color = new Color("#FF0000");
                color.a = 1;

                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = new Color("#000000");
                var outlineWidth = 0;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);

                var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
                return symbol;
            },

            _getHightLightMarkerSymbol: function () {
                var style = SimpleMarkerSymbol.STYLE_CIRCLE;
                var size = 15;
                var color = new Color("#3fafdc");
                color.a = 1;

                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = this._getHighLightColor();
                var outlineWidth = 3;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);

                var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
                return symbol;
            },

            _getLineSymbol: function () {
                var symbol = new SimpleLineSymbol();
                var style = SimpleLineSymbol.STYLE_SOLID;
                var color = new Color("#3fafdc");
                color.a = 1;
                var width = 5;
                symbol.setStyle(style);
                symbol.setColor(color);
                symbol.setWidth(width);
                return symbol;
            },

            _getHightLightLineSymbol: function () {
                var symbol = new SimpleLineSymbol();
                var style = SimpleLineSymbol.STYLE_SOLID;
                var color = this._getHighLightColor();
                color.a = 1;
                var width = 7;
                symbol.setStyle(style);
                symbol.setColor(color);
                symbol.setWidth(width);
                return symbol;
            },

            _getFillSymbol: function () {
                var style = SimpleFillSymbol.STYLE_SOLID;
                var color = new Color('#3fafdc');
                color.a = 0.5;
                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = new Color('#000000');
                var outlineWidth = 1;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);
                var symbol = new SimpleFillSymbol(style, outlineSymbol, color);
                return symbol;
            },

            _getHightLightFillSymbol: function () {
                var style = SimpleFillSymbol.STYLE_SOLID;
                var color = new Color('#3fafdc');
                color.a = 0.5;
                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = this._getHighLightColor();
                var outlineWidth = 3;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);
                var symbol = new SimpleFillSymbol(style, outlineSymbol, color);
                return symbol;
            },

            _setHightLightSymbol:function(g){
                switch(g.geometry.type){
                    case 'extent':
                    case 'polygon':
                        g.setSymbol(this._getHightLightFillSymbol());
                        break;
                    default:
                        g.setSymbol(this._getHightLightMarkerSymbol());
                        break;
                }
            },

            
            _parseUrl: function (url) {
                var location = document.createElement("a");
                location.href = url;
                return location;                    
            },
            _itemExists: function (searchItem, list) {
                for (var i = 0; i < list.length; i++) {
                    if (list[i] === searchItem) {
                        return true;                            
                    }                            
                }                   
                return false; 
            },

            _isValidUrl: function (url) {
                var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                return regexp.test(url);                       
            }
        });
    });