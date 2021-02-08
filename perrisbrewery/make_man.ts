/**
 * rifacimento di makemain in ts
 */
import shx = require('shelljs')

/**
 * 
 */
export default function makeMan(buildDir='') {
   console.log(`creazione versione man`)

   shx.mv('man/eggs.md', 'man/eggs')
   shx.exec(`ronn --roff --manual='eggs manual' --organization=penguins-eggs.net  --style=toc,80c      man/eggs --section 1 -o man/`)

   console.log(`compressione versione man`)
   shx.exec('gzip man/eggs.1')
   shx.mv('man/eggs.1.gz', buildDir +'eggs.1')
}
