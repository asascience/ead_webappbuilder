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
    "dojo/dom-attr",
    "esri/geometry/Polyline",
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
    "esri/geometry/jsonUtils",
    "dojo/_base/array",
    "dojo/_base/html",
    "esri/layers/FeatureLayer",
    "jimu/dijit/DrawBox",
    "dojo/query",
    "dojox/data/CsvStore",
    "dojox/grid/DataGrid",
    "dojo/dom-construct"
],
    function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, LoadingIndicator, utils, esriConfig, urlUtils, Geoprocessor, FeatureSet, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, domAttr, Polyline, SimpleLineSymbol, Polygon, SimpleFillSymbol, Draw, InfoTemplate, esriRequest, graphicsUtils, webMercatorUtils, Color, Dialog, ProgressBar, NumberSpinner, lang, on, dom, domStyle, Select, CheckedMultiSelect,TextBox, jsonUtils, array, html, FeatureLayer, DrawBox, query,CsvStore,DataGrid, domConstruct) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            // DemoWidget code goes here

            //please note that this property is be set by the framework when widget is loaded.
            //templateString: template,

            baseClass: 'jimu-widget-erg',
            name: 'INCIDENT',
            spillGraphicsLayer: null,
            selectedHabitat: null,
            selectedStressor: null,
            selectedObsType: null,
            selectedCustomMetrics:null,
            ergGPJobID: null,
            incidentGraphic: null,
            ergGPActive: null,
            executionType: null,
            maploading:null,
            inputFileData:null,
            inputFileDataType:null,

            onChangeStressors: function (newValue) {
                var stringvalue = '';
                for (var i = 0; i < newValue.length; i++) {
                    if(i>0){
                       stringvalue+=';';
                    }
                    stringvalue+=newValue[i];
                }
                this.selectedStressor = stringvalue;
            },

            onChangefiletype:function(newValue){
                this.inputFileDataType = newValue;
            },
            
            onChangeHabitats: function (newValue) {
                var stringvalue = '';
                for (var i = 0; i < newValue.length; i++) {
                    if(i>0){
                       stringvalue+=';';
                    }
                    stringvalue+=newValue[i];
                }
                this.selectedHabitat = stringvalue;
            },

            onChangeobservations: function (newValue) {
                var stringvalue = '';
                for (var i = 0; i < newValue.length; i++) {
                    if(i>0){
                       stringvalue+=';';
                    }
                    stringvalue+=newValue[i].replace(' - ',',');
                }
                this.selectedObsType = stringvalue;
            },
            
            onChangeCustomMetrics: function (newValue) {
                //multivalues
                var stringvalue = '';
                for (var i = 0; i < newValue.length; i++) {
                    if(i>0){
                       stringvalue+=';';
                    }
                    if(newValue[i]!="None"){
                        stringvalue+=newValue[i].replace(' - ',',');
                    }
                }
                this.selectedCustomMetrics = stringvalue;
                document.getElementById("customvalue").innerHTML = stringvalue;
            },

            onChangequeryLayer: function (newValue) {
                this.metricField.set('options',[]);
                this.metricField._updateSelection();
                this.metricType.set('options',[]);
                this.metricType._updateSelection();
                for (var prop in this.config.layeroptions) {
                    
                    if(newValue == prop){
                        var queryTypeChoices = [];
                        if(this.config.layeroptions[prop].GeoType == 'Point'){
                            queryTypeChoices[0] ={};
                            queryTypeChoices[0].label ="Count";
                            queryTypeChoices[0].value ="Count";
                            this.metricType.addOption(queryTypeChoices);
                        }
                        else if(this.config.layeroptions[prop].GeoType == 'Polygon'){
                            queryTypeChoices[0] ={};
                            queryTypeChoices[0].label ="Count";
                            queryTypeChoices[0].value ="Count";
                            queryTypeChoices[1] ={};
                            queryTypeChoices[1].label ="Area";
                            queryTypeChoices[1].value ="Size";
                            this.metricType.addOption(queryTypeChoices);
                        }
                        else if(this.config.layeroptions[prop].GeoType == 'Polyline'){
                            queryTypeChoices[0] ={};
                            queryTypeChoices[0].label ="Count";
                            queryTypeChoices[0].value ="Count";
                            queryTypeChoices[1] ={};
                            queryTypeChoices[1].label ="Length";
                            queryTypeChoices[1].value ="Size";
                            this.metricType.addOption(queryTypeChoices);
                        }

                        var queryFieldChoices = [];
                        for (var i = 0; i < this.config.layeroptions[prop].Fields.length; i++) {
                            queryFieldChoices[i] ={};
                            queryFieldChoices[i].label =this.config.layeroptions[prop].Fields[i];
                            queryFieldChoices[i].value =this.config.layeroptions[prop].Fields[i];
                        }

                        this.metricField.addOption(queryFieldChoices);
                    }
                }
            },
            onChangequeryType: function (newValue) {
                
            },
            
            onClearBtnClicked: function () {
                if(this.spillGraphicsLayer != null){
                    this.spillGraphicsLayer.clear();
                }
                var newStore = new dojo.data.ItemFileReadStore({data: {  identifier: "",  items: []}});   
                dijit.byId("grid").setStore(newStore, {}); 

                this.obs.set('value',[]);
                this.obs._updateSelection();
                this.Habitats.set('value',[]);
                this.Habitats._updateSelection();
                this.Stressors.set('value',[]);
                this.Stressors._updateSelection();
                this.CustomMetrics.set('value',[]);
                this.CustomMetrics._updateSelection();
                this.selectedHabitat= null;
                this.selectedStressor= null;
                this.selectedObsType= null;
                this.selectedCustomMetrics=null;
                this.inputFileData=null;
                this.matricName.value = null;
                // this.metricLayer.set('value',[]);
                // this.metricLayer._updateSelection();
                this.matricName.attr('value', null);
                this.drawToolbar.deactivate();
            },

            addMatric:function(){
                if(this.matricName.displayedValue != ""){
                    this.CustomMetrics.addOption({"label":this.matricName.displayedValue,"value":this.metricLayer.value+","+this.metricType.value+","+this.metricField.value});    
                }
                else{
                    alert('Please Select a Metric Name.')
                }
            },

            //asynchronous job completed successfully
            displayERGServiceResults: function (results) {

                if (results.paramName === "Output") {
                    var urlcsv;
                    if(this.config.proxy != ''){
                        urlcsv = this.config.proxy+ results.value;
                    }
                    else{
                        urlcsv = results.value;
                    }
                    window.open(results.value,"_blank");

                    var recordsStoreForGrid= new dojox.data.CsvStore({url: urlcsv});

                    var layoutheaders = [
                        [
                          { field: "Analysis", name: "Analysis", width: 10 },
                          { field: "Metric", name: "Metric", width: 10 },
                          { field: "CustomFootprint1", name: "CustomFootprint1", width: 'auto' }
                       ]
                    ];
                    dijit.byId("grid").setStructure(layoutheaders);
                    dijit.byId("grid").setStore(recordsStoreForGrid, {});
                }
                domStyle.set("loadingrun", {
                    "display": 'none',
                });
            },

            onERGGPComplete: function (jobInfo) {

                if (jobInfo.jobStatus !== "esriJobFailed") {
                    this.ergGPJobID = jobInfo.jobId;
                    this.ergGPChemicalService.getResultData(jobInfo.jobId, "Output",
                            lang.hitch(this, this.displayERGServiceResults));
                }
                else{
                    alert('Job Failed, Please try again');
                    domStyle.set("loadingrunscreen", {
                        "display": 'none',
                    });
                }
            },

            onERGGPStatusCallback: function (jobInfo) {
                var status = jobInfo.jobStatus;
            },

            confirmationDialog: function (configJson) {
                var dialog = new Dialog({
                    title: configJson.title,
                    content: ["<div style='width:25em'>", configJson.message, "</div>"].join('')
                });

                dialog.onButtonClickEvent = function (button) {
                    return function () {
                        button.callBack.apply(this, []);
                        dialog.onCancel();
                    }
                };

                for (actionButton in configJson.actionButtons) {
                    if (configJson.actionButtons.hasOwnProperty(actionButton)) {
                        dojo.place(new dijit.form.Button({label: configJson.actionButtons[actionButton].label,
                            onClick: dialog.onButtonClickEvent.apply(dialog, [configJson.actionButtons[actionButton]])
                        }).domNode, dialog.containerNode, 'after');
                    }
                }
                dialog.startup();
                dialog.show();
            },

            convertTime: function (unix_timestamp) {

            },

            addGraphic: function (evt) {
                //deactivate the toolbar and clear existing graphics
                //this.drawToolbar.deactivate();
                this.map.enableMapNavigation();

                // figure out which symbol to use
                var symbol;
                if (evt.geometry.type === "polygon") {
                    symbol = new SimpleFillSymbol(
                        SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 1),
                        new Color([123, 205, 232, 0.5]));
                }
                this.spillGraphicsLayer.add(new Graphic(evt.geometry, symbol));
                this.incidentGraphic = '';

                for (var i = 0; i < this.spillGraphicsLayer.graphics.length; i++) {

                    this.incidentGraphic += JSON.stringify(this.spillGraphicsLayer.graphics[i].geometry);
                    if(i<this.spillGraphicsLayer.graphics.length-1){
                        this.incidentGraphic += ";";
                    }
                }
            },

            bindDrawToolbar: function (evt) {
                if (evt.target.id === "drawSpillInfo") {
                    return;
                }
                var tool = evt.target.id.toLowerCase();
                this.map.disableMapNavigation();
                this.spillGraphicsLayer.clear();
                this.drawToolbar.activate(tool);
            },

            onSolve: function (evt) {
                this.drawToolbar.deactivate();
                var params = {};

                var recordsStoreForGrid= new dojox.data.CsvStore({url: "Summary.csv"});

                var layoutheaders = [
                    [
                      { field: "Analysis", name: "Analysis", width: 10 },
                      { field: "Metric", name: "Metric", width: 10 },
                      { field: "CustomFootprint1", name: "CustomFootprint1", width: 'auto' }
                   ]
                ];
                dijit.byId("grid").setStructure(layoutheaders);
                dijit.byId("grid").setStore(recordsStoreForGrid, {});

                if(this.incidentGraphic == null && this.inputFileData == null){
                    alert("Please add polygon geometry input or upload a file.");
                }
                else{
                    if(this.inputFileData != null){
                        params['Input '] = this.inputFileData;
                        params['InputType'] = this.inputFileDataType;
                    }
                    else {
                        params['InputType'] = 'AOI';
                        params['Input'] = this.incidentGraphic;
                    }
                    var oneValueSelected = false;
                    if(this.selectedCustomMetrics != null){
                        if( this.selectedCustomMetrics != 'None'){
                            params['CustomMetrics'] =this.selectedCustomMetrics;   
                            oneValueSelected=true; 
                        } 
                        else{
                            params['CustomMetrics'] = '';
                        }      
                    }
                    else{
                        params['CustomMetrics'] = '';
                    }
                    if(this.selectedStressor != null){
                        params['Stressors'] = this.selectedStressor;
                        oneValueSelected=true;
                    }
                    else{
                        params['Stressors'] = '';
                    }
                    if(this.selectedHabitat != null){
                        params['Habitats'] = this.selectedHabitat;  
                        oneValueSelected=true;
                    }
                    else{
                        params['Habitats'] = '';
                    }
                    if(this.selectedObsType != null){
                        params['Observations'] = this.selectedObsType;
                        oneValueSelected=true;
                    }
                    else{
                        params['Observations'] = '';
                    }
                    if(oneValueSelected == false){
                        alert("Please Select at least one parameter for the model.");
                    }
                    else{
                        //domAttr.addAttr("runbut", "disabled");
                        domStyle.set("loadingrun", {
                            "display": 'inherit',
                          });
                        this.maploading = new LoadingIndicator();
                        var t = document.getElementById("loadingrun");
                        this.maploading.placeAt(t);
                        this.ergGPChemicalService.submitJob(params, lang.hitch(this, this.onERGGPComplete),
                            lang.hitch(this, this.onERGGPStatusCallback));
                    }
                    
                }
            },

            postCreate: function () {
                this.inherited(arguments);
            },

            startup: function () {

                this.inherited(arguments);
                that = this;

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
                            title: this.nls.tabCustom,
                            content: this.tabNode4
                        },
                        {
                            title: this.nls.tabDemo,
                            content: this.tabNode2
                        },
                        {
                            title: this.nls.tabResults,
                            content: this.tabNode3
                        }
                    ],
                    selected: this.nls.conditions
                }, this.tabERG);
                this.tabContainer.startup();
                utils.setVerticalCenter(this.tabContainer.domNode);
                
                //Get Chemical names from the GP Service
                this.ergGPChemicalService = new Geoprocessor(this.config.url);

                //stressors
                var stressorOption = [];
                for (var i = 0; i < this.config.stressors.length; i++) {
                    stressorOption[i] ={};
                    stressorOption[i].label =this.config.stressors[i];
                    stressorOption[i].value =this.config.stressors[i];
                }

                this.Stressors.addOption(stressorOption);
                this.own(on(this.Stressors, "change", lang.hitch(this, this.onChangeStressors)));

                var obsOption = [];
                for (var i = 0; i < this.config.observations.length; i++) {
                    obsOption[i] ={};
                    obsOption[i].label =this.config.observations[i];
                    obsOption[i].value =this.config.observations[i];
                }
                this.obs.addOption(obsOption);
                this.own(on(this.obs, "change", lang.hitch(this, this.onChangeobservations)));

                var filetype = [];
                for (var i = 0; i < this.config.filetype.length; i++) {
                    filetype[i] ={};
                    filetype[i].label =this.config.filetype[i];
                    filetype[i].value =this.config.filetype[i];
                }
                this.shpType_site.addOption(filetype);
                this.own(on(this.shpType_site, "change", lang.hitch(this, this.onChangefiletype)));

                var habitatsOption = [];
                for (var i = 0; i < this.config.habitats.length; i++) {
                    habitatsOption[i] ={};
                    habitatsOption[i].label =this.config.habitats[i];
                    habitatsOption[i].value =this.config.habitats[i];
                }
                this.Habitats.addOption(habitatsOption);
                this.own(on(this.Habitats, "change", lang.hitch(this, this.onChangeHabitats)));

                var CustomMetricsChoices = [];
                for (var i = 0; i < this.config.custom.length; i++) {
                    CustomMetricsChoices[i] ={};
                    //CustomMetricsChoices[i].label =this.config.custom[i].label;
                    CustomMetricsChoices[i] =this.config.custom[i];
                }
                this.CustomMetrics.addOption(CustomMetricsChoices);
                this.own(on(this.CustomMetrics, "change", lang.hitch(this, this.onChangeCustomMetrics)));

                var queryLayerChoices = [];
                var i = 0;
                for (var prop in this.config.layeroptions) {
                    queryLayerChoices[i] ={};
                    queryLayerChoices[i].label =prop;
                    queryLayerChoices[i].value =prop;
                    if(i==0){
                        var queryFieldChoices = [];
                        for (var t = 0; t < this.config.layeroptions[prop].Fields.length; t++) {
                            queryFieldChoices[t] ={};
                            queryFieldChoices[t].label =this.config.layeroptions[prop].Fields[t];
                            queryFieldChoices[t].value =this.config.layeroptions[prop].Fields[t];
                        }

                        this.metricField.addOption(queryFieldChoices);
                    }
                    i++;
                }
                this.metricLayer.addOption(queryLayerChoices);
                this.own(on(this.metricLayer, "change", lang.hitch(this, this.onChangequeryLayer)));
                
                var queryTypeChoices = [];
                queryTypeChoices[0] ={};
                queryTypeChoices[0].label ="Count";
                queryTypeChoices[0].value ="Count";
                queryTypeChoices[1] ={};
                queryTypeChoices[1].label ="Area";
                queryTypeChoices[1].value ="Size";
                this.metricType.addOption(queryTypeChoices);

                document.getElementById("infile-impact").onchange = function() {
                    
                    if(this.spillGraphicsLayer != null){
                        this.incidentGraphic == null;
                        this.spillGraphicsLayer.clear();
                    }

                    var gpUploadURL = that.config.url_upload;
                    
                    var form = dojo.byId("uploadFormImpact");
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
                      alert(response.message);
                    }  
                    function uploadSucceeded(response,io) {                                                                                                                                                                                                                                                             
                      this.inputFileData = {'Input_Rows': "{'itemID':" +response["item"].itemID+ "}" };  
                    }  
                };

                //spill location graphics layer
                this.spillGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.spillGraphicsLayer);

                //ERG coverage layer
                this.ergGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.ergGraphicsLayer);
                
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
                    case 'polyline':
                        f.setSymbol(this._getLineSymbol());
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
                    case 'polyline':
                        g.setSymbol(this._getHightLightLineSymbol());
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