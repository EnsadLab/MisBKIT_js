# MisBKIT_js

pour installer electron simplement:

* installer node js:
    https://nodejs.org
    installer la version lts

* installer electron:
    dans le terminal (Spotlight terminal)

    - npm install electron --save-dev
    - npm install electron -g

---------------------------------------------

To create a package : 

* install electron packager :
  - npm i electron-packager
  ( www.npmjs.com/package/electron-packager )
  
* in the project folder:
  MACOS   : electron-packager . --platform=darwin --arch=x64 --overwrite --icon=misbkit.icns
  LINUX   : electron-packager . --platform=linux --arch=x64 --overwrite --icon=misbkit.icns
  WINDOWS : electron-packager . --platform=win32 --arch=x64 --overwrite --icon=misbkit.icns
  
