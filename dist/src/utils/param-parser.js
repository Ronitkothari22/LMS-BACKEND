"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParamString = getParamString;
function getParamString(param) {
    if (Array.isArray(param)) {
        return param[0];
    }
    return param || '';
}
//# sourceMappingURL=param-parser.js.map