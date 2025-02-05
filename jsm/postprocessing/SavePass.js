import {
    LinearFilter,
    RGBFormat,
    ShaderMaterial,
    UniformsUtils,
    WebGLRenderTarget
} from '../../../build/v3d.module.js';
import { Pass, FullScreenQuad } from '../postprocessing/Pass.js';
import { CopyShader } from '../shaders/CopyShader.js';

class SavePass extends Pass {

    constructor(renderTarget) {

        super();

        if (CopyShader === undefined) console.error('v3d.SavePass relies on CopyShader');

        const shader = CopyShader;

        this.textureID = 'tDiffuse';

        this.uniforms = UniformsUtils.clone(shader.uniforms);

        this.material = new ShaderMaterial({

            uniforms: this.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader

        });

        this.renderTarget = renderTarget;

        if (this.renderTarget === undefined) {

            this.renderTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat });
            this.renderTarget.texture.name = 'SavePass.rt';

        }

        this.needsSwap = false;

        this.fsQuad = new FullScreenQuad(this.material);

    }

    render(renderer, writeBuffer, readBuffer/*, deltaTime, maskActive */) {

        if (this.uniforms[this.textureID]) {

            this.uniforms[this.textureID].value = readBuffer.texture;

        }

        renderer.setRenderTarget(this.renderTarget);
        if (this.clear) renderer.clear();
        this.fsQuad.render(renderer);

    }

}

export { SavePass };
