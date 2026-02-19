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

}

init();
