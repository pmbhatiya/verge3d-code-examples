(function() {

    // Original src: https://github.com/zz85/threejs-path-flow
    const BITS = 3;
    const TEXTURE_WIDTH = 1024;
    const TEXTURE_HEIGHT = 4;
    /**
 * Make a new v3d.DataTexture to store the descriptions of the curves.
 *
 * @param { number } numberOfCurves the number of curves needed to be described by this texture.
 */

    function initSplineTexture(numberOfCurves = 1) {

        const dataArray = new Float32Array(TEXTURE_WIDTH * TEXTURE_HEIGHT * numberOfCurves * BITS);
        const dataTexture = new v3d.DataTexture(dataArray, TEXTURE_WIDTH, TEXTURE_HEIGHT * numberOfCurves, v3d.RGBFormat, v3d.FloatType);
        dataTexture.wrapS = v3d.RepeatWrapping;
        dataTexture.wrapY = v3d.RepeatWrapping;
        dataTexture.magFilter = v3d.NearestFilter;
        dataTexture.needsUpdate = true;
        return dataTexture;

    }
    /**
 * Write the curve description to the data texture
 *
 * @param { v3d.DataTexture } texture The v3d.DataTexture to write to
 * @param { Curve } splineCurve The curve to describe
 * @param { number } offset Which curve slot to write to
 */

    function updateSplineTexture(texture, splineCurve, offset = 0) {

        const numberOfPoints = Math.floor(TEXTURE_WIDTH * (TEXTURE_HEIGHT / 4));
        splineCurve.arcLengthDivisions = numberOfPoints / 2;
        splineCurve.updateArcLengths();
        const points = splineCurve.getSpacedPoints(numberOfPoints);
        const frenetFrames = splineCurve.computeFrenetFrames(numberOfPoints, true);

        for (let i = 0; i < numberOfPoints; i++) {

            const rowOffset = Math.floor(i / TEXTURE_WIDTH);
            const rowIndex = i % TEXTURE_WIDTH;
            let pt = points[i];
            setTextureValue(texture, rowIndex, pt.x, pt.y, pt.z, 0 + rowOffset + TEXTURE_HEIGHT * offset);
            pt = frenetFrames.tangents[i];
            setTextureValue(texture, rowIndex, pt.x, pt.y, pt.z, 1 + rowOffset + TEXTURE_HEIGHT * offset);
            pt = frenetFrames.normals[i];
            setTextureValue(texture, rowIndex, pt.x, pt.y, pt.z, 2 + rowOffset + TEXTURE_HEIGHT * offset);
            pt = frenetFrames.binormals[i];
            setTextureValue(texture, rowIndex, pt.x, pt.y, pt.z, 3 + rowOffset + TEXTURE_HEIGHT * offset);

        }

        texture.needsUpdate = true;

    }

    function setTextureValue(texture, index, x, y, z, o) {

        const image = texture.image;
        const {
            data
        } = image;
        const i = BITS * TEXTURE_WIDTH * o; // Row Offset

        data[index * BITS + i + 0] = x;
        data[index * BITS + i + 1] = y;
        data[index * BITS + i + 2] = z;

    }
    /**
 * Create a new set of uniforms for describing the curve modifier
 *
 * @param { v3d.DataTexture } Texture which holds the curve description
 */


    function getUniforms(splineTexture) {

        const uniforms = {
            spineTexture: {
                value: splineTexture
            },
            pathOffset: {
                type: 'f',
                value: 0
            },
            // time of path curve
            pathSegment: {
                type: 'f',
                value: 1
            },
            // fractional length of path
            spineOffset: {
                type: 'f',
                value: 161
            },
            spineLength: {
                type: 'f',
                value: 400
            },
            flow: {
                type: 'i',
                value: 1
            }
        };
        return uniforms;

    }

    function modifyShader(material, uniforms, numberOfCurves = 1) {

        if (material.__ok) return;
        material.__ok = true;

        material.onBeforeCompile = shader => {

            if (shader.__modified) return;
            shader.__modified = true;
            Object.assign(shader.uniforms, uniforms);
            const vertexShader = `
        uniform sampler2D spineTexture;
        uniform float pathOffset;
        uniform float pathSegment;
        uniform float spineOffset;
        uniform float spineLength;
        uniform int flow;

        float textureLayers = ${TEXTURE_HEIGHT * numberOfCurves}.;
        float textureStacks = ${TEXTURE_HEIGHT / 4}.;

        ${shader.vertexShader}
        ` // chunk import moved in front of modified shader below
                .replace('#include <beginnormal_vertex>', '') // vec3 transformedNormal declaration overriden below
                .replace('#include <defaultnormal_vertex>', '') // vec3 transformed declaration overriden below
                .replace('#include <begin_vertex>', '') // shader override
                .replace(/void\s*main\s*\(\)\s*\{/, `
void main() {
#include <beginnormal_vertex>

vec4 worldPos = modelMatrix * vec4(position, 1.);

bool bend = flow > 0;
float xWeight = bend ? 0. : 1.;

#ifdef USE_INSTANCING
float pathOffsetFromInstanceMatrix = instanceMatrix[3][2];
float spineLengthFromInstanceMatrix = instanceMatrix[3][0];
float spinePortion = bend ? (worldPos.x + spineOffset) / spineLengthFromInstanceMatrix : 0.;
float mt = (spinePortion * pathSegment + pathOffset + pathOffsetFromInstanceMatrix)*textureStacks;
#else
float spinePortion = bend ? (worldPos.x + spineOffset) / spineLength : 0.;
float mt = (spinePortion * pathSegment + pathOffset)*textureStacks;
#endif

mt = mod(mt, textureStacks);
float rowOffset = floor(mt);

#ifdef USE_INSTANCING
rowOffset += instanceMatrix[3][1] * ${TEXTURE_HEIGHT}.;
#endif

vec3 spinePos = texture2D(spineTexture, vec2(mt, (0. + rowOffset + 0.5) / textureLayers)).xyz;
vec3 a =        texture2D(spineTexture, vec2(mt, (1. + rowOffset + 0.5) / textureLayers)).xyz;
vec3 b =        texture2D(spineTexture, vec2(mt, (2. + rowOffset + 0.5) / textureLayers)).xyz;
vec3 c =        texture2D(spineTexture, vec2(mt, (3. + rowOffset + 0.5) / textureLayers)).xyz;
mat3 basis = mat3(a, b, c);

vec3 transformed = basis
    * vec3(worldPos.x * xWeight, worldPos.y * 1., worldPos.z * 1.)
    + spinePos;

vec3 transformedNormal = normalMatrix * (basis * objectNormal);
            `).replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
                gl_Position = projectionMatrix * mvPosition;`);
            shader.vertexShader = vertexShader;

        };

    }
    /**
 * A helper class for making meshes bend aroudn curves
 */

    class Flow {

        /**
   * @param {Mesh} mesh The mesh to clone and modify to bend around the curve
   * @param {number} numberOfCurves The amount of space that should preallocated for additional curves
   */
        constructor(mesh, numberOfCurves = 1) {

            const obj3D = mesh.clone();
            const splineTexure = initSplineTexture(numberOfCurves);
            const uniforms = getUniforms(splineTexure);
            obj3D.traverse(function(child) {

                if (child instanceof v3d.Mesh || child instanceof v3d.InstancedMesh) {

                    child.material = child.material.clone();
                    modifyShader(child.material, uniforms, numberOfCurves);

                }

            });
            this.curveArray = new Array(numberOfCurves);
            this.curveLengthArray = new Array(numberOfCurves);
            this.object3D = obj3D;
            this.splineTexure = splineTexure;
            this.uniforms = uniforms;

        }

        updateCurve(index, curve) {

            if (index >= this.curveArray.length) throw Error('Index out of range for Flow');
            const curveLength = curve.getLength();
            this.uniforms.spineLength.value = curveLength;
            this.curveLengthArray[index] = curveLength;
            this.curveArray[index] = curve;
            updateSplineTexture(this.splineTexure, curve, index);

        }

        moveAlongCurve(amount) {

            this.uniforms.pathOffset.value += amount;

        }

    }
    const matrix = new v3d.Matrix4();
    /**
 * A helper class for creating instanced versions of flow, where the instances are placed on the curve.
 */

    class InstancedFlow extends Flow {

        /**
   *
   * @param {number} count The number of instanced elements
   * @param {number} curveCount The number of curves to preallocate for
   * @param {Geometry} geometry The geometry to use for the instanced mesh
   * @param {Material} material The material to use for the instanced mesh
   */
        constructor(count, curveCount, geometry, material) {

            const mesh = new v3d.InstancedMesh(geometry, material, count);
            mesh.instanceMatrix.setUsage(v3d.DynamicDrawUsage);
            super(mesh, curveCount);
            this.offsets = new Array(count).fill(0);
            this.whichCurve = new Array(count).fill(0);

        }
        /**
   * The extra information about which curve and curve position is stored in the translation components of the matrix for the instanced objects
   * This writes that information to the matrix and marks it as needing update.
   *
   * @param {number} index of the instanced element to update
   */


        writeChanges(index) {

            matrix.makeTranslation(this.curveLengthArray[this.whichCurve[index]], this.whichCurve[index], this.offsets[index]);
            this.object3D.setMatrixAt(index, matrix);
            this.object3D.instanceMatrix.needsUpdate = true;

        }
        /**
   * Move an individual element along the curve by a specific amount
   *
   * @param {number} index Which element to update
   * @param {number} offset Move by how much
   */


        moveIndividualAlongCurve(index, offset) {

            this.offsets[index] += offset;
            this.writeChanges(index);

        }
        /**
   * Select which curve to use for an element
   *
   * @param {number} index the index of the instanced element to update
   * @param {number} curveNo the index of the curve it should use
   */


        setCurve(index, curveNo) {

            if (isNaN(curveNo)) throw Error('curve index being set is Not a Number (NaN)');
            this.whichCurve[index] = curveNo;
            this.writeChanges(index);

        }

    }

    v3d.Flow = Flow;
    v3d.InstancedFlow = InstancedFlow;
    v3d.getUniforms = getUniforms;
    v3d.initSplineTexture = initSplineTexture;
    v3d.modifyShader = modifyShader;
    v3d.updateSplineTexture = updateSplineTexture;

})();
