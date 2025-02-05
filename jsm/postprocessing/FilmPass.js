import {
    ShaderMaterial,
    UniformsUtils
} from '../../../build/v3d.module.js';
import { Pass, FullScreenQuad } from '../postprocessing/Pass.js';
import { FilmShader } from '../shaders/FilmShader.js';

class FilmPass extends Pass {

    constructor(noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale) {

        super();

        if (FilmShader === undefined) console.error('v3d.FilmPass relies on FilmShader');

        const shader = FilmShader;

        this.uniforms = UniformsUtils.clone(shader.uniforms);

        this.material = new ShaderMaterial({

            uniforms: this.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader

        });

        if (grayscale !== undefined)    this.uniforms.grayscale.value = grayscale;
        if (noiseIntensity !== undefined) this.uniforms.nIntensity.value = noiseIntensity;
        if (scanlinesIntensity !== undefined) this.uniforms.sIntensity.value = scanlinesIntensity;
        if (scanlinesCount !== undefined) this.uniforms.sCount.value = scanlinesCount;

        this.fsQuad = new FullScreenQuad(this.material);

    }

    render(renderer, writeBuffer, readBuffer, deltaTime /*, maskActive */) {

        this.uniforms['tDiffuse'].value = readBuffer.texture;
        this.uniforms['time'].value += deltaTime;

        if (this.renderToScreen) {

            renderer.setRenderTarget(null);
            this.fsQuad.render(renderer);

        } else {

            renderer.setRenderTarget(writeBuffer);
            if (this.clear) renderer.clear();
            this.fsQuad.render(renderer);

        }

    }

}

export { FilmPass };
