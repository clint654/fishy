#!/usr/bin/python

import serial
import time
import sys

ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1, dsrdtr=False)  # open serial port
print(ser)
print(ser.name)         # check which port was really used
time.sleep(1)
print (sys.argv)
ser.write('l 0 ' + sys.argv[1] + '\n')
ser.write('l 1 ' + sys.argv[2] + '\n')
ser.write('l 2 ' + sys.argv[3] + '\n')
ser.write('l 3 ' + sys.argv[4] + '\n')
ser.write('l 4 ' + sys.argv[5] + '\n')
ser.write('l 5 ' + sys.argv[6] + '\n')
ser.write('l 6 ' + sys.argv[7] + '\n')
time.sleep(0.5)

while (ser.inWaiting() >0):
	line=ser.readline()
	print(line)
time.sleep(0.1)
ser.close()             # close port
