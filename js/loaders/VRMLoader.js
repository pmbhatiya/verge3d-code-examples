(function() {

    //
    // VRM is based on glTF 2.0 and VRM extension is defined
    // in top-level json.extensions.VRM

    class VRMLoader extends v3d.Loader {

        constructor(manager) {

            if (v3d.GLTFLoader === undefined) {

                throw new Error('v3d.VRMLoader: Import v3d.GLTFLoader.');

            }

            super(manager);
            this.gltfLoader = new v3d.GLTFLoader(manager);

        }

        load(url, onLoad, onProgress, onError) {

            const scope = this;
            this.gltfLoader.load(url, function(gltf) {

                try {

                    scope.parse(gltf, onLoad);

                } catch (e) {

                    if (onError) {

                        onError(e);

                    } else {

                        console.error(e);

                    }

                    scope.manager.itemError(url);

                }

            }, onProgress, onError);

        }

        setDRACOLoader(dracoLoader) {

            this.gltfLoader.setDRACOLoader(dracoLoader);
            return this;

        }

        parse(gltf, onLoad) {

            // const gltfParser = gltf.parser;
            // const gltfExtensions = gltf.userData.gltfExtensions || {};
            // const vrmExtension = gltfExtensions.VRM || {};
            // handle VRM Extension here
            onLoad(gltf);

        }

    }

    v3d.VRMLoader = VRMLoader;

})();
