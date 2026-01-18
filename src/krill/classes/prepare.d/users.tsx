/**
 * ./src/krill/prepare.d/users.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */
import React from 'react'

import { shx } from '../../../lib/utils.js'
import Users from '../../components/users.js'
import { IUsers } from '../../interfaces/i_krill.js'
import getHostname from '../../lib/get_hostname.js'
import getPassword from '../../lib/get_password.js'
import getUserfullname from '../../lib/get_userfullname.js'
import getUsername from '../../lib/get_username.js'
import Prepare from '../prepare.js'
import { confirm } from './confirm.js'


/**
 * USERS
 */
export async function users(this: Prepare): Promise<IUsers> {

    let { fullname } = this.krillConfig

    let username = this.krillConfig.name
    if (username === '' || username === undefined) {
        username = 'artisan'
    }

    let { password } = this.krillConfig
    if (password === '' || password === undefined) {
        password = 'evolution'
    }

    let { rootPassword } = this.krillConfig
    if (rootPassword === '' || rootPassword === undefined) {
        rootPassword = 'evolution'
    }

    let { hostname } = this.krillConfig
    if (hostname === '' || hostname === undefined) {
        hostname = shx.exec('cat /etc/hostname', { silent: true }).stdout.trim()
    }

    let autologin = false

    const sameUserPassword = true

    let usersElem: React.JSX.Element
    while (true) {
        usersElem = <Users autologin={autologin} fullname={fullname} hostname={hostname} password={password} rootPassword={rootPassword} sameUserPassword={sameUserPassword} username={username} />
        if (await confirm(usersElem, "Confirm Users datas?")) {
            break
        }

        fullname = await getUserfullname(fullname)
        if (fullname !== '') username = fullname.trim().split(' ')[0].toLowerCase();
        username = await getUsername(username)
        password = await getPassword(username, password)
        rootPassword = await getPassword('root', password)
        hostname = await getHostname(hostname)
        autologin = autologin
    }

    return {
        autologin,
        fullname,
        hostname,
        password,
        rootPassword,
        username
    }
}
