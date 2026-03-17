"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../../config/jwt.config");
const generateTestToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, jwt_config_1.jwtConfig.accessToken.secret, {
        expiresIn: jwt_config_1.jwtConfig.accessToken.expiresIn,
    });
};
exports.generateTestToken = generateTestToken;
//# sourceMappingURL=auth.helper.js.map