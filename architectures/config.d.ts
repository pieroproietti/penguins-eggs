export const __esModule: boolean;
export const TARGETS: string[];
export function gitSha(cwd: any, options?: {}): Promise<any>;
export function buildConfig(root: any, options?: {}): Promise<{
    root: any;
    gitSha: any;
    config: core_1.Interfaces.Config | core_1.Config;
    tmp: string;
    updateConfig: {
        s3: core_1.Interfaces.PJSON.S3;
        autoupdate?: {
            rollout?: number | undefined;
            debounce?: number | undefined;
        } | undefined;
        node: {
            version?: string | undefined;
            targets?: string[] | undefined;
        };
    };
    xz: any;
    dist: (...args: any[]) => string;
    s3Config: core_1.Interfaces.PJSON.S3;
    nodeVersion: string;
    workspace(target: any): any;
    targets: any;
}>;
import core_1 = require("@oclif/core");
