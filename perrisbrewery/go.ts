import Makemd from './makemd'
import Makeman from './makeman'
import Makehtml from './makehtml'
import Perrisbrewery from './perrisbrewery'

//const sourcesDir = process.argv[2]
const sourcesDir = '../dist/deb/eggs_7.8.10-1_amd64.deb'

const p = new Perrisbrewery()
p.go(sourcesDir)

const md = new Makemd()
md.go()

const man = new Makeman()
man.go()

const html = new Makehtml()
html.go()




