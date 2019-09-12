/**
 * penguins-eggs: utils.js
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
/**
 * utils
 */
declare class utils {
    addUser(username?: string, password?: string, fullName?: string, roomNumber?: string, workPhone?: string, homePhone?: string): Promise<void>;
    changePassword(username?: string, newPassword?: string): Promise<void>;
    delUser(username?: string): Promise<void>;
    isLive(): Promise<Boolean>;
    isRoot(): Boolean;
    isMounted(check: string): Promise<boolean>;
    netNetmask(): string;
    netDomainName(): string;
    netDns(): string;
    netGateway(): string;
    netBootServer(): string;
    netDeviceName(): string;
    kernerlVersion(): string;
    bashWrite(file: string, text: string): void;
    exec(cmd: string): void;
    rsync(commands: Array<string>): void;
    sr(file: string, search: string, replace: string): void;
    hostname(target: string, hostname: string): void;
    date4label(): string;
    date4file(): String;
    /**
    *
    * Funzioni interne: calcolo rete; copiate da ipcalc
    *
    */
    /**
     * ANDs 32 bit representations of IP and submask to get network address
     *
     * @param {number} 32 bit representation of IP address
     * @param {number} 32 bit representation of submask
     * @return {number} 32 bit representation of IP address (network address)
     */
    net(ip: string, sm: string): string;
    execute(command: string): Promise<string>;
}
declare const _default: utils;
export default _default;
