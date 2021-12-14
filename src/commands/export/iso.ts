/**
 *
 */
import {Command, Flags} from '@oclif/core' 
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'
import {exec} from '../../lib/utils'

export default class ExportIso extends Command {
   static description = 'export iso in the destination host'

   static flags = {
     help: Flags.help({char: 'h'}),
     backup: Flags.boolean({char: 'b', description: 'export backup ISOs'}),
     clean: Flags.boolean({char: 'c', description: 'delete old ISOs before to copy'}),
   }

   async run() :Promise <void> {
     const {flags} = await this.parse(ExportIso)
     Utils.titles(this.id + ' ' + this.argv)

     const Tu = new Tools()
     Utils.warning(ExportIso.description)
     await Tu.loadSettings()
     if (flags.backup) {
       Tu.snapshot_name = Tu.snapshot_name.slice(0, 7) === 'egg-of-' ? 'backup-' + Tu.snapshot_name.slice(7) : 'backup-' + Tu.snapshot_name
     }

     let cmd = `ssh root@${Tu.config.remoteHost} rm -rf ${Tu.config.remotePathIso}${Tu.snapshot_name}*`
     if (flags.clean) {
       Utils.warning('cleaning destination...')
       await exec(cmd, {echo: true, capture: true})
     }

     Utils.warning('copy to destination...')
     cmd = `scp ${Tu.snapshot_dir}${Tu.snapshot_name}* root@${Tu.config.remoteHost}:${Tu.config.remotePathIso}`
     await exec(cmd, {echo: true, capture: true})
   }
}
