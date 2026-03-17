import { User, Content } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      content?: Content & {
        session?: {
          createdById: string;
          participants: {
            id: string;
          }[];
        };
        canView: {
          id: string;
        }[];
        canEdit: {
          id: string;
        }[];
      };
    }
  }
}
