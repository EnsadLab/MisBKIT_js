from pyluos import Robot
import time
# Connect your Luos network (here using an USB module)
r = Robot('/dev/cu.usbserial-DN38ZQ6H')
r.modules
while True :
    time.sleep(0.1)
    print("sensor.setValue distance", r.front.distance) #pyhon3
    value = input()
    if (value == "bye"):
        break
