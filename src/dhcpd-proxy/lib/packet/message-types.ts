// etrick/src/lib/packet/message-types.ts

export enum DhcpMessageType {
    DHCPDISCOVER = 1,
    DHCPOFFER    = 2,
    DHCPREQUEST  = 3,
    DHCPDECLINE  = 4,
    DHCPACK      = 5,
    DHCPNAK      = 6,
    DHCPRELEASE  = 7,
    DHCPINFORM   = 8,
}