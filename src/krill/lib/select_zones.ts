/**
 * ./src/lib/select_zones.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function selectRegions(region = ''): Promise<string> {
  const africa = [
    'Abidjan',
    'Accra',
    'Addis_Ababa',
    'Algiers',
    'Asmara',
    'Bamako',
    'Bangui',
    'Banjul',
    'Bissau',
    'Blantyre',
    'Brazzaville',
    'Bujumbura',
    'Cairo',
    'Casablanca',
    'Ceuta',
    'Conakry',
    'Dakar',
    'Dar_es_Salaam',
    'Djibouti',
    'Douala',
    'El_Aaiun',
    'Freetown',
    'Gaborone',
    'Harare',
    'Johannesburg',
    'Juba',
    'Kampala',
    'Khartoum',
    'Kigali',
    'Kinshasa',
    'Lagos',
    'Libreville',
    'Lome',
    'Luanda',
    'Lubumbashi',
    'Lusaka',
    'Malabo',
    'Maputo',
    'Maseru',
    'Mbabane',
    'Mogadishu',
    'Monrovia',
    'Nairobi',
    'Ndjamena',
    'Niamey',
    'Nouakchott',
    'Ouagadougou',
    'Porto-Novo',
    'Sao_Tome',
    'Timbuktu',
    'Tripoli',
    'Tunis',
    'Windhoek'
  ]

  const america = [
    'Adak',
    'Anchorage',
    'Anguilla',
    'Antigua',
    'Araguaina',
    'Argentina/Buenos_Aires',
    'Argentina/Catamarca',
    'Argentina/Cordoba',
    'Argentina/Jujuy',
    'Argentina/La_Rioja',
    'Argentina/Mendoza',
    'Argentina/Rio_Gallegos',
    'Argentina/Salta',
    'Argentina/San_Juan',
    'Argentina/San_Luis',
    'Argentina/Tucuman',
    'Argentina/Ushuaia',
    'Aruba',
    'Asuncion',
    'Atikokan',
    'Atka',
    'Bahia',
    'Bahia_Banderas',
    'Barbados',
    'Belem',
    'Belize',
    'Blanc-Sablon',
    'Boa_Vista',
    'Bogota',
    'Boise',
    'Cambridge_Bay',
    'Campo_Grande',
    'Cancun',
    'Caracas',
    'Cayenne',
    'Cayman',
    'Chicago',
    'Chihuahua',
    'Coral_Harbour',
    'Costa_Rica',
    'Creston',
    'Cuiaba',
    'Curacao',
    'Danmarkshavn',
    'Dawson',
    'Dawson_Creek',
    'Denver',
    'Detroit',
    'Dominica',
    'Edmonton',
    'Eirunepe',
    'El_Salvador',
    'Ensenada',
    'Fort_Nelson',
    'Fortaleza',
    'Glace_Bay',
    'Godthab',
    'Goose_Bay',
    'Grand_Turk',
    'Grenada',
    'Guadeloupe',
    'Guatemala',
    'Guayaquil',
    'Guyana',
    'Halifax',
    'Havana',
    'Hermosillo',
    'Indiana/Indianapolis',
    'Indiana/Knox',
    'Indiana/Marengo',
    'Indiana/Petersburg',
    'Indiana/Tell_City',
    'Indiana/Vevay',
    'Indiana/Vincennes',
    'Indiana/Winamac',
    'Inuvik',
    'Iqaluit',
    'Jamaica',
    'Juneau',
    'Kentucky/Louisville',
    'Kentucky/Monticello',
    'Kralendijk',
    'La_Paz',
    'Lima',
    'Los_Angeles',
    'Lower_Princes',
    'Maceio',
    'Managua',
    'Manaus',
    'Marigot',
    'Martinique',
    'Matamoros',
    'Mazatlan',
    'Menominee',
    'Merida',
    'Metlakatla',
    'Mexico_City',
    'Miquelon',
    'Moncton',
    'Monterrey',
    'Montevideo',
    'Montreal',
    'Montserrat',
    'Nassau',
    'New_York',
    'Nipigon',
    'Nome',
    'Noronha',
    'North_Dakota/Beulah',
    'North_Dakota/Center',
    'North_Dakota/New_Salem',
    'Nuuk',
    'Ojinaga',
    'Panama',
    'Pangnirtung',
    'Paramaribo',
    'Phoenix',
    'Port-au-Prince',
    'Port_of_Spain',
    'Porto_Acre',
    'Porto_Velho',
    'Puerto_Rico',
    'Punta_Arenas',
    'Rainy_River',
    'Rankin_Inlet',
    'Recife',
    'Regina',
    'Resolute',
    'Rio_Branco',
    'Santa_Isabel',
    'Santarem',
    'Santiago',
    'Santo_Domingo',
    'Sao_Paulo',
    'Scoresbysund',
    'Shiprock',
    'Sitka',
    'St_Barthelemy',
    'St_Johns',
    'St_Kitts',
    'St_Lucia',
    'St_Thomas',
    'St_Vincent',
    'Swift_Current',
    'Tegucigalpa',
    'Thule',
    'Thunder_Bay',
    'Tijuana',
    'Toronto',
    'Tortola',
    'Vancouver',
    'Virgin',
    'Whitehorse',
    'Winnipeg',
    'Yakutat',
    'Yellowknife'
  ]

  const antartica = ['Casey', 'Davis', 'DumontDUrville', 'Macquarie', 'Mawson', 'McMurdo', 'Palmer', 'Rothera', 'Syowa', 'Troll', 'Vostok']

  const australia = ['Adelaide', 'Brisbane', 'Broken_Hill', 'Canberra', 'Currie', 'Darwin', 'Eucla', 'Hobart', 'Lindeman', 'Lord_Howe', 'Melbourne', 'Perth', 'Sydney', 'Yancowinna']

  const artic = ['Longyearbyen']

  const asia = [
    'Aden',
    'Almaty',
    'Amman',
    'Anadyr',
    'Aqtau',
    'Aqtobe',
    'Ashgabat',
    'Atyrau',
    'Baghdad',
    'Bahrain',
    'Baku',
    'Bangkok',
    'Barnaul',
    'Beirut',
    'Bishkek',
    'Brunei',
    'Chita',
    'Choibalsan',
    'Chongqing',
    'Colombo',
    'Damascus',
    'Dhaka',
    'Dili',
    'Dubai',
    'Dushanbe',
    'Famagusta',
    'Gaza',
    'Harbin',
    'Hebron',
    'Ho_Chi_Minh',
    'Hong_Kong',
    'Hovd',
    'Irkutsk',
    'Istanbul',
    'Jakarta',
    'Jayapura',
    'Jerusalem',
    'Kabul',
    'Kamchatka',
    'Karachi',
    'Kashgar',
    'Kathmandu',
    'Khandyga',
    'Kolkata',
    'Krasnoyarsk',
    'Kuala_Lumpur',
    'Kuching',
    'Kuwait',
    'Macau',
    'Magadan',
    'Makassar',
    'Manila',
    'Muscat',
    'Nicosia',
    'Novokuznetsk',
    'Novosibirsk',
    'Omsk',
    'Oral',
    'Phnom_Penh',
    'Pontianak',
    'Pyongyang',
    'Qatar',
    'Qostanay',
    'Qyzylorda',
    'Rangoon',
    'Riyadh',
    'Sakhalin',
    'Samarkand',
    'Seoul',
    'Shanghai',
    'Singapore',
    'Srednekolymsk',
    'Taipei',
    'Tash kent',
    'Tbilisi',
    'Tehran',
    'Tel_Aviv',
    'Thimphu',
    'Tokyo',
    'Tomsk',
    'Ujung_Pandang',
    'Ulaanbaatar',
    'Urumqi',
    'Ust-Nera',
    'Vientiane',
    'Vladivostok',
    'Yakutsk',
    'Yangon',
    'Yekaterinburg',
    'Yerevan'
  ]

  const atlantic = ['Azores', 'Bermuda', 'Canary', 'Cape_Verde', 'Faroe', 'Jan_Mayen', 'Madeira', 'Reykjavik', 'South_Georgia', 'St_Helena', 'Stanley']

  const europe = [
    'Amsterdam',
    'Andorra',
    'Astrakhan',
    'Athens',
    'Belgrade',
    'Berlin',
    'Bratislava',
    'Brussels',
    'Buchares',
    'Budapest',
    'Busingen',
    'Chisinau',
    'Copenaghen',
    'Dublin',
    'Gibraltar',
    'Guernsey',
    'Helsinki',
    'Isle of Man',
    'Instanbul',
    'Jersey',
    'Kaliningrad',
    'Kiev',
    'Kirov',
    'Lisbon',
    'Ljubljana',
    'London',
    'Luxembourg',
    'Madrid',
    'Malta',
    'Mariehamn',
    'Misk',
    'Monaco',
    'Moskow',
    'Oslo',
    'Paris',
    'Podgorica',
    'Prague',
    'Riga',
    'Rome',
    'Samara',
    'San Marino',
    'Sarajevo',
    'Saratov',
    'Simferopol',
    'Skopje',
    'Sofia',
    'Stockholm',
    'Tallin',
    'Tirane',
    'Ulyanovsk',
    'Uzhgorod',
    'Vaduz',
    'Vatican',
    'Vienna',
    'Vilnius',
    'Volgograd',
    'Warsaw',
    'Zagreb',
    'Zaporozhye',
    'Zurich'
  ]

  const indian = ['Antananarivo', 'Chagos', 'Christmas', 'Cocos', 'Comoro', 'Kerguelen', 'Mahe', 'Maldives', 'Mauritius', 'Mayotte', 'Reunion']

  const pacific = [
    'Apia',
    'Auckland',
    'Bougainville',
    'Chatham',
    'Chuuk',
    'Easter',
    'Efate',
    'Enderbury',
    'Fakaofo',
    'Fiji',
    'Funafuti',
    'Galapagos',
    'Gambier',
    'Guadalcanal',
    'Guam',
    'Honolulu',
    'Johnston',
    'Kiritimati',
    'Kosrae',
    'Kwajalein',
    'Majuro',
    'Marquesas',
    'Midway',
    'Nauru',
    'Niue',
    'Norfolk',
    'Noumea',
    'Pago_Pago',
    'Palau',
    'Pitcairn',
    'Pohnpei',
    'Ponape',
    'Port_Moresby',
    'Rarotonga',
    'Saipan',
    'Samoa',
    'Tahiti',
    'Tarawa',
    'Tongatapu',
    'Truk',
    'Wake',
    'Wallis',
    'Yap'
  ]

  const us = ['Alaska', 'Aleutian', 'Arizona', 'Central', 'Eastern', 'Hawaii', 'Indiana-Starke', 'Michigan', 'Mountain', 'Pacific', 'Samoa']

  const etc = [
    'GMT',
    'GMT+0',
    'GMT+1',
    'GMT+10',
    'GMT+11',
    'GMT+12',
    'GMT+2',
    'GMT+3',
    'GMT+4',
    'GMT+5',
    'GMT+6',
    'GMT+7',
    'GMT+8',
    'GMT+9',
    'GMT-0',
    'GMT-1',
    'GMT-10',
    'GMT-11',
    'GMT-12',
    'GMT-13',
    'GMT-14',
    'GMT-2',
    'GMT-3',
    'GMT-4',
    'GMT-5',
    'GMT-6',
    'GMT-7',
    'GMT-8',
    'GMT-9',
    'GMT0',
    'Greenwich',
    'UCT',
    'UTC',
    'Universal',
    'Zulu'
  ]

  let zone = [] as string[]

  switch (region) {
    case 'Atlantic': {
      zone = atlantic

      break
    }

    case 'Africa': {
      zone = africa

      break
    }

    case 'America': {
      zone = america

      break
    }

    case 'Antarctica': {
      zone = antartica

      break
    }

    case 'Artic': {
      zone = artic

      break
    }

    case 'Australia': {
      zone = australia

      break
    }

    case 'Europe': {
      zone = europe

      break
    }

    case 'India': {
      zone = indian

      break
    }

    case 'Pacific': {
      zone = pacific

      break
    }
    // No default
  }

  const questions: any = [
    {
      choices: zone,
      message: 'Please select the city or region corresponding to your time zone: ',
      name: 'zone',
      type: 'list'
    }
  ]

  return new Promise((resolve) => {
    inquirer.prompt(questions).then((options: any) => {
      resolve(options.zone)
    })
  })
}
