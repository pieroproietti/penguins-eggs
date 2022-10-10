"use strict";
/**
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displaymanager = void 0;
const pacman_1 = __importDefault(require("../../pacman"));
/**
 * restituisce displaymanagers in uso
 */
function displaymanager() {
    let text = '';
    text += addIfExist('slim');
    text += addIfExist('sddm');
    text += addIfExist('lightdm');
    text += addIfExist('gdm');
    text += addIfExist('gdm3');
    text += addIfExist('mdm');
    text += addIfExist('lxdm');
    text += addIfExist('kdm');
    return text;
}
exports.displaymanager = displaymanager;
/*
 * @param package2check
 */
function addIfExist(package2check) {
    let content = '';
    if (pacman_1.default.packageIsInstalled(package2check)) {
        let displayManager = package2check;
        if (package2check === 'gdm3') {
            // gdm3 is treat as gdm
            displayManager = 'gdm';
        }
        content = `- ${displayManager}\n`;
        // text += text === '' ? `- ${displayManager}\n` : `                 - ${displayManager}\n`
    }
    return content;
}
