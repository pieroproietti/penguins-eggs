/**
 * penguins-eggs: Update.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("../lib/utils"));
class Update {
    // Properties
    // Methods
    static async go() {
        utils_1.default.exec(`npm config set unsafe-perm true`);
        utils_1.default.exec(`npm i penguins-eggs -g`);
    }
}
exports.default = Update;
