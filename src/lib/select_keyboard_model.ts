/**
 * penguins-eggs
 * selectKeyboardModel
 * author: Piero Proietti
 */
 import inquirer from 'inquirer'
 import Keyboards from '../classes/keyboard'
 
 /**
  * 
  */
 export default async function selectKeyboardModel(selected = ''): Promise<string> {
   const keyboards = new Keyboards()
   const supported = await keyboards.getModels()
 
   const questions: Array<Record<string, any>> = [
     {
       type: 'list',
       name: 'model',
       message: 'Select model: ',
       choices: supported,
       default: selected
     }
   ]
 
   return new Promise(function (resolve) {
     inquirer.prompt(questions).then(function (options) {
       resolve(options.model)
     })
   })
 }
 
 