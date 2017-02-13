
import {primitiveTypes, isArrayType, getArrayType} from './views';



const androidPrimitiveTypes = [
    "bool",
    "int",
    "double",
    "float",
    "string"
];
export default function (view) {
//
// Java specific view
    return Object.assign({}, view, {
        // JAVA code to use for payload deserialization
        "payloadDeserialization": function () {
            if (!this.payload) {
                return "Object payload = null;";
            }
            // Array
            if (isArrayType(this.payload.type)) {
                const arrayType = getArrayType(this.payload.type);
                // Array of a primitive type
                if (primitiveTypes.includes(arrayType)) {
                    let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
                    return `${this.payload.type} payload = bundle.get${objType}Array("${this.payload.name}");`;
                }
                // Array of a complex object type
                else {
                    return `Parcelable[] p = bundle.getParcelableArray("${this.payload.name}");
                        ${this.payload.type} payload = new ${arrayType}[p.length];
                        System.arraycopy(p, 0, payload, 0, p.length);`;
                }
            }
            // No array
            else {
                if (primitiveTypes.includes(this.payload.type)) {
                    const primType = (this.payload.type === 'Integer' ? 'Int' : this.payload.type);
                    return `${this.payload.type} payload = bundle.get${primType}("${this.payload.name}");`;
                } else {
                    return `${this.payload.type} payload = ${this.payload.type}.fromBundle(bundle);`;
                }
            }
        },
        // JAVA code to use for payload serialization (request payload / event payload)
        "payloadSerizalization": function () {
            // Array
            if (isArrayType(this.payload.type)) {
                const arrayType = getArrayType(this.payload.type);
                // Array of a primitive type
                if (primitiveTypes.includes(arrayType)) {
                    let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
                    return `new Bundle(); bundle.put${objType}Array("${this.payload.name}", ${this.payload.name});`;
                }
                // Array of a complex object type
                else {
                    return `new Bundle(); bundle.putParcelableArray("${this.payload.name}", ${this.payload.name});`;
                }
            }
            // Not Array
            else {
                if (primitiveTypes.includes(this.payload.type)) {
                    const primType = (this.payload.type === 'Integer' ? 'Int' : this.payload.type);
                    return `new Bundle(); bundle.put${primType}("${this.payload.name}",\
                   ${this.payload.name});`;
                } else {
                    return `${this.payload.name}.toBundle();`;
                }
            }
        },
        // JAVA code to use for payload serialization (response payload)
        "responsePayloadSerialization": function () {
            // Array
            if (isArrayType(this)) {
                const arrayType = getArrayType(this);
                // Array of a primitive type
                if (primitiveTypes.includes(arrayType)) {
                    let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
                    return `new Bundle(); bundle.put${objType}Array("rsp", obj);`;
                }
                // Array of a complex object type
                else {
                    throw new Error("Complex object type arrays are not supported yet");
                }
            }
            // Not Array
            else {
                // Primitive type
                if (primitiveTypes.includes(this)) {
                    const primType = (this === 'Integer' ? 'Int' : this);
                    return `new Bundle(); bundle.put${primType}("rsp", obj);`;
                }
                // Complex object type
                else {
                    return `obj.toBundle();`;
                }
            }
        },
        // JAVA Code to use for payload deserialization (response payload)
        "responsePayloadDeserialization": function () {
            // Array
            if (isArrayType(this)) {
                const arrayType = getArrayType(this);
                // Array of a primitive type
                if (primitiveTypes.includes(arrayType)) {
                    let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
                    return `${this} payload = bundle.get${objType}Array("rsp");`;
                }
                // Array of a complex object type
                else {
                    throw new Error("Complex object type arrays are not supported yet");
                }
            }
            // Not Array
            else {
                // Primitive type
                if (primitiveTypes.includes(this)) {
                    const primType = (this === 'Integer' ? 'Int' : this);
                    return `${this} payload = bundle.get${primType}("rsp");`;
                }
                // Complex object type
                else {
                    return `${this} payload = ${this}.fromBundle(bundle);`;
                }
            }
        }
    });
}
