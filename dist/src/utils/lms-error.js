"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LmsException = void 0;
const http_exception_1 = __importDefault(require("./http-exception"));
class LmsException extends http_exception_1.default {
    constructor(status, code, message, context) {
        super(status, message);
        this.code = code;
        this.context = context;
    }
}
exports.LmsException = LmsException;
//# sourceMappingURL=lms-error.js.map