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
    "dojo/dom-construct",
    "./FacilitiesPane"
],
    function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, LoadingIndicator, utils, esriConfig, urlUtils, Geoprocessor, FeatureSet, GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, domAttr, Polyline, SimpleLineSymbol, Polygon, SimpleFillSymbol, Draw, InfoTemplate, esriRequest, graphicsUtils, webMercatorUtils, Color, Dialog, ProgressBar, NumberSpinner, lang, on, dom, domStyle, Select, CheckedMultiSelect,TextBox, jsonUtils, array, html, FeatureLayer, DrawBox, query, domConstruct, FacilitiesPane) {
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
                this.selectedCustomMetrics = newValue;
                document.getElementById("customvalue").innerHTML = newValue;
            },
            
            onClearBtnClicked: function () {
                this.spillGraphicsLayer.clear();
            },

            //asynchronous job completed successfully
            displayERGServiceResults: function (results) {

                if (results.paramName === "Output") {
                    window.open(results.value,"_blank");
                }
                domStyle.set("loadingrun", {
                    "display": 'none',
                });
                //domAttr.removeAttr("runbut", "disabled");
            },

            onERGGPComplete: function (jobInfo) {

                if (jobInfo.jobStatus !== "esriJobFailed") {
                    this.ergGPJobID = jobInfo.jobId;
                    this.ergGPChemicalService.getResultData(jobInfo.jobId, "Output",
                            lang.hitch(this, this.displayERGServiceResults));
                }
                else{
                    alert('Job Failed, Please try again')
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
                this.drawToolbar.deactivate();
                this.map.enableMapNavigation();
                this.incidentGraphic = evt.geometry;

                // figure out which symbol to use
                var symbol;
                if (evt.geometry.type === "polygon") {
                    symbol = new SimpleFillSymbol(
                        SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 2),
                        new Color([0, 0, 255, 0.5]));
                }
                this.spillGraphicsLayer.add(new Graphic(evt.geometry, symbol));
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
                var params = {};
                params['InputType'] = 'AOI';
                params['Input'] = this.incidentGraphic;
                if(this.incidentGraphic == null){
                    alert("Please add polygon geometry input or upload a file.");
                }
                //params['InputType'] = 'Shapefile';
                //params['InputType'] = 'Model Output';
                else{

                    if(this.selectedCustomMetrics == null || this.selectedCustomMetrics == 'none'){
                        if(this.selectedStressor == null){
                            alert("Please Select a Stressor");
                        }
                        else if(this.selectedHabitat == null){
                            alert("Please Select a Habitat");   
                        }
                        else if(this.selectedObsType == null){
                             alert("Please Select a Observation");   
                        }
                        else {
                            //domAttr.addAttr("runbut", "disabled");
                            domStyle.set("loadingrun", {
                                "display": 'inherit',
                              });
                            this.maploading = new LoadingIndicator();
                            var t = document.getElementById("loadingrun");
                            this.maploading.placeAt(t);

                            params['Observations'] = this.selectedObsType;
                            params['Habitats'] = this.selectedHabitat;
                            params['Stressors'] = this.selectedStressor;
                            this.ergGPChemicalService.submitJob(params, lang.hitch(this, this.onERGGPComplete),
                                        lang.hitch(this, this.onERGGPStatusCallback));
                        }           
                    }
                    else{
                        domStyle.set("loadingrun", {
                                "display": 'inherit',
                              });
                        this.maploading = new LoadingIndicator();
                        var t = document.getElementById("loadingrun");
                        this.maploading.placeAt(t);

                        params['CustomMetrics'] =this.selectedCustomMetrics;
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
                console.log('startup');

                //add CORS servers
                for (var key in this.config) {
                    if (this.config.hasOwnProperty(key)) {
                        if (this._isValidUrl(this.config[key])) {
                            var url = this._parseUrl(this.config[key]);
                            if (!this._itemExists(url.hostname, esri.config.defaults.io.corsEnabledServers)) {
                                esri.config.defaults.io.corsEnabledServers.push(url.hostname);
                                urlUtils.addProxyRule({
                                    urlPrefix: url.hostname,
                                    proxyUrl: "/dotNetProxy/proxy.ashx"
                                })                                
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
                            title: this.nls.tabDemo,
                            content: this.tabNode2
                        }
                        /*{
                            title: this.nls.tabFacilities,
                            content: this.tabNode3
                        }*/
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
                    CustomMetricsChoices[i] =this.config.custom[i];
                }
                this.CustomMetrics.addOption(CustomMetricsChoices);
                this.own(on(this.CustomMetrics, "change", lang.hitch(this, this.onChangeCustomMetrics)));

                document.getElementById("btn-upload").onchange = function() {
                    //document.getElementById("form").submit();
                };

                document.getElementById("form").onsubmit = function() {
                    //do something with value
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
                if (this.chartLayer) {
                    this.map.removeLayer(this.chartLayer);
                    this.chartLayer = null;
                }

                if (this.facilitiesGraphicsLayer) {
                    this.map.removeLayer(this.facilitiesGraphicsLayer);
                    this.facilitiesGraphicsLayer = null;
                }
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

            _clear: function () {
                this._clearCharts();
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