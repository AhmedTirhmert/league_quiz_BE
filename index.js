/** @format */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 5000;
const axios = require('axios').create({
  baseURL: 'http://ddragon.leagueoflegends.com/cdn',
});

const URL = `http://10.42.0.39:${PORT}`;

app.use(cors());
app.options('*', cors());
app.use('/tiles', express.static(__dirname + '/Champions/Images/tiles'));
app.use('/loadings', express.static(__dirname + '/Champions/Images/loading'));
app.use('/splashes', express.static(__dirname + '/Champions/Images/splash'));
app.use('/spells', express.static(__dirname + '/Champions/Images/spell'));
app.use('/items', express.static(__dirname + '/Champions/Images/item'));
app.use('/passives', express.static(__dirname + '/Champions/Images/passive'));

//CLASSES

//FUNCTIONS
const readChampsData = () => {
  return fs.readdirSync('./Champions/Data');
};
const champData = (championFile) => {
  championFile = championFile.includes('.json')
    ? championFile
    : `${championFile}.json`;
  const champName = championFile.replace('.json', '');
  try {
    const data = fs.readFileSync(`./Champions/Data/${championFile}`, 'utf8');
    return JSON.parse(data).data[champName];
  } catch (error) {
    console.log(error);
  }
};
const readChampionObjectByIndex = (index) => {
  let allChampionsNames = loadChampionsNames();
  let championObject = champData(allChampionsNames[index]);
  return championObject;
};
const champSkinsDataObject = (champFullData) => {
  let champion = {};
  champion.name = champFullData.name;
  champion.id = champFullData.id;
  champion.skins = champFullData.skins.map((skin) => {
    return {
      name: skin.name,
      number: skin.num,
      tile: `${URL}/tiles/${champion.id}_${skin.num}.jpg`,
      loading: `${URL}/loadings/${champion.id}_${skin.num}.jpg`,
      splash: `${URL}/splashes/${champion.id}_${skin.num}.jpg`,
    };
  });
  // champion.spells = champFullData.spells.map((skin) => {
  //   return { id: skin.id, name: skin.name, image: skin.image.full };
  // });
  return champion;
};
function loadChampionsNames() {
  let champs = fs.readdirSync('./Champions/Data');
  // champs = champs.map((champ) => champ.replace('.json', ''));
  return champs;
}
const champDetailsObject = (champFileName) => {
  let champObject = champData(champFileName);
  return {
    key: champObject.key,
    name: champObject.name,
    id: champObject.id,
    title: champObject.title,
    tile: `${URL}/tiles/${champObject.id}_0.jpg`,
  };
};
const prepareChampionsData = () => {
  let championsFilesNames = loadChampionsNames();
  let championsData = [];
  championsFilesNames.forEach((champFileName) => {
    championsData.push(champDetailsObject(champFileName));
  });
  return championsData;
};
const abilityLetter = (index) => {
  switch (index) {
    case 0:
      return 'Q';
    case 1:
      return 'W';
    case 2:
      return 'E';
    case 3:
      return 'R';
  }
};
const randomAbility = () => {
  const champsCount = loadChampionsNames().length - 1;
  let champIndex = Math.floor(Math.random() * champsCount);
  let abilityIndex = Math.floor(Math.random() * 4);
  let championFullData = readChampionObjectByIndex(champIndex);
  let spell = {
    name: championFullData.spells[abilityIndex].name,
    id: championFullData.spells[abilityIndex].id,
    image: `${URL}/spells/${championFullData.spells[abilityIndex].image.full}`,
  };
  let answer = {
    champion: { key: championFullData.key, name: championFullData.name },
    spell: {
      id: championFullData.spells[abilityIndex].id,
      letter: abilityLetter(abilityIndex),
      image: `${URL}/spells/${championFullData.spells[abilityIndex].image.full}`,
    },
  };
  return {
    spell,
    answer,
  };
};

// ROUTUNG
app.get('/', (req, res) => {
  let data = champSkinsDataObject(champData(readChampsData()[0]));
  res.send(data);
});
app.get('/championsData', (req, res) => {
  res.send(prepareChampionsData());
});
app.get('/championSkins/:champId', (req, res) => {
  let data = champSkinsDataObject(champData(req.params.champId));
  res.send(data);
});
app.get('/randomSpell', (req, res) => {
  res.send(randomAbility());
});
app.get('/loadAutoCompleteChampions', (req, res) => {
  res.send(prepareChampionsData());
});
app.get('/testing', async (req, res) => {
  const response = await axios.get('11.16.1/data/en_US/champion.json');
  res.send(response.data);
});
//STARTING SERVER
app.listen(PORT, () => {
  // console.log(randomAbility());
});
