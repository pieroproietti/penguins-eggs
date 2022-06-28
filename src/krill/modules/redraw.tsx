/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

 import Sequence from '../krill-sequence'
 import shx from 'shelljs'
 import { render, RenderOptions } from 'ink'
 

/**
 * Occorre farglierlo rigenerare a forza
 * anche quando NON cambiano i dati
 * forceUpdate
 */
 export default function redraw(elem: JSX.Element) {
    let opt: RenderOptions = {}

    opt.patchConsole = false
    opt.debug = false

    shx.exec('clear')
    render(elem, opt)
}

