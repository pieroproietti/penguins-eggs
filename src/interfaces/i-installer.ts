/**
 * name  = 'calamares' oppure 'krill'
 * configuration = '/etc/calamares/' o '/etc/penguins-eggs.d/krill/'
 * modules = configuration + 'modules/'
 * modulesMultiarch = '/usr/lib/' + arch-linux-gnu + '/' + installer + '/'
 *
 * template = '/etc/penguins-eggs/' + .distro.codenameLikeId + '/' + installer + '/'
 * templateModules = template + '/modules/'
 * templateMultiarch = template + installer + '-modules/'
 */
export interface IInstaller {
  name: string
  configRoot: string
  modules: string
  multiarch: string
  multiarchModules: string

  template: string
  templateModules: string
  templateMultiarch: string
}
