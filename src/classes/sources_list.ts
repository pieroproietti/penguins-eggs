/**
 * penguins-eggs: tailor.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

import chalk from 'chalk'
import Utils from './utils'
import { IMateria } from '../interfaces'
import { exec } from '../lib/utils'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import Pacman from './pacman'
import Distro from './distro'


/**
 * 
 */
export default class SourcesList {

   /**
    * 
    * @param repos 
    * @returns 
    */
   async distribution(distributions: string[]): Promise<boolean> {
      const repos = await this.get()

      /**
      * Linuxmint non ha nessuna configurazione in /etc/apt/sources.list
      */
      if (repos.length === 0) {

      }

      const distro = new Distro()

      let checked = false
      for (const distribution of distributions) {
         for (const repo of repos) {
            if (repo.includes(distro.codenameLikeId)) {
               checked = true
            }
         }
      }
      if (!checked) {
         console.log('You are on: ' + chalk.green(distro.distroId) + '/' + chalk.green(distro.codenameId))
         console.log('compatible with: ' + chalk.green(distro.distroLike) + '/' + chalk.green(distro.codenameLikeId))
         console.log(`This costume/accessory apply to: `)
         for (const distribution of distributions) {
            console.log(`- ${distribution}`)
         }
         Utils.pressKeyToExit('distribution warning, check your /etc/apt/sources.list', true)
      }
      return checked
   }

   /**
    * 
    * @param repos 
    * @returns 
    */
   async components(components: string[]): Promise<boolean> {
      const repos = await this.get()
      let checked = true
      for (const repo of repos) {
         for (const component of components) {
            // On security we need just main
            if (!repo.includes('security')) {
               if (!repo.includes(component)) {
                  console.log('component: ' + chalk.green(component) + ' is not included in repo: ' + chalk.green(repo))
                  checked = false
               }
            }
         }
      }

      if (checked) {
         Utils.warning('repositories checked')
      } else {
         Utils.pressKeyToExit('component warning, check your /etc/apt/sources.list', true)
      }
      return checked
   }

   /**
    * 
    */
   private async get(): Promise<string[]> {
      // deb uri distribution [component1] [component2] [...]
      let checkRepos = await exec(`grep "deb http"</etc/apt/sources.list`, { echo: false, capture: true })
      let tmp: string[] = []
      if (checkRepos.code === 0) {
         tmp = checkRepos.data.split('\n')
      }

      // remove empty line
      let repos: string[] = []
      for (const repo of tmp) {
         if (repo !== '') {
            repos.push(repo)
         }
      }
      return repos
   }
}