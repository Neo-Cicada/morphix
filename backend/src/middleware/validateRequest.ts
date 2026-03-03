import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateRequest = (schema: z.ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    status: 'fail',
                    errors: (error as any).errors || (error as any).issues,
                });
            }
            return next(error);
        }
    };
};
