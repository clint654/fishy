#!/usr/bin/python

"""fishy controller"""
#this script communicates with the arduino to control lights and relays and poll for parameters"""

# pylint: disable=C0103

import sys
import time
import serial

VERSION = "1.0"

class ArduinoSerial(object):
    """The Connection to the arduino Fish controller"""
    Ser = None
    buf = []
    channel_current_lev = [0, 32, 0, 0, 0, 0, 0, 0]
    channel_desired_lev = [0, 5, 0, 64, 0, 255, 0, 0]

    def __init__(self, SerialName):
        "Opens the serial interface"

        self.Ser = serial.Serial(SerialName, 115200, timeout=1, dsrdtr=False)  # open serial port
        print self.Ser
        time.sleep(0.1)

    def get_all_parameters(self):
        """Sends a ? to the arduino to return all current values"""

        print self.Ser
        self.Ser.write('?\n')
        time.sleep(1)
        print self.read_buffer()

    def close(self):
        """Close Serial Interface"""
        self.Ser.close()

    def read_buffer(self):
        """reads all strings in the Serial Buffer"""
        while self.Ser.inWaiting() > 0:
            line = self.Ser.readline()
            #self.buf.append({"time": time.time() , "res": line})
            self.buf.append(line)
        return self.buf

    def parse_line(self,line):
        """parse the line"""

    def update_channels(self):
        """update the channels"""
        print "Update" 
        print self.channel_current_lev;
        print self.channel_desired_lev;
        for i in range(0,6):
          diff = (self.channel_desired_lev[i] - self.channel_current_lev[i])
          if (diff !=0):
            print "change {0}".format(diff)
            if (abs(diff) <=4):
              self.channel_current_lev[i]=self.channel_desired_lev[i]
            elif (diff>0):
              self.channel_current_lev[i]+=4;
            else:
              self.channel_current_lev[i]-=4;
          self.Ser.write("l {0} {1}\n".format(i,self.channel_current_lev[i]))

    def process_replies(self,buffer):
      """process the replies"""
      
        

    def ping(self):
      """ping"""
      self.Ser.write("Ping\n") 


print "Welcome to Fishy Controller version: " + VERSION + "\n"

Controller = ArduinoSerial('/dev/ttyACM0')
time.sleep(1) #arduino needs to reset after

print Controller.Ser.write("?\n")
print Controller.ping()
print Controller.read_buffer()

now = time.time()
start = time.time()
lasttime = time.time()
lastping = time.time()
lastlights = time.time()

while True:
  now = time.time()
  #read any new lines into the buffer
  Controller.read_buffer()

  #Every 5 Seconds ping
  if int(now/4) > lastping/4:
    Controller.ping()
    lastping=now
    print Controller.buf

  #Update Lights
  if int(now/2) > lastlights/2:
    Controller.update_channels()
    lastlights=now

  #print "time: {0} {1}".format(now,lastping)

  time.sleep(0.2)
  

