/*
  penguins-eggs: Eggs.js
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/
"use strict";


export interface IQuestion {
    type: string;
    name: string;
    message: string;
    default: string;
    choices: string[];
    validate: any;
    transformer: any;
    when: any; // Function/boolean
    pageSize: number;
    prefix: string;
    suffix: string;
}

export interface IQuestions {
    username: IQuestion;
    userFullName: IQuestion;
    userPassword: IQuestion;
    autoLogin: IQuestion;
    rootPassword: IQuestion;
    hostName: IQuestion;
    domain: IQuestion;
    netInterface: IQuestion;
    netAddressType: IQuestion;
    netAddress: IQuestion;
    netMask: IQuestion;
    netGateway: IQuestion;
    netDns: IQuestion;
    installationDevice: IQuestion;
    mountType: IQuestion;
    fsType: IQuestion;
}
