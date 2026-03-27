import { RequestHandler } from 'express';
import sessionAssignmentService from '../services/session-assignment.service';
import { getParamString } from '../utils/param-parser';

const getCurrentUser = (req: Parameters<RequestHandler>[0]) => {
  const userId = req.user?.id || '';
  const role = req.user?.role || 'USER';
  return { userId, role };
};

export const createSessionAssignment: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    await sessionAssignmentService.assertManagerAccess({
      sessionId,
      requesterId: userId,
      requesterRole: role,
    });

    const assignment = await sessionAssignmentService.createAssignment(sessionId, userId, req.body);
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

export const listSessionAssignments: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    await sessionAssignmentService.assertManagerAccess({
      sessionId,
      requesterId: userId,
      requesterRole: role,
    });

    const result = await sessionAssignmentService.listAssignments(sessionId, req.query as any);
    res.json({
      success: true,
      message: 'Assignments fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionAssignmentById: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    await sessionAssignmentService.assertManagerAccess({
      sessionId,
      requesterId: userId,
      requesterRole: role,
    });

    const assignment = await sessionAssignmentService.getAssignmentById(sessionId, assignmentId);
    res.json({
      success: true,
      message: 'Assignment fetched successfully',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSessionAssignment: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    await sessionAssignmentService.assertManagerAccess({
      sessionId,
      requesterId: userId,
      requesterRole: role,
    });

    const assignment = await sessionAssignmentService.updateAssignment(
      sessionId,
      assignmentId,
      userId,
      req.body,
    );

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSessionAssignment: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    await sessionAssignmentService.assertManagerAccess({
      sessionId,
      requesterId: userId,
      requesterRole: role,
    });

    const assignment = await sessionAssignmentService.deactivateAssignment(
      sessionId,
      assignmentId,
      userId,
    );
    res.json({
      success: true,
      message: 'Assignment deactivated successfully',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

export const listSessionAssignmentSubmissions: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    await sessionAssignmentService.assertManagerAccess({
      sessionId,
      requesterId: userId,
      requesterRole: role,
    });

    const result = await sessionAssignmentService.listSubmissions(
      sessionId,
      assignmentId,
      req.query as any,
    );
    res.json({
      success: true,
      message: 'Assignment submissions fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionAssignmentTimeline: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    await sessionAssignmentService.assertManagerAccess({
      sessionId,
      requesterId: userId,
      requesterRole: role,
    });

    const result = await sessionAssignmentService.getTimeline(
      sessionId,
      assignmentId,
      req.query as any,
    );
    res.json({
      success: true,
      message: 'Assignment timeline fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadSessionAssignmentSubmissionFile: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    const submissionId = getParamString(req.params.submissionId);
    const fileId = getParamString(req.params.fileId);
    await sessionAssignmentService.assertManagerAccess({
      sessionId,
      requesterId: userId,
      requesterRole: role,
    });

    const file = await sessionAssignmentService.getSubmissionFileForDownload(
      sessionId,
      assignmentId,
      submissionId,
      fileId,
      userId,
    );

    res.json({
      success: true,
      message: 'Submission file download URL fetched successfully',
      data: {
        file: {
          id: file.id,
          fileName: file.fileName,
          fileMimeType: file.fileMimeType,
          fileSizeBytes: file.fileSizeBytes,
          url: file.fileUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMySessionAssignments: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const result = await sessionAssignmentService.getMyAssignments(userId, sessionId, req.query as any);
    res.json({
      success: true,
      message: 'My assignments fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMySessionAssignmentById: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    const assignment = await sessionAssignmentService.getMyAssignmentById(
      userId,
      sessionId,
      assignmentId,
    );

    res.json({
      success: true,
      message: 'My assignment fetched successfully',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
};

export const submitMySessionAssignment: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    const files = (req.files as Express.Multer.File[]) || [];

    const submission = await sessionAssignmentService.submitMyAssignment(
      userId,
      sessionId,
      assignmentId,
      files,
      req.body || {},
    );

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

export const getMySessionAssignmentSubmission: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getCurrentUser(req);
    const sessionId = getParamString(req.params.sessionId);
    const assignmentId = getParamString(req.params.assignmentId);
    const submission = await sessionAssignmentService.getMySubmission(
      userId,
      sessionId,
      assignmentId,
    );
    res.json({
      success: true,
      message: 'My submission fetched successfully',
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};
