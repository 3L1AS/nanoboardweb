import { Response } from 'express';

export function sendInternalError(
    res: Response,
    error: unknown,
    publicMessage = 'Internal server error'
) {
    console.error(publicMessage, error);
    return res.status(500).json({ error: publicMessage });
}
