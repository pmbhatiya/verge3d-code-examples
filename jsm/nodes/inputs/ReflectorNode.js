import { TempNode } from '../core/TempNode.js';
import { InputNode } from '../core/InputNode.js';
import { PositionNode } from '../accessors/PositionNode.js';
import { OperatorNode } from '../math/OperatorNode.js';
import { TextureNode } from './TextureNode.js';
import { Matrix4Node } from './Matrix4Node.js';

class ReflectorNode extends TempNode {

    constructor(mirror) {

        super('v4');

        if (mirror) this.setMirror(mirror);

    }

    setMirror(mirror) {

        this.mirror = mirror;

        this.textureMatrix = new Matrix4Node(this.mirror.material.uniforms.textureMatrix.value);

        this.localPosition = new PositionNode(PositionNode.LOCAL);

        this.uv = new OperatorNode(this.textureMatrix, this.localPosition, OperatorNode.MUL);
        this.uvResult = new OperatorNode(null, this.uv, OperatorNode.ADD);

        this.texture = new TextureNode(this.mirror.material.uniforms.tDiffuse.value, this.uv, null, true);

    }

    generate(builder, output) {

        if (builder.isShader('fragment')) {

            this.uvResult.a = this.offset;
            this.texture.uv = this.offset ? this.uvResult : this.uv;

            if (output === 'sampler2D') {

                return this.texture.build(builder, output);

            }

            return builder.format(this.texture.build(builder, this.type), this.type, output);

        } else {

            console.warn('v3d.ReflectorNode is not compatible with ' + builder.shader + ' shader.');

            return builder.format('vec4(0.0)', this.type, output);

        }

    }

    copy(source) {

        InputNode.prototype.copy.call(this, source);

        this.scope.mirror = source.mirror;

        return this;

    }

    toJSON(meta) {

        let data = this.getJSONNode(meta);

        if (!data) {

            data = this.createJSONNode(meta);

            data.mirror = this.mirror.uuid;

            if (this.offset) data.offset = this.offset.toJSON(meta).uuid;

        }

        return data;

    }

}

ReflectorNode.prototype.nodeType = 'Reflector';

export { ReflectorNode };
