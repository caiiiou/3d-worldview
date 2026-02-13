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

}

init();
