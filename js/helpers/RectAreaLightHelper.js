(function() {

    /**
 *  This helper must be added as a child of the light
 */

    class RectAreaLightHelper extends v3d.Line {

        constructor(light, color) {

            const positions = [1, 1, 0, - 1, 1, 0, - 1, - 1, 0, 1, - 1, 0, 1, 1, 0];
            const geometry = new v3d.BufferGeometry();
            geometry.setAttribute('position', new v3d.Float32BufferAttribute(positions, 3));
            geometry.computeBoundingSphere();
            const material = new v3d.LineBasicMaterial({
                fog: false
            });
            super(geometry, material);
            this.light = light;
            this.color = color; // optional hardwired color for the helper

            this.type = 'RectAreaLightHelper'; //

            const positions2 = [1, 1, 0, - 1, 1, 0, - 1, - 1, 0, 1, 1, 0, - 1, - 1, 0, 1, - 1, 0];
            const geometry2 = new v3d.BufferGeometry();
            geometry2.setAttribute('position', new v3d.Float32BufferAttribute(positions2, 3));
            geometry2.computeBoundingSphere();
            this.add(new v3d.Mesh(geometry2, new v3d.MeshBasicMaterial({
                side: v3d.BackSide,
                fog: false
            })));

        }

        updateMatrixWorld() {

            this.scale.set(0.5 * this.light.width, 0.5 * this.light.height, 1);

            if (this.color !== undefined) {

                this.material.color.set(this.color);
                this.children[0].material.color.set(this.color);

            } else {

                this.material.color.copy(this.light.color).multiplyScalar(this.light.intensity); // prevent hue shift

                const c = this.material.color;
                const max = Math.max(c.r, c.g, c.b);
                if (max > 1) c.multiplyScalar(1 / max);
                this.children[0].material.color.copy(this.material.color);

            } // ignore world scale on light


            this.matrixWorld.extractRotation(this.light.matrixWorld).scale(this.scale).copyPosition(this.light.matrixWorld);
            this.children[0].matrixWorld.copy(this.matrixWorld);

        }

        dispose() {

            this.geometry.dispose();
            this.material.dispose();
            this.children[0].geometry.dispose();
            this.children[0].material.dispose();

        }

    }

    v3d.RectAreaLightHelper = RectAreaLightHelper;

})();
