
import {exec} from '../src/lib/utils'
import Utils from '../src/classes/utils'
import fs from 'fs'
import yaml from 'js-yaml'
import Locales from '../src/classes/locales'
import Keyboard from '../src/classes/keyboard'

main()

async function main() {
  Utils.titles()

  const locales = new Locales()
  const enabledLocales = await locales.getEnabled()
  const supportedLocales = await locales.getSupported()
  const defaultLocale = await locales.getDefault()

  // console.log(`enabledLocales: ${yaml.dump(enabledLocales)}`)
  // console.log(`-supported: ${yaml.dump(supportedLocales)}`)
  // console.log(`defaultLocale: ${defaultLocale}`)

  const keyboard = new Keyboard()
  const keyboardModel = await  keyboard.getModel()
  const keyBoardModels = await keyboard.getModels()
  const keyboardLayout = await keyboard.getLayout()
  const keyboardLayouts = await keyboard.getLayouts()

  const keyboardVariant = await keyboard.getVariant()
  const keyboardVariants = await keyboard.getVariants(keyboardLayout)

  const keyboardOption = await keyboard.getOption()
  const keyboardOptions = await keyboard.getOptions()

  // console.log(`keyboardModel: ${yaml.dump(keyboardModel)}`)
  // console.log(yaml.dump(keyBoardModels))
  console.log(`keyboardLayout: ${yaml.dump(keyboardLayout)}`)
  console.log(JSON.stringify(keyboardLayouts))
  // console.log(`keyboardVariant: ${yaml.dump(keyboardVariant)}`)
  // console.log(yaml.dump(keyboardVariants))
  // console.log(`keyboardOption: ${yaml.dump(keyboardOption)}`)
  // console.log(yaml.dump(keyboardOptions))
}

