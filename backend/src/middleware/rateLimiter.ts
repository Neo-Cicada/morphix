import rateLimit from 'express-rate-limit';

// General API: 100 req / 15 min per IP
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// AI endpoints: 10 req / min per IP (each call hits Anthropic and costs money)
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many AI requests. Please wait before trying again.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Render endpoints: 5 req / 10 min per IP (renders are expensive CPU/FFmpeg jobs)
export const renderLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: 'Too many render requests. Please wait before starting another render.',
    standardHeaders: true,
    legacyHeaders: false,
});
