declare const Cesium: any;

function init() {
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZWY2M2E3Zi0wZTcyLTQ5OWItOTBhYi0yOTIwM2FhMzhhYzQiLCJpZCI6NDEzNDg4LCJpYXQiOjE3NzUyNTA0MDJ9.u0SDRIgFDNncldyXGrHcfe1MeUngVQGtINu6eFNHVZ4';

    var viewer = new Cesium.Viewer('cesiumContainer', {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        animation: false, timeline: false,
        baseLayerPicker: false, geocoder: false,
        homeButton: false, sceneModePicker: false,
        navigationHelpButton: false, fullscreenButton: false,
        infoBox: false, selectionIndicator: false,
    });
    viewer.scene.morphTo3D(0);

    viewer.scene.fog.enabled = false;
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.highDynamicRange = false;
    viewer.scene.fxaa = false;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.skyBox.show = false;
    viewer.scene.sun.show = false;
    viewer.scene.moon.show = false;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0e14');

    // Start at Tokyo (Shibuya area)
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(139.88940, 35.62459, 180),
        orientation: { heading: Cesium.Math.toRadians(295), pitch: Cesium.Math.toRadians(-16), roll: 0 },
    });

    // 3D Tiles
    var tileset3d = null;
    Cesium.Cesium3DTileset.fromIonAssetId(2275207, {
    }).then(function(t) {
        tileset3d = t;
        viewer.scene.primitives.add(t);
        viewer.scene.requestRender();
    }).catch(function(e) {
        console.log('3D Tiles:', e.message);
    });

    // -- Cached DOM refs --
    var domRecTime = document.getElementById('rec-time');

    // -- Clock (user local timezone) --
    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    var tzAbbr = (function() {
        try {
            var m = new Date().toString().match(/\(([^)]+)\)$/);
            if (m) { return m[1].split(' ').map(function(w){return w[0];}).join(''); }
        } catch(e) {}
        return 'LOC';
    })();
    function updateClock() {
        var now = new Date();
        var ts = now.getFullYear() + '-' + pad2(now.getMonth()+1) + '-' + pad2(now.getDate()) + ' ' +
                 pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds()) + ' ' + tzAbbr;
        domRecTime.textContent = ts;
    }
    updateClock();
    setInterval(updateClock, 1000);

    var domDms = document.getElementById('coord-dms');
    var domMgrs = document.getElementById('coord-mgrs');
    var domAlt = document.getElementById('coord-alt');
    var domHdg = document.getElementById('coord-speed');

    // -- Coordinates --
    function toDMS(deg) {
        var a = Math.abs(deg);
        var d = Math.floor(a);
        var mf = (a - d) * 60;
        var m = Math.floor(mf);
        var s = ((mf - m) * 60).toFixed(2);
        return d + '\u00B0' + String(m).padStart(2,'0') + "'" + String(s).padStart(5,'0') + '"';
    }

    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    var _moveRaf = 0;
    var _pendingPos = null;
    function updateCoords() {
        _moveRaf = 0;
        var pos = _pendingPos;
        if (!pos) return;
        var ray = viewer.camera.getPickRay(pos);
        var cart = viewer.scene.globe.pick(ray, viewer.scene);
        if (cart) {
            var c = Cesium.Cartographic.fromCartesian(cart);
            var lat = Cesium.Math.toDegrees(c.latitude);
            var lon = Cesium.Math.toDegrees(c.longitude);
            domDms.textContent = toDMS(lat) + (lat >= 0 ? 'N' : 'S') + ' ' + toDMS(lon) + (lon >= 0 ? 'E' : 'W');
            var zone = Math.floor((lon + 180) / 6) + 1;
            var band = 'CDEFGHJKLMNPQRSTUVWX'[Math.floor((lat + 80) / 8)] || 'Z';
            domMgrs.textContent =
                zone + band + ' ' + Math.abs(Math.floor(lon * 1000) % 10000).toString().padStart(4,'0') + ' ' +
                Math.abs(Math.floor(lat * 1000) % 10000).toString().padStart(4,'0');
        }
        var camC = viewer.camera.positionCartographic;
        domAlt.textContent = 'ALT: ' + (camC.height / 1000).toFixed(1) + ' KM';
        domHdg.textContent = 'HDG: ' + Cesium.Math.toDegrees(viewer.camera.heading).toFixed(1) + '\u00B0';
    }
    handler.setInputAction(function(mov) {
        _pendingPos = mov.endPosition;
        if (!_moveRaf) _moveRaf = requestAnimationFrame(updateCoords);
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    var domNeedle = document.getElementById('compass-needle');
    var domSummary = document.getElementById('summary-text');

    // -- Compass --
    var _lastHeading = -1;
    viewer.camera.changed.addEventListener(function() {
        var h = Cesium.Math.toDegrees(viewer.camera.heading);
        if (Math.abs(h - _lastHeading) >= 0.1) {
            _lastHeading = h;
            domNeedle.setAttribute('transform', 'rotate(' + h + ' 25 25)');
        }
    });
    viewer.camera.moveEnd.addEventListener(function() {
        var c = viewer.camera.positionCartographic;
        domSummary.textContent = 'OBSERVING ' + Cesium.Math.toDegrees(c.latitude).toFixed(2) + ', ' + Cesium.Math.toDegrees(c.longitude).toFixed(2);
    });

}

init();
