## Panels

**CM9** DONE

**Midi** DONE. 

- did not implement that the main button is set to on automatically, when a port is set active. I did not find it logic -> à discuter

- les boutons ont l'air gros.. (Alex?)

- Est-ce qu'on enregistre le bouton global dans les settings? En contradiction ac les autres panels.. mais serait plus pratique.

**OSC**

**Mobilizing** OK

**Robus**

## Motors
**Front side** 

- id, on/OFF, rec: OK 

- index: DONE. To check if we want to start from zero or from one! ~line 367 Misgui

- temperature: looks OK 

- value enter moves gui but not motor (as we saw already): TODO

- check osc messages: ok... voir remarques

**Back side** angle min-max, speed min-max, midi DONE -> tested all, with isadora, console and all settings are correctly saved and read. btn reverse and id input OK: tested with motors

**stopAll button AND midi button to stop motors** : not working yet

- devrait on pas plutôt appeler les boutons "stop all", "freeze"?

- j'ai exprès enlever le "cmdtog".. on peut remettre. J'ai trouvé plus logique de ne pas passer par le système à commande, comme c'est une "commande" pour le dxlManager et non pour les moteurs.. bref, on peut en discuter.



## Animations

**animation buttons**

- loop button should be more visible (-> tell Alexandre)

- add animation, and all buttons OK

- remove default animation: DEJA PRESENT ds ancienne version. Faudrait-il pas l'enlever?

- check OSC messages: OK



**stopAll button** : animation stops. TODO: put speed to zero for all motors

## Sensors

**stopAll button** : TODO


## Remarques

- Osc panel? Les messages osc sont toujours transmis, même si le bouton est à off. Veut-on vraiment implémenter ce bouton global on/off. Si oui, pourrait-on pas le mettre à on par défaut.. car ça fait quand même bcp de choses à activer pour que misB fonctionne.

- OSC stop message appelle stopAll de dxlManager... -> pas ok, car disable les moteurs. Il faudrait avoir une méthode qui met les moteurs à la vitesse zéro, mais j'ai eu des soucis à faire cela... TODO.

- Peut-on vraiment pas changer le mode du moteur quand on est en train d'enregistrer une animation?