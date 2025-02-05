(function() {

    class CubeTexturePass extends v3d.Pass {

        constructor(camera, envMap, opacity = 1) {

            super();
            this.camera = camera;
            this.needsSwap = false;
            this.cubeShader = v3d.ShaderLib['cube'];
            this.cubeMesh = new v3d.Mesh(new v3d.BoxGeometry(10, 10, 10), new v3d.ShaderMaterial({
                uniforms: v3d.UniformsUtils.clone(this.cubeShader.uniforms),
                vertexShader: this.cubeShader.vertexShader,
                fragmentShader: this.cubeShader.fragmentShader,
                depthTest: false,
                depthWrite: false,
                side: v3d.BackSide
            }));
            Object.defineProperty(this.cubeMesh.material, 'envMap', {
                get: function() {

                    return this.uniforms.envMap.value;

                }
            });
            this.envMap = envMap;
            this.opacity = opacity;
            this.cubeScene = new v3d.Scene();
            this.cubeCamera = new v3d.PerspectiveCamera();
            this.cubeScene.add(this.cubeMesh);

        }

        render(renderer, writeBuffer, readBuffer
            /*, deltaTime, maskActive*/
        ) {

            const oldAutoClear = renderer.autoClear;
            renderer.autoClear = false;
            this.cubeCamera.projectionMatrix.copy(this.camera.projectionMatrix);
            this.cubeCamera.quaternion.setFromRotationMatrix(this.camera.matrixWorld);
            this.cubeMesh.material.uniforms.envMap.value = this.envMap;
            this.cubeMesh.material.uniforms.flipEnvMap.value = this.envMap.isCubeTexture && this.envMap._needsFlipEnvMap ? - 1 : 1;
            this.cubeMesh.material.uniforms.opacity.value = this.opacity;
            this.cubeMesh.material.transparent = this.opacity < 1.0;
            renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
            if (this.clear) renderer.clear();
            renderer.render(this.cubeScene, this.cubeCamera);
            renderer.autoClear = oldAutoClear;

        }

    }

    v3d.CubeTexturePass = CubeTexturePass;

})();
