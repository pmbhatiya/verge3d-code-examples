import { MathUtils } from '../../../../build/v3d.module.js';

class Node {

    constructor(type) {

        this.uuid = MathUtils.generateUUID();

        this.name = '';

        this.type = type;

        this.userData = {};

    }

    analyze(builder, settings = {}) {

        builder.analyzing = true;

        this.build(builder.addFlow(settings.slot, settings.cache, settings.context), 'v4');

        builder.clearVertexNodeCode();
        builder.clearFragmentNodeCode();

        builder.removeFlow();

        builder.analyzing = false;

    }

    analyzeAndFlow(builder, output, settings = {}) {

        this.analyze(builder, settings);

        return this.flow(builder, output, settings);

    }

    flow(builder, output, settings = {}) {

        builder.addFlow(settings.slot, settings.cache, settings.context);

        const flow = {};
        flow.result = this.build(builder, output);
        flow.code = builder.clearNodeCode();
        flow.extra = builder.context.extra;

        builder.removeFlow();

        return flow;

    }

    build(builder, output, uuid) {

        output = output || this.getType(builder, output);

        const data = builder.getNodeData(uuid || this);

        if (builder.analyzing) {

            this.appendDepsNode(builder, data, output);

        }

        if (builder.nodes.indexOf(this) === - 1) {

            builder.nodes.push(this);

        }

        if (this.updateFrame !== undefined && builder.updaters.indexOf(this) === - 1) {

            builder.updaters.push(this);

        }

        return this.generate(builder, output, uuid);

    }

    generate(/* builder, output, uuid, type, ns */) {

        // This method needs to be implemented in subclasses

    }

    getHash() {

        let hash = '{';
        let prop, obj;

        for (prop in this) {

            obj = this[prop];

            if (obj instanceof Node) {

                hash += '"' + prop + '":' + obj.getHash() + ',';

            }

        }

        if (this.hashProperties) {

            for (let i = 0; i < this.hashProperties.length; i++) {

                prop = this.hashProperties[i];
                obj = this[prop];

                hash += '"' + prop + '":"' + String(obj) + '",';

            }

        }

        hash += '"id":"' + this.uuid + '"}';

        return hash;

    }

    appendDepsNode(builder, data, output) {

        data.deps = (data.deps || 0) + 1;

        const outputLen = builder.getTypeLength(output);

        if (outputLen > (data.outputMax || 0) || this.getType(builder, output)) {

            data.outputMax = outputLen;
            data.output = output;

        }

    }

    setName(name) {

        this.name = name;

        return this;

    }

    getName(/* builder */) {

        return this.name;

    }

    getType(builder, output) {

        return output === 'sampler2D' || output === 'samplerCube' ? output : this.type;

    }

    getJSONNode(meta) {

        const isRootObject = (meta === undefined || typeof meta === 'string');

        if (!isRootObject && meta.nodes[this.uuid] !== undefined) {

            return meta.nodes[this.uuid];

        }

    }

    copy(source) {

        if (source.name !== undefined) this.name = source.name;

        if (source.userData !== undefined) this.userData = JSON.parse(JSON.stringify(source.userData));

        return this;

    }

    createJSONNode(meta) {

        const isRootObject = (meta === undefined || typeof meta === 'string');

        const data = {};

        if (typeof this.nodeType !== 'string') throw new Error('Node does not allow serialization.');

        data.uuid = this.uuid;
        data.nodeType = this.nodeType;

        if (this.name !== '') data.name = this.name;

        if (JSON.stringify(this.userData) !== '{}') data.userData = this.userData;

        if (!isRootObject) {

            meta.nodes[this.uuid] = data;

        }

        return data;

    }

    toJSON(meta) {

        return this.getJSONNode(meta) || this.createJSONNode(meta);

    }

}

Node.prototype.isNode = true;
Node.prototype.hashProperties = undefined;

export { Node };
