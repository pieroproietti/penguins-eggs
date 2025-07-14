/**
 * ./src/krill/prepare.d/welcome.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import React from 'react'
import {confirm} from './confirm.js'

import Location from '../../components/location.js'
import { ILocation } from '../../interfaces/i_krill.js'
import Prepare from '../prepare.js'
import Utils from '../../../classes/utils.js'
import selectRegions from '../../lib/select_regions.js'
import selectZones from '../../lib/select_zones.js'
import axios from 'axios'
import shx from 'shelljs'


/**
 * 
 * @param this
 * @param language 
 * @returns 
 */

export async function location(this: Prepare, language: string): Promise<ILocation> {
    let region = this.krillConfig.region
    if (region === '' || region === undefined) {
        let region = shx.exec('cut -f1 -d/ < /etc/timezone', { silent: true }).stdout.trim()
    }
    let zone = this.krillConfig.zone
    if (zone === '' || zone === undefined) {
        zone = shx.exec('cut -f2 -d/ < /etc/timezone', { silent: true }).stdout.trim()
    }

    // Try to auto-configure timezone by internet
    const url = `https://geoip.kde.org/v1/calamares`
    try {
        const response = await axios.get(url)
        if (response.statusText === 'OK') {
            const data = JSON.stringify(response.data)
            const obj = JSON.parse(data)
            region = obj.time_zone.substring(0, obj.time_zone.indexOf('/'))
            zone = obj.time_zone.substring(obj.time_zone.indexOf('/') + 1)
        }
    } catch (error) {
        console.error('error: ' + error)
    }

    let locationElem: JSX.Element
    while (true) {
        locationElem = <Location language={language} region={region} zone={zone} />
        if (await confirm(locationElem, "Confirm location datas?")) {
            break
        }
        region = await selectRegions(region)
        zone = await selectZones(region)
    }

    return {
        language: language,
        region: region,
        zone: zone
    }
}
