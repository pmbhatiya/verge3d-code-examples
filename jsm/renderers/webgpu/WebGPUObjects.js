class WebGPUObjects {

    constructor(geometries, info) {

        this.geometries = geometries;
        this.info = info;

        this.updateMap = new WeakMap();

    }

    update(object) {

        const geometry = object.geometry;
        const updateMap = this.updateMap;
        const frame = this.info.render.frame;

        if (geometry.isBufferGeometry !== true) {

            throw 'v3d.WebGPURenderer: This renderer only supports v3d.BufferGeometry for geometries.';

        }

        if (updateMap.get(geometry) !== frame) {

            this.geometries.update(geometry);

            updateMap.set(geometry, frame);

        }

    }

    dispose() {

        this.updateMap = new WeakMap();

    }

}

export default WebGPUObjects;
