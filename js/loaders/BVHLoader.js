(function() {

    /**
 * Description: reads BVH files and outputs a single v3d.Skeleton and an v3d.AnimationClip
 *
 * Currently only supports bvh files containing a single root.
 *
 */

    class BVHLoader extends v3d.Loader {

        constructor(manager) {

            super(manager);
            this.animateBonePositions = true;
            this.animateBoneRotations = true;

        }

        load(url, onLoad, onProgress, onError) {

            const scope = this;
            const loader = new v3d.FileLoader(scope.manager);
            loader.setPath(scope.path);
            loader.setRequestHeader(scope.requestHeader);
            loader.setWithCredentials(scope.withCredentials);
            loader.load(url, function(text) {

                try {

                    onLoad(scope.parse(text));

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

        parse(text) {

            /*
        reads a string array (lines) from a BVH file
        and outputs a skeleton structure including motion data
            returns thee root node:
        { name: '', channels: [], children: [] }
    */
            function readBvh(lines) {

                // read model structure
                if (nextLine(lines) !== 'HIERARCHY') {

                    console.error('v3d.BVHLoader: HIERARCHY expected.');

                }

                const list = []; // collects flat array of all bones

                const root = readNode(lines, nextLine(lines), list); // read motion data

                if (nextLine(lines) !== 'MOTION') {

                    console.error('v3d.BVHLoader: MOTION expected.');

                } // number of frames


                let tokens = nextLine(lines).split(/[\s]+/);
                const numFrames = parseInt(tokens[1]);

                if (isNaN(numFrames)) {

                    console.error('v3d.BVHLoader: Failed to read number of frames.');

                } // frame time


                tokens = nextLine(lines).split(/[\s]+/);
                const frameTime = parseFloat(tokens[2]);

                if (isNaN(frameTime)) {

                    console.error('v3d.BVHLoader: Failed to read frame time.');

                } // read frame data line by line


                for (let i = 0; i < numFrames; i++) {

                    tokens = nextLine(lines).split(/[\s]+/);
                    readFrameData(tokens, i * frameTime, root);

                }

                return list;

            }
            /*
        Recursively reads data from a single frame into the bone hierarchy.
        The passed bone hierarchy has to be structured in the same order as the BVH file.
        keyframe data is stored in bone.frames.
            - data: splitted string array (frame values), values are shift()ed so
        this should be empty after parsing the whole hierarchy.
        - frameTime: playback time for this keyframe.
        - bone: the bone to read frame data from.
    */


            function readFrameData(data, frameTime, bone) {

                // end sites have no motion data
                if (bone.type === 'ENDSITE') return; // add keyframe

                const keyframe = {
                    time: frameTime,
                    position: new v3d.Vector3(),
                    rotation: new v3d.Quaternion()
                };
                bone.frames.push(keyframe);
                const quat = new v3d.Quaternion();
                const vx = new v3d.Vector3(1, 0, 0);
                const vy = new v3d.Vector3(0, 1, 0);
                const vz = new v3d.Vector3(0, 0, 1); // parse values for each channel in node

                for (let i = 0; i < bone.channels.length; i++) {

                    switch (bone.channels[i]) {

                        case 'Xposition':
                            keyframe.position.x = parseFloat(data.shift().trim());
                            break;

                        case 'Yposition':
                            keyframe.position.y = parseFloat(data.shift().trim());
                            break;

                        case 'Zposition':
                            keyframe.position.z = parseFloat(data.shift().trim());
                            break;

                        case 'Xrotation':
                            quat.setFromAxisAngle(vx, parseFloat(data.shift().trim()) * Math.PI / 180);
                            keyframe.rotation.multiply(quat);
                            break;

                        case 'Yrotation':
                            quat.setFromAxisAngle(vy, parseFloat(data.shift().trim()) * Math.PI / 180);
                            keyframe.rotation.multiply(quat);
                            break;

                        case 'Zrotation':
                            quat.setFromAxisAngle(vz, parseFloat(data.shift().trim()) * Math.PI / 180);
                            keyframe.rotation.multiply(quat);
                            break;

                        default:
                            console.warn('v3d.BVHLoader: Invalid channel type.');

                    }

                } // parse child nodes


                for (let i = 0; i < bone.children.length; i++) {

                    readFrameData(data, frameTime, bone.children[i]);

                }

            }
            /*
     Recursively parses the HIERACHY section of the BVH file
         - lines: all lines of the file. lines are consumed as we go along.
     - firstline: line containing the node type and name e.g. 'JOINT hip'
     - list: collects a flat list of nodes
         returns: a BVH node including children
    */


            function readNode(lines, firstline, list) {

                const node = {
                    name: '',
                    type: '',
                    frames: []
                };
                list.push(node); // parse node type and name

                let tokens = firstline.split(/[\s]+/);

                if (tokens[0].toUpperCase() === 'END' && tokens[1].toUpperCase() === 'SITE') {

                    node.type = 'ENDSITE';
                    node.name = 'ENDSITE'; // bvh end sites have no name

                } else {

                    node.name = tokens[1];
                    node.type = tokens[0].toUpperCase();

                }

                if (nextLine(lines) !== '{') {

                    console.error('v3d.BVHLoader: Expected opening { after type & name');

                } // parse OFFSET


                tokens = nextLine(lines).split(/[\s]+/);

                if (tokens[0] !== 'OFFSET') {

                    console.error('v3d.BVHLoader: Expected OFFSET but got: ' + tokens[0]);

                }

                if (tokens.length !== 4) {

                    console.error('v3d.BVHLoader: Invalid number of values for OFFSET.');

                }

                const offset = new v3d.Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));

                if (isNaN(offset.x) || isNaN(offset.y) || isNaN(offset.z)) {

                    console.error('v3d.BVHLoader: Invalid values of OFFSET.');

                }

                node.offset = offset; // parse CHANNELS definitions

                if (node.type !== 'ENDSITE') {

                    tokens = nextLine(lines).split(/[\s]+/);

                    if (tokens[0] !== 'CHANNELS') {

                        console.error('v3d.BVHLoader: Expected CHANNELS definition.');

                    }

                    const numChannels = parseInt(tokens[1]);
                    node.channels = tokens.splice(2, numChannels);
                    node.children = [];

                } // read children


                while (true) {

                    const line = nextLine(lines);

                    if (line === '}') {

                        return node;

                    } else {

                        node.children.push(readNode(lines, line, list));

                    }

                }

            }
            /*
        recursively converts the internal bvh node structure to a v3d.Bone hierarchy
            source: the bvh root node
        list: pass an empty array, collects a flat list of all converted v3d.Bones
            returns the root v3d.Bone
    */


            function tov3dBone(source, list) {

                const bone = new v3d.Bone();
                list.push(bone);
                bone.position.add(source.offset);
                bone.name = source.name;

                if (source.type !== 'ENDSITE') {

                    for (let i = 0; i < source.children.length; i++) {

                        bone.add(tov3dBone(source.children[i], list));

                    }

                }

                return bone;

            }
            /*
        builds a v3d.AnimationClip from the keyframe data saved in each bone.
            bone: bvh root node
            returns: a v3d.AnimationClip containing position and quaternion tracks
    */


            function tov3dAnimation(bones) {

                const tracks = []; // create a position and quaternion animation track for each node

                for (let i = 0; i < bones.length; i++) {

                    const bone = bones[i];
                    if (bone.type === 'ENDSITE') continue; // track data

                    const times = [];
                    const positions = [];
                    const rotations = [];

                    for (let j = 0; j < bone.frames.length; j ++) {

                        const frame = bone.frames[j];
                        times.push(frame.time); // the animation system animates the position property,
                        // so we have to add the joint offset to all values

                        positions.push(frame.position.x + bone.offset.x);
                        positions.push(frame.position.y + bone.offset.y);
                        positions.push(frame.position.z + bone.offset.z);
                        rotations.push(frame.rotation.x);
                        rotations.push(frame.rotation.y);
                        rotations.push(frame.rotation.z);
                        rotations.push(frame.rotation.w);

                    }

                    if (scope.animateBonePositions) {

                        tracks.push(new v3d.VectorKeyframeTrack('.bones[' + bone.name + '].position', times, positions));

                    }

                    if (scope.animateBoneRotations) {

                        tracks.push(new v3d.QuaternionKeyframeTrack('.bones[' + bone.name + '].quaternion', times, rotations));

                    }

                }

                return new v3d.AnimationClip('animation', - 1, tracks);

            }
            /*
        returns the next non-empty line in lines
    */


            function nextLine(lines) {

                let line; // skip empty lines

                while ((line = lines.shift().trim()).length === 0) {}

                return line;

            }

            const scope = this;
            const lines = text.split(/[\r\n]+/g);
            const bones = readBvh(lines);
            const threeBones = [];
            tov3dBone(bones[0], threeBones);
            const threeClip = tov3dAnimation(bones);
            return {
                skeleton: new v3d.Skeleton(threeBones),
                clip: threeClip
            };

        }

    }

    v3d.BVHLoader = BVHLoader;

})();
