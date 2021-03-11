/*****************************************************************************
 * FILE:    GGST Region Map
 * DATE:    8 March 2021
 * AUTHOR: Sarva Pulla
 * COPYRIGHT: (c) Brigham Young University 2021
 * LICENSE: BSD 2-Clause
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/

var LIBRARY_OBJECT = (function() {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library

    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
    var contourGroup,
        contourLayer,
        contourTimeLayer,
        drawnItems,
        graceGroup,
        globalCoords,
        interaction_type,
        layer_control,
        map,
        map_lat,
        map_lon,
        overlay_maps,
        public_interface,
        range_min,
        range_max,
        region_name,
        $selectSignalProcess,
        $selectLayer,
        $selectStorageType,
        tdWmsLayer,
        wms_legend,
        wms_url,
        wmsLayer;



    /************************************************************************
     *                    PRIVATE FUNCTION DECLARATIONS
     *************************************************************************/

    var add_wms,
        get_dropdown_vals,
        get_legend_range,
        get_region_center,
        init_all,
        init_jquery,
        init_map,
        reset_alert;


    /************************************************************************
     *                    PRIVATE FUNCTION IMPLEMENTATIONS
     *************************************************************************/

    init_jquery = function(){
        $selectSignalProcess = $("#select-signal-process");
        $selectLayer = $("#select-layer");
        $selectStorageType = $("#select-storage-type");
        wms_url = $("#map-info").attr("wms-url");
        map_lat = $("#map-info").attr("map-lat");
        map_lon = $("#map-info").attr("map-lon");
        region_name = $("#map-info").attr("region-name");
    };

    //Reset the alerts if everything is going well
    reset_alert = function(){
        $("#message").addClass('hidden');
        $("#message").empty()
            .addClass('hidden')
            .removeClass('alert-success')
            .removeClass('alert-info')
            .removeClass('alert-warning')
            .removeClass('alert-danger');
    };

    init_map = function(){
        map = L.map('map', {
            zoom: 6,
            center: [map_lat, map_lon],
            // crs: L.CRS.EPSG3857
        });
        wms_legend = L.control({
            position: 'bottomright'
        });
        var Esri_WorldStreetMap = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    'Tiles &copy; Esri 2012 <a href="https://leaflet-extras.github.io/leaflet-providers/preview/">See Here</a>'
            }
        )

        var Esri_WorldImagery = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    'Tiles &copy; Esri 2012 <a href="https://leaflet-extras.github.io/leaflet-providers/preview/">See Here</a>'
            }
        )
        var baseLayers = {
            "ESRI_World_Imagery": Esri_WorldImagery,
            "ESRI World Street Map": Esri_WorldStreetMap
        }

        wms_legend.onAdd = function(map) {
            // var src = "?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&LAYER=significant_wave_height&colorscalerange=0,3&PALETTE=scb_bugnylorrd&numcolorbands=100&transparent=TRUE";
            var legend_div = L.DomUtil.create('div', 'info legend lcontrol hidden');
            legend_div.innerHTML +=
                '<img src="" id="legend-image" alt="Legend">';
            return legend_div;
        };
        wms_legend.addTo(map);

        map.timeDimension = new L.TimeDimension();

        var player  = new L.TimeDimension.Player({
            loop: true,
            startOver:true
        }, map.timeDimension);

        var timeDimensionControlOptions = {
            player:        player,
            timeDimension: map.timeDimension,
            position:      'bottomleft',
            autoPlay:      false,
            minSpeed:      1,
            speedStep:     0.5,
            maxSpeed:      20,
            timeSliderDragUpdate: true,
            loopButton:true,
            limitSliders:true
        };

        var timeDimensionControl = new L.Control.TimeDimension(timeDimensionControlOptions);
        map.addControl(timeDimensionControl);

        graceGroup = L.layerGroup().addTo(map);
        contourGroup = L.layerGroup().addTo(map);

        var min_input = L.control({position: 'topleft'});
        min_input.onAdd = function(map){
            var div = L.DomUtil.create('div', 'min_input lcontrol hidden');
            div.innerHTML = '<b>Min:</b><input type="number" class="form-control input-sm" name="leg_min" id="leg_min" min="-5000" max="5000" step="10" value="-500" disabled>';
            return div;
        };
        min_input.addTo(map);

        var max_input = L.control({position: 'topleft'});
        max_input.onAdd = function(map){
            var div = L.DomUtil.create('div', 'max_input lcontrol hidden');
            div.innerHTML = '<b>Max:</b><input type="number" class="form-control input-sm" name="leg_max" id="leg_max" ' +
                'min="-5000" max="5000" step="10" value="0" disabled>';
            return div;
        };
        max_input.addTo(map);

        var opacity_input = L.control({position: 'topright'});
        opacity_input.onAdd = function(map){
            var div = L.DomUtil.create('div', 'opacity_input lcontrol');
            div.innerHTML = '<b>Opacity:</b><input type="number" class="form-control input-sm" name="opacity" id="opacity_val" ' +
                'min="0" max="1" step="0.1" value="1.0">';
            return div;
        };
        opacity_input.addTo(map);

        overlay_maps = {
            "GRACE Layer": graceGroup,
            "Contours": contourGroup
        };

        layer_control = L.control.layers(baseLayers, overlay_maps).addTo(map);
        baseLayers.ESRI_World_Imagery.addTo(map);

        drawnItems = new L.FeatureGroup()
        map.addLayer(drawnItems)

        var drawControlFull = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems,
                edit: false
            },
            draw: {
                polyline: false,
                circlemarker: false,
                rectangle: false,
                circle: false,
                polygon: false
            }
        })

        map.addControl(drawControlFull)

        map.on("draw:drawstart ", function(e) {
            drawnItems.clearLayers()
        })

        map.on("draw:created", function(e) {
            var layer = e.layer
            layer.addTo(drawnItems)

            var feature = drawnItems.toGeoJSON();
            var int_type = feature.features[0].geometry.type
            interaction_type = int_type

            var coords = feature["features"][0]["geometry"]["coordinates"]
            globalCoords = coords
            get_ts(globalCoords);
        })

        map.on("draw:edited", function(e) {
            var feature = drawnItems.toGeoJSON()
            var int_type = feature.features[0].geometry.type
            interaction_type = int_type

            var coords = feature["features"][0]["geometry"]["coordinates"]
            globalCoords = coords
            get_ts(globalCoords);
        })

        map.on("fullscreenchange", function() {
            if (map.isFullscreen()) {
                map.setView(0.0, 15.0)
            } else {
                map.setView(0.0, 15.0)
            }
        })
    }

    get_dropdown_vals = function(){
        let signal_process = $selectSignalProcess.val();
        let layer_val = $selectLayer.val();
        let storage_type = $selectStorageType.val();
        let region = $("#region-select option:selected").val();
        return {signal_process,
            layer_val,
            storage_type,
            region};
    };

    get_region_center = function(region){
        const xhr = ajax_update_database('map-center', {'region': region});
        xhr.done(function(result){
            if('success' in result){
                map.setView(new L.LatLng(result['lat'], result['lon']), 6);
            }
        });
    };

    get_legend_range = function(region_name, signal_process, layer_val, storage_type, style){
        const xhr = ajax_update_database('range',
            {'region_name': region_name,
                'signal_process': signal_process,
                'storage_type': storage_type});
        xhr.done(function(result){
            if('success' in result){
                let wmsUrl = wms_url + region_name + '/'+ region_name +'_' + signal_process + '_' + storage_type + '.nc';
                let opacity = $("#opacity_val").val();
                range_min = result['range_min'];
                range_max = result['range_max'];
                let layer_arr = layer_val.toString().split("|");
                let time_string = layer_arr[0]
                contourLayer = L.tileLayer.wms(wmsUrl, {
                    layers: 'lwe_thickness',
                    format: 'image/png',
                    transparent: true,
                    styles: 'contour/'+style,
                    crs: L.CRS.EPSG4326,
                    opacity: opacity,
                    colorscalerange: [range_min, range_max],
                    version:'1.3.0',
                    zIndex: 10,
                    time: time_string
                });

                contourTimeLayer = L.timeDimension.layer.wms(contourLayer,{
                    // updateTimeDimension:true,
                    // setDefaultTime:true,
                    cache:48
                });

                wmsLayer = L.tileLayer.wms(wmsUrl, {
                    layers: 'lwe_thickness',
                    format: 'image/png',
                    transparent: true,
                    styles: 'boxfill/'+style,
                    opacity: 'opacity',
                    colorscalerange: [range_min, range_max],
                    version:'1.3.0',
                    zIndex:5,
                    time: time_string
                });

                tdWmsLayer = L.timeDimension.layer.wms(wmsLayer,{
                    // updateTimeDimension:true,
                    // setDefaultTime:true,
                    cache:48
                });
                // tdWmsLayer.addTo(map);
                // contourTimeLayer.addTo(map);
                graceGroup.addLayer(tdWmsLayer);
                contourGroup.addLayer(contourTimeLayer);
                contourTimeLayer.bringToFront();

                var src = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=lwe_thickness"+
                    "&colorscalerange="+range_min+","+range_max+"&PALETTE=boxfill/"+style+"&transparent=TRUE";
                $("#legend-image").attr("src", src);
                map.timeDimension.setCurrentTime(layer_arr[1]);
            }
        });
    };

    add_wms = function(region_name, signal_process, layer_val, storage_type, style){
        // map.removeLayer(tdWmsLayer);
        // map.removeLayer(contourTimeLayer);
        $('.lcontrol').removeClass('hidden');
        $('.leaflet-bar-timecontrol').removeClass('hidden');
        graceGroup.clearLayers();
        contourGroup.clearLayers();
        get_legend_range(region_name, signal_process, layer_val, storage_type, style);
    };


    init_all = function(){
        init_jquery();
        init_map();
    }
    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/
    /*
     * Library object that contains public facing functions of the package.
     * This is the object that is returned by the library wrapper function.
     * See below.
     * NOTE: The functions in the public interface have access to the private
     * functions of the library because of JavaScript function scope.
     */
    public_interface = {

    };

    /************************************************************************
     *                  INITIALIZATION / CONSTRUCTOR
     *************************************************************************/

    // Initialization: jQuery function that gets called when
    // the DOM tree finishes loading
    $(function() {
        init_all();
        $("#region-select").val(region_name).trigger('change');

        $("#region-select").change(function(){
            let {signal_process, layer_val, storage_type, region} = get_dropdown_vals();
            let symbology = $("#select-symbology option:selected").val();
            get_region_center(region);
            add_wms(region, signal_process, layer_val, storage_type, symbology);
        });
        $selectLayer.change(function(){
            let {signal_process, layer_val, storage_type, region} = get_dropdown_vals();
            let symbology = $("#select-symbology option:selected").val();
            add_wms(region, signal_process, layer_val, storage_type, symbology);
        });

        $selectSignalProcess.change(function(){
            let {signal_process, layer_val, storage_type, region} = get_dropdown_vals();
            let symbology = $("#select-symbology option:selected").val();
            add_wms(region, signal_process, layer_val, storage_type, symbology);
            if(globalCoords){
                get_ts(globalCoords);
            }
        });

        $selectStorageType.change(function(){
            let {signal_process, layer_val, storage_type, region} = get_dropdown_vals();
            let symbology = $("#select-symbology option:selected").val();
            add_wms(region, signal_process, layer_val, storage_type, symbology);
            if(globalCoords){
                get_ts(globalCoords);
            }
        });

        $("#select-symbology").change(function(){
            let {signal_process, layer_val, storage_type, region} = get_dropdown_vals();
            let symbology = $("#select-symbology option:selected").val();
            add_wms(region, signal_process, layer_val, storage_type, symbology);
        }).change();

        $("#opacity_val").change(function(){
            let opacity = $("#opacity_val").val();
            tdWmsLayer.setOpacity(opacity);
        });
    });

    return public_interface;

}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.