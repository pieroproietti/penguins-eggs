= Compilazione di calamares

 ## Installare

```apt-get install qtdeclarative5-dev qttools5-dev libyaml-cpp-dev libpolkit-qt5-1-dev extra-cmake-modules libkf5parts-dev qtwebengine5-dev libparted-dev qt5-default qtscript5-dev qttools5-dev qttools5-dev-tools qtmultimedia5-dev libqt5svg5-dev libqt5webkit5-dev libsdl2-dev libasound2 libxmu-dev libxi-dev freeglut3-dev libasound2-dev libjack-jackd2-dev libxrandr-dev libqt5xmlpatterns5-dev libqt5xmlpatterns5 libkpmcore4-dev gettext```

```apt-get install python3-dev libboost-dev libboost-python-dev libpythonqt-dev libkf5plasma-dev libkf5package-data libkf5config-bin```


## Scaricare sorgenti
```git clone https://github.com/calamares/calamares```

## Selezionare la versione 3.1.x-stable
```git checkout 3.1.x-stable```

```mkdir calamares/build```
```cd calamares/build```
```cmake -DCMAKE_BUILD_TYPE=Debug ..```
```make```
