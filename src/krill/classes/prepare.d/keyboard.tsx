/**
 * ./src/krill/prepare.d/keyboard.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import React from 'react'

import Utils from '../../../classes/utils.js'
import Keyboard from '../../components/keyboard.js'
import { IKeyboard } from '../../interfaces/i_krill.js'
import selectKeyboardLayout from '../../lib/select_keyboard_layout.js'
import selectKeyboardModel from '../../lib/select_keyboard_model.js'
import selectKeyboardOption from '../../lib/select_keyboard_option.js'
import selectKeyboardVariant from '../../lib/select_keyboard_variant.js'
import Prepare from '../prepare.js'
import { confirm } from './confirm.js'


/**
 * KEYBOARD
 */
export async function keyboard(this: Prepare): Promise<IKeyboard> {
    let { keyboardModel } = this.krillConfig
    if (keyboardModel === '' || keyboardModel === undefined) {
        keyboardModel = await this.keyboards.getModel()
    }

    let { keyboardLayout } = this.krillConfig
    if (keyboardLayout === '' || keyboardLayout === undefined) {
        keyboardLayout = await this.keyboards.getLayout()
    }

    let { keyboardVariant } = this.krillConfig
    if (keyboardVariant === '' || keyboardVariant === undefined) {
        keyboardVariant = await this.keyboards.getVariant()
    }

    let { keyboardOption } = this.krillConfig
    if (keyboardOption === '' || keyboardOption === undefined) {
        keyboardOption = await this.keyboards.getOption()
    }


    let keyboardElem: React.JSX.Element
    while (true) {
        keyboardElem = <Keyboard keyboardLayout={keyboardLayout} keyboardModel={keyboardModel} keyboardOptions={keyboardOption} keyboardVariant={keyboardVariant} />
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
        keyboardLayout,
        keyboardModel,
        keyboardOption,
        keyboardVariant
    }
}
