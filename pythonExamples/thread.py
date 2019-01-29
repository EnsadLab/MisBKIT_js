import sys, json , math
from threading import Thread
from time import sleep

#-----------------------
class PollSensor(Thread):
  def __init__(self):
    self.running = True
    Thread.__init__(self)

  def run(self):
    while(self.running):
      print("sensor.getValue scriptTest "+str(a))  #OK with python 2.7 & python3
      val = input()
      # ... store/use this value
      sleep(0.05)

  def stop(self):
    self.running = False

#------------------------

poll = PollSensor()
poll.start()

dorun = True
while dorun:
  #txt = raw_input()           #ONLY python 2.7
  txt = input()                #ONLY python 3
  #txt = sys.stdin.readline()  #BOTH
  print("#echo "+txt)
  if( txt == "" ):			 #with stdin.readline()
    print("#GOT EMPTY STRING")
    dorun = False
  if( txt.startswith("bye") ):
    print("#GOT BYE")
    dorun = False

poll.stop()
poll.join()
print("bye bye")
