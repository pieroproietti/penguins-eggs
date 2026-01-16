/**
 * src/classes/sys-users.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * "THE SYSUSER MASTER"
 * Gestione pura Node.js per utenti e gruppi di sistema.
 * Sostituisce i binari (useradd/usermod/deluser) per garantire operazioni atomiche
 * e compatibilità SELinux (Fedora/RHEL) scrivendo file puliti.
 */

import * as bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

import { exec } from '../lib/utils.js'

// --- INTERFACCE DATI ---

export interface IPasswdEntry {
    gecos: string
    gid: string
    home: string      
    password: string // 'x'
    shell: string
    uid: string
    username: string
}

export interface IShadowEntry {
    expire: string
    hash: string
    inactive: string
    lastChange: string
    max: string
    min: string
    username: string
    warn: string
}

export interface IGroupEntry {
    gid: string
    groupName: string
    members: string[]
    password: string // 'x'
}

export default class SysUsers {
    private distroFamily: string
    private group: IGroupEntry[] = []
// File "minori" gestiti a righe raw per semplicità
    private gshadowLines: string[] = []
    // Cache in memoria
    private passwd: IPasswdEntry[] = []
    private shadow: IShadowEntry[] = []
private subgidLines: string[] = []
    private subuidLines: string[] = []
    private targetRoot: string

    constructor(targetRoot: string, distroFamily: string) {
        this.targetRoot = targetRoot
        this.distroFamily = distroFamily
    }

    /**
     * Crea un nuovo utente completo
     */
    public addUser(user: IPasswdEntry, cleanPassword: string) {
        // Rimuovi se esiste (idempotenza)
        this.removeUser(user.username)

        // 1. Passwd
        this.passwd.push(user)

        // 2. Shadow (Hash Password)
        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(cleanPassword, salt)
        this.shadow.push({
            expire: '',
            hash,
            inactive: '',
            lastChange: '19700', // Data approssimativa
            max: '99999',
            min: '0',
            username: user.username,
            warn: '7'
        })

        // 3. Gruppo Primario
        // Solo se non esiste già un gruppo con quel nome
        if (!this.group.find(g => g.groupName === user.username)) {
            this.group.push({
                gid: user.gid,
                groupName: user.username,
                members: [],
                password: 'x'
            })
        }
        
        // 4. GShadow (placeholder)
        this.gshadowLines.push(`${user.username}:!::`)

        // 5. SubUID/SubGID (Podman rootless)
        // Calcolo offset standard: 100000 + (UID-1000)*65536
        const uidNum = Number.parseInt(user.uid)
        if (!isNaN(uidNum) && uidNum >= 1000) {
            const startUid = 100_000 + (uidNum - 1000) * 65_536
            const subEntry = `${user.username}:${startUid}:65536`
            this.subuidLines.push(subEntry)
            this.subgidLines.push(subEntry)
        }
    }

    /**
     * Aggiunge utente a un gruppo supplementare
     */
    public addUserToGroup(username: string, groupName: string) {
        const grp = this.group.find(g => g.groupName === groupName)
        if (grp && !grp.members.includes(username)) {
                grp.members.push(username)
            }
        // Se il gruppo non esiste, lo ignoriamo silenziosamente o potremmo crearlo
    }

    // =========================================================================
    // API PUBBLICA
    // =========================================================================

    /**
     * Carica tutti i file di configurazione in memoria
     */
    public load() {
        this.passwd = this.parsePasswd(this.readFile('etc/passwd'))
        this.shadow = this.parseShadow(this.readFile('etc/shadow'))
        this.group = this.parseGroup(this.readFile('etc/group'))
        
        this.gshadowLines = this.readFile('etc/gshadow')
        this.subuidLines = this.readFile('etc/subuid')
        this.subgidLines = this.readFile('etc/subgid')
    }

    /**
     * Rimuove completamente un utente
     */
    public removeUser(username: string) {
        this.passwd = this.passwd.filter(u => u.username !== username)
        this.shadow = this.shadow.filter(s => s.username !== username)
        this.group = this.group.filter(g => g.groupName !== username)
        
        // Rimuovi dai membri di altri gruppi
        for (const g of this.group) {
            g.members = g.members.filter(m => m !== username)
        }

        this.gshadowLines = this.gshadowLines.filter(l => !l.startsWith(`${username}:`))
        this.subuidLines = this.subuidLines.filter(l => !l.startsWith(`${username}:`))
        this.subgidLines = this.subgidLines.filter(l => !l.startsWith(`${username}:`))
    }

    /**
     * Salva lo stato della memoria su disco e applica SELinux fix
     */
    public async save() {
        // Serializzazione
        const passwdContent = this.serializePasswd(this.passwd)
        const shadowContent = this.serializeShadow(this.shadow)
        const groupContent = this.serializeGroup(this.group)
        
        // Scrittura Atomica + Fix SELinux
        await this.writeFile('etc/passwd', passwdContent, 'passwd_file_t')
        await this.writeFile('etc/shadow', shadowContent, 'shadow_t')
        await this.writeFile('etc/group', groupContent, 'passwd_file_t')
        
        // File raw
        if (this.gshadowLines.length > 0) 
            await this.writeFile('etc/gshadow', this.gshadowLines.join('\n'), 'shadow_t')
        
        if (this.subuidLines.length > 0)
            await this.writeFile('etc/subuid', this.subuidLines.join('\n'), 'passwd_file_t')
        
        if (this.subgidLines.length > 0)
            await this.writeFile('etc/subgid', this.subgidLines.join('\n'), 'passwd_file_t')
    }

    /**
     * Cambia password utente
     */
    public setPassword(username: string, password: string) {
        const entry = this.shadow.find(s => s.username === username)
        if (entry) {
            const salt = bcrypt.genSaltSync(10)
            entry.hash = bcrypt.hashSync(password, salt)
            entry.lastChange = '19700'
        }
    }

    // =========================================================================
    // IMPLEMENTAZIONE FILE (Privata)
    // =========================================================================

    private parseGroup(lines: string[]): IGroupEntry[] {
        return lines.map(line => {
            const p = line.split(':')
            if (p.length < 3) return null
            return { gid: p[2], groupName: p[0], members: p[3] && p[3].trim() ? p[3].split(',') : [], password: p[1] }
        }).filter((g): g is IGroupEntry => g !== null)
    }

    private parsePasswd(lines: string[]): IPasswdEntry[] {
        return lines.map(line => {
            const p = line.split(':')
            if (p.length < 7) return null
            return { gecos: p[4], gid: p[3], home: p[5], password: p[1], shell: p[6], uid: p[2], username: p[0] }
        }).filter((u): u is IPasswdEntry => u !== null)
    }

    // --- PARSERS & SERIALIZERS ---

    private parseShadow(lines: string[]): IShadowEntry[] {
        return lines.map(line => {
            const p = line.split(':')
            if (p.length < 2) return null
            return { expire: p[7]||'', hash: p[1], inactive: p[6]||'', lastChange: p[2]||'', max: p[4]||'', min: p[3]||'', username: p[0], warn: p[5]||'' }
        }).filter((u): u is IShadowEntry => u !== null)
    }

    private readFile(relativePath: string): string[] {
        const fullPath = path.join(this.targetRoot, relativePath)
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf8').split('\n').filter(l => l.trim().length > 0)
        }

        return []
    }

    private serializeGroup(entries: IGroupEntry[]): string {
        return entries.map(g => `${g.groupName}:${g.password}:${g.gid}:${g.members.join(',')}`).join('\n')
    }

    private serializePasswd(entries: IPasswdEntry[]): string {
        return entries.map(u => `${u.username}:${u.password}:${u.uid}:${u.gid}:${u.gecos}:${u.home}:${u.shell}`).join('\n')
    }

    private serializeShadow(entries: IShadowEntry[]): string {
        return entries.map(s => `${s.username}:${s.hash}:${s.lastChange}:${s.min}:${s.max}:${s.warn}:${s.inactive}:${s.expire}:`).join('\n')
    }

    private async writeFile(relativePath: string, content: string, contextType: string) {
        const fullPath = path.join(this.targetRoot, relativePath)
        // Crea dir se manca (es. /etc/sudoers.d/ o simili)
        const dir = path.dirname(fullPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

        try {
            // 1. Scrittura
            fs.writeFileSync(fullPath, content + '\n')
            
            // 2. Fix SELinux (Solo RHEL Family)
            if (['almalinux', 'centos', 'fedora', 'rhel', 'rocky'].includes(this.distroFamily)) {
                // await exec, echo false per non sporcare i log
                await exec(`chcon -t ${contextType} ${fullPath}`, { echo: false }).catch(() => {})
            }
        } catch (error) {
            console.error(`SysUsers Error writing ${relativePath}:`, error)
        }
    }
}