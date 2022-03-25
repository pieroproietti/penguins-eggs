/**
 * penguins-eggs
 * selectKeyboardVariant
 * author: Piero Proietti
 */
 import inquirer from 'inquirer'
 import Keyboards from '../classes/keyboard'
import Utils from '../classes/utils'
 
 /**
  * 
  */
 export default async function selectKeyboardVariant(keyboardLayout = ''): Promise<string> {
   const keyboards = new Keyboards()
   const supported = await keyboards.getVariants(keyboardLayout)
 
   const questions: Array<Record<string, any>> = [
     {
       type: 'list',
       name: 'variant',
       message: 'Select variant: ',
       choices: supported,
       default: ''
     }
   ]
 
   return new Promise(function (resolve) {
     inquirer.prompt(questions).then(function (options) {
       resolve(options.variant)
     })
   })
 }
 
 