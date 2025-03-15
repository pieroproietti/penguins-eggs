#!/usr/bin/expect -f
set timeout -1

spawn ./3.ci.worker.sh

expect {
    "Enter Import Password"
    {
        send "\r"
        exp_continue
    }
    "Which services should be restarted"
    {
        send "1\r"
        exp_continue
    }
}
