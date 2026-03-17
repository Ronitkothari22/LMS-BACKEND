"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const router = (0, express_1.Router)();
router.post('/signup', (0, validate_middleware_1.validateRequest)(auth_validation_1.signupSchema), auth_controller_1.signup);
router.post('/admin-signup', (0, validate_middleware_1.validateRequest)(auth_validation_1.adminSignupSchema), auth_controller_1.adminSignup);
router.post('/login', (0, validate_middleware_1.validateRequest)(auth_validation_1.loginSchema), auth_controller_1.login);
router.post('/verify-email', (0, validate_middleware_1.validateRequest)(auth_validation_1.verifyEmailSchema), auth_controller_1.verifyEmail);
router.post('/request-password-reset', (0, validate_middleware_1.validateRequest)(auth_validation_1.requestPasswordResetSchema), auth_controller_1.requestPasswordReset);
router.post('/reset-password', (0, validate_middleware_1.validateRequest)(auth_validation_1.resetPasswordSchema), auth_controller_1.resetPassword);
router.post('/refresh-token', (0, validate_middleware_1.validateRequest)(auth_validation_1.refreshTokenSchema), auth_controller_1.refreshToken);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map