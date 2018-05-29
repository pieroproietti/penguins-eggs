/*
  penguins-eggs: Eggs.js
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/

export interface IDevice {
    device: string;
    fsType: string;
    mountPoint: string;
}

export interface IDevices {
    root: IDevice;
    boot: IDevice;
    data: IDevice;
    swap: IDevice;
}
