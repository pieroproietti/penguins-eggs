/**
 * ./src/krill/prepare.d/welcome.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */
import React from 'react'

import Welcome from '../../components/welcome.js'
import { IWelcome } from '../../interfaces/i_krill.js'
import selectLanguages from '../../lib/select_languages.js'
import Prepare from '../prepare.js'
import {confirm} from './confirm.js'


/**
 * WELCOME
 */
export async function welcome(this: Prepare): Promise<IWelcome> {

  let {language} = this.krillConfig
  if (language === '' || language === undefined) {
    language = await this.locales.getDefault() // 'en_US.UTF-8'
  }

  let welcomeElem: JSX.Element
  while (true) {
    welcomeElem = <Welcome language={language} />
    if (await confirm(welcomeElem, "Confirm Welcome datas?")) {
      break
    }

    language = await selectLanguages(language)
  }

  return { language }
}
