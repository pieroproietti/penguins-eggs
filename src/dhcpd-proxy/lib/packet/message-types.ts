// etrick/src/lib/packet/message-types.ts

export enum DhcpMessageType {
    DHCPACK      = 5,
    DHCPDECLINE  = 4,
    DHCPDISCOVER = 1,
    DHCPINFORM   = 8,
    DHCPNAK      = 6,
    DHCPOFFER    = 2,
    DHCPRELEASE  = 7,
    DHCPREQUEST  = 3,
}