#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = tslib_1.__importDefault(require("../src/classes/utils"));
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
const locales_1 = tslib_1.__importDefault(require("../src/classes/locales"));
const keyboard_1 = tslib_1.__importDefault(require("../src/classes/keyboard"));
main();
async function main() {
    utils_1.default.titles();
    const locales = new locales_1.default();
    const enabledLocales = await locales.getEnabled();
    const supportedLocales = await locales.getSupported();
    const defaultLocale = await locales.getDefault();
    //console.log(`enabledLocales: ${yaml.dump(enabledLocales)}`)
    // console.log(`-supported: ${yaml.dump(supportedLocales)}`)
    //console.log(`defaultLocale: ${defaultLocale}`)
    const keyboard = new keyboard_1.default();
    const keyboardModel = await keyboard.getModel();
    const keyBoardModels = await keyboard.getModels();
    const keyboardLayout = await keyboard.getLayout();
    const keyboardLayouts = await keyboard.getLayouts();
    const keyboardVariant = await keyboard.getVariant();
    const keyboardVariants = await keyboard.getVariants(keyboardLayout);
    const keyboardOption = await keyboard.getOption();
    const keyboardOptions = await keyboard.getOptions();
    // console.log(`keyboardModel: ${yaml.dump(keyboardModel)}`)
    // console.log(yaml.dump(keyBoardModels))
    console.log(`keyboardLayout: ${js_yaml_1.default.dump(keyboardLayout)}`);
    console.log(JSON.stringify(keyboardLayouts));
    // console.log(`keyboardVariant: ${yaml.dump(keyboardVariant)}`)
    // console.log(yaml.dump(keyboardVariants))
    // console.log(`keyboardOption: ${yaml.dump(keyboardOption)}`)
    // console.log(yaml.dump(keyboardOptions))
}
