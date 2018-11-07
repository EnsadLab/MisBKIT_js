"""
  MisBKIT keyDown event  example
  Please click on a non-active area to get keyPress forwarded

  use arrow left and right keys
"""

import sys, json , math
from threading import Thread
from time import sleep

#enable MisBKIT forward keyPress & midi messages for example
print("python.setForwards key,midi")  

#set motor 0 on joint mode , !!! donot quote 'joint' !!!
print("dxl.mode 0 joint")

#ask motor 0 to go to angle 0
print("dxl.angle 0 0")


# dictionaries for more key in sight 

def onLeft():
  print("dxl.angle 0 -90")

def onRight():
  print("dxl.angle 0 90")

keyDico = {
    "ArrowLeft" : onLeft,
    "ArrowRight" : onRight,
  }

#parsing MisBKIT message:
def parseCmd(str):                             #"key xxx"
  spl = str.split()
  if( spl[0]=="key" ):
    #if( keyDico.has_key( "ArrowLeft" ) #ONLY  python 2
    if( spl[1] in keyDico ):            #BOTH python2 & python3
      keyDico[spl[1]]()       #execute 

dorun = True
while dorun:
  #txt = raw_input()          #ONLY python 2.7
  #txt = input()              #ONLY python 3
  txt = sys.stdin.readline()  #BOTH
  print("#echo "+txt)

  if( txt == "" ):     #only with stdin
    pass

  elif( txt.startswith("bye") ):
    print("#GOT BYE")
    dorun = False

  else:
    parseCmd(txt)

print("bye bye")
