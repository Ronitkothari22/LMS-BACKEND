"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStringParam = getStringParam;
function getStringParam(param) {
    if (Array.isArray(param)) {
        return param[0];
    }
    return param || '';
}
//# sourceMappingURL=param.util.js.map