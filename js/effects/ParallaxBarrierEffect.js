(function() {

    class ParallaxBarrierEffect {

        constructor(renderer) {

            const _camera = new v3d.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);

            const _scene = new v3d.Scene();

            const _stereo = new v3d.StereoCamera();

            const _params = {
                minFilter: v3d.LinearFilter,
                magFilter: v3d.NearestFilter,
                format: v3d.RGBAFormat
            };

            const _renderTargetL = new v3d.WebGLRenderTarget(512, 512, _params);

            const _renderTargetR = new v3d.WebGLRenderTarget(512, 512, _params);

            const _material = new v3d.ShaderMaterial({
                uniforms: {
                    'mapLeft': {
                        value: _renderTargetL.texture
                    },
                    'mapRight': {
                        value: _renderTargetR.texture
                    }
                },
                vertexShader: ['varying vec2 vUv;', 'void main() {', '    vUv = vec2(uv.x, uv.y);', '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);', '}'].join('\n'),
                fragmentShader: ['uniform sampler2D mapLeft;', 'uniform sampler2D mapRight;', 'varying vec2 vUv;', 'void main() {', '    vec2 uv = vUv;', '    if ((mod(gl_FragCoord.y, 2.0)) > 1.00) {', '        gl_FragColor = texture2D(mapLeft, uv);', '    } else {', '        gl_FragColor = texture2D(mapRight, uv);', '    }', '}'].join('\n')
            });

            const mesh = new v3d.Mesh(new v3d.PlaneGeometry(2, 2), _material);

            _scene.add(mesh);

            this.setSize = function(width, height) {

                renderer.setSize(width, height);
                const pixelRatio = renderer.getPixelRatio();

                _renderTargetL.setSize(width * pixelRatio, height * pixelRatio);

                _renderTargetR.setSize(width * pixelRatio, height * pixelRatio);

            };

            this.render = function(scene, camera) {

                scene.updateMatrixWorld();
                if (camera.parent === null) camera.updateMatrixWorld();

                _stereo.update(camera);

                renderer.setRenderTarget(_renderTargetL);
                renderer.clear();
                renderer.render(scene, _stereo.cameraL);
                renderer.setRenderTarget(_renderTargetR);
                renderer.clear();
                renderer.render(scene, _stereo.cameraR);
                renderer.setRenderTarget(null);
                renderer.render(_scene, _camera);

            };

        }

    }

    v3d.ParallaxBarrierEffect = ParallaxBarrierEffect;

})();
