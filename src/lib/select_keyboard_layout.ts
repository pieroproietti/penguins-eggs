/**
 *
item =  English (EEUU)
cmd =minino-keyboard us
icon = /usr/local/share/pixmaps/us.png

item =  English (GB)
cmd =minino-keyboard gb
icon = /usr/local/share/pixmaps/gb.png

item =  Italian (Italy)
cmd =minino-keyboard it
icon = /usr/local/share/pixmaps/it.png

item =  Português (Brazil)
cmd =minino-keyboard br
icon = /usr/local/share/pixmaps/br.png

item =  Português (Portugal)
cmd =minino-keyboard pt
icon = /usr/local/share/pixmaps/pt.png

item =  Español (España)
cmd =minino-keyboard es
icon = /usr/local/share/pixmaps/es.png

item =  Español (Latam)
cmd =minino-keyboard latam
icon = /usr/local/share/pixmaps/latam.png
 */

import inquirer from 'inquirer'

export default async function selectKeyboardLayout(): Promise<string> {
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'layout',
      message: 'Select layout: ',
      choices: ['br', 'gb', 'es', 'it', 'latam', 'pt', 'us'],
      default: 'es'
    }
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.layout)
    })
  })
}
