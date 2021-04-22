/**
 * rifacimento di makemain in ts
 */

import fs = require('fs')
import {IPackage} from '../interfaces'
import yaml = require('js-yaml')
import shx = require('shelljs')

export default function convertHtml() {
  if (fs.existsSync('pb.yaml')) {
    let pbPackage = {} as IPackage
    pbPackage = yaml.load(fs.readFileSync('pb.yaml', 'utf8')) as IPackage
    
    const tempMd = pbPackage.destDir + '/DEBIAN/' + pbPackage.name + '.md'
    const srcHtml = pbPackage.destDir + '/DEBIAN/' + pbPackage.name + '.html'
    const destHtml = pbPackage.destDir + '/usr/lib/penguins-eggs/manpages/doc/man/' + pbPackage.name + '.1.html'


    const  vfile = require('to-vfile')
    const  report = require('vfile-reporter')
    const  unified = require('unified')
    const  markdown = require('remark-parse')
    const  remark2rehype = require('remark-rehype')
    const  doc = require('rehype-document')
    const  format = require('rehype-format')
    const  html = require('rehype-stringify')

    unified()
    .use(markdown)
    .use(remark2rehype)
    .use(doc)
    .use(format)
    .use(html)
    .process(vfile.readSync(tempMd), function (err: any, file: any) {
      console.error(report(err || file))
      file.extname = '.html'
      vfile.writeSync(file)
    })
    // shx.exec(`ls ${pbPackage.destDir}/DEBIAN`)
    shx.exec('mv ' + srcHtml + ' ' + destHtml)
  }
}
