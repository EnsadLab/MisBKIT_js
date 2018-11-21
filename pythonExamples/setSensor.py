import sys, json , math
from threading import Thread
from time import sleep

a = 0

while True:
    sleep(0.05)
    s = math.sin( a )
    #print("sensor.setValue scriptTest",s)       #ONLY python3
    print("sensor.setValue scriptTest "+str(s))  #OK with python 2.7 & python3
    a += 0.1


