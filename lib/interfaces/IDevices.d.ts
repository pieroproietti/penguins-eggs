export interface IDevice {
    device: string;
    fsType: string;
    mountPoint: string;
}
export interface IDevices {
    root: IDevice;
    swap: IDevice;
}
