export interface IWelcome {
   language: string
}

export interface ILocation {
   language: string,
   region: string,
   zone: string
 }

export interface IKeyboard {
   keyboardModel: string,
   keyboardLayout: string,
   keyboardVariant: string
}

export interface IPartitions {
   installationDevice: string,
   installationMode: string,
   filesystemType: string,
   userSwapChoice: string
}

export interface IUsers {
   name: string,
   fullname: string,
   password: string,
   rootPassword: string,
   autologin: boolean,
   hostname: string
}
