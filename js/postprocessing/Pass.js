(function() {

    class Pass {

        constructor() {

            // if set to true, the pass is processed by the composer
            this.enabled = true; // if set to true, the pass indicates to swap read and write buffer after rendering

            this.needsSwap = true; // if set to true, the pass clears its buffer before rendering

            this.clear = false; // if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.

            this.renderToScreen = false;

        }

        setSize() {}

        render() {

            console.error('v3d.Pass: .render() must be implemented in derived pass.');

        }

    } // Helper for passes that need to fill the viewport with a single quad.


    const _camera = new v3d.OrthographicCamera(- 1, 1, 1, - 1, 0, 1); // https://github.com/mrdoob/three.js/pull/21358


    const _geometry = new v3d.BufferGeometry();

    _geometry.setAttribute('position', new v3d.Float32BufferAttribute([- 1, 3, 0, - 1, - 1, 0, 3, - 1, 0], 3));

    _geometry.setAttribute('uv', new v3d.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));

    class FullScreenQuad {

        constructor(material) {

            this._mesh = new v3d.Mesh(_geometry, material);

        }

        dispose() {

            this._mesh.geometry.dispose();

        }

        render(renderer) {

            renderer.render(this._mesh, _camera);

        }

        get material() {

            return this._mesh.material;

        }

        set material(value) {

            this._mesh.material = value;

        }

    }

    v3d.FullScreenQuad = FullScreenQuad;
    v3d.Pass = Pass;

})();
