#!/usr/bin/python

"""fishy controller"""
# this script communicates with the arduino to control lights and relays and poll for parameters"""

# pylint: disable=C0103

import sys
import time
import serial
import math
import MySQLdb

VERSION = "1.0"

class ArduinoSerial(object):
  """The Connection to the arduino Fish controller"""
  Ser = None
  buf = []
  channel_current_lev = [0, 0, 0, 0, 0, 0, 0, 0]
  channel_desired_lev = [0, 5, 0, 64, 0, 255, 0, 0]
  temps = [-1, -1, -1, -1]
  switches = [-1, -1, -1]
  relays = [-1, -1, -1, -1]

  def __init__(self, SerialName):
    "Opens the serial interface"

    self.Ser = serial.Serial(SerialName, 115200, timeout=1, dsrdtr=False)  # open serial port
    print self.Ser
    time.sleep(0.1)

  def get_all_parameters(self):
    """Sends a ? to the arduino to return all current values"""
    self.Ser.write('?\n')

  def close(self):
    """Close Serial Interface"""
    self.Ser.close()

  def read_buffer(self):
    """reads all strings in the Serial Buffer"""
    while self.Ser.inWaiting() > 0:
      line = self.Ser.readline().rstrip()
      self.buf.append({'time': time.time(), 'line': line})
      # self.buf.append(line)
    return self.buf

  def parse_line(self, line):
    """parse the line"""

  def update_channels(self):
    """update the channels"""
    #print "Update
    #print self.channel_current_lev
    #print self.channel_desired_lev
    for i in range(0, 7):
      diff = (self.channel_desired_lev[i] - self.channel_current_lev[i])
      if (diff != 0):
        print "change {0}".format(diff)
        if (abs(diff) <= 4):
          self.channel_current_lev[i] = self.channel_desired_lev[i]
        elif (diff > 0):
          self.channel_current_lev[i] += 4;
        else:
          self.channel_current_lev[i] -= 4;
        self.Ser.write("l {0} {1}\n".format(i, self.channel_current_lev[i]))

  def set_channels(self):
    """set the all channel state"""
    for i in range(0, 7):
      self.Ser.write("l {0} {1}\n".format(i, self.channel_desired_lev[i]))
      self.channel_current_lev[i] = self.channel_desired_lev[i]

  def process_replies(self):
    """process the replies"""
    while len(self.buf) > 0:
      o = self.buf.pop(0)
      line = o['line']
      now = o['time']
      if line.find("Welcome") != -1:  # TODO SET INITIAL STATE
        print "ARDUINO RESET"
        self.set_channels()
        self.get_all_parameters()

      elif line[0:4] == 'Pong':
        self.pongtime = now
        print "PONG {0}".format(self.pongtime)

      elif line[0:2] == 'C ':
        o = line.split(' ')
        for i in range(0, 7):
          self.channel_current_lev[i] = int(o[i + 1])

      elif line[0:2] == 'T ':
        o = line.split(' ')
        for i in range(0, 2):
          self.temps[i] = float(o[i + 1])
        print "TEMPERATURE {0}".format(self.temps)  #TODO pop mysql

      elif line[0:2] == 'S ':
        o = line.split(' ')
        for i in range(0, 2):
          self.switches[i] = float(o[i + 1])
        print "SWITCH {0}".format(self.switches)  # TODO pop mysql

      elif line[0:2] == 'R ':
        o = line.split(' ')
        for i in range(0, 4):
          self.relays[i] = float(o[i + 1])
        print "RELAYS {0}".format(self.relays)  # TODO pop mysql

      else:
        print line

  def ping(self):
    """ping"""
    self.Ser.write("Ping\n")


print "Welcome to Fishy Controller version: " + VERSION + "\n"

Controller = ArduinoSerial('/dev/ttyACM0')
time.sleep(1)  # arduino needs to reset after

now = time.time()
start = now
lasttime = now
lastping = now
lastlights = now
lastparams = now
lastlightsql = now

db = MySQLdb.connect("localhost", "fishy", "fishy", "fishy", autocommit=True)
curs = db.cursor()

#get initial state
sqltime = round(((time.time()-time.timezone)%86400)/10,0)*10
print sqltime
curs.execute("""select a.channel,a.power from time_intensity a join current_status b on (a.profile=b.profile) where time=%s; """, [sqltime])
for row in curs.fetchall():
    Controller.channel_desired_lev[row[0]] = int(row[1])



while True:
  now = time.time()
  # read any new lines into the buffer
  Controller.read_buffer()
  Controller.process_replies()

  # Every 30 Seconds ping
  if int(now / 60) > lastping / 60:
    Controller.ping()
    lastping = now

  # Every so often refresh all states
  if int(now / 120) > lastparams / 120:
    Controller.get_all_parameters()
    lastparams = now

  # Adjust Lights
  if int(now / 0.5) > lastlights / 0.5:
    Controller.update_channels()
    lastlights = now

  #Get new light values from sql
  if int(now / 10) > lastlightsql/10:
    sqltime = round(((time.time()-time.timezone) % 86400) / 10, 0) * 10
    print "Check SQL {0}\n".format(sqltime)
    curs.execute("select a.channel,a.power from time_intensity a join current_status b using (profile) where time=%s",[sqltime])
    for row in curs.fetchall():
      chan=int(row[0])
      power=round(row[1],0)
      Controller.channel_desired_lev[chan] = power
    lastlightsql=now

  time.sleep(0.05)
