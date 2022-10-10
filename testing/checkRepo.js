#!/usr/bin/npx ts-node
"use strict";
/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = tslib_1.__importDefault(require("../src/classes/utils"));
const tailor_1 = tslib_1.__importDefault(require("../src/classes/tailor"));
startPoint();
async function startPoint() {
    utils_1.default.titles('order');
    const tailor = new tailor_1.default('wardrobe.d', 'hen');
    tailor.prepare(true);
}
