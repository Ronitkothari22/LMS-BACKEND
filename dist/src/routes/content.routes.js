"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const content_controller_1 = require("../controllers/content.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const content_middleware_1 = require("../middleware/content.middleware");
const content_form_middleware_1 = require("../middleware/content-form.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const content_validation_1 = require("../validations/content.validation");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticateToken, upload_middleware_1.contentUpload.single('file'), content_form_middleware_1.validateContentForm, content_middleware_1.validateSessionForContent, content_controller_1.uploadContent);
router.get('/test-deployment', (_req, res) => {
    res.json({
        message: 'New endpoint deployed successfully!',
        timestamp: new Date().toISOString(),
        version: 'v1.0.1',
    });
});
router.get('/download/:contentId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(content_validation_1.getContentByIdSchema), content_middleware_1.validateContentAccess, content_controller_1.downloadContent);
router.get('/:contentId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(content_validation_1.getContentByIdSchema), content_middleware_1.validateContentAccess, content_controller_1.getContentById);
router.get('/session/:sessionId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(content_validation_1.getSessionContentSchema), content_controller_1.getSessionContent);
router.put('/:contentId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(content_validation_1.updateContentSchema), content_middleware_1.validateContentAccess, content_controller_1.updateContent);
router.delete('/:contentId', auth_middleware_1.authenticateToken, (0, validate_middleware_1.validateRequest)(content_validation_1.deleteContentSchema), content_middleware_1.validateContentAccess, content_controller_1.deleteContent);
exports.default = router;
//# sourceMappingURL=content.routes.js.map