
## Structure
 - classes
 - export/require ( aulieu de <script> dans html )
 - generaliser  input(s)-process-output(s)

## Settings
- motors settings --> SettingsManager
- project settings ( --> choisir un path ? ) --> open project = open folder
- load Anim / load Sensor à ouvrir dans le bon dossier

## GUI
- cleaning ! (j'ai commencé à cleaner les motors dans MisGUI)
- name of "manager" functions, a revoir ?
- argument = objet ?  cmd({ eltID:xxx , func:xxxx , param:xxxx })
- Motors : button "position zero" + reglage de cette position (bouton ou number ?) 
- temperature : à verifier ( j'ai viré les alerts, qui s'affichaient constament )
- Sensors: bouton d'autocalibration
- Sensors: filtres :  click droit + settings ?
- Animation: pouvoir parametrer un "generateur" ? ( sinus,random, .... )
- tooltips
- ((( eviter tout appel direct ? ( GUI externe ? ) ???? )))


## Sensors
- One inputEnabled in place of xxxxEnabledInput ( or inputParam = {enabled:true
- isMapped + onMidi  en une seule passe ? ( pareil pour motorMappingManager ? )
- input right click ( ou <button> gear ) pour advanced settings
- animation input

## OSC-mobilizing 
- à unifier ( j'ai essayé d'éviter de toucher à l'osc existant )
- doc OSC

***
***
OLD WORK
**
## commentaires

- J'ai implémenté ce que j'ai pu. En gros, les capteurs, j'ai pas encore touché, car y'a trop de modifs qu'Alex doit faire. J'y toucherai du coup la semaine prochaine.

- pour le reste, le prob principal est que je n'arrive pas à mettre une vitesse zéro aux moteurs. misGui.speed(index,0) n'a pas l'air de marcher.. suis un peu perplexe.

## Panels

**CM9** DONE

**Midi** DONE. 

- did not implement that the main button is set to on automatically, when a port is set active. I did not find it logic -> à discuter

- les boutons ont l'air gros.. (Alex?)

- Est-ce qu'on enregistre le bouton global dans les settings? En contradiction ac les autres panels.. mais serait plus pratique.

**OSC** voir remarques

**Mobilizing** OK

**Robus** Didier
    DB: Je vais le désactiver. Inutile et perturbant tant que nous n'avons pas de modules Robus.

## Motors
**Front side** 

- id, on/OFF, rec: OK 

- index: DONE. To check if we want to start from zero or from one! ~line 367 Misgui

- temperature: looks OK 

- value enter moves gui but not motor (as we saw already): TODO

- check osc messages: à revoir. et voir remarques

**Back side** angle min-max, speed min-max, midi DONE -> tested all, with isadora, console and all settings are correctly saved and read. btn reverse and id input OK: tested with motors

- pas assez de place pour les IDs à deux chiffres -> dire A Alex.

**stopAll button AND midi button to stop motors** : not working yet

- devrait on pas plutôt appeler les boutons "stop all", "freeze"?

- j'ai exprès enlever le "cmdtog".. on peut remettre. J'ai trouvé plus logique de ne pas passer par le système à commande, comme c'est une "commande" pour le dxlManager et non pour les moteurs.. bref, on peut en discuter.
  DB: oui, c'est à revoir de façon plus génerale. Mais je dois verifier que tout marche.

**gear button**: To be done... Le bouton close a giclé à un moment donné. A retester..


## Animations

**animation buttons**

- loop button should be more visible (-> tell Alexandre)

- add animation, and all buttons OK

- remove default animation: DEJA PRESENT ds ancienne version. Faudrait-il pas l'enlever?
    DB: à cacher ("hyde"), le sensor par défaut doit être revu aussi.

- check OSC messages: OK


**stopAll button** : animation stops. TODO: put speed to zero for all motors

## Sensors

- trop de choses encore à changer dans la gui. Je pense qu'il vaut mieux attendre les modifs d'Alex. Lui écrit en fin de semaine.

## à changer:

- val min, val max, normal qu'ils soient à droite?

- le mot tolerance n'a plus la place nécessaire.. on l'enlève?

- CM9, manque la pin id

- Midi, manque le mode et l'index. Et le port est trop petit.

- motor mapping, manque l'index

- OSC, enlever le port.(pour l'instant)

- possible de rendre le nom du panel Sensors plus visible? C'était Filipe surtout qui voulait ce chgmt.

**stopAll button and etc...** TODO 


## Remarques

- Osc panel? Les messages osc sont toujours transmis, même si le bouton est à off. Veut-on vraiment implémenter ce bouton global on/off. Si oui, pourrait-on pas le mettre à ON par défaut.. car ça fait quand même bcp de choses à activer pour que misB fonctionne.

- OSC stop message appelle stopAll de dxlManager... -> pas ok, car disable les moteurs. Il faudrait avoir une méthode qui met les moteurs à la vitesse zéro, mais j'ai eu des soucis à faire cela... TODO.

- Peut-on vraiment pas changer le mode du moteur quand on est en train d'enregistrer une animation?
    DB: pas prévu et difficile ... ce serait vraiment utile ?

## A faire

- tooltips

- bouton vert CM9 devrait devenir orange si la carte est déconnectée

- bouton scan devrait réagir même si CM9 ou si CM9 est connectée.
    DB: réagir comment ?

- changer le fond du moteur + apparition pop-up quand température est critique.

- bug des moteurs au démarrage

- qd on delete un capteur, il est encore actif... (le bug qu'on a vu pdt le workshop mobilizing)
    DB: oui c'est grave et bizarre, à debugger.
