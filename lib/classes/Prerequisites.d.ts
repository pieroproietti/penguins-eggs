/**
 * penguins-eggs: Prerequisites.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import { IOses } from "../interfaces";
declare class Prerequisites {
    private o;
    constructor(o: IOses);
    install(): Promise<void>;
    debian(): Promise<void>;
}
export default Prerequisites;
