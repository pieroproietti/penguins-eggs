/**
 * ./src/krill/prepare.d/keyboard.tsx
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import React from 'react'
import {confirm} from './confirm.js'

import Keyboard from '../../components/keyboard.js'
import { IKeyboard } from '../../interfaces/i_krill.js'
import Prepare from '../prepare.js'
import Utils from '../../../classes/utils.js'
import selectKeyboardOption from '../../lib/select_keyboard_option.js'
import selectKeyboardModel from '../../lib/select_keyboard_model.js'
import selectKeyboardVariant from '../../lib/select_keyboard_variant.js'
import selectKeyboardLayout from '../../lib/select_keyboard_layout.js'


/**
 * KEYBOARD
 */
export async function keyboard(this: Prepare): Promise<IKeyboard> {
    let keyboardModel = this.krillConfig.keyboardModel
    if (keyboardModel === '' || keyboardModel === undefined) {
        keyboardModel = await this.keyboards.getModel()
    }

    let keyboardLayout = this.krillConfig.keyboardLayout
    if (keyboardLayout === '' || keyboardLayout === undefined) {
        keyboardLayout = await this.keyboards.getLayout()
    }

    let keyboardVariant = this.krillConfig.keyboardVariant
    if (keyboardVariant === '' || keyboardVariant === undefined) {
        keyboardVariant = await this.keyboards.getVariant()
    }

    let keyboardOption = this.krillConfig.keyboardOption
    if (keyboardOption === '' || keyboardOption === undefined) {
        keyboardOption = await this.keyboards.getOption()
    }


    let keyboardElem: JSX.Element
    while (true) {
        keyboardElem = <Keyboard keyboardModel={keyboardModel} keyboardLayout={keyboardLayout} keyboardVariant={keyboardVariant} keyboardOptions={keyboardOption} />
        if (await confirm(keyboardElem, "Confirm Keyboard datas?")) {
            break
        } else {
            keyboardModel = 'pc105'
            keyboardModel = await selectKeyboardModel(keyboardModel)

            keyboardLayout = 'us'
            keyboardLayout = await selectKeyboardLayout(keyboardLayout)

            keyboardVariant = ''
            keyboardVariant = await selectKeyboardVariant(keyboardLayout)

            keyboardOption = ''
            keyboardOption = await selectKeyboardOption(keyboardOption)
            if (keyboardModel === '') {
                keyboardModel = 'pc105'
            }
        }
    }
    return {
        keyboardModel: keyboardModel,
        keyboardLayout: keyboardLayout,
        keyboardVariant: keyboardVariant,
        keyboardOption: keyboardOption
    }
}
