"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboarding_controller_1 = require("../controllers/onboarding.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const onboarding_validation_1 = require("../validations/onboarding.validation");
const router = (0, express_1.Router)();
router.put('/user-details', auth_middleware_1.authenticateToken, admin_middleware_1.isAdmin, (0, validate_middleware_1.validateRequest)(onboarding_validation_1.updateUserDetailsSchema), onboarding_controller_1.updateUserDetails);
exports.default = router;
//# sourceMappingURL=onboarding.routes.js.map