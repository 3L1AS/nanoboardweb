import path from 'path';

export function isWithinBasePath(baseDir: string, targetPath: string): boolean {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(targetPath);
    return resolvedTarget === resolvedBase || resolvedTarget.startsWith(`${resolvedBase}${path.sep}`);
}

export function resolveWithinBase(baseDir: string, userPath: string): string | null {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(resolvedBase, userPath);
    return isWithinBasePath(resolvedBase, resolvedTarget) ? resolvedTarget : null;
}

export function isSafePathToken(value: unknown): value is string {
    return typeof value === 'string'
        && value.trim().length > 0
        && !/[\\/\0]/.test(value);
}

export function isSafeLeafName(value: unknown): value is string {
    return isSafePathToken(value) && value !== '.' && value !== '..';
}
