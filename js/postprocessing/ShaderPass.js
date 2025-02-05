(function() {

    class ShaderPass extends v3d.Pass {

        constructor(shader, textureID) {

            super();
            this.textureID = textureID !== undefined ? textureID : 'tDiffuse';

            if (shader instanceof v3d.ShaderMaterial) {

                this.uniforms = shader.uniforms;
                this.material = shader;

            } else if (shader) {

                this.uniforms = v3d.UniformsUtils.clone(shader.uniforms);
                this.material = new v3d.ShaderMaterial({
                    defines: Object.assign({}, shader.defines),
                    uniforms: this.uniforms,
                    vertexShader: shader.vertexShader,
                    fragmentShader: shader.fragmentShader
                });

            }

            this.fsQuad = new v3d.FullScreenQuad(this.material);

        }

        render(renderer, writeBuffer, readBuffer
            /*, deltaTime, maskActive */
        ) {

            if (this.uniforms[this.textureID]) {

                this.uniforms[this.textureID].value = readBuffer.texture;

            }

            this.fsQuad.material = this.material;

            if (this.renderToScreen) {

                renderer.setRenderTarget(null);
                this.fsQuad.render(renderer);

            } else {

                renderer.setRenderTarget(writeBuffer); // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600

                if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
                this.fsQuad.render(renderer);

            }

        }

    }

    v3d.ShaderPass = ShaderPass;

})();
