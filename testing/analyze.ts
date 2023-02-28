
/**
 * run with: npx ts-node
 * #!/usr/bin/npx ts-node
 */

import {exec} from '../src/lib/utils'
import Utils from '../src/classes/utils'
import fs from 'fs'
import yaml from 'js-yaml'
import {string} from '@oclif/core/lib/flags'

startPoint()

async function startPoint() {
  Utils.titles('order')
  await makeInstalled()
  await makeOrder()
  const sections = await getSections()

  /**
    * per ogni sezione. creaiamo uan lista
    *     drivers_printer:
    * - autoconf
    */
  for (const section of sections) {
    console.log(section + ':')
    getPackages(section)
  }
}

/**
 *
  */
async function getPackages(section: string) {
   interface wif { name: string, section: string }
   let wifs: wif[] = []

   const content = fs.readFileSync('./testing/ordinati.yml', 'utf8')
   wifs = yaml.load(content) as wif[]

   for (const wif of wifs) {
     if (wif.section === section) {
       console.log(`- ${wif.name}`)
     }
   }
}

/**
 *
 */
async function makeInstalled() {
   interface wif { name: string, section: string }
   const wifs: wif[] = []

   const installeds: string[] = []
   const oInstalleds = await exec('apt list --installed', {echo: false, ignore: false, capture: true})
   if (oInstalleds.code === 0) {
     const elements = oInstalleds.data.split('\n')
     for (const elem of elements) {
       if (!elem.includes('Listing...') && elem !== '') {
         const pacchetto = elem.slice(0, Math.max(0, elem.indexOf('/')))
         const section = await getSection(pacchetto)
         const wif = {name: pacchetto, section: section}
         wifs.push(wif)
       }
     }
   } else {
     console.log('error')
   }

   fs.writeFileSync('./testing/installed.yml', yaml.dump(wifs))
}

/**
 *
 */
async function getSection(pacchetto: string) {
  let section = ''
  try {
    const result = await exec(`apt-cache show ${pacchetto}|grep Section:`, {echo: false, ignore: false, capture: true})
    if (result.code === 0) {
      section = result.data.slice(Math.max(0, result.data.indexOf(':') + 2)).replace(/(\r\n|\n|\r)/gm, '')
    }
  } catch (error) {
    console.log(error)
  }

  return section
}

/**
*
*/
async function getSections(): Promise<string[]> {
   interface wif { name: string, section: string }
   let wifs: wif[] = []

   /**
    * Ora abbiamo wifs ordinati per section
    * creiamo la array sections
    */
   const content = fs.readFileSync('./testing/ordinati.yml', 'utf8')
   wifs = yaml.load(content) as wif[]

   const sections: string[] = []
   let currentSection = ''
   for (const wif of wifs) {
     if (currentSection !== wif.section) {
       sections.push(wif.section)
       currentSection = wif.section
     }
   }

   return sections
}

/**
*
*/
async function makeOrder() {
   interface wif { name: string, section: string }
   let wifs: wif[] = []
   let ordinati: wif[] = []

   const content = fs.readFileSync('./testing/installed.yml', 'utf8')
   wifs = yaml.load(content) as wif[]
   ordinati = wifs.sort((a, b) => a.section.localeCompare(b.section))
   fs.writeFileSync('./testing/ordinati.yml', yaml.dump(ordinati))
}
