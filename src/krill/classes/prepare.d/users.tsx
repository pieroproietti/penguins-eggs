/**
 * ./src/krill/prepare.d/users.tsx
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */
import React from 'react'
import { confirm} from './confirm.js'

import Users from '../../components/users.js'
import { IUsers } from '../../interfaces/i_krill.js'
import Prepare from '../prepare.js'
import getUsername from '../../lib/get_username.js'
import getUserfullname from '../../lib/get_userfullname.js'
import getPassword from '../../lib/get_password.js'
import getHostname from '../../lib/get_hostname.js'
import shx from 'shelljs'




/**
 * USERS
 */
export async function users(this: Prepare): Promise<IUsers> {

    let username = this.krillConfig.name
    if (username === '' || username === undefined) {
        username = 'artisan'
    }

    let fullname = this.krillConfig.fullname
    if (fullname === '' || fullname === undefined) {
        fullname = username
    }

    let password = this.krillConfig.password
    if (password === '' || password === undefined) {
        password = 'evolution'
    }

    let rootPassword = this.krillConfig.rootPassword
    if (rootPassword === '' || rootPassword === undefined) {
        rootPassword = 'evolution'
    }

    let hostname = this.krillConfig.hostname
    if (hostname === '' || hostname === undefined) {
        hostname = shx.exec('cat /etc/hostname').trim()
    }

    let autologin = true

    let sameUserPassword = true

    let usersElem: JSX.Element
    while (true) {
        usersElem = <Users username={username} fullname={fullname} hostname={hostname} password={password} rootPassword={rootPassword} autologin={autologin} sameUserPassword={sameUserPassword} />
        if (await confirm(usersElem, "Confirm Users datas?")) {
            break
        }
        username = await getUsername(username)
        fullname = await getUserfullname(fullname)
        password = await getPassword(username, password)
        rootPassword = await getPassword('root', password)
        hostname = await getHostname(hostname)
    }

    return {
        username: username,
        fullname: fullname,
        password: password,
        rootPassword: rootPassword,
        autologin: autologin,
        hostname: hostname
    }
}
