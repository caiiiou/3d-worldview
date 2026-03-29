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

    // -- Loading progress --
    document.body.classList.add('loading');
    var _loadingCleared = false;
    var _globeReady = false;
    var _tilesetReady = false;
    var domLoadBar = document.getElementById('load-bar');
    var _peakRemaining = 1;

    function clearLoading() {
        if (_loadingCleared) return;
        _loadingCleared = true;
        domLoadBar.style.width = '100%';
        setTimeout(function() {
            domLoadBar.classList.add('done');
            document.body.classList.remove('loading');
        }, 400);
    }
    function checkReady() {
        if (_globeReady && _tilesetReady) clearLoading();
    }

    viewer.scene.globe.tileLoadProgressEvent.addEventListener(function(remaining) {
        if (remaining > _peakRemaining) _peakRemaining = remaining;
        if (!_loadingCleared) {
            var globePct = (1 - remaining / _peakRemaining) * 65;
            var tilesPct = _tilesetReady ? 20 : 0;
            domLoadBar.style.width = Math.min(95, 10 + globePct + tilesPct) + '%';
        }
        if (remaining === 0) { _globeReady = true; checkReady(); }
    });

    setTimeout(function() { if (_globeReady && !_loadingCleared) clearLoading(); }, 3500);
    setTimeout(clearLoading, 5000);

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
        _tilesetReady = true;
        checkReady();
        viewer.scene.requestRender();
    }).catch(function(e) {
        console.log('3D Tiles:', e.message);
        _tilesetReady = true;
        checkReady();
    });

    // -- Cached DOM refs --
    var domRecTime = document.getElementById('rec-time');
    var domEdgeTime = document.getElementById('edge-time-l');

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
        if (!hudVisible) return;
        var now = new Date();
        var ts = now.getFullYear() + '-' + pad2(now.getMonth()+1) + '-' + pad2(now.getDate()) + ' ' +
                 pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds()) + ' ' + tzAbbr;
        domRecTime.textContent = ts;
        domEdgeTime.textContent = ts.substring(11);
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
        if (!hudVisible) return;
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

    // -- GPU Post-Process Shaders --
    var crtShader = new Cesium.PostProcessStage({
        fragmentShader: [
            'uniform sampler2D colorTexture;',
            'uniform vec2 colorTextureDimensions;',
            'in vec2 v_textureCoordinates;',
            'void main() {',
            '  vec4 c = texture(colorTexture, v_textureCoordinates);',
            '  float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114));',
            '  vec3 desat = mix(vec3(gray), c.rgb, 0.6);',
            '  desat = (desat - 0.5) * 1.25 + 0.5;',
            '  desat *= 0.85;',
            '  float scanline = sin(v_textureCoordinates.y * colorTextureDimensions.y * 1.5) * 0.04;',
            '  desat -= scanline;',
            '  desat = vec3(desat.r * 1.2, desat.g * 0.9, desat.b * 0.4);',
            '  out_FragColor = vec4(clamp(desat, 0.0, 1.0), 1.0);',
            '}',
        ].join('\n')
    });

    var nvShader = new Cesium.PostProcessStage({
        fragmentShader: [
            'uniform sampler2D colorTexture;',
            'uniform vec2 colorTextureDimensions;',
            'in vec2 v_textureCoordinates;',
            'void main() {',
            '  vec4 c = texture(colorTexture, v_textureCoordinates);',
            '  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));',
            '  lum = pow(lum, 0.8) * 1.2;',
            '  lum = clamp((lum - 0.5) * 1.3 + 0.5, 0.0, 1.0);',
            '  lum *= 0.85;',
            '  float scanline = sin(v_textureCoordinates.y * colorTextureDimensions.y * 0.8) * 0.025;',
            '  float noise = fract(sin(dot(v_textureCoordinates * czm_frameNumber * 0.01, vec2(12.9898, 78.233))) * 43758.5453) * 0.04;',
            '  lum = lum - scanline + noise;',
            '  out_FragColor = vec4(lum * 0.12, lum * 0.9, lum * 0.1, 1.0);',
            '}',
        ].join('\n')
    });

    var flirShader = new Cesium.PostProcessStage({
        fragmentShader: [
            'uniform sampler2D colorTexture;',
            'in vec2 v_textureCoordinates;',
            'void main() {',
            '  vec4 c = texture(colorTexture, v_textureCoordinates);',
            '  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));',
            '  lum = clamp((lum - 0.5) * 1.6 + 0.5, 0.0, 1.0) * 1.05;',
            '  vec3 cold = vec3(0.0, 0.0, 0.5);',
            '  vec3 mid = vec3(1.0, 0.55, 0.0);',
            '  vec3 hot = vec3(1.0, 1.0, 0.2);',
            '  vec3 col = lum < 0.5 ? mix(cold, mid, lum * 2.0) : mix(mid, hot, (lum - 0.5) * 2.0);',
            '  out_FragColor = vec4(col, 1.0);',
            '}',
        ].join('\n')
    });

    crtShader.enabled = false;
    nvShader.enabled = false;
    flirShader.enabled = false;
    viewer.scene.postProcessStages.add(crtShader);
    viewer.scene.postProcessStages.add(nvShader);
    viewer.scene.postProcessStages.add(flirShader);

    var domModeLabel = document.getElementById('mode-label');
    var domActiveStyle = document.getElementById('active-style-name');
    var styleButtons = document.querySelectorAll('.style-btn');

    var shaderMap = {
        crt: crtShader,
        nightvision: nvShader,
        flir: flirShader,
    };

    var modeNames = {
        normal: 'NORMAL',
        crt: 'CRT',
        nightvision: 'NIGHT VISION',
        flir: 'FLIR',
    };

    var _currentMode = 'normal';
    function setVisionMode(mode) {
        document.body.classList.remove('mode-' + _currentMode);
        document.body.classList.add('mode-' + mode);
        _currentMode = mode;
        for (var i = 0; i < styleButtons.length; i++) {
            var b = styleButtons[i];
            b.classList.remove('active', 'pulse');
            if (b.dataset.mode === mode) {
                b.classList.add('active');
                void b.offsetWidth;
                b.classList.add('pulse');
            }
        }
        var name = modeNames[mode] || mode.toUpperCase();
        domModeLabel.textContent = name;
        domActiveStyle.textContent = name;
        var keys = Object.keys(shaderMap);
        for (var j = 0; j < keys.length; j++) {
            shaderMap[keys[j]].enabled = (keys[j] === mode);
        }
        viewer.scene.requestRender();
    }

    for (var si = 0; si < styleButtons.length; si++) {
        styleButtons[si].addEventListener('click', function() {
            setVisionMode(this.dataset.mode);
        });
    }

    // -- Keyboard shortcuts --
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            if (e.key === 'Escape') { e.target.blur(); }
            return;
        }
        switch(e.key) {
            case '1': setVisionMode('normal'); break;
            case '2': setVisionMode('crt'); break;
            case '3': setVisionMode('nightvision'); break;
            case '4': setVisionMode('flir'); break;
            case 'Enter': toggleLocPanel(); break;
            case 'Tab': e.preventDefault(); toggleHUD(); break;
            case ' ':
                if (domLocPanel.classList.contains('collapsed')) toggleLocPanel();
                locInput.focus();
                e.preventDefault();
                break;
        }
    });

    // -- Location search --
    // [lon, lat, range, type, country]
    var locations = {
        // US Cities (alphabetical)
        'chicago': [-87.63434, 41.88219, 2400, 'city', 'US'],
        'houston': [-95.36456, 29.75830, 1500, 'city', 'US'],
        'las vegas': [-115.15997, 36.13531, 3000, 'city', 'US', 42.8],
        'los angeles': [-118.26114, 34.04506, 1500, 'city', 'US'],
        'miami': [-80.1918, 25.7617, 1500, 'city', 'US'],
        'new york': [-74.01130, 40.70785, 1500, 'city', 'US'],
        'san francisco': [-122.39820, 37.79002, 1200, 'city', 'US'],
        'seattle': [-122.33503, 47.61030, 1500, 'city', 'US'],
        'washington dc': [-77.0369, 38.9072, 1200, 'city', 'US'],
        // US Landmarks (alphabetical)
        'alcatraz': [-122.4229, 37.8267, 800, 'landmark', 'US'],
        'central park': [-73.9654, 40.7829, 2000, 'landmark', 'US'],
        'golden gate bridge': [-122.4786, 37.8199, 1800, 'landmark', 'US'],
        'hoover dam': [-114.7377, 36.0160, 1500, 'landmark', 'US'],
        'pentagon': [-77.05672, 38.86939, 900, 'landmark', 'US'],
        'space needle': [-122.3493, 47.6205, 600, 'landmark', 'US'],
        'statue of liberty': [-74.04353, 40.68949, 600, 'landmark', 'US', 285],
        'washington monument': [-77.0353, 38.8895, 800, 'landmark', 'US'],
        'white house': [-77.03690, 38.89689, 250, 'landmark', 'US'],
    };

    var countryNames = { 'US': 'UNITED STATES' };

    var countryNames = { 'US': 'UNITED STATES' };

    // -- Build location tags grouped by country --
    (function() {
        var landmarkEl = document.getElementById('loc-landmarks');
        var cityEl = document.getElementById('loc-cities');
        var countryOrder = ['US'];
        var _activeTag = null;
        function makeTag(key, loc) {
            var btn = document.createElement('button');
            btn.className = 'loc-tag' + (loc[3] === 'landmark' ? ' landmark' : ' city');
            btn.textContent = key.toUpperCase();
            btn.addEventListener('click', function() {
                if (_activeTag) _activeTag.classList.remove('active');
                btn.classList.add('active');
                _activeTag = btn;
                flyToLocation(key);
            });
            return btn;
        }
        function buildGroup(parentEl, type) {
            var grouped = {};
            Object.keys(locations).forEach(function(key) {
                var loc = locations[key];
                if (loc[3] !== type) return;
                var c = loc[4];
                if (!grouped[c]) grouped[c] = [];
                grouped[c].push(key);
            });
            countryOrder.forEach(function(c) {
                if (!grouped[c]) return;
                var label = document.createElement('div');
                label.className = 'loc-country-label';
                label.textContent = countryNames[c] || c;
                parentEl.appendChild(label);
                var tags = document.createElement('div');
                tags.className = 'loc-tags';
                grouped[c].forEach(function(key) {
                    tags.appendChild(makeTag(key, locations[key]));
                });
                parentEl.appendChild(tags);
            });
        }
        buildGroup(landmarkEl, 'landmark');
        buildGroup(cityEl, 'city');
    })();

    function flyToTarget(lon, lat, range, label, type, headingDeg) {
        var isLandmark = type === 'landmark';
        var targetAlt = isLandmark ? range * 0.08 : 0;
        var target = Cesium.Cartesian3.fromDegrees(lon, lat, targetAlt);
        var heading = Cesium.Math.toRadians(headingDeg != null ? headingDeg : 30);
        var pitch = Cesium.Math.toRadians(isLandmark ? -22 : -25);
        var sphereRadius = isLandmark ? Math.max(range * 0.05, 20) : 10;
        viewer.camera.flyToBoundingSphere(
            new Cesium.BoundingSphere(target, sphereRadius),
            {
                offset: new Cesium.HeadingPitchRange(heading, pitch, range),
                duration: 2.5,
                easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
            }
        );
        document.getElementById('loc-name').textContent = label.toUpperCase();
        document.getElementById('loc-landmark').textContent = type === 'landmark' ? 'LANDMARK' : 'CITY';
        document.getElementById('summary-text').textContent = 'TARGET: ' + label.toUpperCase();
    }

    function flyToLocation(name) {
        var q = name || document.getElementById('loc-input').value.toLowerCase().trim();
        if (!q) return;
        var match = locations[q];
        if (match) {
            flyToTarget(match[0], match[1], match[2], q, match[3], match[5]);
            return;
        }
        var keys = Object.keys(locations);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].indexOf(q) !== -1) {
                flyToLocation(keys[i]);
                return;
            }
        }
    }
    (window as any).flyToLocation = flyToLocation;

    var locInput = document.getElementById('loc-input');
    var acDropdown = document.getElementById('loc-autocomplete');
    var acSelectedIdx = -1;

    locInput.addEventListener('keydown', function(e) {
        var items = acDropdown.querySelectorAll('.loc-ac-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            acSelectedIdx = Math.min(acSelectedIdx + 1, items.length - 1);
            updateAcSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            acSelectedIdx = Math.max(acSelectedIdx - 1, -1);
            updateAcSelection(items);
        } else if (e.key === 'Enter') {
            if (acSelectedIdx >= 0 && items[acSelectedIdx]) {
                items[acSelectedIdx].click();
            } else {
                hideAutocomplete();
                flyToLocation();
            }
        } else if (e.key === 'Escape') {
            hideAutocomplete();
        }
    });

    var _acTimer = null;
    locInput.addEventListener('input', function() {
        var self = this;
        clearTimeout(_acTimer);
        _acTimer = setTimeout(function() {
            var q = self.value.toLowerCase().trim();
            if (q.length < 1) { hideAutocomplete(); return; }
            var matches = [];
            var keys = Object.keys(locations);
            for (var i = 0; i < keys.length; i++) {
                if (keys[i].indexOf(q) !== -1) {
                    var loc = locations[keys[i]];
                    matches.push({ name: keys[i], type: loc[3], country: loc[4] });
                }
            }
            if (matches.length === 0) { hideAutocomplete(); return; }
            acDropdown.innerHTML = '';
            acSelectedIdx = -1;
            for (var j = 0; j < matches.length; j++) {
                (function(m, idx) {
                    var div = document.createElement('div');
                    div.className = 'loc-ac-item';
                    var typeLabel = m.type === 'landmark' ? 'LANDMARK' : 'CITY';
                    div.innerHTML = m.name.toUpperCase() + '<span class="ac-type">' + typeLabel + ' / ' + (countryNames[m.country] || m.country) + '</span>';
                    div.addEventListener('click', function() {
                        locInput.value = m.name;
                        hideAutocomplete();
                        flyToLocation(m.name);
                    });
                    div.addEventListener('mouseenter', function() {
                        acSelectedIdx = idx;
                        updateAcSelection(acDropdown.querySelectorAll('.loc-ac-item'));
                    });
                    acDropdown.appendChild(div);
                })(matches[j], j);
            }
            acDropdown.style.display = 'block';
        }, 60);
    });

    locInput.addEventListener('blur', function() {
        setTimeout(hideAutocomplete, 150);
    });

    function hideAutocomplete() {
        acDropdown.style.display = 'none';
        acSelectedIdx = -1;
    }

    function updateAcSelection(items) {
        items.forEach(function(el, i) {
            el.classList.toggle('selected', i === acSelectedIdx);
        });
    }

    var domLocPanel = document.getElementById('location-panel');
    var domLocToggle = document.getElementById('loc-toggle');

    function toggleLocPanel() {
        var wasCollapsed = domLocPanel.classList.contains('collapsed');
        domLocPanel.classList.toggle('collapsed');
        var nowCollapsed = domLocPanel.classList.contains('collapsed');
        domLocToggle.classList.toggle('collapsed', nowCollapsed);
        document.body.classList.toggle('loc-expanded', !nowCollapsed);
        if (wasCollapsed) {
            domLocToggle.classList.remove('expanding');
            void domLocToggle.offsetWidth;
            domLocToggle.classList.add('expanding');
        }
    }

    domLocToggle.addEventListener('click', toggleLocPanel);

    var domTopStack = document.getElementById('top-stack');
    var domLocWrapper = document.getElementById('loc-wrapper');
    var domCompass = document.getElementById('compass');
    var domHideBtn = document.getElementById('hide-ui-btn');
    var domEdgeTexts = document.querySelectorAll('.edge-text-left, .edge-text-right');
    var domHuds = document.querySelectorAll('.hud');

    var hudVisible = true;
    function toggleHUD() {
        hudVisible = !hudVisible;
        var hide = !hudVisible;
        for (var i = 0; i < domHuds.length; i++) {
            if (domHuds[i].id === 'hud-bottom') continue;
            domHuds[i].classList.toggle('hud-fade', hide);
        }
        domTopStack.classList.toggle('hud-hidden', hide);
        domLocWrapper.classList.toggle('ui-hidden', hide);
        domCompass.classList.toggle('ui-hidden', hide);
        for (var j = 0; j < domEdgeTexts.length; j++) {
            domEdgeTexts[j].classList.toggle('ui-hidden', hide);
        }
        domHideBtn.innerHTML = 'HUD ' + (hudVisible ? '\u25BC' : '\u25B2') + '<span class="enter-hint">TAB</span>';
    }

    domHideBtn.addEventListener('click', toggleHUD);

}

init();
