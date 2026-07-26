export declare class Context {
    /**
     * Merges multiple context layers sequentially.
     * Priority goes from left to right (rightmost layer overrides leftmost layer).
     */
    static merge(layers: (Record<string, any> | string | undefined | null)[], env: Record<string, any>): Record<string, any>;
}
//# sourceMappingURL=context.d.ts.map