export interface ISettings {
    'modules-search': string[],
    'sequence': {
        show: string[],
        exec: string[]
    },
    'branding': string,
    'prompt-install': boolean,
    'dont-chroot': boolean
}
