#!/usr/bin/perl

use strict;
use warnings;
use Device::SerialPort

my $port = '/dev/ttyACM0';
my $baud = 115200;

my $port = new Device::SerialPort($port); 
$port->user_msg(ON); 
$port->baudrate($baud); 
$port->parity("none"); 
$port->databits(8); 
$port->stopbits(1); 
$port->handshake("xoff"); 
$port->write_settings;

$port->lookclear; 
$port->write("?");

my $answer = $port->lookfor;
print $answer;

